
'''One-time script to populate Pinecone with fire protocol knowledge.
Run this before the hackathon demo.

Usage:
    python ingest.py

Requirements:
    pip install langchain langchain-openai langchain-pinecone pypdf pinecone-client python-dotenv
'''

# necessary dependencies
import os
from dotenv import load_dotenv
from pathlib import Path
from typing import List

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

# ── Config ────────────────────────────────────────────────────────────────────

OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY  = os.getenv("PINECONE_API_KEY")
INDEX_NAME        = os.getenv("PINECONE_INDEX_NAME", "emberlink")
DOCS_NAMESPACE    = "docs"
DOCS_DIR          = Path("./docs")        # put your PDFs here

# Chunk settings:
# - chunk_size 500: ~500 words per chunk, small enough to be specific
# - chunk_overlap 50: 50-word overlap so sentences aren't cut mid-thought
CHUNK_SIZE        = 500
CHUNK_OVERLAP     = 50


def validate_required_env() -> None:
    """Fail fast with a clear message when required API keys are missing."""
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

# ── Step 1: Initialize Pinecone ───────────────────────────────────────────────

def init_pinecone() -> Pinecone:
    """
    Connect to Pinecone and create the index if it doesn't exist yet.

    Index dimension 1536 matches OpenAI's text-embedding-3-small output.
    ServerlessSpec uses the free tier — no pod costs.
    """
    pc = Pinecone(api_key=PINECONE_API_KEY)

    existing_indexes = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        print(f"Creating Pinecone index: {INDEX_NAME}")
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    else:
        print(f"Index '{INDEX_NAME}' already exists — skipping creation.")

    return pc


# ── Step 2: Load PDFs ─────────────────────────────────────────────────────────

def load_pdfs(docs_dir: Path) -> list:
    """
    Walk the ./docs folder and load every PDF.

    PyPDFLoader returns one Document per page, each with metadata:
        { source: "docs/fema_guide.pdf", page: 0 }

    We collect all pages across all PDFs into a single flat list.
    """
    all_pages = []
    pdf_files = list(docs_dir.glob("*.pdf"))

    if not pdf_files:
        raise FileNotFoundError(
            f"No PDFs found in {docs_dir}. "
            "Download FEMA/Red Cross guides and place them there."
        )

    for pdf_path in pdf_files:
        # pdf layout parsing with PyMuPDF (fitz)
        print(f"Parsing layout: {pdf_path.name}")
        if fitz is not None:
            pages = parse_pdf_layout(pdf_path)
        else:
            # fallback to PyPDFLoader (page-level text only)
            print("  PyMuPDF not available — falling back to PyPDFLoader (page-level)")
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()

        all_pages.extend(pages)
        print(f"  → {len(pages)} elements/pages loaded")

    print(f"\nTotal pages loaded: {len(all_pages)}")
    return all_pages


# ── Step 3: Chunk the text ────────────────────────────────────────────────────

def chunk_documents(pages: list) -> list:
    """
    Split pages into smaller overlapping chunks.

    Why chunk? A full PDF page is too long to embed meaningfully and
    too broad for a user query to match precisely. Smaller chunks =
    more precise retrieval.

    RecursiveCharacterTextSplitter tries to split on:
        paragraphs → sentences → words
    ...in that order, so it never cuts mid-sentence if it can help it.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "]
    )

    # pages may already be element-level Documents (from parse_pdf_layout)
    chunks = splitter.split_documents(pages)
    print(f"Total chunks after splitting: {len(chunks)}")
    return chunks


def parse_pdf_layout(pdf_path: Path) -> List[Document]:
    """
    Parse a PDF using PyMuPDF and return one Document per page.

    Blocks within a page are joined with double newlines so the
    RecursiveCharacterTextSplitter can produce proper 500-char chunks.
    """
    docs: List[Document] = []
    doc = fitz.open(str(pdf_path))

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pdict = page.get_text("dict")

        block_texts = []
        for block in pdict.get("blocks", []):
            if block.get("type") != 0:
                continue

            span_texts = []
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if text:
                        span_texts.append(text)

            block_text = " ".join(span_texts).strip()
            if block_text:
                block_texts.append(block_text)

        page_text = "\n\n".join(block_texts).strip()
        if page_text:
            docs.append(Document(
                page_content=page_text,
                metadata={"source": str(pdf_path), "page": page_num}
            ))

    doc.close()
    return docs


# ── Step 4: Embed and upsert into Pinecone ────────────────────────────────────

def embed_and_upsert(chunks: list) -> None:
    """
    Convert each chunk to an embedding and store it in Pinecone.

    What happens here:
    1. OpenAIEmbeddings sends each chunk's text to OpenAI's API
    2. OpenAI returns a 1536-dimensional vector (list of floats)
    3. PineconeVectorStore stores: vector + original text + metadata
       in the "docs" namespace

    The metadata (source filename, page number) is stored alongside
    the vector so the AI agent can cite where it found the information.

    PineconeVectorStore.from_documents() batches the upserts
    automatically — you don't need to loop manually.
    """
    print("\nEmbedding and upserting chunks into Pinecone...")

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",   # cheap, fast, 1536 dims
        openai_api_key=OPENAI_API_KEY
    )

    vector_store = PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=INDEX_NAME,
        namespace=DOCS_NAMESPACE
    )

    print(f"Done. {len(chunks)} chunks stored in namespace '{DOCS_NAMESPACE}'.")
    return vector_store


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== FireLink Ingestion Pipeline ===\n")

    validate_required_env()

    # 1. Connect to / create Pinecone index
    init_pinecone()

    # 2. Load all PDFs from ./docs
    pages = load_pdfs(DOCS_DIR)

    # 3. Split into chunks
    chunks = chunk_documents(pages)


    for chunk in chunks[:10]:
        print(f"{chunk}\n")


    # # 4. Embed and push to Pinecone
    # embed_and_upsert(chunks)

    # print("\n✓ Ingestion complete. Pinecone is ready for RAG queries.")


if __name__ == "__main__":
    main()
