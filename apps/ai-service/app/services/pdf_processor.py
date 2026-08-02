import os
from typing import List
from pypdf import PdfReader

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

try:
    from langchain_core.documents import Document
except ImportError:
    from langchain.docstore.document import Document

from app.core.config import settings
from app.core.logger import logger
from app.core.exceptions import IngestionError

class PDFProcessor:
    @staticmethod
    def extract_and_chunk(file_path: str, chunk_size: int = None, chunk_overlap: int = None) -> List[Document]:
        if not os.path.exists(file_path):
            raise IngestionError(f"PDF file does not exist at path: {file_path}")

        c_size = chunk_size or settings.default_chunk_size
        c_overlap = chunk_overlap or settings.default_chunk_overlap

        try:
            logger.info(f"Loading PDF document: {file_path}")
            reader = PdfReader(file_path)
            raw_docs = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    raw_docs.append(Document(
                        page_content=text,
                        metadata={"page": i, "source": file_path}
                    ))

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=c_size,
                chunk_overlap=c_overlap,
                separators=["\n\n", "\n", " ", ""]
            )

            chunks = text_splitter.split_documents(raw_docs)
            logger.info(f"Extracted {len(chunks)} chunks from {file_path}")
            return chunks
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise IngestionError(f"Failed to process PDF: {str(e)}")
