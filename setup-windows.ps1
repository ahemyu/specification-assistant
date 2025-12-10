# Windows Startup Script for Specification Assistant
# Run this script from the project root directory after installing prerequisites

$ErrorActionPreference = "Stop"

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$FRONTEND_DIR = Join-Path $ROOT_DIR "src\pdf_reader\frontend"
$BACKEND_DIR = Join-Path $ROOT_DIR "src\pdf_reader"
$ENV_FILE = Join-Path $ROOT_DIR ".env"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Specification Assistant - Windows Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cleanup function to stop database on exit
function Cleanup {
    Write-Host ""
    Write-Host "Shutting down database..." -ForegroundColor Yellow
    Push-Location $ROOT_DIR
    docker-compose down
    Pop-Location
    Write-Host "Cleanup complete" -ForegroundColor Green
}

# Register cleanup on script exit
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

# Validate directories exist
if (-not (Test-Path $FRONTEND_DIR)) {
    Write-Host "[ERROR] Frontend directory not found at $FRONTEND_DIR" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "[ERROR] Backend directory not found at $BACKEND_DIR" -ForegroundColor Red
    exit 1
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check UV
try {
    $uvVersion = uv --version 2>&1
    Write-Host "[OK] UV found: $uvVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] UV not found. Please install UV with: pip install uv" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js 18+ (LTS)." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All prerequisites found!" -ForegroundColor Green
Write-Host ""

# Install Python dependencies
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Installing Python Dependencies" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Running: uv sync" -ForegroundColor Yellow

try {
    uv sync
    if ($LASTEXITCODE -ne 0) {
        throw "uv sync failed"
    }
    Write-Host "[OK] Python dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install Python dependencies." -ForegroundColor Red
    Write-Host "Please run 'uv sync' manually from the project root." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install frontend dependencies
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Installing Frontend Dependencies" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Running: npm install (in src/pdf_reader/frontend)" -ForegroundColor Yellow

Push-Location $FRONTEND_DIR

try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "[OK] Frontend dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install frontend dependencies." -ForegroundColor Red
    Write-Host "Please run 'npm install' manually in src/pdf_reader/frontend." -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""

# Build frontend
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Building Frontend" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Running: npm run build" -ForegroundColor Yellow

Push-Location $FRONTEND_DIR

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed"
    }
    Write-Host "[OK] Frontend built successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to build frontend." -ForegroundColor Red
    Write-Host "Please run 'npm run build' manually in src/pdf_reader/frontend." -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""

# Start database
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Starting Database" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Running: docker-compose up -d db" -ForegroundColor Yellow

Push-Location $ROOT_DIR

try {
    docker-compose up -d db
    if ($LASTEXITCODE -ne 0) {
        throw "docker-compose up failed"
    }
    Write-Host "[OK] Database container started!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to start database container." -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $result = docker exec specification-assistant-db mysqladmin ping -h localhost --silent 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Database is ready!" -ForegroundColor Green
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $attempt++
}

if ($attempt -eq $maxAttempts) {
    Write-Host "[ERROR] Database did not become ready in time." -ForegroundColor Red
    Cleanup
    exit 1
}

Write-Host ""

# Load environment variables
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Loading Environment Variables" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

if (Test-Path $ENV_FILE) {
    Write-Host "Loading .env from $ENV_FILE" -ForegroundColor Yellow
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove surrounding quotes if present
            if ($value -match '^["''](.*)["'']$') {
                $value = $matches[1]
            }
            [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
    Write-Host "[OK] .env loaded" -ForegroundColor Green
} else {
    Write-Host ".env not found. You'll be prompted for required values." -ForegroundColor Yellow
}

# Check and set API key if not already set
if (-not $env:OPENAI_API_KEY) {
    $apiKey = Read-Host "Enter OPENAI_API_KEY" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
    $env:OPENAI_API_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host ""

# Start FastAPI server
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Starting FastAPI Server" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Running: uv run main.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access the application at: http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server and database." -ForegroundColor Yellow
Write-Host ""

Push-Location $BACKEND_DIR

try {
    uv run main.py
} finally {
    Pop-Location
    Cleanup
}
