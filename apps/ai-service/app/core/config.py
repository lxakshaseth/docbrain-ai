import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    port: int = 8001
    environment: str = "development"
    log_level: str = "INFO"

    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str | None = None

    chroma_host: str = "localhost"
    chroma_port: int = 8000

    groq_api_key: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""

    embedding_model_name: str = "all-MiniLM-L6-v2"
    groq_model_name: str = "llama-3.1-8b-instant"
    llm_model_name: str = "gemini-1.5-flash"

    default_chunk_size: int = 1000
    default_chunk_overlap: int = 200
    vector_search_top_k: int = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

