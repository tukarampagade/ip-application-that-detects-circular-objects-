# start_all.ps1
# Launches both the FastAPI backend and the Vite frontend dev server
# in separate PowerShell windows.

Write-Host "Starting OpenCV Circle Detection (backend + frontend)..." -ForegroundColor Cyan

$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$root\backend'
if (-not (Test-Path venv)) { python -m venv venv }
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
"@

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$root\frontend'
if (-not (Test-Path node_modules)) { npm install }
npm run dev
"@

Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Green
