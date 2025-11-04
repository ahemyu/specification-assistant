"""Domain models."""
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Individual message in a conversation."""

    role: str
    content: str


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
