#!/usr/bin/env bash
set -euo pipefail

# Usage: ./start.sh [dev|prod]
#   dev  - runs on port 8000 (default)
#   prod - runs on port 80 (requires root)

MODE="${1:-dev}"
if [ "$MODE" = "prod" ]; then
  export APP_PORT=80
else
  export APP_PORT=8000
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${ROOT_DIR}/src/pdf_reader/frontend"
BACKEND_DIR="${ROOT_DIR}/src/pdf_reader"
ENV_FILE="${ROOT_DIR}/.env"

# Cleanup function to stop database on exit
cleanup() {
  echo ""
  echo "Shutting down database..."
  (cd "${ROOT_DIR}" && docker-compose down)
  echo "Cleanup complete"
}

# Register cleanup on script exit (including Ctrl+C)
trap cleanup EXIT

if [ ! -d "${FRONTEND_DIR}" ]; then
  echo "Frontend directory not found at ${FRONTEND_DIR}" >&2
  exit 1
fi

if [ ! -d "${BACKEND_DIR}" ]; then
  echo "Backend directory not found at ${BACKEND_DIR}" >&2
  exit 1
fi

echo "Building frontend (npm run build)"
(
  cd "${FRONTEND_DIR}" &&
  npm run build
)

echo "Starting database (docker-compose up -d db)"
(
  cd "${ROOT_DIR}" &&
  docker-compose up -d db
)

echo "Waiting for database to be ready..."
until docker exec specification-assistant-db mysqladmin ping -h localhost --silent 2>/dev/null; do
  sleep 1
done
echo "Database is ready"

echo "Loading environment variables"
if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
  echo ".env loaded from ${ENV_FILE}"
else
  echo ".env not found. You'll be prompted for required values."
fi

if [ -z "${GPT41_API_KEY:-}" ]; then
  read -r -s -p "Enter GPT41_API_KEY: " GPT41_API_KEY
  echo
  export GPT41_API_KEY
fi

if [ -z "${GPT41_MINI_API_KEY:-}" ]; then
  read -r -s -p "Enter GPT41_MINI_API_KEY: " GPT41_MINI_API_KEY
  echo
  export GPT41_MINI_API_KEY
fi

echo "Starting FastAPI server on port ${APP_PORT} (uv run main.py)"
cd "${BACKEND_DIR}"
uv run main.py
