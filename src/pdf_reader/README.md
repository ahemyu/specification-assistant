# PDF Text Extraction Service

A FastAPI-based web service for extracting text and tables from PDF documents using pdfplumber.

## Features

- Upload single or multiple PDF files via web interface
- Extract text content (excluding table areas)
- Extract and format tables separately
- Download extracted content as text files

## Installation

Install dependencies using uv:

```bash
# From project root
uv sync
```
## Running the Service

### Start the FastAPI server:

```bash
# From project root, activate the virtual environment and run
uv run python src/pdf_reader/api.py
```

Or with uvicorn directly:

```bash
uv run uvicorn src.pdf_reader.api:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at: http://localhost:8000

## Usage

### Web Interface

1. Open your browser and navigate to http://localhost:8000
2. Click "Choose PDF Files" and select one or more PDF files
3. Click "Upload and Process"
5. Download the extracted text files

### API Endpoints
## Output Format

The extracted text files follow this structure:

```
################################################################################
DOCUMENT: example.pdf
################################################################################

Total Pages: 10

================================================================================
PAGE 1
================================================================================

--------------------------------------------------------------------------------
TEXT CONTENT (excluding tables)
--------------------------------------------------------------------------------

[Page text without tables]

--------------------------------------------------------------------------------
TABLES
--------------------------------------------------------------------------------

Table 1 on Page 1:

[Table data in pipe-separated format]
```

## Command Line Usage

You can also use the script directly to process PDFs from a directory:

```bash
uv run python src/pdf_reader/process_pdfs.py
```

Edit the `__main__` section in `process_pdfs.py` to set your input and output directories.

## Project Structure

```
src/pdf_reader/
├── api.py                  # FastAPI application
├── process_pdfs.py         # PDF processing functions
├── README.md              # This file
└── output/                # Extracted text files (created automatically)
```

## Technical Details

- **PDF Processing**: Uses pdfplumber for reliable text and table extraction
- **Text Extraction**: Excludes table areas from text content to avoid duplication
- **Table Extraction**: Extracts tables in structured format with row/column data
- **API Framework**: FastAPI for high performance and automatic API documentation

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
