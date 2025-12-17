"""Request models for API endpoints."""

from pydantic import BaseModel

from .domain import ChatMessage


class KeyExtractionRequest(BaseModel):
    """Request model for key extraction endpoint.

    Note: Always uses gpt-4.1 for accuracy.
    """

    file_ids: list[str]
    key_names: list[str]
    language: str = "en"


class QuestionRequest(BaseModel):
    """Request model for asking questions about PDFs.

    Note: Always uses gpt-4.1-mini for speed.
    """

    file_ids: list[str]
    question: str
    conversation_history: list[ChatMessage] | None = None
    language: str = "en"


class ExcelDownloadRequest(BaseModel):
    """Request model for downloading extraction results as Excel."""

    extraction_results: dict


class PDFComparisonRequest(BaseModel):
    """Request model for comparing two PDF versions.

    Note: Always uses gpt-4.1 for accuracy.
    """

    base_file_id: str  # The original/old version
    new_file_id: str  # The updated/new version
    additional_context: str | None = None


class ProductTypeDetectionRequest(BaseModel):
    """Request model for detecting product type from PDFs.

    Note: Always uses gpt-4.1-mini for speed.
    """

    file_ids: list[str]


class CoreWindingCountRequest(BaseModel):
    """Request model for detecting core/winding count from PDFs.

    Note: Always uses gpt-4.1-mini for speed.
    """

    file_ids: list[str]
    product_type: str
