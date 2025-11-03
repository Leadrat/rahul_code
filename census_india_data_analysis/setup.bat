@echo off
echo ========================================
echo ML Data Analysis Dashboard Setup
echo ========================================
echo.

echo [1/4] Creating Python virtual environment...
python -m venv .venv
if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment
    pause
    exit /b 1
)
echo Virtual environment created successfully!
echo.

echo [2/4] Activating virtual environment...
call .venv\Scripts\activate.bat
echo.

echo [3/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)
echo Python dependencies installed successfully!
echo.

echo [4/4] Installing Node.js dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo Node.js dependencies installed successfully!
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application:
echo 1. Run 'start-backend.bat' in one terminal
echo 2. Run 'start-frontend.bat' in another terminal
echo.
pause
