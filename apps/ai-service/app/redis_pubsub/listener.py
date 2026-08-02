import json
import redis
import threading
from app.core.config import settings
from app.core.logger import logger
from app.services.ingestion import IngestionService
from app.services.rag_pipeline import RAGPipelineService

def start_redis_listener():
    def listen_loop():
        logger.info(f"Connecting Python AI Service Redis Listener to {settings.redis_host}:{settings.redis_port}")
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)
        pubsub = r.pubsub()
        pubsub.subscribe("doc:ingest:request", "chat:stream:request")

        logger.info("Subscribed to 'doc:ingest:request' and 'chat:stream:request' Redis channels")

        for item in pubsub.listen():
            if item["type"] == "message":
                channel = item["channel"]
                try:
                    data = json.loads(item["data"])
                    logger.info(f"Received Redis Pub/Sub task on channel '{channel}'")

                    if channel == "doc:ingest:request":
                        IngestionService.ingest_pdf(
                            document_id=data["documentId"],
                            file_path=data["fileUrl"],
                            collection_name=data["vectorCollectionId"]
                        )

                    elif channel == "chat:stream:request":
                        RAGPipelineService.process_chat_query(
                            request_id=data["requestId"],
                            conversation_id=data["conversationId"],
                            query=data["query"],
                            collection_name=data["vectorCollectionId"]
                        )
                except Exception as e:
                    logger.error(f"Error handling Redis event on {channel}: {e}")

    thread = threading.Thread(target=listen_loop, daemon=True)
    thread.start()
    logger.info("Background Redis Pub/Sub listener thread started")
