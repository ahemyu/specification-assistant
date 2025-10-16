"""FastAPI service for PDF text extraction."""
import logging
import os
import re
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from process_pdfs import process_single_pdf, process_single_pdf_to_dict
from llm_key_extractor import LLMKeyExtractor, KeyExtractionResult

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Text Extraction API", version="1.0.0")

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("output")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Initialize LLM key extractor (requires GOOGLE_API_KEY environment variable)
llm_extractor: Optional[LLMKeyExtractor] = None
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    try:
        llm_extractor = LLMKeyExtractor(api_key=GOOGLE_API_KEY)
        logger.info("LLM key extractor initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize LLM key extractor: {str(e)}")
else:
    logger.warning("GOOGLE_API_KEY not found. LLM key extraction endpoints will not be available.")


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to make it safe for filesystem storage.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename safe for filesystem use
    """
    name = Path(filename).stem
    ext = Path(filename).suffix

    # Replace unsafe characters with underscores
    safe_name = re.sub(r'[^\w\s\-.]', '_', name)
    # Replace multiple spaces/underscores with single underscore
    safe_name = re.sub(r'[\s_]+', '_', safe_name)
    # Remove leading/trailing underscores
    safe_name = safe_name.strip('_')

    return f"{safe_name}{ext}"


def get_unique_filepath(directory: Path, filename: str) -> tuple[Path, str]:
    """
    Get a unique filepath by appending a counter if the file already exists.

    Args:
        directory: Directory where file will be saved
        filename: Desired filename

    Returns:
        Tuple of (unique_path, unique_filename)
    """
    sanitized = sanitize_filename(filename)
    filepath = directory / sanitized

    if not filepath.exists():
        return filepath, sanitized

    # File exists, append counter
    stem = Path(sanitized).stem
    ext = Path(sanitized).suffix
    counter = 1

    while filepath.exists():
        new_filename = f"{stem}_{counter}{ext}"
        filepath = directory / new_filename
        counter += 1

    return filepath, filepath.name


@app.get("/")
async def root(request: Request):
    """Serve the main HTML page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """
    Upload and process multiple PDF files.

    Returns JSON with extracted content and file IDs for download.
    """
    processed = []
    failed = []

    for file in files:
        if not file.filename or not file.filename.endswith('.pdf'):
            failed.append(f"{file.filename or 'Unknown'} (not a PDF)")
            continue

        try:
            # Use sanitized original filename instead of UUID
            upload_path, stored_filename = get_unique_filepath(UPLOAD_DIR, file.filename)

            contents = await file.read()
            with open(upload_path, "wb") as f:
                f.write(contents)

            logger.info(f"Processing {file.filename}...")

            # Pass original filename to process function
            pdf_data = process_single_pdf_to_dict(upload_path, filename=file.filename)

            text_content = process_single_pdf(upload_path, filename=file.filename)
            # Use same base name for output file
            output_filename = Path(stored_filename).stem + ".txt"
            output_path = OUTPUT_DIR / output_filename
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text_content)

            processed.append({
                "filename": file.filename,
                "file_id": Path(stored_filename).stem,  # Use stem as file_id for consistency
                "stored_filename": stored_filename,  # The actual stored filename
                "total_pages": pdf_data["total_pages"],
                "data": pdf_data
            })

            logger.info(f"Successfully processed {file.filename}")

        except Exception as e:
            logger.error(f"Error processing {file.filename}: {str(e)}")
            failed.append(f"{file.filename} ({str(e)})")

    return {
        "processed": processed,
        "failed": failed
    }


