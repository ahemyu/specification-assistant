# PDF Reader Service

This service handles PDF processing, LLM extraction, and stores data in a MySQL database.

## Prerequisites

- Python 3.10+
- Docker & Docker Compose
- Node.js (for frontend)

## Database Setup

This project uses MySQL for data persistence. A `docker-compose.yml` file is provided to easily spin up a local database instance.

### 1. Start the Database

To start the MySQL database and Adminer (a database management interface), run:

```bash
docker-compose up -d
```

This will start:
- **MySQL 8.0** on port `3306`
- **Adminer** on port `8080` (accessible at http://localhost:8080)

### 2. Configuration

The application is configured via the `.env` file. A default configuration matching the Docker setup has been added:

```bash
# MySQL Database configuration
export MYSQL_USER="app_user"
export MYSQL_PASSWORD="app_password"
export MYSQL_HOST="127.0.0.1"
export MYSQL_PORT="3306"
export MYSQL_DATABASE="specification_assistant"
```

If you change credentials in `docker-compose.yml`, make sure to update `.env` accordingly.

### 3. Database Initialization

The application automatically checks for and creates necessary database tables on startup. 
Just run the backend application:

```bash
# From src/pdf_reader directory
uvicorn backend.app:app --reload
```

You should see logs indicating successful database initialization:
`INFO:     Database tables created successfully`

## Storage Architecture

All PDF data is stored directly in the database:
- **PDF binary** - stored in `LONGBLOB` column (`pdf_binary`)
- **Extracted text** - stored in `LONGTEXT` column (`formatted_text`)
- **Metadata** - file_id, original_filename, total_pages, etc.

## Database Management

You can manage the database using **Adminer** at [http://localhost:8080](http://localhost:8080).

- **System:** MySQL
- **Server:** db
- **Username:** app_user
- **Password:** app_password
- **Database:** specification_assistant

## Authentication

The service includes JWT-based authentication.

- **Register:** `POST /auth/register`
- **Login:** `POST /auth/login` (returns Bearer token)

Secure endpoints using the `Authorization: Bearer <token>` header.
