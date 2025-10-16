# PDF Text Extraction Service

FastAPI web service for extracting and analyzing PDF documents with LLM-powered intelligence.

## Features

- Extract text and tables from PDFs (pdfplumber)
- Preview extracted content in browser
- LLM-powered key extraction (e.g., "voltage rating", "manufacturer name")
- Chat with PDFs using natural language questions
- Export extracted key-value pairs to Excel

## Installation

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
# From project root
uv run uvicorn src.pdf_reader.api:app --reload --host 0.0.0.0 --port 8000
```

Access at: http://localhost:8000

## Usage

1. Upload PDFs via web interface
2. Preview extracted text
3. Extract specific keys using LLM (e.g., "device model", "max voltage")
4. Ask questions about uploaded PDFs
5. Download results as text or Excel

## Tech Stack

- **FastAPI**: Web API framework
- **pdfplumber**: PDF text/table extraction
- **LangChain + Google Gemini**: LLM key extraction and Q&A
- **pandas + openpyxl**: Excel export

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
