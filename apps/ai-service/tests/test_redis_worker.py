import json
import pytest
from app.schemas.events import DocIngestRequest, ChatStreamRequest

def test_doc_ingest_request_schema():
    payload = {
        "correlationId": "test-uuid-1234",
        "version": "1.0",
        "documentId": "doc_abc",
        "userId": "user_xyz",
        "fileUrl": "/uploads/test.pdf",
        "fileName": "test.pdf",
        "vectorCollectionId": "col_test"
    }
    req = DocIngestRequest(**payload)
    assert req.documentId == "doc_abc"
    assert req.vectorCollectionId == "col_test"

def test_chat_stream_request_schema():
    payload = {
        "correlationId": "test-uuid-5678",
        "version": "1.0",
        "requestId": "req_1",
        "conversationId": "conv_1",
        "documentId": "doc_abc",
        "userId": "user_xyz",
        "query": "Summarize this document",
        "vectorCollectionId": "col_test"
    }
    req = ChatStreamRequest(**payload)
    assert req.query == "Summarize this document"
    assert req.conversationId == "conv_1"
