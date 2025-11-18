"""Unit tests for Excel template handling."""
import pytest

from dependencies import excel_template_storage


@pytest.mark.unit
class TestExcelTemplateUpload:
    """Tests for Excel template upload functionality."""

    def test_upload_excel_template_invalid_file(self, client):
        """Test upload with invalid file type."""
        # Create mock file with wrong type
        file_content = b"not an excel file"
        files = {"file": ("document.txt", file_content, "text/plain")}

        # Execute
        response = client.post("/upload-excel-template", files=files)

        # Assert
        # Should reject non-Excel files with 400 Bad Request
        assert response.status_code == 400
        assert "detail" in response.json()
        assert "Invalid file type" in response.json()["detail"]


@pytest.mark.unit
class TestExcelStorage:
    """Tests for Excel template storage."""

    def test_excel_storage_clear(self, mock_excel_data):
        """Test that Excel storage is properly cleared between tests."""
        # Verify storage is empty at start
        assert len(excel_template_storage) == 0

        # Add data
        excel_template_storage["test_id"] = mock_excel_data

        # Verify it was added
        assert len(excel_template_storage) == 1

    def test_excel_storage_isolation(self):
        """Test that each test has isolated storage."""
        # This should be empty due to autouse clear_storage fixture
        assert len(excel_template_storage) == 0
