@echo off
title OpenCV Circle Detection - Backend

echo ==========================================
echo   OpenCV Circle Detection Backend
echo ==========================================
echo.

cd /d "%~dp0"

echo Project folder:
echo %CD%
echo.

REM Create virtual environment if it does not exist
if not exist "venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    python -m venv venv

    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call "venv\Scripts\activate.bat"

if errorlevel 1 (
    echo.
    echo ERROR: Could not activate virtual environment.
    pause
    exit /b 1
)

echo.
echo Installing backend requirements...
python -m pip install -r "backend\requirements.txt"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install backend requirements.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Starting FastAPI Backend
echo ==========================================
echo.
echo Backend:
echo http://127.0.0.1:8000
echo.
echo API Documentation:
echo http://127.0.0.1:8000/docs
echo.

REM Start FastAPI from PROJECT ROOT
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

pause