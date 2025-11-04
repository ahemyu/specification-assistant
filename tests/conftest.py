"""Pytest configuration and fixtures for the test suite."""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add src directory to path and change to that directory
src_dir = Path(__file__).parent.parent / "src" / "pdf_reader"
sys.path.insert(0, str(src_dir))

# Change to the src directory so relative paths in app work
original_dir = os.getcwd()
os.chdir(str(src_dir))

from app import app
from dependencies import pdf_storage, excel_template_storage

# Change back to original directory
os.chdir(original_dir)


@pytest.fixture(scope="function")
def client() -> TestClient:
    """Create a test client for the FastAPI application."""
    return TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def clear_storage():
    """Clear in-memory storage before each test."""
    pdf_storage.clear()
    excel_template_storage.clear()
    yield
    pdf_storage.clear()
    excel_template_storage.clear()


@pytest.fixture
def sample_pdf_path() -> Path:
    """Return path to a sample PDF file for testing."""
    return Path(__file__).parent / "fixtures" / "sample.pdf"


@pytest.fixture
def sample_excel_path() -> Path:
    """Return path to a sample Excel file for testing."""
    return Path(__file__).parent / "fixtures" / "sample_template.xlsx"


@pytest.fixture
def mock_pdf_data() -> dict:
    """Return mock PDF data structure matching the actual app structure."""
    return {
        "file_id": "test_file_123",
        "filename": "test.pdf",
        "formatted_text": "Sample PDF text content",
        "total_pages": 2,
        "pages": [
            {"page_number": 1, "text": "Page 1 content"},
            {"page_number": 2, "text": "Page 2 content"}
        ]
    }


@pytest.fixture
def mock_excel_data() -> dict:
    """Return mock Excel template data."""
    return {
        "template_id": "test_template_123",
        "filename": "template.xlsx",
        "keys": ["Name", "Age", "Address"],
        "excel_data": {
            "Sheet1": [
                ["Name", "Age", "Address"],
                ["", "", ""]
            ]
        }
    }
