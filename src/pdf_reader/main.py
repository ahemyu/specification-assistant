"""
Main entry point for the Specification Assistant application.

This file serves as the entry point and imports the FastAPI app from the backend module.
Run with: uv run main.py
"""

import os

from backend.app import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("APP_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
