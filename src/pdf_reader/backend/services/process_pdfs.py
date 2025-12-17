"""
This script will be used to parse pdf files, extract their content as text file suitable for llms to digest.
"""

import io
import logging
from pathlib import Path

import pdfplumber

logger = logging.getLogger(__name__)


def is_line_in_any_table(line: dict, tables: list) -> bool:
    """Check if a text line is fully contained within any table bounding box."""

    # A line from extract_text_lines() has x0, top, x1, bottom
    l_x0 = line.get("x0", 0)
    l_top = line.get("top", 0)
    l_x1 = line.get("x1", 0)
    l_bottom = line.get("bottom", 0)

    # Handle cases where line might be None or empty
    if l_x0 is None or l_top is None or l_x1 is None or l_bottom is None:
        return False

    for table in tables:
        bbox = table.bbox
        t_x0, t_top, t_x1, t_bottom = bbox

        # Check if the line's bounding box is (mostly) inside the table's bounding box
        # We use a small tolerance (center of line) to be safe
        line_center_x = (l_x0 + l_x1) / 2
        line_center_y = (l_top + l_bottom) / 2

        if line_center_x >= t_x0 and line_center_x <= t_x1 and line_center_y >= t_top and line_center_y <= t_bottom:
            return True
    return False


def process_single_page(page, page_number: int) -> dict:
    """
    Process a single PDF page and format it for LLM consumption.

    Args:
        page: pdfplumber Page object
        page_number: 1-based page number

    Returns:
        Dictionary with:
        {
            "page_number": int,
            "formatted_text": str (pre-formatted for LLM with [line_id: ...]),
            "line_id_map": dict (mapping line_id to [x0, top, x1, bottom])
        }
    """
    tables = page.find_tables()

    # We set return_chars=False as we don't need individual char info here
    text_lines = page.extract_text_lines(layout=False, strip=True, return_chars=False)
    formatted_parts = []
    line_id_map = {}

    formatted_parts.append(f"\n{'=' * 80}\nPAGE {page_number}\n{'=' * 80}\n")
    formatted_parts.append(f"\n{'-' * 80}\nTEXT CONTENT (excluding tables)\n{'-' * 80}\n\n")

    line_index = 0
    if text_lines:
        for line in text_lines:
            if not is_line_in_any_table(line, tables):
                line_id = f"{page_number}_{line_index}"
                line_text = line.get("text", "")

                formatted_parts.append(f"[line_id: {line_id}] {line_text}\n")

                # Add coordinates to the map
                line_id_map[line_id] = [line.get("x0", 0), line.get("top", 0), line.get("x1", 0), line.get("bottom", 0)]

                line_index += 1

    # Table data
    if tables:
        formatted_parts.append(f"\n{'-' * 80}\nTABLES\n{'-' * 80}\n\n")
        for table_index, table_obj in enumerate(tables):
            # Use table.rows to get row bboxes
            rows = table_obj.rows

            if rows:
                formatted_parts.append(f"Table {table_index + 1} on Page {page_number}:\n\n")

                # Extract text using the standard method
                table_data = table_obj.extract()

                # Iterate through both table_data (text) and rows (coordinates) together
                for row_idx, (row_cells_text, row_obj) in enumerate(zip(table_data, rows)):
                    cell_parts = []

                    # For each cell in the row, we'll use the ENTIRE ROW bbox
                    # This way any cell_id in this row will highlight the whole row
                    row_bbox = row_obj.bbox  # (x0, top, x1, bottom) for entire row

                    # row_obj.cells is ordered left-to-right, col_idx is position in that list
                    for col_idx, cell_text in enumerate(row_cells_text):
                        # Create unique cell_id
                        cell_id = f"{page_number}_t{table_index}_r{row_idx}_c{col_idx}"

                        # Store the ROW bbox for this cell (highlights entire row)
                        line_id_map[cell_id] = list(row_bbox)

                        # Format cell with ID prefix
                        cell_text_str = str(cell_text) if cell_text is not None else ""
                        cell_parts.append(f"[cell_id: {cell_id}] {cell_text_str}")

                    formatted_parts.append(" | ".join(cell_parts))
                    formatted_parts.append("\n")
                formatted_parts.append("\n")

    return {"page_number": page_number, "formatted_text": "".join(formatted_parts), "line_id_map": line_id_map}


def process_single_pdf(pdf_source: Path | io.BytesIO, filename: str | None = None) -> dict:
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

        aggregated_formatted_parts = []
        aggregated_line_id_map = {}

        # Add document header
        aggregated_formatted_parts.append(f"{'#' * 80}\nDOCUMENT: {display_name}\n{'#' * 80}\n")
        aggregated_formatted_parts.append(f"\nTotal Pages: {total_pages}\n")

        for i, page in enumerate(pdf.pages, 1):
            try:
                page_data = process_single_page(page, i)
                pages_data.append(page_data)

                aggregated_formatted_parts.append(page_data["formatted_text"])
                aggregated_line_id_map.update(page_data["line_id_map"])
            except Exception as e:
                logger.error(f"Error processing page {i} of {display_name}: {str(e)}")
                # Continue processing other pages

        return {
            "filename": display_name,
            "total_pages": total_pages,
            "pages": pages_data,
            "formatted_text": "".join(aggregated_formatted_parts),
            "line_id_map": aggregated_line_id_map,
        }
