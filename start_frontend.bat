@echo off
echo Starting OpenCV Circle Detection frontend...
cd frontend
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
)
npm run dev
pause
