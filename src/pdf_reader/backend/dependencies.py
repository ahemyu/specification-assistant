"""Shared dependencies and storage for the PDF extraction service."""
import logging
import os
from pathlib import Path

from backend.services.llm_key_extractor import LLMKeyExtractor

logger = logging.getLogger(__name__)

# Base directory is the directory containing this file (src/pdf_reader)
BASE_DIR = Path(__file__).parent

# Output directory for extracted text files
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Directory for storing uploaded PDF files persistently
UPLOADED_PDFS_DIR = BASE_DIR / "uploaded_pdfs"
UPLOADED_PDFS_DIR.mkdir(exist_ok=True)

# In-memory storage for processed PDF data
# Key: file_id, Value: processed pdf_data dict from process_single_pdf
pdf_storage: dict[str, dict] = {}

# In-memory storage for uploaded Excel templates
# Key: template_id, Value: dict with excel_data, keys, and filled_excel (after extraction)
excel_template_storage: dict[str, dict] = {}

# Initialize LLM key extractor
llm_extractor: LLMKeyExtractor | None = None
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY:
    try:
        llm_extractor = LLMKeyExtractor(api_key=OPENAI_API_KEY)
        logger.info("LLM key extractor initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize LLM key extractor: {str(e)}")
else:
    logger.warning("OPENAI_API_KEY not found. LLM key extraction endpoints will not be available.")


def get_llm_extractor() -> LLMKeyExtractor:
    """Dependency to get the LLM extractor instance."""
    if llm_extractor is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="LLM service is not available. OPENAI_API_KEY may not be configured."
        )
    return llm_extractor


def get_pdf_storage() -> dict[str, dict]:
    """Dependency to get the PDF storage."""
    return pdf_storage


def get_excel_storage() -> dict[str, dict]:
    """Dependency to get the Excel template storage."""
    return excel_template_storage


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
