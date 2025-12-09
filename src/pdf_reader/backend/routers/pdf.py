"""Router for PDF upload, download, and preview endpoints."""

import asyncio
import logging
import os
from concurrent.futures import ProcessPoolExecutor
from io import BytesIO

from backend.database import get_db
from backend.dependencies import get_current_user_optional
from backend.models.user import User
from backend.services.document import (
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_file_id,
)
from backend.services.process_pdfs import process_single_pdf
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["pdf"])


def _process_single_file(file_contents: bytes, filename: str) -> dict:
    """
    Process a single PDF file synchronously.

    This function is designed to be run in parallel via ProcessPoolExecutor.

    Args:
        file_contents: The PDF file contents as bytes
        filename: The name of the file

    Returns:
        Dictionary with processing result or error information
    """
    try:
        logger.info(f"Processing {filename}...")

        # Process PDF from memory
        pdf_data = process_single_pdf(BytesIO(file_contents), filename=filename)

        file_id = filename.replace(".pdf", "")

        logger.info(f"Successfully processed {filename}")

        return {
            "success": True,
            "filename": filename,
            "file_id": file_id,
            "pdf_data": pdf_data,
            "file_size_bytes": len(file_contents),
            "pdf_binary": file_contents,
        }

    except Exception as e:
        logger.error(f"Error processing {filename}: {str(e)}")
        return {"success": False, "filename": filename, "error": str(e)}


@router.post("/upload")
async def upload_pdfs(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Upload and process multiple PDF files with parallel processing.
    Stores PDF binary and extracted text directly in the database.

    Returns JSON with extracted content and file IDs for download.
    """
    processed = []
    failed = []

    # Get user_id if authenticated
    user_id = current_user.id if current_user else None
    # Filter out non-PDF files and read all file contents
    valid_files = []
    for file in files:
        if not file.filename or not file.filename.endswith(".pdf"):
            failed.append(f"{file.filename or 'Unknown'} (not a PDF)")
            continue

        contents = await file.read()
        valid_files.append((contents, file.filename))

    if not valid_files:
        return {"processed": processed, "failed": failed}

    # Process PDFs in parallel using ProcessPoolExecutor
    loop = asyncio.get_event_loop()
    max_workers = os.cpu_count() or 4
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        # Submit all processing tasks
        tasks = [
            loop.run_in_executor(executor, _process_single_file, file_contents, filename)
            for file_contents, filename in valid_files
        ]

        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks)

    # Process results and save to database
    for result in results:
        if result["success"]:
            file_id = result["file_id"]
            pdf_data = result["pdf_data"]
            file_size_bytes = result["file_size_bytes"]
            pdf_binary = result["pdf_binary"]

            # Check if document already exists (re-upload case)
            existing_doc = await get_document_by_file_id(db, file_id)
            if existing_doc:
                # Delete old record to replace with new one
                await delete_document(db, file_id)

            # Store document in database (including PDF binary)
            await create_document(
                db=db,
                file_id=file_id,
                original_filename=result["filename"],
                total_pages=pdf_data["total_pages"],
                file_size_bytes=file_size_bytes,
                formatted_text=pdf_data["formatted_text"],
                line_id_map=pdf_data.get("line_id_map", {}),
                pdf_binary=pdf_binary,
                user_id=user_id,
            )

            processed.append(
                {
                    "filename": result["filename"],
                    "original_filename": result["filename"],
                    "file_id": file_id,
                    "total_pages": pdf_data["total_pages"],
                    "data": pdf_data,
                }
            )
        else:
            failed.append(f"{result['filename']} ({result['error']})")

    return {"processed": processed, "failed": failed}


@router.get("/download/{file_id}")
async def download_file(file_id: str, db: AsyncSession = Depends(get_db)):
    """Download the extracted text file from database."""
    document = await get_document_by_file_id(db, file_id)

    if not document or not document.formatted_text:
        raise HTTPException(status_code=404, detail="File not found")

    return Response(
        content=document.formatted_text,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=extracted_{file_id}.txt"},
    )


@router.get("/preview/{file_id}")
async def preview_file(file_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get the text content of an extracted file for preview.

    Returns JSON with the text content and metadata.
    """
    document = await get_document_by_file_id(db, file_id)

    if not document:
        raise HTTPException(status_code=404, detail="File not found")

    content = document.formatted_text or ""
    return {
        "file_id": file_id,
        "filename": f"{file_id}.txt",
        "content": content,
        "size": len(content),
    }


@router.get("/view-pdf/{file_id}")
async def view_pdf(file_id: str, db: AsyncSession = Depends(get_db)):
    """
    Serve the original uploaded PDF file for viewing in browser.

    Returns the PDF file with inline content disposition for browser viewing.
    """
    document = await get_document_by_file_id(db, file_id)

    if not document or not document.pdf_binary:
        raise HTTPException(status_code=404, detail="PDF file not found")

    return Response(
        content=document.pdf_binary,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={file_id}.pdf"},
    )


@router.delete("/delete-pdf/{file_id}")
async def delete_pdf(file_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a PDF from database.

    Args:
        file_id: The ID of the file to delete

    Returns:
        Success message
    """
    deleted = await delete_document(db, file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Document {file_id} not found")

    return {"message": f"File {file_id} deleted successfully"}


@router.get("/documents")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """
    List all uploaded documents.

    Returns list of documents with metadata (no full text content).
    This is useful for the frontend to display available documents on load.
    """
    documents = await get_all_documents(db)
    return {
        "documents": [
            {
                "file_id": doc.file_id,
                "original_filename": doc.original_filename,
                "total_pages": doc.total_pages,
                "file_size_bytes": doc.file_size_bytes,
                "created_at": doc.created_at.isoformat(),
            }
            for doc in documents
        ]
    }
