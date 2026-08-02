from typing import List, TypedDict, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from app.services.retriever_service import HybridRetrieverService
from app.services.prompt_templates import rag_prompt_template, followup_prompt_template
from app.core.config import settings
from app.core.logger import logger
from app.services.memory_service import memory_service

class RAGState(TypedDict):
    query: str
    collection_name: str
    conversation_id: str
    top_k: int
    retrieved_docs: List[str]
    sources: List[Dict[str, Any]]
    answer: str
    suggested_questions: List[str]

# Node 1: Hybrid Retrieval (Dense + Sparse BM25)
def hybrid_retrieve_node(state: RAGState) -> Dict[str, Any]:
    logger.info(f"LangGraph Node 1 [Hybrid Retrieve]: Querying '{state['query']}'")
    context_docs, sources = HybridRetrieverService.hybrid_retrieve(
        query=state['query'],
        collection_name=state['collection_name'],
        top_k=state.get('top_k', 4)
    )
    return {
        "retrieved_docs": context_docs,
        "sources": sources
    }

# Node 2: Grounded LLM Answer Generation (Groq / Gemini)
def generate_answer_node(state: RAGState) -> Dict[str, Any]:
    logger.info("LangGraph Node 2 [Generate Answer]: Formatting prompt & calling LLM")
    query = state['query']
    docs = state.get('retrieved_docs', [])
    context_str = "\n\n".join(docs) if docs else "No relevant document context found."

    history_str = ""
    if state.get('conversation_id'):
        history_str = memory_service.get_formatted_history(state['conversation_id'])

    formatted_prompt = rag_prompt_template.format(
        history=history_str,
        context=context_str,
        query=query
    )

    answer = ""
    if settings.groq_api_key:
        try:
            logger.info(f"Using Groq LPUs ({settings.groq_model_name}) for high-speed RAG inference")
            llm = ChatGroq(
                model_name=settings.groq_model_name,
                groq_api_key=settings.groq_api_key,
                temperature=0.2
            )
            response = llm.invoke(formatted_prompt)
            answer = response.content
        except Exception as e:
            logger.error(f"Groq LLM invocation error: {e}")
            answer = ""

    if not answer and settings.gemini_api_key:
        try:
            logger.info("Using Google Gemini for RAG inference")
            llm = ChatGoogleGenerativeAI(
                model=settings.llm_model_name,
                google_api_key=settings.gemini_api_key,
                temperature=0.2
            )
            response = llm.invoke(formatted_prompt)
            answer = response.content
        except Exception as e:
            logger.error(f"Gemini LLM invocation error: {e}")
            answer = ""

    if not answer:
        answer = f"Based on the document context:\n{docs[0] if docs else 'Information not found.'}"

    if state.get('conversation_id'):
        memory_service.add_user_message(state['conversation_id'], query)
        memory_service.add_assistant_message(state['conversation_id'], answer)

    return {"answer": answer}

# Node 3: Grounded Follow-Up Questions Generator
def generate_followups_node(state: RAGState) -> Dict[str, Any]:
    logger.info("LangGraph Node 3 [Generate Follow-up Questions]")
    query = state['query']
    answer = state.get('answer', '')
    docs = state.get('retrieved_docs', [])
    context_snippet = docs[0][:300] if docs else "PDF Document Content"

    formatted_prompt = followup_prompt_template.format(
        query=query,
        answer=answer[:500],
        context_snippet=context_snippet
    )

    suggested = []
    if settings.groq_api_key:
        try:
            llm = ChatGroq(
                model_name=settings.groq_model_name,
                groq_api_key=settings.groq_api_key,
                temperature=0.6
            )
            resp = llm.invoke(formatted_prompt)
            lines = [line.strip("- *123456789.") for line in resp.content.split("\n") if line.strip()]
            suggested = lines[:3]
        except Exception as e:
            logger.error(f"Groq follow-up generation error: {e}")

    if not suggested and settings.gemini_api_key:
        try:
            llm = ChatGoogleGenerativeAI(
                model=settings.llm_model_name,
                google_api_key=settings.gemini_api_key,
                temperature=0.7
            )
            resp = llm.invoke(formatted_prompt)
            lines = [line.strip("- *123456789.") for line in resp.content.split("\n") if line.strip()]
            suggested = lines[:3]
        except Exception as e:
            logger.error(f"Gemini follow-up generation error: {e}")

    if not suggested:
        suggested = [
            "Can you elaborate further on this section?",
            "What are the main key takeaways mentioned?",
            "Are there any specific metrics or numbers reported?"
        ]

    return {"suggested_questions": suggested}

# Build LangGraph RAG Workflow
def build_rag_graph():
    workflow = StateGraph(RAGState)

    workflow.add_node("hybrid_retrieve", hybrid_retrieve_node)
    workflow.add_node("generate_answer", generate_answer_node)
    workflow.add_node("generate_followups", generate_followups_node)

    workflow.set_entry_point("hybrid_retrieve")
    workflow.add_edge("hybrid_retrieve", "generate_answer")
    workflow.add_edge("generate_answer", "generate_followups")
    workflow.add_edge("generate_followups", END)

    return workflow.compile()

rag_graph = build_rag_graph()
