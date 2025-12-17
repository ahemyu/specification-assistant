"""Unit tests for PDF upload and processing endpoints."""

import pytest


@pytest.mark.unit
class TestPDFUpload:
    """Tests for PDF upload functionality."""

    def test_upload_pdf_success(self, client, sample_pdf_path):
        """Test successful PDF upload and processing."""
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
        assert len(data["processed"]) > 0

    def test_upload_multiple_pdfs(self, client, sample_pdf_path):
        """Test uploading multiple PDF files."""
        # Use actual PDF fixture file for both uploads
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()

        files = [
            ("files", ("test1.pdf", file_content, "application/pdf")),
            ("files", ("test2.pdf", file_content, "application/pdf")),
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
            ("files", ("invalid.txt", b"not a pdf", "text/plain")),
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

    def test_get_pdf_preview_success(self, client, sample_pdf_path):
        """Test successful PDF preview retrieval after upload."""
        # Upload a real PDF first
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()
        files = {"files": ("test_preview.pdf", file_content, "application/pdf")}
        upload_response = client.post("/upload", files=files)
        assert upload_response.status_code == 200

        file_id = "test_preview"

        # Execute
        response = client.get(f"/preview/{file_id}")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        assert "filename" in data
        assert "content" in data
        assert "size" in data
        assert data["file_id"] == file_id

    def test_get_pdf_preview_not_found(self, client):
        """Test retrieving non-existent PDF returns 404."""
        # Execute
        response = client.get("/preview/nonexistent_id")

        # Assert
        assert response.status_code == 404


@pytest.mark.unit
class TestPDFDownload:
    """Tests for PDF file download endpoints."""

    def test_download_file_success(self, client, sample_pdf_path):
        """Test successful download of extracted text file."""
        # Upload a real PDF first
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()
        files = {"files": ("test_download.pdf", file_content, "application/pdf")}
        upload_response = client.post("/upload", files=files)
        assert upload_response.status_code == 200

        file_id = "test_download"

        # Execute
        response = client.get(f"/download/{file_id}")

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"

    def test_download_file_not_found(self, client):
        """Test download of non-existent file returns 404."""
        # Execute
        response = client.get("/download/nonexistent_file")

        # Assert
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_view_pdf_success(self, client, sample_pdf_path):
        """Test successful viewing of original PDF file."""
        # Upload a real PDF first
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()
        files = {"files": ("test_view.pdf", file_content, "application/pdf")}
        upload_response = client.post("/upload", files=files)
        assert upload_response.status_code == 200

        file_id = "test_view"

        # Execute
        response = client.get(f"/view-pdf/{file_id}")

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "inline" in response.headers["content-disposition"]

    def test_view_pdf_not_found(self, client):
        """Test viewing non-existent PDF returns 404."""
        # Execute
        response = client.get("/view-pdf/nonexistent_pdf")

        # Assert
        assert response.status_code == 404


@pytest.mark.unit
class TestPDFDeletion:
    """Tests for PDF deletion functionality."""

    def test_delete_pdf_success(self, client, sample_pdf_path):
        """Test successful PDF deletion from database."""
        # Upload a real PDF first
        with open(sample_pdf_path, "rb") as f:
            file_content = f.read()
        files = {"files": ("test_delete.pdf", file_content, "application/pdf")}
        upload_response = client.post("/upload", files=files)
        assert upload_response.status_code == 200

        file_id = "test_delete"

        # Execute
        response = client.delete(f"/delete-pdf/{file_id}")

        # Assert
        assert response.status_code == 200

        # Verify the PDF is gone
        preview_response = client.get(f"/preview/{file_id}")
        assert preview_response.status_code == 404

    def test_delete_pdf_not_found(self, client):
        """Test deleting PDF that doesn't exist returns 404."""
        # Execute
        response = client.delete("/delete-pdf/nonexistent_file")

        # Assert
        assert response.status_code == 404
