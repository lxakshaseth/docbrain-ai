from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.config import settings
from app.core.logger import logger

class EmbeddingService:
    @staticmethod
    def get_embeddings():
        if settings.gemini_api_key:
            try:
                logger.info("Initializing Google Gemini Embeddings (models/embedding-001)")
                return GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=settings.gemini_api_key
                )
            except Exception as e:
                logger.warning(f"Failed to load Gemini Embeddings, falling back to SentenceTransformers: {e}")

        logger.info(f"Initializing SentenceTransformerEmbeddings ({settings.embedding_model_name})")
        return SentenceTransformerEmbeddings(model_name=settings.embedding_model_name)
