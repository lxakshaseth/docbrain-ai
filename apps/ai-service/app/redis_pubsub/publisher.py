import json
import redis
from datetime import datetime
from app.core.config import settings
from app.core.logger import logger

class RedisEventPublisher:
    def __init__(self):
        self.r = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password,
            decode_responses=True
        )

    def publish_ingest_status(self, document_id: str, status: str, chunk_count: int = 0, error_reason: str = None, correlation_id: str = None):
        payload = {
            "correlationId": correlation_id or "system",
            "version": "1.0",
            "documentId": document_id,
            "status": status,
            "chunkCount": chunk_count,
            "errorReason": error_reason,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.r.publish("doc:ingest:status", json.dumps(payload))
        logger.info(f"Published doc:ingest:status [corrId={correlation_id}, docId={document_id}] status={status}")

    def publish_chat_chunk(self, request_id: str, conversation_id: str, chunk_text: str, index: int, correlation_id: str = None):
        payload = {
            "correlationId": correlation_id or "system",
            "version": "1.0",
            "requestId": request_id,
            "conversationId": conversation_id,
            "chunkText": chunk_text,
            "index": index
        }
        self.r.publish("chat:stream:chunk", json.dumps(payload))

    def publish_chat_status(self, request_id: str, conversation_id: str, status: str, answer: str = "", sources=None, suggested_questions=None, error_message=None, correlation_id: str = None):
        payload = {
            "correlationId": correlation_id or "system",
            "version": "1.0",
            "requestId": request_id,
            "conversationId": conversation_id,
            "status": status,
            "answer": answer,
            "sources": sources or [],
            "suggestedQuestions": suggested_questions or [],
            "errorMessage": error_message,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.r.publish("chat:stream:status", json.dumps(payload))
        logger.info(f"Published chat:stream:status [corrId={correlation_id}, convId={conversation_id}] status={status}")

redis_publisher = RedisEventPublisher()
