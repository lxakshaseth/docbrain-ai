import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "PDF KB AI Microservice"
    assert data["status"] == "online"

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "ai-service"

def test_suggest_questions_endpoint():
    payload = {
        "context": "This document describes quantum computing algorithms and error correction.",
        "num_questions": 3
    }
    response = client.post("/api/v1/suggest-questions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "suggested_questions" in data
    assert len(data["suggested_questions"]) > 0
