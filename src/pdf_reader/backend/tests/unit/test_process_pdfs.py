"""Unit tests for PDF processing service."""
import io
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from backend.services.process_pdfs import process_single_page, process_single_pdf


@pytest.mark.unit
class TestProcessSinglePage:
    """Tests for process_single_page function."""

    def test_process_page_with_text_only(self):
        """Test processing a page with only text content."""
        # Setup mock page
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text_lines.return_value = [
            {"text": "Sample text from page", "x0": 0, "top": 0, "x1": 100, "bottom": 10}
        ]

        # Execute
        result = process_single_page(mock_page, 1)

        # Assert
        assert result["page_number"] == 1
        assert "Sample text from page" in result["formatted_text"]
        assert "PAGE 1" in result["formatted_text"]

    def test_process_page_with_tables(self):
        """Test processing a page with tables."""
        # Setup mock page and table
        mock_row1 = MagicMock()
        mock_row1.bbox = (0, 0, 100, 10)
        mock_row2 = MagicMock()
        mock_row2.bbox = (0, 10, 100, 20)

        mock_table = MagicMock()
        mock_table.extract.return_value = [
            ["Header1", "Header2"],
            ["Value1", "Value2"]
        ]
        mock_table.rows = [mock_row1, mock_row2]
        mock_table.bbox = (0, 0, 100, 100)

        mock_page = MagicMock()
        mock_page.find_tables.return_value = [mock_table]
        mock_page.extract_text_lines.return_value = [
            {"text": "Text outside tables", "x0": 150, "top": 0, "x1": 250, "bottom": 10}
        ]

        # Execute
        result = process_single_page(mock_page, 2)

        # Assert
        assert result["page_number"] == 2
        assert "TABLES" in result["formatted_text"]
        assert "Table 1 on Page 2" in result["formatted_text"]

    def test_process_page_empty(self):
        """Test processing an empty page."""
        # Setup mock page
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text_lines.return_value = []

        # Execute
        result = process_single_page(mock_page, 1)

        # Assert
        assert result["page_number"] == 1
        assert "PAGE 1" in result["formatted_text"]


@pytest.mark.unit
class TestProcessSinglePDF:
    """Tests for process_single_pdf function."""

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_pdf_from_path(self, mock_pdfplumber):
        """Test successful PDF processing from file path."""
        # Setup mocks
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text_lines.return_value = [
            {"text": "Test content", "x0": 0, "top": 0, "x1": 100, "bottom": 10}
        ]

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

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_pdf_from_bytesio(self, mock_pdfplumber):
        """Test processing PDF from BytesIO object."""
        # Setup mocks
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text_lines.return_value = [
            {"text": "BytesIO content", "x0": 0, "top": 0, "x1": 100, "bottom": 10}
        ]

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

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_pdf_multiple_pages(self, mock_pdfplumber):
        """Test processing multi-page PDF."""
        # Setup mocks
        mock_page1 = MagicMock()
        mock_page1.find_tables.return_value = []
        mock_page1.extract_text_lines.return_value = [
            {"text": "Page 1", "x0": 0, "top": 0, "x1": 100, "bottom": 10}
        ]

        mock_page2 = MagicMock()
        mock_page2.find_tables.return_value = []
        mock_page2.extract_text_lines.return_value = [
            {"text": "Page 2", "x0": 0, "top": 0, "x1": 100, "bottom": 10}
        ]

        mock_page3 = MagicMock()
        mock_page3.find_tables.return_value = []
        mock_page3.extract_text_lines.return_value = [
            {"text": "Page 3", "x0": 0, "top": 0, "x1": 100, "bottom": 10}
        ]

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


@pytest.mark.unit
class TestProcessPDFErrorHandling:
    """Tests for error handling in PDF processing."""

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_pdf_with_corrupted_file(self, mock_pdfplumber):
        """Test handling of corrupted PDF that pdfplumber cannot open."""
        # Setup: Mock pdfplumber to raise an exception
        mock_pdfplumber.open.side_effect = Exception("PDF is corrupted or invalid")

        from pathlib import Path
        test_path = Path("corrupted.pdf")

        # Execute and assert
        with pytest.raises(Exception) as exc_info:
            process_single_pdf(test_path)

        assert "corrupted" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_page_when_extract_text_lines_fails(self, mock_pdfplumber):
        """Test graceful handling when page.extract_text_lines raises exception."""
        # Setup: Mock page that fails during text extraction
        mock_page = MagicMock()
        mock_page.find_tables.return_value = []
        mock_page.extract_text_lines.side_effect = Exception("Text extraction failed")

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.__exit__.return_value = None

        mock_pdfplumber.open.return_value = mock_pdf

        from pathlib import Path
        test_path = Path("test.pdf")

        # Execute - should handle error and continue
        result = process_single_pdf(test_path)

        # Assert - should still return a result, possibly with empty pages
        assert result is not None
        assert "filename" in result
        assert "total_pages" in result

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_pdf_with_empty_document(self, mock_pdfplumber):
        """Test processing PDF with zero pages."""
        # Setup: Mock empty PDF
        mock_pdf = MagicMock()
        mock_pdf.pages = []
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.__exit__.return_value = None

        mock_pdfplumber.open.return_value = mock_pdf

        from pathlib import Path
        test_path = Path("empty.pdf")

        # Execute
        result = process_single_pdf(test_path)

        # Assert
        assert result["filename"] == "empty.pdf"
        assert result["total_pages"] == 0
        assert len(result["pages"]) == 0

    def test_is_line_in_any_table_with_none_values(self):
        """Test is_line_in_any_table handles None values gracefully."""
        from backend.services.process_pdfs import is_line_in_any_table

        # Test with None coordinates
        line_with_nones = {
            "x0": None,
            "top": None,
            "x1": None,
            "bottom": None,
            "text": "some text"
        }

        # Execute
        result = is_line_in_any_table(line_with_nones, [])

        # Assert - should return False without crashing
        assert result is False

    def test_is_line_in_any_table_with_missing_keys(self):
        """Test is_line_in_any_table handles missing dictionary keys."""
        from backend.services.process_pdfs import is_line_in_any_table

        # Test with missing keys
        incomplete_line = {"text": "some text"}

        # Execute
        result = is_line_in_any_table(incomplete_line, [])

        # Assert - should return False without crashing
        assert result is False

    @patch('backend.services.process_pdfs.pdfplumber')
    def test_process_pdf_handles_table_extraction_failure(self, mock_pdfplumber):
        """Test handling when table extraction fails mid-processing."""
        # Setup: Mock page where table.extract() fails
        mock_table = MagicMock()
        mock_table.extract.side_effect = Exception("Table extraction failed")
        mock_table.bbox = (0, 0, 100, 100)
        mock_table.rows = []

        mock_page = MagicMock()
        mock_page.find_tables.return_value = [mock_table]
        mock_page.extract_text_lines.return_value = []

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.__exit__.return_value = None

        mock_pdfplumber.open.return_value = mock_pdf

        from pathlib import Path
        test_path = Path("table_error.pdf")

        # Execute - should handle the error
        result = process_single_pdf(test_path)

        # Assert - processing should continue despite table error
        assert result is not None
        assert result["total_pages"] == 1
