from typing import List, Optional
from pydantic import BaseModel, Field

class DocIngestRequest(BaseModel):
    documentId: str
    userId: str
    fileUrl: str
    fileName: str
    vectorCollectionId: str

class DocIngestStatus(BaseModel):
    documentId: str
    status: str = Field(..., description="processing | completed | failed")
    chunkCount: Optional[int] = 0
    errorReason: Optional[str] = None
    timestamp: str

class SourceCitation(BaseModel):
    pageNumber: int
    snippet: str
    score: float

class ChatStreamRequest(BaseModel):
    requestId: str
    conversationId: str
    documentId: str
    userId: str
    query: str
    vectorCollectionId: str

class ChatStreamChunk(BaseModel):
    requestId: str
    conversationId: str
    chunkText: str
    index: int

class ChatStreamStatus(BaseModel):
    requestId: str
    conversationId: str
    status: str = Field(..., description="started | completed | failed")
    sources: Optional[List[SourceCitation]] = None
    errorMessage: Optional[str] = None
    timestamp: str
