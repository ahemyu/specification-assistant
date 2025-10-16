"""This script will be used to parse pdfs file/s, extract text in various formats (.txt, .md, .xml) and save the output."""
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


def process_single_page(page, page_number: int) -> str:
    """
    Process a single PDF page: extract text (excluding tables) and tables separately.

    Args:
        page: pdfplumber Page object
        page_number: 1-based page number

    Returns:
        Formatted string with page content
    """
    output = []

    output.append("=" * 80)
    output.append(f"PAGE {page_number}")
    output.append("=" * 80)
    output.append("")

    tables = page.find_tables()

    def is_char_in_any_table(char):
        for table in tables:
            bbox = table.bbox
            x0, top, x1, bottom = bbox
            if (char['x0'] >= x0 and char['x1'] <= x1 and
                char['top'] >= top and char['bottom'] <= bottom):
                return True
        return False

    output.append("-" * 80)
    output.append("TEXT CONTENT (excluding tables)")
    output.append("-" * 80)
    output.append("")

    if tables:
        filtered_page = page.filter(lambda obj: obj['object_type'] != 'char' or not is_char_in_any_table(obj))
        text = filtered_page.extract_text()
    else:
        text = page.extract_text()

    if text and text.strip():
        output.append(text)
    else:
        output.append("[No text content found]")

    output.append("")
    output.append("-" * 80)
    output.append("TABLES")
    output.append("-" * 80)
    output.append("")

    if tables:
        for i, table in enumerate(tables, 1):
            output.append(f"Table {i} on Page {page_number}:")
            output.append("")
            table_data = table.extract()
            if table_data:
                for row in table_data:
                    output.append(" | ".join([str(cell) if cell is not None else "" for cell in row]))
            output.append("")
    else:
        output.append("[No tables found on this page]")

    output.append("")

    return "\n".join(output)


def process_single_pdf_to_dict(pdf_source: Union[Path, io.BytesIO], filename: str = None) -> dict:
    """
    Process a single PDF file and return structured data as dictionary.

    Args:
        pdf_source: Path to PDF file or BytesIO object
        filename: Optional filename for display (used when pdf_source is BytesIO or to override Path name)

    Returns:
        Dictionary with total_pages, filename, and page data
    """
    # Determine the display name
    if filename:
        display_name = filename
    elif isinstance(pdf_source, Path):
        display_name = pdf_source.name
    else:
        display_name = "document.pdf"

    with pdfplumber.open(pdf_source) as pdf:
        total_pages = len(pdf.pages)
        pages_data = []

        for i, page in enumerate(pdf.pages, 1):
            tables = page.find_tables()

            def is_char_in_any_table(char):
                for table in tables:
                    bbox = table.bbox
                    x0, top, x1, bottom = bbox
                    if (char['x0'] >= x0 and char['x1'] <= x1 and
                        char['top'] >= top and char['bottom'] <= bottom):
                        return True
                return False

            if tables:
                filtered_page = page.filter(lambda obj: obj['object_type'] != 'char' or not is_char_in_any_table(obj))
                text = filtered_page.extract_text()
            else:
                text = page.extract_text()

            tables_data = []
            for table in tables:
                table_data = table.extract()
                if table_data:
                    tables_data.append(table_data)

            pages_data.append({
                "page_number": i,
                "text": text if text else "",
                "tables": tables_data
            })

        return {
            "filename": display_name,
            "total_pages": total_pages,
            "pages": pages_data
        }


def process_single_pdf(pdf_source: Union[Path, io.BytesIO], filename: str = None) -> str:
    """
    Process a single PDF file: extract content from all pages.

    Args:
        pdf_source: Path to PDF file or BytesIO object
        filename: Optional filename for display (used when pdf_source is BytesIO)

    Returns:
        Formatted string with entire PDF content
    """
    output = []

    # Determine the display name
    if isinstance(pdf_source, Path):
        display_name = pdf_source.name
    elif filename:
        display_name = filename
    else:
        display_name = "document.pdf"

    output.append("#" * 80)
    output.append(f"DOCUMENT: {display_name}")
    output.append("#" * 80)
    output.append("")

    with pdfplumber.open(pdf_source) as pdf:
        total_pages = len(pdf.pages)
        output.append(f"Total Pages: {total_pages}")
        output.append("")

        for i, page in enumerate(pdf.pages, 1):
            page_content = process_single_page(page, i)
            output.append(page_content)

    return "\n".join(output)


def process_pdf_directory(input_dir: str, output_dir: str = "output"):
    """
    Process all PDF files in a directory and save extracted content to text files.

    Args:
        input_dir: Path to directory containing PDF files
        output_dir: Path to directory where output text files will be saved
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    if not input_path.exists():
        logger.error(f"Input directory '{input_dir}' does not exist.")
        return

    output_path.mkdir(parents=True, exist_ok=True)

    pdf_files = list(input_path.glob("*.pdf"))

    if not pdf_files:
        logger.warning(f"No PDF files found in '{input_dir}'")
        return

    logger.info(f"Found {len(pdf_files)} PDF file(s) in '{input_dir}'")
    logger.info(f"Output will be saved to '{output_dir}'")

    for pdf_file in pdf_files:
        logger.info(f"Processing: {pdf_file.name}...")

        try:
            content = process_single_pdf(pdf_file)

            output_filename = pdf_file.stem + ".txt"
            output_file_path = output_path / output_filename

            with open(output_file_path, "w", encoding="utf-8") as f:
                f.write(content)

            logger.info(f"Saved to: {output_file_path}")

        except Exception as e:
            logger.error(f"Error processing {pdf_file.name}: {str(e)}")

    logger.info("Processing complete!")


if __name__ == "__main__":
    input_directory = "/home/ahemyu/projects/specification-assistant/data/test/Datasheet/Example spec/__Siemens Energy HVDC Lanwin2" #TODO: Change this to dir where pdfs reside
    output_directory = "/home/ahemyu/projects/specification-assistant/output" # TODO: change this to where the extracted text of the pdfs shall be written to

    process_pdf_directory(input_directory, output_directory)
