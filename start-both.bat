@echo off
REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 🚀 Starting MediNova Services...
echo.

REM Start ML Service
echo 1️⃣  Starting ML Service (Port 5001)...
cd ml_service
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
start "MediNova ML Service" cmd /k "venv\Scripts\activate.bat && python app.py"
cd ..
echo ✓ ML Service starting...
echo.
timeout /t 3 /nobreak

REM Start Backend
echo 2️⃣  Starting Backend API (Port 5000)...
cd backend
start "MediNova Backend" cmd /k "npm run dev"
cd ..
echo ✓ Backend starting...
echo.
timeout /t 3 /nobreak

REM Start Frontend
echo 3️⃣  Starting Frontend (Port 5173)...
start "MediNova Frontend" cmd /k "npm run dev"
echo ✓ Frontend starting...
echo.
echo ✅ All services are starting!
echo.
echo 📱 Access at: http://localhost:5173
echo 🔌 Backend API: http://localhost:5000
echo 🤖 ML Service: http://localhost:5001
echo.
echo Three terminal windows should open. Check them for any errors.
echo.
pause
