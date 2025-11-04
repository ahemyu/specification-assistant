"""Router for PDF upload, download, and preview endpoints."""
import asyncio
import logging
import os
from concurrent.futures import ProcessPoolExecutor
from io import BytesIO
from pathlib import Path

from backend.dependencies import OUTPUT_DIR, UPLOADED_PDFS_DIR, get_pdf_storage
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from backend.services.process_pdfs import process_single_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["pdf"])


def _process_single_file(file_contents: bytes, filename: str, output_dir: Path) -> dict:
    """
    Process a single PDF file synchronously.

    This function is designed to be run in parallel via ProcessPoolExecutor.

    Args:
        file_contents: The PDF file contents as bytes
        filename: The name of the file
        output_dir: Directory to save the output text file

    Returns:
        Dictionary with processing result or error information
    """
    try:
        logger.info(f"Processing {filename}...")

        # Process PDF from memory
        pdf_data = process_single_pdf(BytesIO(file_contents), filename=filename)

        # Convert structured data to formatted text
        text_content = pdf_data["formatted_text"]

        # Save extracted text to output directory
        safe_filename = filename.replace('.pdf', '.txt')
        output_path = output_dir / safe_filename

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        file_id = output_path.stem

        logger.info(f"Successfully processed {filename}")

        return {
            "success": True,
            "filename": filename,
            "file_id": file_id,
            "pdf_data": pdf_data
        }

    except Exception as e:
        logger.error(f"Error processing {filename}: {str(e)}")
        return {
            "success": False,
            "filename": filename,
            "error": str(e)
        }


@router.post("/upload")
async def upload_pdfs(files: list[UploadFile] = File(...)):
    """
    Upload and process multiple PDF files in-memory with parallel processing.
    Also saves the original PDF files to disk for persistence across restarts.

    Returns JSON with extracted content and file IDs for download.
    """
    pdf_storage = get_pdf_storage()
    processed = []
    failed = []

    # Filter out non-PDF files and read all file contents
    valid_files = []
    for file in files:
        if not file.filename or not file.filename.endswith('.pdf'):
            failed.append(f"{file.filename or 'Unknown'} (not a PDF)")
            continue

        contents = await file.read()

        # Save the original PDF file to disk for persistence
        try:
            # Create a safe filename based on the original name
            safe_filename = file.filename.replace('.pdf', '') + '.pdf'
            pdf_file_path = UPLOADED_PDFS_DIR / safe_filename

            with open(pdf_file_path, 'wb') as f:
                f.write(contents)

            logger.info(f"Saved PDF file to {pdf_file_path}")
        except Exception as e:
            logger.error(f"Error saving PDF file {file.filename}: {str(e)}")
            failed.append(f"{file.filename} (error saving to disk)")
            continue

        valid_files.append((contents, file.filename))

    if not valid_files:
        return {"processed": processed, "failed": failed}

    # Process PDFs in parallel using ProcessPoolExecutor
    loop = asyncio.get_event_loop()
    max_workers = os.cpu_count() or 4
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        # Submit all processing tasks
        tasks = [
            loop.run_in_executor(
                executor,
                _process_single_file,
                file_contents,
                filename,
                OUTPUT_DIR
            )
            for file_contents, filename in valid_files
        ]

        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks)

    # Process results
    for result in results:
        if result["success"]:
            file_id = result["file_id"]
            pdf_data = result["pdf_data"]

            # Store processed PDF data in memory for later extraction
            pdf_storage[file_id] = pdf_data

            processed.append({
                "filename": result["filename"],
                "file_id": file_id,
                "total_pages": pdf_data["total_pages"],
                "data": pdf_data
            })
        else:
            failed.append(f"{result['filename']} ({result['error']})")

    return {
        "processed": processed,
        "failed": failed
    }


@router.get("/download/{file_id}")
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


@router.get("/preview/{file_id}")
async def preview_file(file_id: str):
    """
    Get the text content of an extracted file for preview.

    Returns JSON with the text content and metadata.
    """
    file_path = OUTPUT_DIR / f"{file_id}.txt"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        return {
            "file_id": file_id,
            "filename": f"{file_id}.txt",
            "content": content,
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"Error reading file {file_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}"
        )


@router.get("/pdf/{file_id}")
async def get_pdf(file_id: str):
    """
    Serve the original PDF file for viewing in the browser.

    Args:
        file_id: The ID of the file to serve

    Returns:
        PDF file with proper headers for browser viewing
    """
    pdf_file_path = UPLOADED_PDFS_DIR / f"{file_id}.pdf"

    if not pdf_file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")

    return FileResponse(
        path=pdf_file_path,
        media_type="application/pdf",
        filename=f"{file_id}.pdf"
    )


@router.delete("/delete-pdf/{file_id}")
async def delete_pdf(file_id: str):
    """
    Delete a PDF from storage (text file, original PDF, and in-memory data).

    Args:
        file_id: The ID of the file to delete

    Returns:
        Success message
    """
    pdf_storage = get_pdf_storage()

    # Remove from in-memory storage
    if file_id in pdf_storage:
        del pdf_storage[file_id]
        logger.info(f"Removed {file_id} from in-memory storage")

    # Remove the text file from disk
    text_file_path = OUTPUT_DIR / f"{file_id}.txt"
    if text_file_path.exists():
        try:
            text_file_path.unlink()
            logger.info(f"Deleted text file {text_file_path}")
        except Exception as e:
            logger.error(f"Error deleting text file {text_file_path}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error deleting text file: {str(e)}"
            )

    # Remove the original PDF file from disk
    pdf_file_path = UPLOADED_PDFS_DIR / f"{file_id}.pdf"
    if pdf_file_path.exists():
        try:
            pdf_file_path.unlink()
            logger.info(f"Deleted PDF file {pdf_file_path}")
        except Exception as e:
            logger.error(f"Error deleting PDF file {pdf_file_path}: {str(e)}")
            # Don't raise exception here, just log the error

    return {"message": f"File {file_id} deleted successfully"}
