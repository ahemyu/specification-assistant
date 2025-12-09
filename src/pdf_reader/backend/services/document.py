"""Service layer for document operations."""

import logging

from backend.models.document import Document
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def create_document(
    db: AsyncSession,
    file_id: str,
    original_filename: str,
    total_pages: int,
    file_size_bytes: int,
    formatted_text: str,
    line_id_map: dict,
    pdf_binary: bytes | None = None,
    user_id: int | None = None,
) -> Document:
    """Create a new document record in the database.

    Args:
        db: Database session.
        file_id: Unique identifier for the document.
        original_filename: Original filename as uploaded.
        total_pages: Number of pages in the PDF.
        file_size_bytes: Size of the PDF file in bytes.
        formatted_text: Extracted and formatted text content.
        line_id_map: Mapping of line IDs to text for reference lookups.
        pdf_binary: The raw PDF file bytes.
        user_id: Optional user ID who owns this document.

    Returns:
        The created Document instance.
    """
    document = Document(
        file_id=file_id,
        original_filename=original_filename,
        total_pages=total_pages,
        file_size_bytes=file_size_bytes,
        formatted_text=formatted_text,
        line_id_map=line_id_map,
        pdf_binary=pdf_binary,
        user_id=user_id,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    logger.info(f"Created document: {file_id} ({original_filename})")
    return document


async def get_document_by_file_id(db: AsyncSession, file_id: str) -> Document | None:
    """Get a document by its file_id.

    Args:
        db: Database session.
        file_id: The unique file identifier.

    Returns:
        Document if found, None otherwise.
    """
    result = await db.execute(select(Document).where(Document.file_id == file_id))
    return result.scalar_one_or_none()


async def get_documents_by_user(db: AsyncSession, user_id: int | None = None) -> list[Document]:
    """Get all documents, optionally filtered by user.

    Args:
        db: Database session.
        user_id: Optional user ID to filter by. If None, returns all documents.

    Returns:
        List of Document instances.
    """
    if user_id is not None:
        result = await db.execute(
            select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc())
        )
    else:
        result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    return list(result.scalars().all())


async def get_all_documents(db: AsyncSession) -> list[Document]:
    """Get all documents in the database.

    Args:
        db: Database session.

    Returns:
        List of all Document instances.
    """
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    return list(result.scalars().all())


async def delete_document(db: AsyncSession, file_id: str) -> bool:
    """Delete a document by file_id.

    Args:
        db: Database session.
        file_id: The unique file identifier.

    Returns:
        True if document was deleted, False if not found.
    """
    document = await get_document_by_file_id(db, file_id)
    if document is None:
        return False

    await db.delete(document)
    await db.commit()
    logger.info(f"Deleted document from database: {file_id}")
    return True


async def delete_documents_by_user(db: AsyncSession, user_id: int) -> int:
    """Delete all documents belonging to a user.

    Args:
        db: Database session.
        user_id: The user ID whose documents should be deleted.

    Returns:
        Number of documents deleted.
    """
    from sqlalchemy import delete

    result = await db.execute(delete(Document).where(Document.user_id == user_id))
    await db.commit()
    deleted_count = result.rowcount
    logger.info(f"Deleted {deleted_count} documents for user_id: {user_id}")
    return deleted_count


def build_pdf_data_from_documents(documents: list[Document]) -> dict[str, dict]:
    """Build a dict mapping file_id to pdf_data from a list of documents.

    This creates a structure suitable for batch operations on multiple PDFs.

    Args:
        documents: List of Document instances.

    Returns:
        Dict mapping file_id to pdf_data dict.
    """
    return {doc.file_id: doc.to_pdf_data_dict() for doc in documents}
