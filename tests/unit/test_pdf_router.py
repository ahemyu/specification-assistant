"""Unit tests for PDF upload and processing endpoints."""
from pathlib import Path
from unittest.mock import patch

import pytest

from dependencies import pdf_storage


@pytest.mark.unit
class TestPDFUpload:
    """Tests for PDF upload functionality."""

    def test_upload_endpoint_exists(self, client, sample_pdf_path):
        """Test that upload endpoint exists and responds."""
        # Use actual PDF fixture file
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()
        files = {"files": ("test.pdf", file_content, "application/pdf")}

        # Execute
        response = client.post("/upload", files=files)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "processed" in data
        assert "failed" in data

    def test_upload_multiple_pdfs(self, client, sample_pdf_path):
        """Test uploading multiple PDF files."""
        # Use actual PDF fixture file for both uploads
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()

        files = [
            ("files", ("test1.pdf", file_content, "application/pdf")),
            ("files", ("test2.pdf", file_content, "application/pdf"))
        ]

        # Execute
        response = client.post("/upload", files=files)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "processed" in data
        assert "failed" in data
        # At least one should be processed successfully
        assert len(data["processed"]) > 0

    def test_upload_invalid_pdf_file(self, client):
        """Test upload with invalid (non-PDF) file type."""
        # Create a non-PDF file
        file_content = b"not a pdf file"
        files = {"files": ("document.txt", file_content, "text/plain")}

        # Execute
        response = client.post("/upload", files=files)

        # Assert
        # PDF router always returns 200, but adds invalid files to 'failed' list
        assert response.status_code == 200
        data = response.json()
        assert "failed" in data
        assert "processed" in data
        # The invalid file should be in the failed list
        assert any("document.txt" in failed_item for failed_item in data["failed"])
        # No files should be processed
        assert len(data["processed"]) == 0

    def test_upload_mixed_valid_invalid_files(self, client, sample_pdf_path):
        """Test upload with a mix of valid PDF and invalid files."""
        # Use actual PDF fixture for valid file
        with open(sample_pdf_path, "rb") as f:
            valid_content = f.read()

        files = [
            ("files", ("valid.pdf", valid_content, "application/pdf")),
            ("files", ("invalid.txt", b"not a pdf", "text/plain"))
        ]

        # Execute
        response = client.post("/upload", files=files)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "failed" in data
        assert "processed" in data
        # Valid file should be processed
        assert len(data["processed"]) > 0
        # Invalid file should be in failed list
        assert any("invalid.txt" in failed_item for failed_item in data["failed"])


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
