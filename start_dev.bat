@echo off
echo Starting FileVora Services...

echo Starting Backend (Port 8000)...
start "FileVora Backend" cmd /k "call .venv\Scripts\activate && cd backend && uvicorn main:app --reload"

echo Starting Celery Worker...
start "FileVora Celery Worker" cmd /k "call .venv\Scripts\activate && cd backend && celery -A celery_worker worker --loglevel=info --pool=solo"

echo Starting Frontend (Port 3000)...
start "FileVora Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [IMPORTANT] Ensure Redis is running (port 6379).
echo Services are launching in new windows.
pause