@app.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download the extracted text file."""
    # Try with .txt extension
    file_path = OUTPUT_DIR / f"{file_id}.txt"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="text/plain",
        filename=f"extracted_{file_id}.txt"
    )


class KeyExtractionRequest(BaseModel):
    """Request model for key extraction endpoint."""

    file_ids: List[str]
    key_name: str
    additional_context: Optional[str] = None


class MultipleKeysExtractionRequest(BaseModel):
    """Request model for extracting multiple keys."""

    file_ids: List[str]
    key_names: List[str]
    additional_context: Optional[str] = None


@app.post("/extract-key")
async def extract_key(request: KeyExtractionRequest) -> KeyExtractionResult:
    """
    Extract a specific key from one or more previously uploaded PDFs using LLM.

    Requires:
    - file_ids: List of file IDs from previous /upload requests
    - key_name: The key to extract (e.g., "voltage rating", "manufacturer name")
    - additional_context (optional): Additional context to help the LLM

    Returns:
    - KeyExtractionResult with the extracted value and source locations
    """
    if not llm_extractor:
        raise HTTPException(
            status_code=503,
            detail="LLM key extraction service is not available. GOOGLE_API_KEY may not be configured."
        )

    # Load the PDF data for each file_id
    pdf_data_list = []
    for file_id in request.file_ids:
        # Try to find the PDF file - could be file_id.pdf or with a counter
        upload_path = UPLOAD_DIR / f"{file_id}.pdf"

        # If not found, try to find any file starting with file_id
        if not upload_path.exists():
            matching_files = list(UPLOAD_DIR.glob(f"{file_id}*.pdf"))
            if matching_files:
                upload_path = matching_files[0]

        if not upload_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File with ID {file_id} not found"
            )

        try:
            # Use the actual filename stored on disk
            pdf_dict = process_single_pdf_to_dict(upload_path, filename=upload_path.name)
            pdf_data_list.append(pdf_dict)
        except Exception as e:
            logger.error(f"Error processing PDF {file_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing PDF {file_id}: {str(e)}"
            )

    # Extract the key using LLM
    try:
        result = llm_extractor.extract_key(
            key_name=request.key_name,
            pdf_data=pdf_data_list,
            additional_context=request.additional_context or ""
        )
        return result
    except Exception as e:
        logger.error(f"Error during LLM key extraction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during key extraction: {str(e)}"
        )


@app.post("/extract-multiple-keys")
async def extract_multiple_keys(request: MultipleKeysExtractionRequest) -> dict:
    """
    Extract multiple keys from one or more previously uploaded PDFs using LLM.

    Requires:
    - file_ids: List of file IDs from previous /upload requests
    - key_names: List of keys to extract
    - additional_context (optional): Additional context to help the LLM

    Returns:
    - Dictionary mapping each key name to its KeyExtractionResult
    """
    if not llm_extractor:
        raise HTTPException(
            status_code=503,
            detail="LLM key extraction service is not available. GOOGLE_API_KEY may not be configured."
        )

    # Load the PDF data for each file_id
    pdf_data_list = []
    for file_id in request.file_ids:
        # Try to find the PDF file - could be file_id.pdf or with a counter
        upload_path = UPLOAD_DIR / f"{file_id}.pdf"

        # If not found, try to find any file starting with file_id
        if not upload_path.exists():
            matching_files = list(UPLOAD_DIR.glob(f"{file_id}*.pdf"))
            if matching_files:
                upload_path = matching_files[0]

        if not upload_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File with ID {file_id} not found"
            )

        try:
            # Use the actual filename stored on disk
            pdf_dict = process_single_pdf_to_dict(upload_path, filename=upload_path.name)
            pdf_data_list.append(pdf_dict)
        except Exception as e:
            logger.error(f"Error processing PDF {file_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing PDF {file_id}: {str(e)}"
            )

    # Extract all keys using LLM
    try:
        results = llm_extractor.extract_multiple_keys(
            key_names=request.key_names,
            pdf_data=pdf_data_list,
            additional_context=request.additional_context or ""
        )
        # Convert results to dict with serializable values
        return {
            key: result.model_dump() if result else None
            for key, result in results.items()
        }
    except Exception as e:
        logger.error(f"Error during LLM multiple key extraction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during key extraction: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
