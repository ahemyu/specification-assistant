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
    bounding_box: list[float] | None = Field(
        default=None,
        description="Bounding box coordinates [x0, top, x1, bottom] for highlighting the text location"
    )


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
    matched_line_ids: list[str] | None = Field(
        default=None,
        description="Line IDs or cell IDs where the key value was found (e.g., ['3_5', '3_t0_r1_c1'])"
    )


class SpecificationChange(BaseModel):
    """Represents a change in a specification between two PDF versions."""

    specification_name: str = Field(description="Name or identifier of the specification that changed")
    old_value: str | None = Field(description="Value in the base/old PDF. Null if not present in old version.")
    new_value: str | None = Field(description="Value in the new/updated PDF. Null if removed in new version.")
    change_type: str = Field(
        description="Type of change: 'added', 'removed', 'modified', or 'unchanged'"
    )
    description: str = Field(description="Description of the change and its significance")
    pages_old: list[int] = Field(description="Page numbers in the old PDF where this was found")
    pages_new: list[int] = Field(description="Page numbers in the new PDF where this was found")


class PDFComparisonResult(BaseModel):
    """Structured output for PDF comparison."""

    summary: str = Field(description="High-level summary of all changes between the two PDFs")
    changes: list[SpecificationChange] = Field(
        description="List of all specification changes found between the documents"
    )
    total_changes: int = Field(description="Total number of changes detected")


class ProductTypeDetectionResult(BaseModel):
    """Structured output for product type detection from PDF specifications."""

    product_type: str = Field(
        description="Detected product type: 'Stromwandler', 'Spannungswandler', or 'Kombiwandler'"
    )
    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0 indicating certainty of detection"
    )
    evidence: str = Field(
        description="Explanation of the evidence found in the document that supports this classification"
    )
    page_numbers: list[int] = Field(
        description="Page numbers where the key evidence was found"
    )
