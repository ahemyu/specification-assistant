"""
This script will be used to parse pdf files, extract their content as text file suitable for llms to digest.
"""
import io
import logging
from pathlib import Path
from typing import Union

import pdfplumber

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def process_single_page(page, page_number: int) -> dict:
    """
    Process a single PDF page and format it for LLM consumption.

    Args:
        page: pdfplumber Page object
        page_number: 1-based page number

    Returns:
        Dictionary with formatted text ready for LLM:
        {
            "page_number": int,
            "text": str (pre-formatted for LLM)
        }
    """
    tables = page.find_tables()

    def is_char_in_any_table(char):
        for table in tables:
            bbox = table.bbox
            x0, top, x1, bottom = bbox
            if (char['x0'] >= x0 and char['x1'] <= x1 and
                char['top'] >= top and char['bottom'] <= bottom):
                return True
        return False

    # Extract text (excluding tables)
    if tables:
        filtered_page = page.filter(lambda obj: obj['object_type'] != 'char' or not is_char_in_any_table(obj))
        raw_text = filtered_page.extract_text()
    else:
        raw_text = page.extract_text()

    # Extract table data
    tables_data = []
    for table in tables:
        table_data = table.extract()
        if table_data:
            tables_data.append(table_data)

    # Format everything for LLM consumption right here, once
    formatted_parts = []
    formatted_parts.append(f"\n{'='*80}\nPAGE {page_number}\n{'='*80}\n")

    if raw_text:
        formatted_parts.append(f"\n{'-'*80}\nTEXT CONTENT (excluding tables)\n{'-'*80}\n\n")
        formatted_parts.append(f"{raw_text}\n")

    if tables_data:
        formatted_parts.append(f"\n{'-'*80}\nTABLES\n{'-'*80}\n\n")
        for i, table in enumerate(tables_data, 1):
            formatted_parts.append(f"Table {i} on Page {page_number}:\n\n")
            for row in table:
                formatted_parts.append(" | ".join([str(cell) if cell is not None else "" for cell in row]))
                formatted_parts.append("\n")
            formatted_parts.append("\n")

    return {
        "page_number": page_number,
        "text": "".join(formatted_parts)
    }


def process_single_pdf(pdf_source: Union[Path, io.BytesIO], filename: str | None = None) -> dict:
    """
    Process a single PDF file and return structured data as dictionary.

    Args:
        pdf_source: Path to PDF file or BytesIO object
        filename: Optional filename for display (used when pdf_source is BytesIO or to override Path name)

    Returns:
        Dictionary with total_pages, filename, page data, and pre-formatted LLM text
    """
    # Determine the display name
    if filename:
        display_name = filename
    elif isinstance(pdf_source, Path):
        display_name = pdf_source.name
    else:
        display_name = "document.pdf"

    with pdfplumber.open(pdf_source) as pdf:
        pages_data = []
        total_pages = len(pdf.pages)
        for i, page in enumerate(pdf.pages, 1):
            page_data = process_single_page(page, i)
            pages_data.append(page_data)

        # Build formatted text for LLM by concatenating pre-formatted pages
        formatted_parts = []
        formatted_parts.append(f"{'#'*80}\nDOCUMENT: {display_name}\n{'#'*80}\n")
        formatted_parts.append(f"\nTotal Pages: {total_pages}\n")

        for page_data in pages_data:
            formatted_parts.append(page_data["text"])

        return {
            "filename": display_name,
            "total_pages": total_pages,
            "pages": pages_data,
            "formatted_text": "".join(formatted_parts)
        }
