"""Configuration constants for the PDF extraction service."""

import os
from pathlib import Path

# Directory paths
# BACKEND_DIR: src/pdf_reader/backend/ - contains backend code
BACKEND_DIR = Path(__file__).parent
# PDF_READER_DIR: src/pdf_reader/ - root of the pdf_reader package
PDF_READER_DIR = BACKEND_DIR.parent

# Azure OpenAI configuration - GPT-4.1 (used for key extraction, PDF comparison)
GPT41_API_KEY = os.getenv("GPT41_API_KEY")
GPT41_ENDPOINT = os.getenv("GPT41_ENDPOINT", "https://westeurope.api.cognitive.microsoft.com/")
GPT41_DEPLOYMENT = os.getenv("GPT41_DEPLOYMENT", "gpt-4.1")

# Azure OpenAI configuration - GPT-4.1-mini (used for chat, detection)
GPT41_MINI_API_KEY = os.getenv("GPT41_MINI_API_KEY")
GPT41_MINI_ENDPOINT = os.getenv("GPT41_MINI_ENDPOINT", "https://mf-gwc-tg.cognitiveservices.azure.com/")
GPT41_MINI_DEPLOYMENT = os.getenv("GPT41_MINI_DEPLOYMENT", "gpt-4.1-mini-GWC-TG")

# Shared Azure OpenAI settings
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

# LLM batch processing configuration
DEFAULT_BATCH_SIZE = 20  # number of keys sent per LLM request
MAX_CONCURRENT_BATCHES_GPT41 = 1  # gpt-4.1 has lower rate limits

# Legacy config for backward compatibility
OPENAI_API_KEY = GPT41_API_KEY

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
