# Test Suite for PDF Reader Backend

Unit tests for the PDF processing and extraction application using pytest.

## Test Structure

```
tests/
├── conftest.py                 # Shared fixtures and configuration
├── unit/
│   ├── test_process_pdfs.py   # PDF processing service tests
│   ├── test_pdf_router.py     # PDF API endpoint tests
│   └── test_excel_router.py   # Excel download endpoint tests
└── fixtures/
    ├── sample.pdf              # Sample PDF for testing
    └── sample_template.xlsx    # Sample Excel template
```

## Running Tests

### Setup

Install test dependencies:
```bash
cd /path/to/specification-assistant
uv sync --extra test
```

### Run Tests

```bash
# Run all tests
uv run python -m pytest tests/

# Verbose output
uv run python -m pytest tests/ -v

# Run specific test file
uv run python -m pytest tests/unit/test_process_pdfs.py

# Run with coverage
uv run python -m pytest tests/ --cov

# Run only unit tests
uv run python -m pytest tests/ -m unit
```

## Test Statistics

- **Total Tests**: 27
- **All Passing**: 100%
- **Test Coverage**:
  - PDF Processing Service: ~88%
  - PDF Router: ~60%
  - Excel Router: ~40%

## What's Tested

### PDF Processing (`test_process_pdfs.py`)
- Text extraction from PDF pages
- Table detection and extraction
- Multi-page document processing
- Error handling (corrupted files, extraction failures)
- Edge cases (empty PDFs, None values)

### PDF API Endpoints (`test_pdf_router.py`)
- Upload: single/multiple PDFs, invalid files
- Preview: retrieval and 404 handling
- Download: text file retrieval
- View: original PDF viewing
- Delete: file cleanup

### Excel Download (`test_excel_router.py`)
- Extraction results export to Excel
- Handling failed extractions
- Empty results handling

## What's NOT Tested (Requires LLM/External Services)

The following components require live LLM API access and are not unit tested:

- **LLM Router** (`routers/llm.py`):
  - `/extract-keys` - Key extraction from PDFs
  - `/ask-question-stream` - Question answering with streaming
  - `/compare-pdfs` - PDF version comparison
  - `/detect-product-type` - Product type detection
  - `/detect-core-winding-count` - Core/winding count detection

- **LLM Key Extractor** (`services/llm_key_extractor.py`):
  - All LLM-based extraction methods
  - Google Gemini API integration
  - Structured output parsing

These would require integration tests with mocked LLM responses or actual API keys.

## Writing New Tests

### Test Naming
- Files: `test_*.py`
- Classes: `Test*`
- Functions: `test_*`

### Using Fixtures

Available fixtures in `conftest.py`:
```python
def test_example(client, mock_pdf_data, sample_pdf_path):
    # client: FastAPI TestClient
    # mock_pdf_data: Sample PDF structure
    # sample_pdf_path: Path to test PDF file
    response = client.get("/some-endpoint")
    assert response.status_code == 200
```

### Auto-Cleanup
Storage is automatically cleared between tests via `clear_storage` fixture.
