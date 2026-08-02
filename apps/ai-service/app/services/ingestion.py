import os
import json
import redis
from datetime import datetime
from pypdf import PdfReader

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

            # 1. Extract Text using PyPDF
            reader = PdfReader(file_path)
            raw_docs = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    raw_docs.append(Document(
                        page_content=text,
                        metadata={"page": i, "source": file_path}
                    ))

            # 2. Chunk Documents
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.default_chunk_size,
                chunk_overlap=settings.default_chunk_overlap
            )
            chunks = text_splitter.split_documents(raw_docs)
            logger.info(f"Extracted {len(chunks)} text chunks from PDF")

            # 3. Embedding Generation & Vector Store Bulk Load
            chroma_client = get_chroma_client()
            if not chroma_client:
                raise RuntimeError("ChromaDB connection unavailable")

            collection = chroma_client.get_or_create_collection(name=collection_name)

            documents_text = [chunk.page_content for chunk in chunks]
            metadatas = [
                {
                    "page_number": chunk.metadata.get("page", 0) + 1,
                    "document_id": document_id,
                    "source": chunk.metadata.get("source", file_path)
                }
                for chunk in chunks
            ]
            ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]

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
                "chunkCount": len(chunks),
                "timestamp": datetime.utcnow().isoformat()
            }
            r.publish("doc:ingest:status", json.dumps(status_payload))
            logger.info(f"Successfully ingested {len(chunks)} chunks into ChromaDB for {document_id}")
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
