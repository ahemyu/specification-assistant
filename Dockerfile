# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install uv for faster dependency management
RUN pip install --no-cache-dir uv

# Install Python dependencies
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy application source code
COPY src/ ./src/

# Create necessary directories for uploads and outputs
RUN mkdir -p /app/src/pdf_reader/uploads /app/src/pdf_reader/output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

# Expose the port the app runs on
EXPOSE 8000

# Set working directory to where the app files are
WORKDIR /app/src/pdf_reader

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000').read()" || exit 1

# Run the FastAPI application with uvicorn
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
