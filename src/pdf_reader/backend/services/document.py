"""Service layer for document operations."""

import logging

from backend.models.document import Document
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def create_document(
    db: AsyncSession,
    file_name: str,
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
        file_name: Original filename as uploaded.
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
        file_name=file_name,
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
    logger.info("Created document: %s (%s)", document.id, file_name)
    return document


async def get_document_by_id(db: AsyncSession, document_id: int) -> Document | None:
    """Get a document by its primary key.

    Args:
        db: Database session.
        document_id: The document ID.

    Returns:
        Document if found, None otherwise.
    """
    return await db.get(Document, document_id)


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


async def delete_document(db: AsyncSession, document_id: int) -> bool:
    """Delete a document by document ID.

    Args:
        db: Database session.
        document_id: The document ID.

    Returns:
        True if document was deleted, False if not found.
    """
    document = await get_document_by_id(db, document_id)
    if document is None:
        return False

    await db.delete(document)
    await db.commit()
    logger.info("Deleted document from database: %s", document_id)
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


def build_pdf_data_from_documents(documents: list[Document]) -> dict[int, dict]:
    """Build a dict mapping document_id to pdf_data from a list of documents.

    This creates a structure suitable for batch operations on multiple PDFs.

    Args:
        documents: List of Document instances.

    Returns:
        Dict mapping document_id to pdf_data dict.
    """
    return {doc.id: doc.to_pdf_data_dict() for doc in documents}
