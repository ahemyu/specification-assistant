"""Service layer for extraction result operations."""

import logging

from backend.models.extraction_result import ExtractionResult
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def create_extraction_result(
    db: AsyncSession,
    user_id: int,
    file_ids: list[str],
    extraction_results: dict[str, str | None],
    language: str = "en",
) -> ExtractionResult:
    """Create a new extraction result record in the database.

    Args:
        db: Database session.
        user_id: user ID who performed the extraction.
        file_ids: List of document file names included in this extraction.
        extraction_results: Simple dict mapping key names to extracted values.
        language: Language used for extraction.

    Returns:
        The created ExtractionResult instance.
    """
    extraction_result = ExtractionResult(
        user_id=user_id,
        file_ids=file_ids,
        extraction_results=extraction_results,
        language=language,
    )
    db.add(extraction_result)
    await db.commit()
    await db.refresh(extraction_result)
    logger.info(
        f"Created extraction result: {extraction_result.id} "
        f"(user_id={user_id}, files={len(file_ids)})"
    )
    return extraction_result


async def get_extraction_results_by_user(db: AsyncSession, user_id: int) -> list[ExtractionResult]:
    """Get all extraction results for a specific user.

    Args:
        db: Database session.
        user_id: The user ID.

    Returns:
        List of ExtractionResult instances for the user.
    """
    result = await db.execute(
        select(ExtractionResult)
        .where(ExtractionResult.user_id == user_id)
        .order_by(ExtractionResult.created_at.desc())
    )
    return list(result.scalars().all())
