@echo off
echo ========================================
echo Starting Flask Backend Server
echo ========================================
echo.

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Starting Flask server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

cd backend
python app.py
