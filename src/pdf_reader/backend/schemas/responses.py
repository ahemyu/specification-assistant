"""Response models for API endpoints."""
from pydantic import BaseModel


class ExcelTemplateResponse(BaseModel):
    """Response model for Excel template upload."""

    template_id: str
    keys: list[str]
    total_keys: int
