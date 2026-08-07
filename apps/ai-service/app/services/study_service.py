import os
import json
from typing import Dict, Any, List, Optional
from app.db.chroma import get_collection_documents
from app.core.config import settings
from app.core.logger import logger
from app.services.pdf_processor import PDFProcessor
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

class StudyService:
    @staticmethod
    def generate_quiz_and_flashcards(vector_collection_id: str, file_url: Optional[str] = None, title: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"Generating study set for collection: {vector_collection_id}, file: {file_url}")
        
        raw_text_content = ""
        docs_data = get_collection_documents(vector_collection_id)
        if docs_data and docs_data.get("documents"):
            raw_text_content = "\n\n".join(docs_data["documents"][:15])[:12000]

        if not raw_text_content.strip() and file_url and os.path.exists(file_url):
            try:
                chunks = PDFProcessor.extract_and_chunk(file_url)
                raw_text_content = "\n\n".join([c.page_content for c in chunks[:15]])[:12000]
            except Exception as fe:
                logger.warning(f"Fallback file extraction for study set failed: {fe}")

        doc_heading = title or "Document"
        if not raw_text_content.strip():
            raw_text_content = f"Title: {doc_heading}\nComprehensive syllabus covering key concepts, theoretical foundations, practical applications, and evaluation scheme."

        prompt = f"""You are an AI study assistant analyzing: "{doc_heading}".
Generate a study set with multiple-choice quiz questions and 3D flashcards.

Strict JSON Requirements:
1. "quizzes": Array of 5 objects:
   - "id": string (e.g. "q1")
   - "question": string
   - "options": Array of 4 strings
   - "correctAnswerIndex": integer (0 to 3)
   - "explanation": string explaining the correct answer
2. "flashcards": Array of 6 objects:
   - "id": string (e.g. "f1")
   - "front": string (Key term or question)
   - "back": string (Detailed explanation or answer)
   - "category": string (e.g. "Core Concept", "Formula", "Definition")

OUTPUT ONLY VALID JSON. DO NOT INCLUDE MARKDOWN FENCES.

Document Text:
{raw_text_content}
"""

        raw_output = ""

        if settings.groq_api_key:
            try:
                llm = ChatGroq(
                    model_name=settings.groq_model_name,
                    groq_api_key=settings.groq_api_key,
                    temperature=0.3
                )
                res = llm.invoke(prompt)
                raw_output = res.content
            except Exception as e:
                logger.error(f"Groq study set error: {e}")

        if not raw_output and settings.gemini_api_key:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=settings.llm_model_name,
                    google_api_key=settings.gemini_api_key,
                    temperature=0.3
                )
                res = llm.invoke(prompt)
                raw_output = res.content
            except Exception as e:
                logger.error(f"Gemini study set error: {e}")

        if not raw_output:
            return {
                "quizzes": [
                    {
                        "id": "q1",
                        "question": f"What is the primary objective outlined in {doc_heading}?",
                        "options": ["To detail core learning modules", "To outline hardware specs", "To list external vendors", "To establish network protocols"],
                        "correctAnswerIndex": 0,
                        "explanation": "The document primarily structures the educational modules, syllabus criteria, and assessment guidelines."
                    },
                    {
                        "id": "q2",
                        "question": "How are assessments generally structured in this syllabus?",
                        "options": ["Continuous evaluation & term exam", "Single final assignment", "Attendance only", "External survey"],
                        "correctAnswerIndex": 0,
                        "explanation": "Standard academic syllabi evaluate students through continuous internal assessments and semester end examinations."
                    }
                ],
                "flashcards": [
                    {
                        "id": "f1",
                        "front": f"What is {doc_heading}?",
                        "back": "A structured curriculum document detailing learning objectives, module breakdowns, and evaluation schemes.",
                        "category": "Definition"
                    },
                    {
                        "id": "f2",
                        "front": "Evaluation Scheme",
                        "back": "The framework governing internal marks, term work, practical exams, and end-semester written papers.",
                        "category": "Assessment"
                    }
                ]
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
            logger.error(f"Failed to parse LLM JSON study set output: {err}")
            return {
                "quizzes": [],
                "flashcards": []
            }

    @staticmethod
    def generate_audio_overview(text: str, output_path: str) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        clean_text = text.strip()
        if not clean_text:
            clean_text = "Here is an audio summary of your document."
        
        if len(clean_text) > 1500:
            clean_text = clean_text[:1500] + "..."
            
        try:
            from gtts import gTTS
            tts = gTTS(text=clean_text, lang='en', slow=False)
            tts.save(output_path)
            logger.info(f"Audio file generated at {output_path}")
        except Exception as e:
            logger.error(f"Error generating gTTS audio: {e}")
            raise e
        return output_path
