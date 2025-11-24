# Test Suite for PDF Reader Application

This directory contains unit tests for the PDF Reader application using pytest.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and test configuration
├── unit/                    # Unit tests
│   ├── test_process_pdfs.py # Tests for PDF processing service
│   ├── test_pdf_router.py   # Tests for PDF API endpoints
│   └── test_excel_router.py # Tests for Excel API endpoints
├── integration/             # Integration tests (placeholder)
└── fixtures/                # Test data files (placeholder)
```

## Running Tests

### Prerequisites

1. Create and activate a virtual environment (if not already active):
```bash
# Create virtual environment (if needed)
python -m venv .venv

# Activate it (choose your platform)
source .venv/bin/activate      # Linux/macOS
.venv\Scripts\activate         # Windows (CMD)
.venv\Scripts\Activate.ps1     # Windows (PowerShell)
```

2. Ensure test dependencies are installed:
```bash
pip install -e ".[test]"
```

### Run All Tests

```bash
pytest
```

### Run with Verbose Output

```bash
pytest -v
```

### Run Specific Test File

```bash
pytest tests/unit/test_process_pdfs.py
```

### Run Specific Test Class

```bash
pytest tests/unit/test_process_pdfs.py::TestProcessSinglePDF
```

### Run Specific Test

```bash
pytest tests/unit/test_process_pdfs.py::TestProcessSinglePDF::test_process_pdf_from_path
```

### Run Only Unit Tests

```bash
pytest -m unit
```

### Run with Coverage Report

```bash
pytest --cov
```

Coverage reports are generated in:
- Terminal output (summary)
- `htmlcov/` directory (detailed HTML report)

To view the HTML coverage report:
```bash
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

## Test Coverage

Current test coverage: **43%** overall

High coverage modules:
- `services/process_pdfs.py`: 88%
- `schemas/`: 100%

Areas for improvement:
- Excel router functionality
- LLM key extraction service
- Error handling paths

## Writing New Tests

### Test Naming Convention

- Test files: `test_*.py`
- Test classes: `Test*`
- Test functions: `test_*`

### Using Fixtures

Common fixtures available in `conftest.py`:

- `client`: FastAPI TestClient for API testing
- `mock_pdf_data`: Sample PDF data structure
- `mock_excel_data`: Sample Excel template data
- `clear_storage`: Auto-clears storage between tests

Example:
```python
def test_example(client, mock_pdf_data):
    response = client.get("/some-endpoint")
    assert response.status_code == 200
```

### Test Markers

Available markers:
- `@pytest.mark.unit`: Unit tests
- `@pytest.mark.integration`: Integration tests
- `@pytest.mark.slow`: Slow-running tests

## CI/CD Integration

To run tests in a CI/CD pipeline:

```bash
# Install dependencies
pip install -e ".[test]"

# Run tests with coverage
pytest --cov --cov-report=xml --cov-report=term

# Exit with error code if coverage is below threshold
pytest --cov --cov-fail-under=40
```

## Current Test Statistics

- **Total Tests**: 15
- **Passing**: 15 (100%)
- **Test Categories**:
  - PDF Processing: 6 tests
  - PDF API Endpoints: 6 tests
  - Excel API Endpoints: 3 tests

## Notes

- Tests use mocking to isolate units and avoid file I/O
- Storage is automatically cleared between tests
- Tests run in the context of the application's source directory
- FastAPI TestClient is used for API endpoint testing
