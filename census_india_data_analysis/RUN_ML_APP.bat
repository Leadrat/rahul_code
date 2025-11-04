@echo off
echo ========================================
echo  ML Data Analysis Application Launcher
echo ========================================
echo.
echo This will start both backend and frontend
echo.
echo Starting Backend (Flask)...
start "ML Backend" cmd /k "python backend\app.py"
echo.
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul
echo.
echo Starting Frontend (React)...
start "ML Frontend" cmd /k "cd frontend && npm start"
echo.
echo ========================================
echo  Application Starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ML Insights: http://localhost:3000/ml-insights
echo.
echo Press any key to exit this launcher...
echo (Backend and Frontend will continue running)
pause > nul
