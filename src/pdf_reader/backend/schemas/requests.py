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
    additional_context: str | None = None


class PDFComparisonRequest(BaseModel):
    """Request model for comparing two PDF versions."""

    base_file_id: str  # The original/old version
    new_file_id: str   # The updated/new version
    additional_context: str | None = None


class ProductTypeDetectionRequest(BaseModel):
    """Request model for detecting product type from PDFs."""

    file_ids: list[str]


class CoreWindingCountRequest(BaseModel):
    """Request model for detecting core/winding count from PDFs."""

    file_ids: list[str]
    product_type: str
