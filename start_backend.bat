@echo off
echo Starting OpenCV Circle Detection backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
