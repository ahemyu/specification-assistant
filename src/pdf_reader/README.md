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

### Start the backend server:

```bash
# From project root
uv run src/pdf_reader/main.py
```
Or inside src/pdf_reader/ :
```bash
uv run main.py
```
Or with uvicorn directly:

```bash
# From project root
uv run uvicorn src.pdf_reader.main:app --reload --host 0.0.0.0 --port 8000
```

### Start the frontend dev server (for development):

```bash
cd src/pdf_reader/frontend
VITE_DEV_MODE=true npm run dev
npm run dev
```

### Production:
Build the frontend once, then just run the backend server:
```bash
cd src/pdf_reader/frontend
npm run build
# Then start backend as shown above
```

Access at: http://localhost:8000 (production) or http://localhost:5173 (development)

## Usage

1. Upload PDFs via web interface
2. Preview extracted text
3. Extract specific keys using LLM (e.g., "device model", "max voltage")
4. Upload Excel template with keys to auto-fill values from PDFs or type in keys manually
5. Ask questions about uploaded PDFs
6. Download results as Excel

## Project Structure

```
pdf_reader/
├── backend/              # Backend code
│   ├── routers/          # API endpoints
│   ├── services/         # Business logic
│   ├── schemas/          # Data models
│   ├── dependencies.py
│   └── app.py            # FastAPI app
├── frontend/             # Frontend code
│   ├── src/              # React source
│   │   ├── components/
│   │   ├── store/
│   │   └── styles/
│   ├── dist/             # Production build
│   └── archived_vanilla_js/  # Old code (archived)
├── main.py               # Entry point
├── output/               # Extracted text files
└── uploaded_pdfs/        # Uploaded PDF storage
```

## Tech Stack

- **FastAPI**: Web API framework
- **pdfplumber**: PDF text/table extraction
- **LangChain + Azure OpenAI**: LLM key extraction and Q&A
- **pandas + openpyxl**: Excel export
- **React + TypeScript + Vite**: Modern frontend with type safety

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
