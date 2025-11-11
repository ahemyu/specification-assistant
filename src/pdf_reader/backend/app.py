"""FastAPI service for PDF text extraction, question answering and key extraction."""
import logging
from contextlib import asynccontextmanager

from backend.dependencies import load_existing_pdfs
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
# from fastapi.templating import Jinja2Templates  # DEPRECATED: Vanilla JS templates no longer used
from backend.routers import excel, llm, pdf

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
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

# ============================================================================
# DEPRECATED: Vanilla JS Static Files (Archived 2025-11-11)
# The React build is now served from frontend/dist/ directory.
# The old vanilla JS code is archived in frontend/archived_vanilla_js/
# app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
# templates = Jinja2Templates(directory="frontend/templates")
# @app.get("/")
# async def root(request: Request):
#     """Serve the main HTML page."""
#     return templates.TemplateResponse("index.html", {"request": request})
# ============================================================================

# Include routers (must be before catch-all static mount)
app.include_router(pdf.router)
app.include_router(llm.router)
app.include_router(excel.router)

# Mount React production build (must be LAST - catch-all route)
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="react-frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
