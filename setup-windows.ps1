# Windows Setup Script for Specification Assistant
# Run this script from the project root directory after installing prerequisites

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Specification Assistant - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Please install Python 3.11+ and add it to PATH." -ForegroundColor Red
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

# Check npm
try {
    $npmVersion = npm --version 2>&1
    Write-Host "[OK] npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm not found. Please install Node.js which includes npm." -ForegroundColor Red
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

Write-Host ""
Write-Host "All prerequisites found!" -ForegroundColor Green
Write-Host ""

# Check and set API key
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Environment Variable Setup" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$existingKey = [System.Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'User')
if ($existingKey) {
    Write-Host "OPENAI_API_KEY is already set." -ForegroundColor Green
    $response = Read-Host "Do you want to update it? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $apiKey = Read-Host "Enter your Azure OpenAI API key"
        [System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', $apiKey, 'User')
        Write-Host "API key updated successfully!" -ForegroundColor Green
        $env:OPENAI_API_KEY = $apiKey
    }
} else {
    Write-Host "OPENAI_API_KEY is not set." -ForegroundColor Yellow
    $apiKey = Read-Host "Enter your Azure OpenAI API key"
    [System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', $apiKey, 'User')
    Write-Host "API key set successfully!" -ForegroundColor Green
    $env:OPENAI_API_KEY = $apiKey
}

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

Push-Location src/pdf_reader/frontend

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

Write-Host ""

# Build frontend
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Building Frontend" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Running: npm run build" -ForegroundColor Yellow

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
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "  1. Navigate to src/pdf_reader:" -ForegroundColor White
Write-Host "     cd src\pdf_reader" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Start the backend server:" -ForegroundColor White
Write-Host "     uv run main.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Open your browser and go to:" -ForegroundColor White
Write-Host "     http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: If you just set the API key for the first time," -ForegroundColor Cyan
Write-Host "      you may need to close and reopen PowerShell for it to take effect." -ForegroundColor Cyan
Write-Host ""
