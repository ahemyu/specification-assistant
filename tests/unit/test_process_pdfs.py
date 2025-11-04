"""Unit tests for PDF processing service."""
import pytest
import io
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src" / "pdf_reader"))

from services.process_pdfs import (
    process_single_page,
    process_single_pdf
)


@pytest.mark.unit
class TestProcessSinglePage:
    """Tests for process_single_page function."""

    def test_process_page_with_text_only(self):
        """Test processing a page with only text content."""
        # Setup mock page
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text.return_value = "Sample text from page"

        # Execute
        result = process_single_page(mock_page, 1)

        # Assert
        assert result["page_number"] == 1
        assert "Sample text from page" in result["text"]
        assert "PAGE 1" in result["text"]

    def test_process_page_with_tables(self):
        """Test processing a page with tables."""
        # Setup mock page and table
        mock_table = MagicMock()
        mock_table.extract.return_value = [
            ["Header1", "Header2"],
            ["Value1", "Value2"]
        ]
        mock_table.bbox = (0, 0, 100, 100)

        mock_page = MagicMock()
        mock_page.find_tables.return_value = [mock_table]
        mock_page.filter.return_value.extract_text.return_value = "Text outside tables"

        # Execute
        result = process_single_page(mock_page, 2)

        # Assert
        assert result["page_number"] == 2
        assert "TABLES" in result["text"]
        assert "Table 1 on Page 2" in result["text"]

    def test_process_page_empty(self):
        """Test processing an empty page."""
        # Setup mock page
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text.return_value = ""

        # Execute
        result = process_single_page(mock_page, 1)

        # Assert
        assert result["page_number"] == 1
        assert "PAGE 1" in result["text"]


@pytest.mark.unit
class TestProcessSinglePDF:
    """Tests for process_single_pdf function."""

    @patch('services.process_pdfs.pdfplumber')
    def test_process_pdf_from_path(self, mock_pdfplumber):
        """Test successful PDF processing from file path."""
        # Setup mocks
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text.return_value = "Test content"

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.__exit__.return_value = None

        mock_pdfplumber.open.return_value = mock_pdf

        test_path = Path("test.pdf")

        # Execute
        result = process_single_pdf(test_path)

        # Assert
        assert result["filename"] == "test.pdf"
        assert result["total_pages"] == 1
        assert len(result["pages"]) == 1
        assert "formatted_text" in result
        assert "Test content" in result["formatted_text"]

    @patch('services.process_pdfs.pdfplumber')
    def test_process_pdf_from_bytesio(self, mock_pdfplumber):
        """Test processing PDF from BytesIO object."""
        # Setup mocks
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text.return_value = "BytesIO content"

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.__exit__.return_value = None

        mock_pdfplumber.open.return_value = mock_pdf

        pdf_bytes = io.BytesIO(b"fake pdf content")

        # Execute
        result = process_single_pdf(pdf_bytes, filename="uploaded.pdf")

        # Assert
        assert result["filename"] == "uploaded.pdf"
        assert result["total_pages"] == 1
        assert "BytesIO content" in result["formatted_text"]

    @patch('services.process_pdfs.pdfplumber')
    def test_process_pdf_multiple_pages(self, mock_pdfplumber):
        """Test processing multi-page PDF."""
        # Setup mocks
        mock_page1 = MagicMock()
        mock_page1.find_tables.return_value = []
        mock_page1.extract_text.return_value = "Page 1"

        mock_page2 = MagicMock()
        mock_page2.find_tables.return_value = []
        mock_page2.extract_text.return_value = "Page 2"

        mock_page3 = MagicMock()
        mock_page3.find_tables.return_value = []
        mock_page3.extract_text.return_value = "Page 3"

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page1, mock_page2, mock_page3]
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.__exit__.return_value = None

        mock_pdfplumber.open.return_value = mock_pdf

        test_path = Path("multi_page.pdf")

        # Execute
        result = process_single_pdf(test_path)

        # Assert
        assert result["total_pages"] == 3
        assert len(result["pages"]) == 3
        assert "Page 1" in result["formatted_text"]
        assert "Page 2" in result["formatted_text"]
        assert "Page 3" in result["formatted_text"]
        assert "PAGE 1" in result["formatted_text"]
        assert "PAGE 2" in result["formatted_text"]
        assert "PAGE 3" in result["formatted_text"]
