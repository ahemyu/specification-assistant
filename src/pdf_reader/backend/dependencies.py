"""Shared dependencies and storage for the PDF extraction service."""

from __future__ import annotations

import logging

from backend.config import OPENAI_API_KEY
from backend.database import get_db
from backend.models.user import User
from backend.services.auth import decode_access_token, get_user_by_id
from backend.services.llm_key_extractor import LLMKeyExtractor
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# Lazy-initialized LLM key extractor (created on first access)
_llm_extractor: LLMKeyExtractor | None = None
_llm_extractor_initialized: bool = False


def get_llm_extractor() -> LLMKeyExtractor:
    """
    Dependency to get the LLM extractor instance using lazy initialization.

    The extractor is created on first access rather than at module import time.
    This improves startup time and makes testing easier.

    Returns:
        LLMKeyExtractor instance

    Raises:
        HTTPException: If OPENAI_API_KEY is not configured or initialization fails
    """
    global _llm_extractor, _llm_extractor_initialized

    if not _llm_extractor_initialized:
        _llm_extractor_initialized = True

        if not OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not found. LLM key extraction endpoints will not be available.")
        else:
            try:
                _llm_extractor = LLMKeyExtractor(api_key=OPENAI_API_KEY)
                logger.info("LLM key extractor initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize LLM key extractor: {str(e)}")

    if _llm_extractor is None:
        raise HTTPException(
            status_code=503, detail="LLM service is not available. OPENAI_API_KEY may not be configured."
        )
    return _llm_extractor


def reset_llm_extractor() -> None:
    """
    Reset the LLM extractor state for testing purposes.

    This allows tests to re-trigger initialization or test behavior
    when the extractor is not available.
    """
    global _llm_extractor, _llm_extractor_initialized
    _llm_extractor = None
    _llm_extractor_initialized = False


async def get_pdf_data_for_file_ids_async(db: AsyncSession, file_ids: list[str]) -> list[dict]:
    """
    Retrieve PDF data for a list of file IDs from database.

    Args:
        db: Database session.
        file_ids: List of file IDs to look up.

    Returns:
        List of PDF data dictionaries in the format expected by LLM extractors.

    Raises:
        HTTPException: If any file_id is not found in database.
    """
    from backend.services.document import get_document_by_file_id
    from fastapi import HTTPException

    pdf_data_list = []
    for file_id in file_ids:
        document = await get_document_by_file_id(db, file_id)
        if document is None:
            raise HTTPException(
                status_code=404, detail=f"File with ID {file_id} not found. Please upload the file first."
            )
        pdf_data_list.append(document.to_pdf_data_dict())
    return pdf_data_list


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from the JWT token.

    Args:
        token: The JWT token from the Authorization header.
        db: The database session.

    Returns:
        The authenticated User.

    Raises:
        HTTPException: If token is missing, invalid, or user not found.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = decode_access_token(token)
    if token_data is None or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(db, token_data.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Get the current user if authenticated, otherwise return None.

    This is useful for endpoints that work for both authenticated
    and unauthenticated users but may provide different responses.

    Args:
        token: The JWT token from the Authorization header.
        db: The database session.

    Returns:
        The authenticated User if token is valid, None otherwise.
    """
    if token is None:
        return None

    token_data = decode_access_token(token)
    if token_data is None or token_data.user_id is None:
        return None

    user = await get_user_by_id(db, token_data.user_id)
    if user is None or not user.is_active:
        return None

    return user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current user and verify they are a superuser.

    Args:
        current_user: The currently authenticated user.

    Returns:
        The authenticated User if they are a superuser.

    Raises:
        HTTPException: If the user is not a superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
