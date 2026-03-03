@echo off
echo Starting ConvertLocally Services...

echo Starting Backend (Port 8000)...
start "ConvertLocally Backend" cmd /k "call .venv\Scripts\activate && cd backend && uvicorn main:app --reload"

echo Starting Celery Worker...
start "ConvertLocally Celery Worker" cmd /k "call .venv\Scripts\activate && cd backend && celery -A celery_worker worker --loglevel=info --pool=solo"

echo Starting Frontend (Port 3000)...
start "ConvertLocally Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [IMPORTANT] Ensure Redis is running (port 6379).
echo Services are launching in new windows.
pause
