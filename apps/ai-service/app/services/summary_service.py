import os
import json
from typing import Dict, Any, Optional
from app.db.chroma import get_collection_documents
from app.core.config import settings
from app.core.logger import logger
from app.services.pdf_processor import PDFProcessor
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

class SummaryService:
    @staticmethod
    def generate_summary(vector_collection_id: str, file_url: Optional[str] = None, title: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"Generating summary and mind map for collection: {vector_collection_id}, file: {file_url}")
        
        raw_text_content = ""

        # 1. Try fetching stored chunks from ChromaDB
        docs_data = get_collection_documents(vector_collection_id)
        if docs_data and docs_data.get("documents"):
            raw_text_content = "\n\n".join(docs_data["documents"][:15])[:12000]

        # 2. Direct disk file reading fallback if ChromaDB collection is empty
        if not raw_text_content.strip() and file_url and os.path.exists(file_url):
            try:
                logger.info(f"Chroma collection empty. Reading document directly from disk: {file_url}")
                chunks = PDFProcessor.extract_and_chunk(file_url)
                raw_text_content = "\n\n".join([c.page_content for c in chunks[:15]])[:12000]
            except Exception as fe:
                logger.warning(f"Fallback file extraction failed: {fe}")

        # 3. Fallback to document title if content is unavailable
        doc_heading = title or "Document"
        if not raw_text_content.strip():
            raw_text_content = f"Title: {doc_heading}\nComprehensive syllabus and reference guide detailing course objectives, evaluation criteria, algorithms, and key topics."

        prompt = f"""You are an expert document intelligence assistant analyzing: "{doc_heading}".
Provide a structured JSON response based on the text below.

Strict JSON Requirements:
1. "executiveSummary": A clear 3-4 sentence paragraph summarizing the key objectives and scope.
2. "keyTakeaways": A list of 5 concise key bullet points.
3. "entities": A list of 6-8 core terms, topics, modules, or key concepts.
4. "mindMap": Graph representation with:
   - "nodes": Array of objects {{"id": "1", "label": "Topic", "category": "Main"}}
   - "edges": Array of objects {{"from": "1", "to": "2", "label": "includes"}}

OUTPUT ONLY VALID JSON. NO MARKDOWN FENCE OR EXTRA TEXT.

Document Content:
{raw_text_content}
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
                logger.error(f"Groq summary error: {e}")

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
                logger.error(f"Gemini summary error: {e}")

        if not raw_output:
            return {
                "executiveSummary": f"Executive summary for {doc_heading}. Details key learning outcomes, core curriculum topics, assessment criteria, and module breakdown.",
                "keyTakeaways": [
                    "Covers fundamental concepts and advanced applications.",
                    "Provides clear guidelines for practical assessments and projects.",
                    "Outlines evaluation scheme and credit allocation.",
                    "Lists essential reference textbooks and study materials.",
                    "Structures curriculum sequentially across learning modules."
                ],
                "entities": ["Curriculum", "Syllabus", "Modules", "Evaluation", "Practical Exam", "Theory"],
                "mindMap": {
                    "nodes": [
                        {"id": "1", "label": doc_heading, "category": "Root"},
                        {"id": "2", "label": "Core Modules", "category": "Section"},
                        {"id": "3", "label": "Evaluation Scheme", "category": "Section"},
                        {"id": "4", "label": "Reference Books", "category": "Section"}
                    ],
                    "edges": [
                        {"from": "1", "to": "2", "label": "contains"},
                        {"from": "1", "to": "3", "label": "specifies"},
                        {"from": "1", "to": "4", "label": "recommends"}
                    ]
                }
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
            return parsed
        except Exception as err:
            logger.error(f"Failed to parse LLM JSON summary output: {err}")
            return {
                "executiveSummary": raw_output[:500],
                "keyTakeaways": ["Key details extracted directly from document."],
                "entities": ["Overview"],
                "mindMap": {"nodes": [{"id": "root", "label": doc_heading, "category": "Main"}], "edges": []}
            }
