# PDF Text Extraction Service

FastAPI web service for extracting and analyzing PDF documents with LLM-powered intelligence.

## Features

- Extract text and tables from PDFs (pdfplumber) with parallel processing
- Preview extracted content in browser
- LLM-powered key extraction (e.g., "voltage rating", "manufacturer name")
- Upload Excel templates with keys and auto-fill values using LLM
- Chat with PDFs using natural language questions
- Export extracted key-value pairs to Excel

## Prerequisites

- **Python 3.11+** with `uv` (`pip install uv`)
- **Node.js 18+** with npm
- **Git**

## Environment Variables

Create `.env` in the project root and set required values:
export OPENAI_API_KEY="Your key here"

## Linux/macOS Quick Start

1. Run `uv sync` from the repo root the first time to install Python deps.
2. Run `npm install` once inside `src/pdf_reader/frontend/`.
3. Execute the startup script from the root:
   ```bash
   ./start.sh
   ```
   - Builds the frontend via `npm run build`.
   - Loads `.env` (prompts for `OPENAI_API_KEY` if missing).
   - Starts the FastAPI server with `uv run main.py`.

## Linux/macOS Manual Workflow

### Install dependencies
```bash
# Python deps
uv sync

# Frontend deps
cd src/pdf_reader/frontend
npm install
```

### Run the backend
```bash
# From project root
uv run src/pdf_reader/main.py

# Or inside backend folder
cd src/pdf_reader
uv run main.py
```

Alternative (FastAPI + Uvicorn):
```bash
uv run uvicorn src.pdf_reader.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend development server
```bash
cd src/pdf_reader/frontend
VITE_DEV_MODE=true npm run dev
```
- Dev server: http://localhost:5173

### Production build
```bash
cd src/pdf_reader/frontend
npm run build
```
Serve the built assets via the FastAPI app (already handled when running the backend from `src/pdf_reader`).

### Access points
- Backend / docs: http://localhost:8000 (Swagger at `/docs`, ReDoc at `/redoc`).
- Frontend dev server: http://localhost:5173.

## Windows Setup

### 1. Clone the repository
```powershell
git clone git@code.trench-group.net:operational-excellence-trench-germany/specification-assistant.git
cd specification-assistant
```

### 2. Run the setup script
```powershell
./setup-windows.ps1
```
The script validates prerequisites, prompts for `OPENAI_API_KEY`, installs Python + frontend dependencies, and builds the frontend. If PowerShell blocks the script, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Start the backend
```powershell
cd src\pdf_reader
uv run main.py
```
Access http://localhost:8000.

### Manual fallback (if the script fails)
1. `uv sync`
2. Set `OPENAI_API_KEY` for the current user:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'your-api-key-here', 'User')
   ```
3. `cd src\pdf_reader\frontend` and run `npm install`
4. `npm run build`
5. `cd ..` and run `uv run main.py`

### Windows troubleshooting
- **"python/uv not recognized"**: reopen PowerShell or reinstall with PATH enabled.
- **Script execution errors**: adjust execution policy (see above).
- **Port conflicts**: `uv run uvicorn src.pdf_reader.main:app --port 8001`.
- **Module not found**: ensure `uv sync` completed successfully.

## Usage

1. Upload PDFs via the web UI.
2. Preview extracted text.
3. Extract specific keys using LLM (or provide your own keys via Excel/manual input).
4. Ask questions about uploaded PDFs.
5. Download results as Excel.

## Project Structure

```
pdf_reader/
├── backend/              # FastAPI routers, services, schemas
├── frontend/             # React + Vite app (src/, dist/, archived code)
├── main.py               # Entry point used by uv/uvicorn
├── output/               # Extracted text files
└── uploaded_pdfs/        # Uploaded PDF storage
```

## Tech Stack

- **FastAPI** for REST + docs
- **pdfplumber** for PDF extraction
- **LangChain + Azure OpenAI** for LLM-driven key extraction + Q&A
- **pandas + openpyxl** for Excel export
- **React + TypeScript + Vite** for the frontend

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
