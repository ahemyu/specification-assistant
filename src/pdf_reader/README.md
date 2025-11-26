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
cd src/pdf_re   ader/frontend
npm run build
# Then start backend as shown above
```

Access at: http://localhost:8000 (production) or http://localhost:5173 (development)

## Windows Installation and Running

This section provides detailed instructions for setting up and running the application on a fresh Windows machine with no relevant software pre-installed.

### Step 1: Install Prerequisites

Install the following software before proceeding:

1. **Python 3.11 or higher**
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Verify installation: Open PowerShell or Command Prompt and run:
     ```powershell
     python --version
     ```

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - Use the LTS (Long Term Support) version
   - This will also install npm (Node Package Manager)
   - Verify installation:
     ```powershell
     node --version
     npm --version
     ```

3. **Git**
   - Download from: https://git-scm.com/download/win
   - Use default installation settings
   - Verify installation:
     ```powershell
     git --version
     ```

4. **UV Package Manager**
   - Open PowerShell as Administrator and run:
     ```powershell
     pip install uv
     ```
   - Verify installation:
     ```powershell
     uv --version
     ```

### Step 2: Clone the Repository

First create an SSH key and add it to your GitLab account. Then run:

```powershell
git clone git@code.trench-group.net:operational-excellence-trench-germany/specification-assistant.git
cd specification-assistant
```

### Step 3: Run the Setup Script

From the project root directory, run the automated setup script:

```powershell
.\setup-windows.ps1
```

The script will:
- Verify all prerequisites are installed
- Prompt you for your Azure OpenAI API key and set it as an environment variable
- Install Python dependencies
- Install frontend dependencies
- Build the frontend for production

**Note:** If you encounter a script execution error, you may need to change the PowerShell execution policy first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 4: Run the Application

After the setup script completes successfully:

```powershell
cd src\pdf_reader
uv run main.py
```

Then open your browser and go to: http://localhost:8000

---

## Manual Setup (Reference)

If the automated setup script does not work, you can follow these manual steps:

### Install Python Dependencies

From the project root directory:
```powershell
uv sync
```

### Set Up Environment Variables

Set your Azure OpenAI API key:
```powershell
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'your-api-key-here', 'User')
```
Note: This sets the variable for the current user systemwide. Open a new terminal to bring it into effect.

### Install Frontend Dependencies

Navigate to the frontend directory:
```powershell
cd src\pdf_reader\frontend
npm install
```

### Build the Frontend

While in the frontend directory:
```powershell
npm run build
```

### Start the Backend Server

Go into `src\pdf_reader\` and start the backend:
```powershell
cd src\pdf_reader
uv run main.py
```

Open your web browser and go to: http://localhost:8000

---

## Troubleshooting Windows-Specific Issues

- **"python is not recognized"**: Make sure Python was added to PATH during installation. Reinstall Python and check "Add Python to PATH".

- **"uv is not recognized"**: Close and reopen PowerShell after installing uv, or reinstall with `pip install uv`.

- **PowerShell script execution errors**: You may need to change the execution policy:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

- **Port already in use**: If port 8000 or 5173 is already in use, you can change the port:
  ```powershell
  uv run uvicorn src.pdf_reader.main:app --reload --host 0.0.0.0 --port 8001
  ```

- **Module not found errors**: Make sure you ran `uv sync` from the project root directory.

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
