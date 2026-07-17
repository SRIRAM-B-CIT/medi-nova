@echo off
REM MediNova Next.js + ML startup script for Windows

echo.
echo 🏥 MediNova Complete Startup
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 20.9+ first.
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

REM Start the integrated Next.js frontend and API
echo 2️⃣  Starting MediNova Web + API (Port 3000) in new window...
if not exist "node_modules" (
    echo    Installing Node.js dependencies...
    call npm install
)
start "MediNova Next.js" cmd /k "npm run dev"

echo.
echo ✅ All services started successfully!
echo.
echo 📱 Access MediNova at: http://localhost:3000
echo.
echo 🔗 API Endpoints:
echo    - Next.js UI + Backend API: http://localhost:3000
echo    - ML Service: http://localhost:5001
echo.
echo Each service is running in its own terminal window.
echo To stop a service, close its terminal window.
echo.
pause
