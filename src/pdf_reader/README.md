# PDF Text Extraction Service

FastAPI web service for extracting and analyzing PDF documents with LLM-powered intelligence.

## Features

- Extract text and tables from PDFs (pdfplumber) with parallel processing
- Preview extracted content in browser
- LLM-powered key extraction (e.g., "voltage rating", "manufacturer name")
- Upload Excel templates with keys and auto-fill values using LLM
- Chat with PDFs using natural language questions
- Export extracted key-value pairs to Excel

## Installation

```bash
# From project root
uv sync
```

## Configuration

Set your Azure OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="your-azure-openai-api-key"
```

## Running the Service

### Start the FastAPI server:

```bash
# From project root, activate the virtual environment and run
uv run src/pdf_reader/api.py
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
4. Upload Excel template with keys to auto-fill values from PDFs or type in keys manually
5. Ask questions about uploaded PDFs
6. Download results as Excel

## Tech Stack

- **FastAPI**: Web API framework
- **pdfplumber**: PDF text/table extraction
- **LangChain + Azure OpenAI**: LLM key extraction and Q&A
- **pandas + openpyxl**: Excel export

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
