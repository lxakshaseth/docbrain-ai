import json
from typing import Dict, Any, List
from app.db.chroma import get_collection_documents
from app.core.config import settings
from app.core.logger import logger
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

class ComparisonService:
    @staticmethod
    def compare_documents(documents: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        documents: List of dicts containing {'id': doc_id, 'title': doc_title, 'vectorCollectionId': col_id}
        """
        logger.info(f"Comparing {len(documents)} documents")
        
        doc_summaries = []
        headers = []

        for doc in documents:
            col_id = doc.get("vectorCollectionId")
            title = doc.get("title", "Document")
            doc_id = doc.get("id")
            headers.append({"docId": doc_id, "title": title})

            docs_data = get_collection_documents(col_id) if col_id else None
            text_snippet = ""
            if docs_data and docs_data.get("documents"):
                text_snippet = "\n".join(docs_data["documents"][:5])[:3000]

            doc_summaries.append(f"Document ID: {doc_id}\nTitle: {title}\nExcerpt:\n{text_snippet}\n---")

        all_text = "\n\n".join(doc_summaries)

        prompt = f"""You are a multi-document research analyst. Compare the provided documents and generate a detailed comparative analysis.

Requirements:
1. "summary": A 2-3 sentence overall comparative synthesis.
2. "rows": An array of objects comparing key dimensions/features across the documents. Each row object MUST have a "feature" string, and key-value pairs where the key is the "docId" of each document.
   Example: {{"feature": "Core Theme", "doc_1": "...", "doc_2": "..."}}
3. "markdownMatrix": A formatted GitHub Markdown table comparing the documents.

OUTPUT ONLY VALID JSON. NO MARKDOWN WRAPPERS.

Documents Content:
{all_text}
"""

        raw_output = ""

        if settings.groq_api_key:
            try:
                llm = ChatGroq(
                    model_name=settings.groq_model_name,
                    groq_api_key=settings.groq_api_key,
                    temperature=0.2
                )
                res = llm.invoke(prompt)
                raw_output = res.content
            except Exception as e:
                logger.error(f"Groq comparison error: {e}")

        if not raw_output and settings.gemini_api_key:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=settings.llm_model_name,
                    google_api_key=settings.gemini_api_key,
                    temperature=0.2
                )
                res = llm.invoke(prompt)
                raw_output = res.content
            except Exception as e:
                logger.error(f"Gemini comparison error: {e}")

        if not raw_output:
            return {
                "summary": "Comparison service unavailable.",
                "headers": headers,
                "rows": [],
                "markdownMatrix": "| Feature | Comparison |\n|---|---|\n| Analysis | Service unavailable |"
            }

        try:
            clean_json = raw_output.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            parsed = json.loads(clean_json)
            parsed["headers"] = headers
            return parsed
        except Exception as err:
            logger.error(f"Failed to parse comparison JSON: {err}")
            return {
                "summary": raw_output[:300],
                "headers": headers,
                "rows": [],
                "markdownMatrix": raw_output
            }
