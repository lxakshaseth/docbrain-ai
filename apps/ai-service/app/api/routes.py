from fastapi import APIRouter, HTTPException, status
from app.schemas.requests import (
    IngestRequestSchema,
    QueryRequestSchema,
    QueryResponseSchema,
    SuggestQuestionsRequestSchema,
    SuggestQuestionsResponseSchema,
)
from app.services.ingestion_service import IngestionService
from app.services.rag_pipeline import RAGPipelineService
from app.db.chroma import get_chroma_client
from app.core.config import settings
from app.core.logger import logger

router = APIRouter(prefix="/api/v1")

@router.post("/ingest", status_code=status.HTTP_200_OK, response_model=dict)
def ingest_pdf_document(payload: IngestRequestSchema):
    try:
        result = IngestionService.process_and_store(
            document_id=payload.document_id,
            file_path=payload.file_path,
            collection_name=payload.collection_name
        )
        return {"success": True, "message": "PDF ingested successfully", "data": result}
    except Exception as e:
        logger.error(f"HTTP Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query", response_model=QueryResponseSchema)
def execute_rag_query(payload: QueryRequestSchema):
    try:
        result = RAGPipelineService.run_pipeline(
            query=payload.query,
            collection_name=payload.collection_name,
            conversation_id=payload.conversation_id,
            top_k=payload.top_k or 4
        )
        return QueryResponseSchema(
            answer=result["answer"],
            sources=result["sources"],
            suggested_questions=result["suggested_questions"],
            conversation_id=result["conversation_id"]
        )
    except Exception as e:
        logger.error(f"HTTP Query execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-questions", response_model=SuggestQuestionsResponseSchema)
def suggest_followup_questions(payload: SuggestQuestionsRequestSchema):
    try:
        prompt = (
            f"Based on the following document context, generate {payload.num_questions or 3} relevant follow-up questions:\n"
            f"Context: {payload.context[:1000]}\n"
            "Return ONLY the questions separated by newlines."
        )

        suggested = []
        if settings.groq_api_key:
            from langchain_groq import ChatGroq
            llm = ChatGroq(
                model_name=settings.groq_model_name,
                groq_api_key=settings.groq_api_key,
                temperature=0.7
            )
            resp = llm.invoke(prompt)
            suggested = [line.strip("- *123456789.") for line in resp.content.split("\n") if line.strip()][:3]
        elif settings.gemini_api_key:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model=settings.llm_model_name,
                google_api_key=settings.gemini_api_key
            )
            resp = llm.invoke(prompt)
            suggested = [line.strip("- *123456789.") for line in resp.content.split("\n") if line.strip()][:3]

        if not suggested:
            suggested = [
                "What is the summary of this document?",
                "What are the main findings?",
                "What recommendations are provided?"
            ]

        return SuggestQuestionsResponseSchema(suggested_questions=suggested)
    except Exception as e:
        logger.error(f"Suggest questions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_status():
    chroma_client = get_chroma_client()
    chroma_healthy = chroma_client is not None
    return {
        "status": "online",
        "service": "ai-service",
        "groq_configured": bool(settings.groq_api_key),
        "chroma_connected": chroma_healthy,
        "environment": settings.environment
    }
