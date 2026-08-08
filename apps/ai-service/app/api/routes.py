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

@router.post("/summary")
def generate_document_summary(payload: dict):
    collection_name = payload.get("collection_name") or payload.get("vector_collection_id")
    file_url = payload.get("file_url")
    title = payload.get("title")
    if not collection_name:
        raise HTTPException(status_code=400, detail="vector_collection_id is required")
    from app.services.summary_service import SummaryService
    summary = SummaryService.generate_summary(collection_name, file_url=file_url, title=title)
    return {"success": True, "data": summary}

@router.post("/study/quiz-and-flashcards")
def generate_study_set(payload: dict):
    collection_name = payload.get("collection_name") or payload.get("vector_collection_id")
    file_url = payload.get("file_url")
    title = payload.get("title")
    if not collection_name:
        raise HTTPException(status_code=400, detail="vector_collection_id is required")
    from app.services.study_service import StudyService
    study_set = StudyService.generate_quiz_and_flashcards(collection_name, file_url=file_url, title=title)
    return {"success": True, "data": study_set}

@router.post("/study/audio-overview")
def generate_audio_overview(payload: dict):
    text = payload.get("text", "")
    document_id = payload.get("document_id", "doc")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    import os
    from app.services.study_service import StudyService
    output_dir = os.path.join(os.getcwd(), "public", "audio")
    output_filename = f"audio_{document_id}.mp3"
    output_path = os.path.join(output_dir, output_filename)
    audio_path = StudyService.generate_audio_overview(text, output_path)
    return {
        "success": True, 
        "data": {
            "audioUrl": f"/public/audio/{output_filename}", 
            "path": audio_path,
            "text": text
        }
    }

@router.post("/compare")
def compare_documents(payload: dict):
    documents = payload.get("documents", [])
    if not documents or len(documents) < 2:
        raise HTTPException(status_code=400, detail="At least 2 documents are required for comparison")
    from app.services.comparison_service import ComparisonService
    comparison = ComparisonService.compare_documents(documents)
    return {"success": True, "data": comparison}

