# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY src/pdf_reader/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY src/pdf_reader/frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Python application
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install uv for faster dependency management
RUN pip install --no-cache-dir uv

# Install Python dependencies
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy application source code
COPY src/ ./src/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./src/pdf_reader/frontend/dist

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

# Expose the port the app runs on
EXPOSE 8000

# Set working directory to where the app files are
WORKDIR /app/src/pdf_reader

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/ || exit 1

# Run the FastAPI application with uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
