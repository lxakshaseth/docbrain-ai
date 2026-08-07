import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logger import logger
from app.core.exceptions import AIServiceException
from app.api.routes import router
from app.redis_pubsub.subscriber import redis_subscriber_worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Python AI Microservice...")
    redis_subscriber_worker.start()
    yield

app = FastAPI(
    title="PDF Knowledge Base AI Service",
    description="Python RAG Engine powered by LangChain, LangGraph, Gemini & ChromaDB",
    version="1.0.0",
    lifespan=lifespan
)

os.makedirs("public/audio", exist_ok=True)
app.mount("/public", StaticFiles(directory="public"), name="public")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.exception_handler(AIServiceException)
async def ai_service_exception_handler(request: Request, exc: AIServiceException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

@app.get("/")
def root():
    return {
        "service": "PDF KB AI Microservice",
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
