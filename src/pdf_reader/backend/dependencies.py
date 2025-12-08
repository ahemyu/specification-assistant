"""Shared dependencies and storage for the PDF extraction service."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from backend.config import OPENAI_API_KEY, OUTPUT_DIR, UPLOADED_PDFS_DIR

if TYPE_CHECKING:
    from backend.services.llm_key_extractor import LLMKeyExtractor

logger = logging.getLogger(__name__)

# Ensure directories exist at module load time
OUTPUT_DIR.mkdir(exist_ok=True)
UPLOADED_PDFS_DIR.mkdir(exist_ok=True)

# In-memory storage for processed PDF data
# Key: file_id, Value: processed pdf_data dict from process_single_pdf
pdf_storage: dict[str, dict] = {}

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
                from backend.services.llm_key_extractor import LLMKeyExtractor

                _llm_extractor = LLMKeyExtractor(api_key=OPENAI_API_KEY)
                logger.info("LLM key extractor initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize LLM key extractor: {str(e)}")

    if _llm_extractor is None:
        from fastapi import HTTPException

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


def get_pdf_storage() -> dict[str, dict]:
    """Dependency to get the PDF storage."""
    return pdf_storage


def get_pdf_data_for_file_ids(file_ids: list[str]) -> list[dict]:
    """
    Retrieve PDF data for a list of file IDs from storage.

    Args:
        file_ids: List of file IDs to look up

    Returns:
        List of PDF data dictionaries

    Raises:
        HTTPException: If any file_id is not found in storage
    """
    from fastapi import HTTPException

    pdf_data_list = []
    for file_id in file_ids:
        if file_id not in pdf_storage:
            raise HTTPException(
                status_code=404, detail=f"File with ID {file_id} not found. Please upload the file first."
            )
        pdf_data_list.append(pdf_storage[file_id])
    return pdf_data_list


def load_existing_pdfs() -> None:
    """
    Load existing PDF files from disk on startup and populate pdf_storage.
    This ensures PDFs persist across app restarts.
    """
    from backend.services.process_pdfs import process_single_pdf

    logger.info("Loading existing PDFs from disk...")
    loaded_count = 0

    # Check for existing PDF files
    if not UPLOADED_PDFS_DIR.exists():
        logger.info("No uploaded PDFs directory found")
        return

    pdf_files = list(UPLOADED_PDFS_DIR.glob("*.pdf"))

    if not pdf_files:
        logger.info("No existing PDFs found")
        return

    for pdf_file in pdf_files:
        try:
            # Process the PDF
            pdf_data = process_single_pdf(pdf_file, filename=pdf_file.name)

            # Use the file stem (filename without extension) as file_id
            file_id = pdf_file.stem

            # Store in memory
            pdf_storage[file_id] = pdf_data

            loaded_count += 1
            logger.info(f"Loaded {pdf_file.name} with file_id: {file_id}")

        except Exception as e:
            logger.error(f"Error loading {pdf_file.name}: {str(e)}")

    logger.info(f"Successfully loaded {loaded_count} PDF(s) from disk")
