"""
Main entry point for the Specification Assistant application.

This file serves as the entry point and imports the FastAPI app from the backend module.
Run with: uvicorn main:app --reload
"""

from backend.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
