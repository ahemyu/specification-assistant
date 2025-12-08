"""Configuration constants for the PDF extraction service."""

import os
from pathlib import Path

# Directory paths
# BACKEND_DIR: src/pdf_reader/backend/ - contains backend code
BACKEND_DIR = Path(__file__).parent
# PDF_READER_DIR: src/pdf_reader/ - root of the pdf_reader package
PDF_READER_DIR = BACKEND_DIR.parent

# Output directory for extracted text files
OUTPUT_DIR = BACKEND_DIR / "output"

# Directory for storing uploaded PDF files persistently
UPLOADED_PDFS_DIR = BACKEND_DIR / "uploaded_pdfs"

# OpenAI / Azure OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_OPENAI_BASE_URL = "https://westeurope.api.cognitive.microsoft.com/openai/v1/"
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", DEFAULT_OPENAI_BASE_URL)
DEFAULT_MODEL_NAME = "gpt-4.1"

# LLM batch processing configuration
DEFAULT_BATCH_SIZE = 20  # number of keys sent per LLM request (optimized for ~50K token PDFs)
MAX_CONCURRENT_BATCHES = 1  # how many batches are sent at once
