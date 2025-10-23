from pydantic import BaseModel, Field


class KeyExtractionRequest(BaseModel):
    """Request model for key extraction endpoint."""

    file_ids: list[str]
    key_name: str
    additional_context: str | None = None


class MultipleKeysExtractionRequest(BaseModel):
    """Request model for extracting multiple keys."""

    file_ids: list[str]
    key_names: list[str]
    additional_context: str | None = None


class ChatMessage(BaseModel):
    """Individual message in a conversation."""

    role: str
    content: str


class QuestionRequest(BaseModel):
    """Request model for asking questions about PDFs."""

    file_ids: list[str]
    question: str
    conversation_history: list[ChatMessage] | None = None

class ExcelDownloadRequest(BaseModel):
    """Request model for downloading extraction results as Excel."""

    extraction_results: dict


class ExcelTemplateResponse(BaseModel):
    """Response model for Excel template upload."""

    template_id: str
    keys: list[str]
    total_keys: int


class ExcelTemplateExtractionRequest(BaseModel):
    """Request model for extracting keys from an uploaded Excel template."""

    template_id: str
    file_ids: list[str]
    additional_context: str | None = None


class SourceLocation(BaseModel):
    """Location information for where a key was found."""

    pdf_filename: str = Field(description="Name of the PDF file where the information was found")
    page_numbers: list[int] = Field(description="List of page numbers where the information was found")


class KeyExtractionResult(BaseModel):
    """Structured output for key extraction from PDF text."""

    key_value: str | None = Field(
        description="The extracted value for the requested key. If not found, this should be null."
    )
    source_locations: list[SourceLocation] = Field(
        description="List of source locations (PDF files and page numbers) where the key information was found"
    )
    description: str = Field(
        description="A brief description of where and how the key was found in the documents"
    )
