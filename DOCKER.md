# Docker Deployment Guide

This guide explains how to run the Specification Assistant application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose
- OpenAI API Key (for LLM features like key extraction and Q&A)

## Quick Start with Docker Compose

1. Clone the repository and navigate to the project directory

2. Create a `.env` file with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env and configure your settings
   ```

3. Build and run the application:
   ```bash
   docker-compose up -d
   ```

   This starts three services:
   - **app**: The main application (FastAPI backend + React frontend) on port 8000
   - **db**: MySQL database on port 3306
   - **adminer**: Database admin UI on port 8080

4. Access the application at http://localhost:8000

5. Access database admin UI at http://localhost:8080

6. Stop the application:
   ```bash
   docker-compose down
   ```

7. Stop and remove all data (including database):
   ```bash
   docker-compose down -v
   ```

## Environment Variables

Required:
- `OPENAI_API_KEY`: Required for LLM-based features (key extraction, Q&A)

Optional (with defaults):
- `OPENAI_BASE_URL`: OpenAI API base URL (default: Azure OpenAI endpoint)
- `MYSQL_DATABASE`: Database name (default: specification_assistant)
- `MYSQL_USER`: Database user (default: app_user)
- `MYSQL_PASSWORD`: Database password (default: app_password)
- `MYSQL_ROOT_PASSWORD`: MySQL root password (default: root_password)
- `JWT_SECRET_KEY`: Secret for JWT tokens (default: change-this-secret-key-in-production)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiry in minutes (default: 1440)

## Services

### Application (app)
- FastAPI backend with React frontend
- Port: 8000
- Depends on: MySQL database
- Health check enabled

### Database (db)
- MySQL 8.0
- Port: 3306
- Data persisted in Docker volume `db_data`
- Health check enabled

### Adminer (adminer)
- Database administration UI
- Port: 8080
- Connect using: Server=db, User/Password from env vars

## Volumes

- `db_data`: MySQL database files (PDFs and extracted text are stored in the database)

## Ports

- Port `8000`: FastAPI application (web interface and API)
- Port `3306`: MySQL database
- Port `8080`: Adminer database UI

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
```

## Rebuild After Changes

```bash
docker-compose up -d --build
```

## Health Checks

Both the application and database containers include health checks that run every 10-30 seconds to ensure services are responding correctly.
