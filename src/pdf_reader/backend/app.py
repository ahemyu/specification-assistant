"""FastAPI service for PDF text extraction, question answering and key extraction."""

import logging
from contextlib import asynccontextmanager

from backend.config import PDF_READER_DIR
from backend.dependencies import load_existing_pdfs
from backend.routers import excel, llm, pdf
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Handle application lifespan events (startup and shutdown)."""
    # Startup: Load existing PDFs from disk
    logger.info("Application starting up...")
    load_existing_pdfs()
    logger.info("Startup complete")
    yield
    # Shutdown: Clean up resources if needed
    logger.info("Application shutting down...")


app = FastAPI(title="PDF Text Extraction API", version="1.0.0", lifespan=lifespan)

# Include routers (must be before catch-all static mount)
app.include_router(pdf.router)
app.include_router(llm.router)
app.include_router(excel.router)

# Mount React production build
frontend_dist = PDF_READER_DIR / "frontend" / "dist"
app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="react-frontend")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
