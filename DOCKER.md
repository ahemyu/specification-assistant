# Docker Deployment Guide

This guide explains how to run the Specification Assistant application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)
- Google API Key (for LLM features like key extraction and Q&A)

## Quick Start with Docker Compose

1. Clone the repository and navigate to the project directory

2. Create a `.env` file with your Google API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

3. Build and run the application:
   ```bash
   docker-compose up -d
   ```

4. Access the application at http://localhost:8000

5. Stop the application:
   ```bash
   docker-compose down
   ```

## Using Docker CLI

### Build the image

```bash
docker build -t specification-assistant .
```

### Run the container

```bash
docker run -d \
  --name specification-assistant \
  -p 8000:8000 \
  -e GOOGLE_API_KEY=your_api_key_here \
  -v $(pwd)/uploads:/app/src/pdf_reader/uploads \
  -v $(pwd)/output:/app/src/pdf_reader/output \
  specification-assistant
```

### View logs

```bash
docker logs -f specification-assistant
```

### Stop the container

```bash
docker stop specification-assistant
docker rm specification-assistant
```

## Environment Variables

- `GOOGLE_API_KEY`: Required for LLM-based features (key extraction, Q&A)

## Volumes

The application uses two volumes to persist data:

- `/app/src/pdf_reader/uploads`: Stores uploaded PDF files
- `/app/src/pdf_reader/output`: Stores extracted text files

## Ports

- Port `8000`: FastAPI application (web interface and API)

## Health Check

The container includes a health check that runs every 30 seconds to ensure the application is responding correctly.
