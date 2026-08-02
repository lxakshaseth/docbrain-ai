from typing import List, Optional
from pydantic import BaseModel, Field

class IngestRequestSchema(BaseModel):
    document_id: str
    file_path: str
    collection_name: str

class QueryRequestSchema(BaseModel):
    query: str
    collection_name: str
    conversation_id: Optional[str] = None
    top_k: Optional[int] = 4

class SourceCitationSchema(BaseModel):
    pageNumber: int
    snippet: str
    score: float

class QueryResponseSchema(BaseModel):
    answer: str
    sources: List[SourceCitationSchema]
    suggested_questions: List[str]
    conversation_id: Optional[str] = None

class SuggestQuestionsRequestSchema(BaseModel):
    context: str
    num_questions: Optional[int] = 3

class SuggestQuestionsResponseSchema(BaseModel):
    suggested_questions: List[str]
