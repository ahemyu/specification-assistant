"""Pytest configuration and fixtures for the test suite."""

import sys
from pathlib import Path

# Add src directory to path before other imports
# Tests are now in src/pdf_reader/backend/tests/, so go up 3 levels to reach src/pdf_reader/
src_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(src_dir))

import pytest  # noqa: E402
from backend.app import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="function")
def client() -> TestClient:
    """Create a test client for the FastAPI application."""
    return TestClient(app)


@pytest.fixture
def sample_pdf_path() -> Path:
    """Return path to a sample PDF file for testing."""
    return Path(__file__).parent / "fixtures" / "sample.pdf"


@pytest.fixture
def mock_pdf_data() -> dict:
    """Return mock PDF data structure matching the actual app structure."""
    return {
        "file_id": "test_file_123",
        "filename": "test.pdf",
        "formatted_text": "Sample PDF text content",
        "total_pages": 2,
        "pages": [{"page_number": 1, "text": "Page 1 content"}, {"page_number": 2, "text": "Page 2 content"}],
    }
