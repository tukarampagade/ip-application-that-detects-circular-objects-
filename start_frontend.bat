@echo off
title OpenCV Circle Detection - Frontend

echo ==========================================
echo   OpenCV Circle Detection Frontend
echo ==========================================
echo.

cd /d "%~dp0frontend"

echo Frontend folder:
echo %CD%
echo.

REM Install dependencies if node_modules does not exist
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install

    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo ==========================================
echo   Starting Vite Frontend
echo ==========================================
echo.
echo Frontend:
echo http://localhost:5173
echo.

npm run dev

pause