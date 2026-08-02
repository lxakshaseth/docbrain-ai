import os
try:
    import chromadb
except ImportError:
    import chromadb_client as chromadb

from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.core.logger import logger

_chroma_client_instance = None

def get_chroma_client():
    global _chroma_client_instance
    if _chroma_client_instance is not None:
        return _chroma_client_instance

    # 1. Try remote HTTP client first
    try:
        client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
            settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
        )
        # Heartbeat verification to check server health
        client.heartbeat()
        logger.info(f"Connected to remote ChromaDB HTTP server at {settings.chroma_host}:{settings.chroma_port}")
        _chroma_client_instance = client
        return _chroma_client_instance
    except Exception as e:
        logger.warn(f"Remote ChromaDB server at {settings.chroma_host}:{settings.chroma_port} unavailable ({e}). Using local PersistentClient at ./chroma_data")

    # 2. Local PersistentClient fallback (Stores vectors in ./chroma_data)
    try:
        os.makedirs("./chroma_data", exist_ok=True)
        client = chromadb.PersistentClient(
            path="./chroma_data",
            settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
        )
        logger.info("Initialized local persistent ChromaDB client at ./chroma_data")
        _chroma_client_instance = client
        return _chroma_client_instance
    except Exception as local_err:
        logger.error(f"Failed to initialize local persistent ChromaDB client: {local_err}")
        return None
