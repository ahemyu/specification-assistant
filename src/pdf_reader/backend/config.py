"""Configuration constants for the PDF extraction service."""

import os
from pathlib import Path

# Directory paths
# BACKEND_DIR: src/pdf_reader/backend/ - contains backend code
BACKEND_DIR = Path(__file__).parent
# PDF_READER_DIR: src/pdf_reader/ - root of the pdf_reader package
PDF_READER_DIR = BACKEND_DIR.parent

# OpenAI / Azure OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_OPENAI_BASE_URL = "https://westeurope.api.cognitive.microsoft.com/openai/v1/"
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", DEFAULT_OPENAI_BASE_URL)
DEFAULT_MODEL_NAME = "gpt-4.1"

# LLM batch processing configuration
DEFAULT_BATCH_SIZE = 20  # number of keys sent per LLM request (optimized for ~50K token PDFs)
MAX_CONCURRENT_BATCHES = 1  # how many batches are sent at once

# MySQL Database configuration
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "specification_assistant")

# JWT Authentication configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
