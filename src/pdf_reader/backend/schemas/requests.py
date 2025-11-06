"""Request models for API endpoints."""
from pydantic import BaseModel

from .domain import ChatMessage


class KeyExtractionRequest(BaseModel):
    """Request model for key extraction endpoint."""

    file_ids: list[str]
    key_names: list[str]


class QuestionRequest(BaseModel):
    """Request model for asking questions about PDFs."""

    file_ids: list[str]
    question: str
    conversation_history: list[ChatMessage] | None = None
    model_name: str | None = "gpt-4.1"


class ExcelDownloadRequest(BaseModel):
    """Request model for downloading extraction results as Excel."""

    extraction_results: dict


class ExcelTemplateExtractionRequest(BaseModel):
    """Request model for extracting keys from an uploaded Excel template."""

    template_id: str
    file_ids: list[str]
