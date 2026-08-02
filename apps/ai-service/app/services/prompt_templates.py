try:
    from langchain_core.prompts import PromptTemplate
except ImportError:
    from langchain.prompts import PromptTemplate

# Anti-Hallucination RAG System Prompt
RAG_SYSTEM_PROMPT = """You are a Senior AI Assistant specialized in analyzing and explaining complex PDF documents.
Your goal is to answer the user's question with high accuracy, clarity, and precision.

CRITICAL GROUNDING RULES:
1. Base your answer STRICTLY on the Ground Truth Context provided below.
2. If the answer cannot be found in or inferred from the context, state clearly: "I could not find specific information regarding this in the uploaded document."
3. Do NOT make up facts, hallucinate, or use external knowledge outside the document context.
4. When citing information, reference relevant sections and page numbers.

Conversation Memory History:
{history}

Ground Truth Document Context:
{context}

User Question: {query}

Answer:"""

# Grounded Follow-up Questions Generation Prompt
FOLLOWUP_QUESTIONS_PROMPT = """Based on the following document query and generated answer, suggest 3 concise, highly relevant follow-up questions that a user would likely ask next to dive deeper into the document.

User Query: {query}
Answer: {answer}

Grounding Context Snippet:
{context_snippet}

Output Requirement:
Return EXACTLY 3 questions as a plain list, one question per line. Do NOT include numbers or bullet symbols.
"""

# Context Compression Prompt
CONTEXT_COMPRESSION_PROMPT = """Extract only the sentences from the text chunk below that are directly relevant to answering the user query. Omit all irrelevant noise.

User Query: {query}
Text Chunk: {chunk}

Extracted Relevant Context:"""

rag_prompt_template = PromptTemplate(
    input_variables=["history", "context", "query"],
    template=RAG_SYSTEM_PROMPT
)

followup_prompt_template = PromptTemplate(
    input_variables=["query", "answer", "context_snippet"],
    template=FOLLOWUP_QUESTIONS_PROMPT
)
