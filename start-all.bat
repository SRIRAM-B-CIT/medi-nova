@echo off
REM MediNova Complete Startup Script for Windows

echo.
echo 🏥 MediNova Complete Startup
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% found

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ %PYTHON_VERSION% found
echo.

REM Start ML Service
echo 1️⃣  Starting ML Service (Port 5001) in new window...
cd ml_service
if not exist "venv" (
    echo    Setting up virtual environment...
    python -m venv venv
)
cd ..
start "MediNova ML Service" cmd /k "cd ml_service & venv\Scripts\activate.bat & python app.py"
timeout /t 3 /nobreak

REM Start Backend
echo 2️⃣  Starting Backend API (Port 5000) in new window...
cd backend
if not exist "node_modules" (
    echo    Installing backend dependencies...
    call npm install
)
cd ..
start "MediNova Backend API" cmd /k "cd backend & npm run dev"
timeout /t 3 /nobreak

REM Start Frontend
echo 3️⃣  Starting Frontend (Port 5173) in new window...
if not exist "node_modules" (
    echo    Installing frontend dependencies...
    call npm install
)
start "MediNova Frontend" cmd /k "npm run dev"

echo.
echo ✅ All services started successfully!
echo.
echo 📱 Access MediNova at: http://localhost:5173
echo.
echo 🔗 API Endpoints:
echo    - Backend API: http://localhost:5000
echo    - ML Service: http://localhost:5001
echo.
echo Each service is running in its own terminal window.
echo To stop a service, close its terminal window.
echo.
pause
