"""One-time script to populate Pinecone with fire protocol knowledge.

Usage:
    python -m app.services.knowledge.ingest [--dump-chunks PATH] [--preview-only]
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import List, Tuple

from dotenv import load_dotenv

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from langchain_core.documents import Document

load_dotenv()

# ── Config ───────────────────────────────────────────────────────────────────

OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY  = os.getenv("PINECONE_API_KEY")
INDEX_NAME        = os.getenv("PINECONE_INDEX_NAME", "firelink")
DOCS_NAMESPACE    = "docs"

# Resolve docs dir relative to this file: app/services/knowledge/ingest.py → root/docs
PROJECT_ROOT      = Path(__file__).resolve().parents[3]
DOCS_DIR          = PROJECT_ROOT / "docs"

CHUNK_SIZE        = 500
CHUNK_OVERLAP     = 50
MIN_BLOCK_WORDS   = 40
DEFAULT_PREVIEW   = DOCS_DIR / "chunks_preview.json" # for testing and validation only! (not pushed)


def validate_required_env() -> None:
    missing = []
    if not OPENAI_API_KEY:
        missing.append("OPENAI_API_KEY")
    if not PINECONE_API_KEY:
        missing.append("PINECONE_API_KEY")

    if missing:
        raise EnvironmentError(
            "Missing required environment variables: "
            + ", ".join(missing)
            + ". If running in Docker, ensure docker-compose injects .env into the backend service."
        )


def init_pinecone() -> Pinecone:
    pc = Pinecone(api_key=PINECONE_API_KEY)

    existing_indexes = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        print(f"Creating Pinecone index: {INDEX_NAME}")
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
    else:
        print(f"Index '{INDEX_NAME}' already exists — skipping creation.")

    return pc


def parse_pdf_layout(pdf_path: Path) -> List[Document]:
    docs: List[Document] = []
    doc = fitz.open(str(pdf_path))

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pdict = page.get_text("dict")

        for block in pdict.get("blocks", []):
            if block.get("type") != 0:
                continue

            block_text_parts = []
            max_font = 0.0

            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if not text:
                        continue
                    block_text_parts.append(text)
                    size = span.get("size", 0.0)
                    if size and size > max_font:
                        max_font = size

            block_text = "\n".join(block_text_parts).strip()
            if not block_text:
                continue

            element_type = "heading" if max_font >= 13 else "paragraph"

            metadata = {
                "source": str(pdf_path),
                "page": page_num,
                "element_type": element_type,
                "font_size": max_font,
            }

            docs.append(Document(page_content=block_text, metadata=metadata))

    doc.close()
    return docs


def load_pdfs(docs_dir: Path) -> list:
    all_pages = []
    pdf_files = list(docs_dir.glob("*.pdf"))

    if not pdf_files:
        raise FileNotFoundError(
            f"No PDFs found in {docs_dir}. "
            "Download FEMA/Red Cross guides and place them there."
        )

    for pdf_path in pdf_files:
        print(f"Parsing layout: {pdf_path.name}")
        if fitz is not None:
            pages = parse_pdf_layout(pdf_path)
        else:
            print("  PyMuPDF not available — falling back to PyPDFLoader (page-level)")
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()

        all_pages.extend(pages)
        print(f"  → {len(pages)} elements/pages loaded")

    print(f"\nTotal pages loaded: {len(all_pages)}")
    return all_pages


def chunk_documents(pages: list) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "],
    )
    chunks = splitter.split_documents(pages)
    print(f"Total chunks after splitting: {len(chunks)}")
    return chunks


def _word_count(text: str) -> int:
    return len(text.split())


def combine_small_blocks(pages: list, min_words: int) -> list:
    '''intentionally merges tiny pdf blocks before splitting to ensure granular chunks'''
    if not pages:
        return []

    merged = []
    buffer_doc = None
    buffer_words = 0
    buffer_blocks = 0
    buffer_source = None
    buffer_page = None

    for doc in pages:
        meta = doc.metadata or {}
        source = meta.get("source")
        page = meta.get("page")

        if buffer_doc is None:
            buffer_doc = Document(page_content=doc.page_content, metadata=dict(meta))
            buffer_words = _word_count(buffer_doc.page_content)
            buffer_blocks = 1
            buffer_source = source
            buffer_page = page
            continue

        same_page = (source == buffer_source) and (page == buffer_page)
        if same_page and buffer_words < min_words:
            buffer_doc.page_content = (
                f"{buffer_doc.page_content}\n{doc.page_content}"
            ).strip()
            buffer_words = _word_count(buffer_doc.page_content)
            buffer_blocks += 1
            continue

        buffer_doc.metadata = {**(buffer_doc.metadata or {}), "merged_blocks": buffer_blocks}
        merged.append(buffer_doc)

        buffer_doc = Document(page_content=doc.page_content, metadata=dict(meta))
        buffer_words = _word_count(buffer_doc.page_content)
        buffer_blocks = 1
        buffer_source = source
        buffer_page = page

    if buffer_doc is not None:
        buffer_doc.metadata = {**(buffer_doc.metadata or {}), "merged_blocks": buffer_blocks}
        merged.append(buffer_doc)

    if len(merged) != len(pages):
        print(f"Merged small blocks: {len(pages)} -> {len(merged)} (min_words={min_words})")
    return merged


def _normalize_text(text: str) -> str:
    return " ".join(text.split())


def _chunk_id(doc: Document) -> str:
    '''deterministic chunk ids (hash of normalized text and metadata) ensures upserts overwrite prior
    entries rather than creating duplicates'''
    payload = {
        "text": _normalize_text(doc.page_content),
        "metadata": doc.metadata or {},
    }
    payload_json = json.dumps(payload, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(payload_json.encode("utf-8")).hexdigest()


def dedupe_chunks(chunks: list) -> Tuple[list, list]:
    seen = set()
    unique = []
    duplicates = []
    for doc in chunks:
        doc_id = _chunk_id(doc)
        if doc_id in seen:
            duplicates.append(doc)
            continue
        seen.add(doc_id)
        doc.metadata = {**(doc.metadata or {}), "chunk_id": doc_id}
        unique.append(doc)
    return unique, duplicates


def dump_chunks_json(chunks: list, output_path: Path) -> None:
    payload = []
    for doc in chunks:
        payload.append(
            {
                "chunk_id": doc.metadata.get("chunk_id") if doc.metadata else None,
                "text": doc.page_content,
                "metadata": doc.metadata or {},
            }
        )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=True, indent=2)
    print(f"Wrote chunk preview: {output_path}")


def embed_and_upsert(chunks: list) -> None:
    print("\nEmbedding and upserting chunks into Pinecone...")

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY,
    )

    # initialize vector store
    vector_store = PineconeVectorStore(
        index_name=INDEX_NAME,
        embedding=embeddings,
        namespace=DOCS_NAMESPACE,
    )

    ids = [doc.metadata.get("chunk_id") for doc in chunks]
    vector_store.add_documents(documents=chunks, ids=ids)

    print(f"Done. {len(chunks)} chunks stored in namespace '{DOCS_NAMESPACE}'.")
    return vector_store

# CLI options for if you need to either preview chunks AND insert in pinecone (--dump-chunks) OR just preview and skip upsert 
# or 
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="FireLink ingestion pipeline")
    parser.add_argument(
        "--dump-chunks",
        dest="dump_chunks",
        default=None,
        help="Write chunk preview JSON to this path",
    )
    parser.add_argument(
        "--preview-only",
        action="store_true",
        help="Only write chunk preview JSON and skip embedding/upsert",
    )
    return parser.parse_args()


def main():
    print("=== FireLink Ingestion Pipeline ===\n")

    args = parse_args()

    validate_required_env()
    init_pinecone()
    pages = load_pdfs(DOCS_DIR)
    pages = combine_small_blocks(pages, MIN_BLOCK_WORDS)
    chunks = chunk_documents(pages)
    deduped, duplicates = dedupe_chunks(chunks)
    print(f"Deduped chunks: {len(deduped)} (removed {len(duplicates)} duplicates)")

    if args.dump_chunks or args.preview_only:
        output_path = Path(args.dump_chunks) if args.dump_chunks else DEFAULT_PREVIEW
        dump_chunks_json(deduped, output_path)
        if args.preview_only:
            print("\n✓ Preview-only mode; skipping embeddings/upsert.")
            return

    embed_and_upsert(deduped)
    print("\n✓ Ingestion complete. Pinecone is ready for RAG queries.")


if __name__ == "__main__":
    main()
