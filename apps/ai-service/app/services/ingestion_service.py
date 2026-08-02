from typing import Dict, Any
from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.db.chroma import get_chroma_client
from app.core.logger import logger
from app.core.exceptions import IngestionError, VectorStoreError
from app.redis_pubsub.publisher import redis_publisher

class IngestionService:
    @staticmethod
    def process_and_store(document_id: str, file_path: str, collection_name: str) -> Dict[str, Any]:
        logger.info(f"Ingesting PDF doc_id={document_id}, collection={collection_name}")
        redis_publisher.publish_ingest_status(document_id, "processing")

        try:
            chunks = PDFProcessor.extract_and_chunk(file_path)
            chroma_client = get_chroma_client()
            if not chroma_client:
                raise VectorStoreError("ChromaDB connection unavailable")

            collection = chroma_client.get_or_create_collection(name=collection_name)

            texts = [chunk.page_content for chunk in chunks]
            metadatas = [
                {
                    "page_number": chunk.metadata.get("page", 0) + 1,
                    "document_id": document_id,
                    "source": chunk.metadata.get("source", file_path)
                }
                for chunk in chunks
            ]
            ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]

            # Compute embeddings using EmbeddingService (Gemini / SentenceTransformers)
            embeddings_model = EmbeddingService.get_embeddings()
            embeddings_list = embeddings_model.embed_documents(texts)

            collection.add(
                documents=texts,
                embeddings=embeddings_list,
                metadatas=metadatas,
                ids=ids
            )

            chunk_count = len(chunks)
            redis_publisher.publish_ingest_status(document_id, "completed", chunk_count=chunk_count)
            logger.info(f"Successfully stored {chunk_count} chunks with computed embeddings into ChromaDB for {document_id}")

            return {
                "document_id": document_id,
                "status": "completed",
                "chunk_count": chunk_count,
                "collection_name": collection_name
            }
        except Exception as e:
            logger.error(f"Ingestion failed for doc_id={document_id}: {e}")
            redis_publisher.publish_ingest_status(document_id, "failed", error_reason=str(e))
            raise IngestionError(f"PDF Ingestion Error: {str(e)}")
