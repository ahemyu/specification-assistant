"""Configuration constants for the PDF extraction service."""

import os
from pathlib import Path

# Directory paths
# BACKEND_DIR: src/pdf_reader/backend/ - contains backend code
BACKEND_DIR = Path(__file__).parent
# PDF_READER_DIR: src/pdf_reader/ - root of the pdf_reader package
PDF_READER_DIR = BACKEND_DIR.parent

# Google Gemini Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

# LLM batch processing configuration
DEFAULT_BATCH_SIZE = 20  # number of keys sent per LLM request
MAX_CONCURRENT_BATCHES = 5  # Gemini has higher rate limits

# MySQL Database configuration
MYSQL_USER = os.getenv("MYSQL_USER", "app_user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "app_password")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "specification_assistant")

# JWT Authentication configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
