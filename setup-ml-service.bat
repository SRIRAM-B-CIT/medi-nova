@echo off
REM MediNova ML Service Setup & Start Script for Windows

echo.
echo 🚀 MediNova ML Service Setup
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.8+ first.
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ %PYTHON_VERSION% found

REM Create virtual environment if it doesn't exist
if not exist "ml_service\venv" (
    echo 📦 Creating Python virtual environment...
    cd ml_service
    python -m venv venv
    cd ..
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call ml_service\venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing Python dependencies...
cd ml_service
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ✅ Setup Complete!
echo.
echo 📋 To start the ML Service, run:
echo    ml_service\venv\Scripts\activate.bat
echo    cd ml_service
echo    python app.py
echo.
echo The ML service will be available at: http://localhost:5001
echo.
pause
