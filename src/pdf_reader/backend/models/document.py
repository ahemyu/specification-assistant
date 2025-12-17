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

    # Foreign key to user (nullable for shared/anonymous documents)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Unique identifier used for file paths and API references
    file_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # Original filename as uploaded by user
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # PDF metadata
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # PDF binary data stored directly in database
    pdf_binary: Mapped[bytes | None] = mapped_column(LargeBinary(length=2**32 - 1), nullable=True)

    # Extracted content - LONGTEXT for MySQL to handle large PDFs
    formatted_text: Mapped[str | None] = mapped_column(LONGTEXT, nullable=True)

    # Line ID map for reference lookups (stored as JSON)
    line_id_map: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationship to user
    user = relationship("User", backref="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, file_id={self.file_id}, filename={self.original_filename})>"

    def to_pdf_data_dict(self) -> dict:
        """Convert to the pdf_data dict format used by the application.

        This matches the structure returned by process_single_pdf() so it can
        be used interchangeably with in-memory processed data.
        """
        return {
            "filename": self.original_filename,
            "total_pages": self.total_pages,
            "formatted_text": self.formatted_text or "",
            "line_id_map": self.line_id_map or {},
            # Note: 'pages' data is not stored - it's only needed during initial processing
        }
