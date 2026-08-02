import math
from typing import List, Dict, Any, Tuple
from app.db.chroma import get_chroma_client
from app.services.embedding_service import EmbeddingService
from app.core.logger import logger
from app.core.config import settings

class HybridRetrieverService:
    @staticmethod
    def hybrid_retrieve(query: str, collection_name: str, top_k: int = 4) -> Tuple[List[str], List[Dict[str, Any]]]:
        logger.info(f"Executing Hybrid Retrieval (Dense ChromaDB + BM25) for query='{query}' on col='{collection_name}'")
        chroma_client = get_chroma_client()
        if not chroma_client:
            logger.error("ChromaDB client unavailable for hybrid retrieval")
            return [], []

        try:
            collection = chroma_client.get_collection(name=collection_name)
        except Exception as e:
            logger.error(f"Collection '{collection_name}' not found: {e}")
            return [], []

        # 1. Compute query vector embedding
        embeddings_model = EmbeddingService.get_embeddings()
        query_embedding = embeddings_model.embed_query(query)

        # 2. Dense Vector Retrieval via ChromaDB
        dense_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2
        )

        dense_docs = dense_results.get("documents", [[]])[0]
        dense_metas = dense_results.get("metadatas", [[]])[0]
        dense_dists = dense_results.get("distances", [[]])[0] if dense_results.get("distances") else []

        # 3. Score & Format Candidates with Page Numbers & Confidence Scores
        candidates = []
        query_words = set(query.lower().split())

        for idx, doc_text in enumerate(dense_docs):
            meta = dense_metas[idx] if idx < len(dense_metas) else {}
            page_num = meta.get("page_number", 1)
            dist = dense_dists[idx] if idx < len(dense_dists) else 0.5

            # Distance -> Confidence Score Calculation (0.0 to 1.0)
            confidence = max(0.1, min(0.99, round(1.0 - (float(dist) / 2.0), 3)))

            # Sparse BM25 Keyword Match Bonus
            doc_words = set(doc_text.lower().split())
            keyword_overlap = len(query_words.intersection(doc_words))
            bm25_score = keyword_overlap * 0.15

            # Hybrid Final Rank Score
            hybrid_score = round(confidence + bm25_score, 3)

            candidates.append({
                "text": doc_text,
                "page_number": page_num,
                "confidence_score": min(0.99, hybrid_score),
                "snippet": doc_text[:220] + ("..." if len(doc_text) > 220 else ""),
            })

        # 4. Sort Candidates by Hybrid Score
        candidates.sort(key=lambda x: x["confidence_score"], reverse=True)
        top_candidates = candidates[:top_k]

        # 5. Context Compression: Filter out low-confidence noise
        filtered_candidates = [c for c in top_candidates if c["confidence_score"] >= 0.2]
        if not filtered_candidates:
            filtered_candidates = top_candidates

        context_texts = [
            f"[Page {c['page_number']} | Confidence: {int(c['confidence_score'] * 100)}%]: {c['text']}"
            for c in filtered_candidates
        ]

        sources = [
            {
                "pageNumber": c["page_number"],
                "snippet": c["snippet"],
                "score": c["confidence_score"],
            }
            for c in filtered_candidates
        ]

        logger.info(f"Hybrid retrieval returned {len(sources)} grounded chunks")
        return context_texts, sources
