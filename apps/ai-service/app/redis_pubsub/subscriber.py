import json
import time
import redis
import threading
from app.core.config import settings
from app.core.logger import logger
from app.services.ingestion_service import IngestionService
from app.services.rag_pipeline import RAGPipelineService

class RedisSubscriberWorker:
    def __init__(self):
        self.host = settings.redis_host
        self.port = settings.redis_port
        self.password = settings.redis_password

    def _process_message_with_retry(self, channel: str, data: dict, max_retries: int = 3):
        correlation_id = data.get("correlationId", "N/A")
        for attempt in range(1, max_retries + 1):
            try:
                if channel == "doc:ingest:request":
                    IngestionService.process_and_store(
                        document_id=data["documentId"],
                        file_path=data["fileUrl"],
                        collection_name=data["vectorCollectionId"]
                    )
                elif channel == "chat:stream:request":
                    RAGPipelineService.run_pipeline(
                        query=data["query"],
                        collection_name=data["vectorCollectionId"],
                        conversation_id=data["conversationId"],
                        request_id=data["requestId"],
                        correlation_id=correlation_id
                    )
                return  # Success, exit retry loop
            except Exception as e:
                logger.error(f"Task attempt #{attempt}/{max_retries} failed on channel {channel} [corrId={correlation_id}]: {e}")
                if attempt < max_retries:
                    time.sleep(attempt * 2)  # Exponential backoff sleep
                else:
                    logger.error(f"Exhausted all retries for task [corrId={correlation_id}] on channel {channel}")

    def start(self):
        def listen_loop():
            backoff = 1
            while True:
                try:
                    logger.info(f"Connecting Python AI Service Redis Subscriber to {self.host}:{self.port}")
                    r = redis.Redis(host=self.host, port=self.port, password=self.password, decode_responses=True)
                    pubsub = r.pubsub()
                    pubsub.subscribe("doc:ingest:request", "chat:stream:request")
                    logger.info("Subscribed to 'doc:ingest:request' and 'chat:stream:request' channels")
                    backoff = 1  # Reset backoff upon successful connection

                    for item in pubsub.listen():
                        if item["type"] == "message":
                            channel = item["channel"]
                            try:
                                data = json.loads(item["data"])
                                correlation_id = data.get("correlationId", "N/A")
                                logger.info(f"Received Redis task [corrId={correlation_id}] on channel '{channel}'")
                                self._process_message_with_retry(channel, data)
                            except Exception as parse_err:
                                logger.error(f"Failed to parse Redis message on {channel}: {parse_err}")
                except Exception as conn_err:
                    logger.warn(f"Redis listener connection dropped: {conn_err}. Reconnecting in {backoff}s...")
                    time.sleep(backoff)
                    backoff = min(backoff * 2, 30)

        thread = threading.Thread(target=listen_loop, daemon=True)
        thread.start()
        logger.info("Resilient Redis Subscriber background thread started")

redis_subscriber_worker = RedisSubscriberWorker()
