import pytest
from app.services.graph_workflow import rag_graph, RAGState

def test_rag_graph_structure():
    assert rag_graph is not None

def test_memory_service():
    from app.services.memory_service import memory_service
    conv_id = "test_conv_123"
    memory_service.add_user_message(conv_id, "Hello")
    memory_service.add_assistant_message(conv_id, "Hi there")
    history = memory_service.get_formatted_history(conv_id)
    assert "User: Hello" in history
    assert "Assistant: Hi there" in history
