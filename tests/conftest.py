"""Pytest configuration and fixtures for the test suite."""
import sys
from pathlib import Path

# Add src directory to path before other imports
src_dir = Path(__file__).parent.parent / "src" / "pdf_reader"
sys.path.insert(0, str(src_dir))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import app  # noqa: E402
from dependencies import excel_template_storage, pdf_storage  # noqa: E402


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
    # No cleanup needed after yield - next test will clear before it runs


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
