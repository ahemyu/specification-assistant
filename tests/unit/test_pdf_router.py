"""Unit tests for PDF upload and processing endpoints."""
import pytest
from pathlib import Path
from unittest.mock import patch
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src" / "pdf_reader"))

from dependencies import pdf_storage


@pytest.mark.unit
class TestPDFUpload:
    """Tests for PDF upload functionality."""

    def test_upload_endpoint_exists(self, client):
        """Test that upload endpoint exists and responds."""
        # Create mock PDF file
        file_content = b"%PDF-1.4 mock pdf content"
        files = {"files": ("test.pdf", file_content, "application/pdf")}

        # Execute
        response = client.post("/upload", files=files)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "processed" in data or "failed" in data

    def test_upload_multiple_pdfs(self, client):
        """Test uploading multiple PDF files."""
        # Create multiple mock PDF files
        files = [
            ("files", ("test1.pdf", b"%PDF-1.4 content1", "application/pdf")),
            ("files", ("test2.pdf", b"%PDF-1.4 content2", "application/pdf"))
        ]

        # Execute
        response = client.post("/upload", files=files)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "processed" in data or "failed" in data


@pytest.mark.unit
class TestPDFRetrieval:
    """Tests for PDF data retrieval endpoints."""

    def test_get_pdf_preview_not_found(self, client):
        """Test retrieving non-existent PDF returns 404."""
        # Execute
        response = client.get("/preview/nonexistent_id")

        # Assert
        assert response.status_code == 404


@pytest.mark.unit
class TestPDFDeletion:
    """Tests for PDF deletion functionality."""

    def test_delete_pdf_success(self, client, mock_pdf_data):
        """Test successful PDF deletion."""
        # Setup: Add PDF to storage
        file_id = mock_pdf_data["file_id"]
        pdf_storage[file_id] = mock_pdf_data

        # Execute
        response = client.delete(f"/delete-pdf/{file_id}")

        # Assert
        assert response.status_code == 200
        assert file_id not in pdf_storage


@pytest.mark.unit
class TestPDFStorage:
    """Tests for PDF storage functionality."""

    def test_pdf_storage_clear(self, mock_pdf_data):
        """Test that PDF storage is properly cleared between tests."""
        # Verify storage is empty at start
        assert len(pdf_storage) == 0

        # Add data
        pdf_storage["test_id"] = mock_pdf_data

        # Verify it was added
        assert len(pdf_storage) == 1

    def test_pdf_storage_isolation(self):
        """Test that each test has isolated storage."""
        # This should be empty due to autouse clear_storage fixture
        assert len(pdf_storage) == 0
