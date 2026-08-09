import os
import socket
try:
    import chromadb
except ImportError:
    import chromadb_client as chromadb

from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.core.logger import logger

_chroma_client_instance = None

def is_port_open(host: str, port: int, timeout: float = 0.1) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def get_chroma_client():
    global _chroma_client_instance
    if _chroma_client_instance is not None:
        return _chroma_client_instance

    # 1. Try remote HTTP client ONLY if port is actually listening
    if is_port_open(settings.chroma_host, settings.chroma_port):
        try:
            client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
                settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
            )
            client.heartbeat()
            logger.info(f"Connected to remote ChromaDB HTTP server at {settings.chroma_host}:{settings.chroma_port}")
            _chroma_client_instance = client
            return _chroma_client_instance
        except Exception as e:
            logger.warn(f"Remote ChromaDB server error ({e}). Falling back to local PersistentClient")

    # 2. Fast local PersistentClient fallback (Stores vectors in ./chroma_data)
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
        logger.warning(f"Failed to initialize local persistent ChromaDB client ({local_err}). Falling back to EphemeralClient.")
        try:
            client = chromadb.EphemeralClient(
                settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
            )
            logger.info("Initialized in-memory Ephemeral ChromaDB client")
            _chroma_client_instance = client
            return _chroma_client_instance
        except Exception as eph_err:
            logger.error(f"Failed to initialize Ephemeral ChromaDB client: {eph_err}")
            return None

def get_collection_documents(collection_name: str) -> dict:
    client = get_chroma_client()
    if not client:
        return {}
    try:
        col = client.get_collection(name=collection_name)
        return col.get()
    except Exception as e:
        logger.error(f"Error fetching collection {collection_name}: {e}")
        return {}


