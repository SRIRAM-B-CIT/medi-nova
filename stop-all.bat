@echo off
REM MediNova Services - Stop All Script
REM Gracefully stops all running MediNova services

echo.
echo 🛑 Stopping MediNova Services...
echo.

REM Kill Node.js (integrated Next.js UI + API)
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ Next.js UI ^& API stopped
) else (
    echo ⚠ No Node.js processes found or already stopped
)

REM Kill Python processes (ML Service)
taskkill /F /IM python.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ ML Service stopped
) else (
    echo ⚠ No Python processes found or already stopped
)

echo.
echo ✅ All MediNova services stopped successfully!
echo.
echo 📊 Summary:
echo - ML Service (Port 5001): Stopped
echo - Next.js UI + API (Port 3000): Stopped
echo.
pause
