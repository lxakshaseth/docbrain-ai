class AIServiceException(Exception):
    def __init__(self, message: str, code: str = "AI_SERVICE_ERROR", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code

class VectorStoreError(AIServiceException):
    def __init__(self, message: str):
        super().__init__(message, code="VECTOR_STORE_ERROR", status_code=500)

class IngestionError(AIServiceException):
    def __init__(self, message: str):
        super().__init__(message, code="INGESTION_ERROR", status_code=400)

class LLMGenerationError(AIServiceException):
    def __init__(self, message: str):
        super().__init__(message, code="LLM_GENERATION_ERROR", status_code=500)
