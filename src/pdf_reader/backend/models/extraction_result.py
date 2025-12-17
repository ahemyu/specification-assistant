"""Extraction result model for storing LLM extraction results in the database."""

from datetime import datetime

from backend.database import Base
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column


class ExtractionResult(Base):
    """Model for storing LLM extraction results."""

    __tablename__ = "extraction_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    extraction_results: Mapped[dict[str, str | None]] = mapped_column(JSON, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<ExtractionResult(id={self.id}, user_id={self.user_id}, files={len(self.file_ids)})>"
