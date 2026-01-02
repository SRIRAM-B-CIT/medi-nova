@echo off
echo Starting MediNova Backend Server...
cd backend
start cmd /k "npm run dev"
cd ..
echo.
echo Backend server starting on http://localhost:5000
echo.
timeout /t 3 /nobreak
echo Starting MediNova Frontend...
start cmd /k "npm run dev"
echo.
echo Frontend starting on http://localhost:5173
echo.
echo Both servers are starting. Check the new terminal windows.
pause
