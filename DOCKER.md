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
   docker compose up -d
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

## Migrating from docker-compose to docker compose (on WSL)

   The project now uses Docker Compose V2 (docker compose) instead of the legacy docker-compose.

   Steps:

   - Remove old docker-compose:  sudo apt remove docker-compose
   - Add Docker's official repo and install the plugin:  
       sudo apt-get install ca-certificates curl
       sudo install -m 0755 -d /etc/apt/keyrings
       sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
       sudo chmod a+r /etc/apt/keyrings/docker.asc
       
       echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

       sudo apt-get update
       sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   - Either do sudo service docker start each time you open wsl or: 
      - Auto-start Docker on WSL boot - add to ~/.bashrc or ~/.zshrc:  if ! pgrep -x "dockerd" > /dev/null; then
           sudo service docker start > /dev/null 2>&1
       fi
      - (Optional) Skip sudo password for docker service - run sudo visudo and add:  %docker ALL=(ALL) NOPASSWD: /usr/sbin/service docker *
      - Add yourself to docker group and restart WSL:  sudo usermod -aG docker $USER
   - Verify installation:  docker compose version