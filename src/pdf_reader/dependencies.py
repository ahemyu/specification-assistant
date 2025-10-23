"""Shared dependencies and storage for the PDF extraction service."""
import logging
import os
from pathlib import Path

from services.llm_key_extractor import LLMKeyExtractor

logger = logging.getLogger(__name__)

# Output directory for extracted text files
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

# In-memory storage for processed PDF data
# Key: file_id, Value: processed pdf_data dict from process_single_pdf
pdf_storage: dict[str, dict] = {}

# In-memory storage for uploaded Excel templates
# Key: template_id, Value: dict with excel_data, keys, and filled_excel (after extraction)
excel_template_storage: dict[str, dict] = {}

# Initialize LLM key extractor
llm_extractor: LLMKeyExtractor | None = None
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    try:
        llm_extractor = LLMKeyExtractor(api_key=GOOGLE_API_KEY)
        logger.info("LLM key extractor initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize LLM key extractor: {str(e)}")
else:
    logger.warning("GOOGLE_API_KEY not found. LLM key extraction endpoints will not be available.")


def get_llm_extractor() -> LLMKeyExtractor:
    """Dependency to get the LLM extractor instance."""
    if llm_extractor is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="LLM service is not available. GOOGLE_API_KEY may not be configured."
        )
    return llm_extractor


def get_pdf_storage() -> dict[str, dict]:
    """Dependency to get the PDF storage."""
    return pdf_storage


def get_excel_storage() -> dict[str, dict]:
    """Dependency to get the Excel template storage."""
    return excel_template_storage
