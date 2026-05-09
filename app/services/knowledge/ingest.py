"""One-time script to populate Pinecone with fire protocol knowledge.

Usage:
    python -m app.services.knowledge.ingest
"""

import os
from pathlib import Path
from typing import List

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
INDEX_NAME        = os.getenv("PINECONE_INDEX_NAME", "emberlink")
DOCS_NAMESPACE    = "docs"

# Resolve docs dir relative to this file: app/services/knowledge/ingest.py → root/docs
PROJECT_ROOT      = Path(__file__).resolve().parents[3]
DOCS_DIR          = PROJECT_ROOT / "docs"

CHUNK_SIZE        = 500
CHUNK_OVERLAP     = 50


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


def embed_and_upsert(chunks: list) -> None:
    print("\nEmbedding and upserting chunks into Pinecone...")

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY,
    )

    vector_store = PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=INDEX_NAME,
        namespace=DOCS_NAMESPACE,
    )

    print(f"Done. {len(chunks)} chunks stored in namespace '{DOCS_NAMESPACE}'.")
    return vector_store


def main():
    print("=== FireLink Ingestion Pipeline ===\n")

    validate_required_env()
    init_pinecone()
    pages = load_pdfs(DOCS_DIR)
    chunks = chunk_documents(pages)
    embed_and_upsert(chunks)
    print("\n✓ Ingestion complete. Pinecone is ready for RAG queries.")


if __name__ == "__main__":
    main()
