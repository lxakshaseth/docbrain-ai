from typing import Dict, Any
from app.services.graph_workflow import rag_graph
from app.redis_pubsub.publisher import redis_publisher
from app.core.logger import logger

class RAGPipelineService:
    @staticmethod
    def run_pipeline(
        query: str,
        collection_name: str,
        conversation_id: str = None,
        request_id: str = None,
        top_k: int = 4,
        correlation_id: str = None
    ) -> Dict[str, Any]:
        logger.info(f"Running RAG Pipeline for query='{query}' on col='{collection_name}' [corrId={correlation_id}]")

        if request_id and conversation_id:
            redis_publisher.publish_chat_status(request_id, conversation_id, "started", correlation_id=correlation_id)

        initial_state = {
            "query": query,
            "collection_name": collection_name,
            "conversation_id": conversation_id or "default",
            "top_k": top_k,
            "retrieved_docs": [],
            "sources": [],
            "answer": "",
            "suggested_questions": []
        }

        try:
            # Run LangGraph StateGraph Execution
            final_state = rag_graph.invoke(initial_state)

            answer = final_state.get("answer", "")
            sources = final_state.get("sources", [])
            suggested = final_state.get("suggested_questions", [])

            if request_id and conversation_id:
                # Stream tokens over Redis
                words = answer.split(" ")
                for i, word in enumerate(words):
                    chunk_text = word + (" " if i < len(words) - 1 else "")
                    redis_publisher.publish_chat_chunk(request_id, conversation_id, chunk_text, i, correlation_id=correlation_id)

                # Publish final completion status over Redis
                redis_publisher.publish_chat_status(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    status="completed",
                    answer=answer,
                    sources=sources,
                    suggested_questions=suggested,
                    correlation_id=correlation_id
                )

            return {
                "answer": answer,
                "sources": sources,
                "suggested_questions": suggested,
                "conversation_id": conversation_id
            }
        except Exception as e:
            logger.error(f"Error in RAG pipeline execution: {e}")
            if request_id and conversation_id:
                redis_publisher.publish_chat_status(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    status="error",
                    error_message=str(e),
                    correlation_id=correlation_id
                )
            raise
