try:
    from langchain_core.prompts import PromptTemplate
except ImportError:
    from langchain.prompts import PromptTemplate

# Anti-Hallucination RAG System Prompt
RAG_SYSTEM_PROMPT = """You are an expert AI Study Assistant and Document Tutor.
Your goal is to provide clear, thorough, and highly helpful answers to the user's questions based on the provided document.

INSTRUCTIONS & GUIDELINES:
1. Primary Source: Carefully examine the Ground Truth Document Context. If the answer is present or can be inferred from the context, provide a detailed explanation and cite the page/section numbers if available.
2. Educational & Comprehensive: If the document mentions a topic (e.g. in a syllabus, outline, or table) but does not provide a full explanation, provide a complete, well-structured explanation of the concept to help the user learn. Note what is specifically mentioned in the document and supplement it with clear, accurate explanations.
3. Formatting: Use markdown formatting (bullet points, bold text, code blocks) to make your response easy to read, well-structured, and engaging.

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
