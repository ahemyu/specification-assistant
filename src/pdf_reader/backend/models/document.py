"""Document model for storing uploaded PDFs and extracted text."""

from datetime import datetime

from backend.database import Base
from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.dialects.mysql import JSON, LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Document(Base):
    """Document model for storing PDF metadata, binary, and extracted content.

    The PDF binary and all metadata/extracted text are stored in the database
    for persistence and querying."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to user
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Original filename as uploaded by user
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # PDF metadata
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # PDF binary data stored directly in database
    pdf_binary: Mapped[bytes | None] = mapped_column(LargeBinary(length=2**32 - 1), nullable=True)

    # Extracted content
    formatted_text: Mapped[str | None] = mapped_column(LONGTEXT, nullable=True)

    # Line ID map for reference lookups
    line_id_map: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationship to user
    user = relationship("User", backref="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, filename={self.file_name})>"

    def to_pdf_data_dict(self) -> dict:
        """Convert to the pdf_data dict format used by the application."""
        return {
            "document_id": self.id,
            "filename": self.file_name,
            "total_pages": self.total_pages,
            "formatted_text": self.formatted_text or "",
            "line_id_map": self.line_id_map or {},
        }
