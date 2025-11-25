"""Unit tests for Excel download functionality."""
import pytest


@pytest.mark.unit
class TestExcelDownload:
    """Tests for Excel download endpoints."""

    def test_download_extraction_excel_success(self, client):
        """Test successful download of extraction results as Excel."""
        request_data = {
            "extraction_results": {
                "Name": {
                    "key_value": "John Doe",
                    "description": "Person's name",
                    "source_locations": [
                        {
                            "pdf_filename": "test.pdf",
                            "page_numbers": [1, 2]
                        }
                    ]
                },
                "Age": {
                    "key_value": "30",
                    "description": "Person's age",
                    "source_locations": []
                }
            }
        }

        # Execute
        response = client.post("/download-extraction-excel", json=request_data)

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert "attachment" in response.headers["content-disposition"]

    def test_download_extraction_excel_with_none_results(self, client):
        """Test download when some extractions failed (None results)."""
        request_data = {
            "extraction_results": {
                "Name": {
                    "key_value": "John Doe",
                    "description": "Found",
                    "source_locations": []
                },
                "MissingKey": None
            }
        }

        # Execute
        response = client.post("/download-extraction-excel", json=request_data)

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    def test_download_extraction_excel_empty_results(self, client):
        """Test download with empty extraction results."""
        request_data = {
            "extraction_results": {}
        }

        # Execute
        response = client.post("/download-extraction-excel", json=request_data)

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
