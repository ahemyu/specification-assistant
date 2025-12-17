"""FastAPI service for PDF text extraction, question answering and key extraction."""

import logging
from contextlib import asynccontextmanager

from backend.config import PDF_READER_DIR
from backend.database import close_db, init_db
from backend.routers import auth, excel, llm, pdf, pdf_download
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Handle application lifespan events (startup and shutdown)."""
    # Startup: Initialize database
    logger.info("Application starting up...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning("Database initialization failed: %s. Auth and document features may not work.", str(e))
    logger.info("Startup complete")
    yield
    # Shutdown: Clean up resources
    logger.info("Application shutting down...")
    try:
        await close_db()
    except Exception as e:
        logger.warning("Error closing database: %s", str(e))


app = FastAPI(title="PDF Text Extraction API", version="1.0.0", lifespan=lifespan)

# Include routers (must be before catch-all static mount)
app.include_router(auth.router)
app.include_router(pdf.router)
app.include_router(llm.router)
app.include_router(excel.router)
app.include_router(pdf_download.router)

# Mount React production build
frontend_dist = PDF_READER_DIR / "frontend" / "dist"
app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="react-frontend")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
