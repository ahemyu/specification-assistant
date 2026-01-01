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

# Cleanup function to stop database and adminer on exit
cleanup() {
  echo ""
  echo "Shutting down database and adminer..."
  (cd "${ROOT_DIR}" && docker compose down)
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

echo "Loading environment variables"
if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
  echo ".env loaded from ${ENV_FILE}"
else
  echo ".env not found. Please copy .env.example to .env and configure it."
  echo "You can do this by running: cp .env.example .env"
fi

if [ -z "${GOOGLE_API_KEY:-}" ]; then
  # Only prompt if not in non-interactive mode
  if [ -t 0 ]; then
      read -r -s -p "Enter GOOGLE_API_KEY: " GOOGLE_API_KEY
      echo
      export GOOGLE_API_KEY
  else
      echo "Warning: GOOGLE_API_KEY not set in environment."
  fi
fi

echo "Building frontend (npm run build)"
(
  cd "${FRONTEND_DIR}" &&
  npm run build
)

echo "Starting database and adminer (docker compose up -d db adminer)"
(
  cd "${ROOT_DIR}" &&
  docker compose up -d db adminer
)

echo "Waiting for database to be ready..."
until docker exec specification-assistant-db mysqladmin ping -h localhost --silent 2>/dev/null; do
  sleep 1
done
echo "Database is ready"

echo "Starting FastAPI server on port ${APP_PORT} (uv run main.py)"
cd "${BACKEND_DIR}"
uv run main.py
