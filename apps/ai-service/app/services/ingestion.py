import os
import re
import json
import redis
from datetime import datetime
from typing import List

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

try:
    from langchain_core.documents import Document
except ImportError:
    from langchain.docstore.document import Document

from app.core.config import settings
from app.core.logger import logger
from app.db.chroma import get_chroma_client
from app.services.embedding_service import EmbeddingService


# ---------------------------------------------------------------------------
# Text Quality Validation
# ---------------------------------------------------------------------------

def _is_text_clean(text: str, min_printable_ratio: float = 0.60) -> bool:
    """Returns True if text has enough printable ASCII/unicode characters.
    Filters out garbage characters from corrupt PDF encoding."""
    if not text or len(text.strip()) < 20:
        return False
    # Count printable chars: letters, digits, punctuation, whitespace
    printable = sum(1 for c in text if c.isprintable() and ord(c) < 65536)
    ratio = printable / max(len(text), 1)
    return ratio >= min_printable_ratio


def _clean_text(text: str) -> str:
    """Normalize whitespace and strip non-printable control characters."""
    # Remove control characters except newlines/tabs
    text = re.sub(r'[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]', ' ', text)
    # Collapse multiple whitespace sequences
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ---------------------------------------------------------------------------
# Multi-Strategy PDF Extraction
# ---------------------------------------------------------------------------

def _extract_with_pymupdf(file_path: str) -> List[Document]:
    """Strategy 1: PyMuPDF (fitz) — best for complex layouts & newspaper PDFs."""
    import fitz  # pymupdf
    docs = []
    with fitz.open(file_path) as pdf:
        for page_num in range(len(pdf)):
            page = pdf[page_num]
            text = page.get_text("text")  # plain text extraction
            if not text.strip():
                # Try 'blocks' layout which is better for multi-column
                blocks = page.get_text("blocks")
                text = "\n".join(b[4] for b in blocks if b[4].strip())
            cleaned = _clean_text(text)
            if _is_text_clean(cleaned):
                docs.append(Document(
                    page_content=cleaned,
                    metadata={"page": page_num, "source": file_path}
                ))
    return docs


def _extract_with_pdfplumber(file_path: str) -> List[Document]:
    """Strategy 2: pdfplumber — great for tables and mixed-layout PDFs."""
    import pdfplumber
    docs = []
    with pdfplumber.open(file_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            cleaned = _clean_text(text)
            if _is_text_clean(cleaned):
                docs.append(Document(
                    page_content=cleaned,
                    metadata={"page": page_num, "source": file_path}
                ))
    return docs


def _extract_with_pypdf(file_path: str) -> List[Document]:
    """Strategy 3: PyPDF — fallback for simple, text-native PDFs."""
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    docs = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        cleaned = _clean_text(text)
        if _is_text_clean(cleaned):
            docs.append(Document(
                page_content=cleaned,
                metadata={"page": i, "source": file_path}
            ))
    return docs


def extract_pdf_text(file_path: str) -> List[Document]:
    """
    Tries PDF extraction strategies in priority order:
      1. PyMuPDF  — best for complex/newspaper PDFs
      2. pdfplumber — best for table-heavy PDFs
      3. PyPDF    — fallback for simple text PDFs
    Returns the best result (most valid pages extracted).
    """
    strategies = [
        ("PyMuPDF", _extract_with_pymupdf),
        ("pdfplumber", _extract_with_pdfplumber),
        ("PyPDF", _extract_with_pypdf),
    ]

    best_docs: List[Document] = []
    for name, strategy in strategies:
        try:
            docs = strategy(file_path)
            logger.info(f"PDF Extraction [{name}]: {len(docs)} clean pages extracted")
            if len(docs) > len(best_docs):
                best_docs = docs
            # If we already got good results, stop early
            if len(best_docs) >= 1:
                logger.info(f"Using [{name}] extraction — {len(best_docs)} pages")
                return best_docs
        except ImportError:
            logger.warning(f"PDF Extractor [{name}] not installed, skipping")
        except Exception as e:
            logger.warning(f"PDF Extractor [{name}] failed: {e}")

    return best_docs


# ---------------------------------------------------------------------------
# Ingestion Service
# ---------------------------------------------------------------------------

class IngestionService:
    @staticmethod
    def ingest_pdf(document_id: str, file_path: str, collection_name: str) -> dict:
        logger.info(f"Starting PDF ingestion for doc={document_id}, file={file_path}, col={collection_name}")
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)

        try:
            r.publish("doc:ingest:status", json.dumps({
                "documentId": document_id,
                "status": "processing",
                "timestamp": datetime.utcnow().isoformat()
            }))

            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found at path: {file_path}")

            # 1. Extract Text — Multi-Strategy with Quality Validation
            raw_docs = extract_pdf_text(file_path)

            if not raw_docs:
                raise ValueError(
                    "PDF text extraction failed: No readable text found. "
                    "The PDF may be scanned/image-only. OCR support coming soon."
                )

            logger.info(f"Total clean pages ready for chunking: {len(raw_docs)}")

            # 2. Chunk Documents
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.default_chunk_size,
                chunk_overlap=settings.default_chunk_overlap
            )
            chunks = text_splitter.split_documents(raw_docs)
            logger.info(f"Extracted {len(chunks)} text chunks from PDF")

            # 3. Filter out any chunks that are still garbage after splitting
            clean_chunks = [c for c in chunks if _is_text_clean(c.page_content, min_printable_ratio=0.65)]
            logger.info(f"Clean chunks after quality filter: {len(clean_chunks)} / {len(chunks)}")

            if not clean_chunks:
                raise ValueError("All extracted chunks failed quality validation. PDF may be image-based.")

            # 4. Embedding Generation & Vector Store Bulk Load
            chroma_client = get_chroma_client()
            if not chroma_client:
                raise RuntimeError("ChromaDB connection unavailable")

            collection = chroma_client.get_or_create_collection(name=collection_name)

            documents_text = [chunk.page_content for chunk in clean_chunks]
            metadatas = [
                {
                    "page_number": chunk.metadata.get("page", 0) + 1,
                    "document_id": document_id,
                    "source": chunk.metadata.get("source", file_path)
                }
                for chunk in clean_chunks
            ]
            ids = [f"{document_id}_chunk_{i}" for i in range(len(clean_chunks))]

            # Compute embeddings
            embeddings_model = EmbeddingService.get_embeddings()
            embeddings_list = embeddings_model.embed_documents(documents_text)

            collection.add(
                documents=documents_text,
                embeddings=embeddings_list,
                metadatas=metadatas,
                ids=ids
            )

            status_payload = {
                "documentId": document_id,
                "status": "completed",
                "chunkCount": len(clean_chunks),
                "timestamp": datetime.utcnow().isoformat()
            }
            r.publish("doc:ingest:status", json.dumps(status_payload))
            logger.info(f"Successfully ingested {len(clean_chunks)} clean chunks into ChromaDB for {document_id}")
            return status_payload

        except Exception as e:
            logger.error(f"Failed to ingest PDF {document_id}: {e}")
            error_payload = {
                "documentId": document_id,
                "status": "failed",
                "errorReason": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            r.publish("doc:ingest:status", json.dumps(error_payload))
            return error_payload
