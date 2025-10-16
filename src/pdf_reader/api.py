"""FastAPI service for PDF text extraction."""
import logging
import uuid
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from process_pdfs import process_single_pdf, process_single_pdf_to_dict

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
        if not file.filename.endswith('.pdf'):
            failed.append(f"{file.filename} (not a PDF)")
            continue

        try:
            file_id = str(uuid.uuid4())
            upload_path = UPLOAD_DIR / f"{file_id}.pdf"

            contents = await file.read()
            with open(upload_path, "wb") as f:
                f.write(contents)

            logger.info(f"Processing {file.filename}...")

            pdf_data = process_single_pdf_to_dict(upload_path)

            text_content = process_single_pdf(upload_path)
            output_path = OUTPUT_DIR / f"{file_id}.txt"
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text_content)

            processed.append({
                "filename": file.filename,
                "file_id": file_id,
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
    file_path = OUTPUT_DIR / f"{file_id}.txt"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="text/plain",
        filename=f"extracted_{file_id}.txt"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
