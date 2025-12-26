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
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Azure OpenAI configuration - DEPRECATED
GPT41_API_KEY = os.getenv("GPT41_API_KEY")
GPT41_ENDPOINT = os.getenv("GPT41_ENDPOINT", "https://westeurope.api.cognitive.microsoft.com/")
GPT41_DEPLOYMENT = os.getenv("GPT41_DEPLOYMENT", "gpt-4.1")

# Azure OpenAI configuration - DEPRECATED
GPT41_MINI_API_KEY = os.getenv("GPT41_MINI_API_KEY")
GPT41_MINI_ENDPOINT = os.getenv("GPT41_MINI_ENDPOINT", "https://mf-gwc-tg.cognitiveservices.azure.com/")
GPT41_MINI_DEPLOYMENT = os.getenv("GPT41_MINI_DEPLOYMENT", "gpt-4.1-mini-GWC-TG")

# Shared Azure OpenAI settings - DEPRECATED
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

# LLM batch processing configuration
DEFAULT_BATCH_SIZE = 20  # number of keys sent per LLM request
MAX_CONCURRENT_BATCHES = 5  # Gemini has higher rate limits

# Legacy config for backward compatibility
OPENAI_API_KEY = GPT41_API_KEY

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
