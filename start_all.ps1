# ============================================================
# OpenCV Circle Detection
# Start Backend + Frontend
# ============================================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   OpenCV Circle Detection Application" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

Write-Host "Project Root:" -ForegroundColor Yellow
Write-Host $root
Write-Host ""

# ============================================================
# BACKEND
# ============================================================

Write-Host "Starting FastAPI Backend..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", @"
cd '$root'

if (-not (Test-Path '$root\venv\Scripts\python.exe')) {
    Write-Host 'Creating Python virtual environment...' -ForegroundColor Yellow
    python -m venv '$root\venv'
}

Write-Host 'Activating virtual environment...' -ForegroundColor Yellow
& '$root\venv\Scripts\Activate.ps1'

Write-Host 'Installing backend requirements...' -ForegroundColor Yellow
python -m pip install -r '$root\backend\requirements.txt'

Write-Host ''
Write-Host 'Starting FastAPI...' -ForegroundColor Green
Write-Host 'Backend: http://127.0.0.1:8000' -ForegroundColor Cyan
Write-Host 'Docs:    http://127.0.0.1:8000/docs' -ForegroundColor Cyan
Write-Host ''

uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
"@

# ============================================================
# WAIT
# ============================================================

Start-Sleep -Seconds 3

# ============================================================
# FRONTEND
# ============================================================

Write-Host "Starting React/Vite Frontend..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$root\frontend'

if (-not (Test-Path '$root\frontend\node_modules')) {
    Write-Host 'Installing frontend dependencies...' -ForegroundColor Yellow
    npm install
}

Write-Host ''
Write-Host 'Starting Vite frontend...' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Cyan
Write-Host ''

npm run dev
"@

# ============================================================
# INFORMATION
# ============================================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       APPLICATION STARTED" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend : http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Two PowerShell windows have been opened." -ForegroundColor Yellow
Write-Host ""