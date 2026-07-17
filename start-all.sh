#!/bin/bash

# MediNova startup script (integrated Next.js UI/API + ML service)

echo "🏥 MediNova Complete Startup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.9+ first."
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo "✓ npm found: $(npm --version)"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo ""

# Start ML Service
echo "1️⃣  Starting ML Service (Port 5001)..."
cd ml_service
if [ ! -x "venv/bin/python" ]; then
    echo "   Setting up virtual environment..."
    python3 -m venv venv
fi

if [ ! -x "venv/bin/python" ]; then
    echo "   ❌ Failed to create Python virtual environment."
    exit 1
fi

if [ ! -f "venv/.requirements_installed" ] || [ requirements.txt -nt "venv/.requirements_installed" ]; then
    echo "   Installing ML dependencies..."
    venv/bin/pip install -r requirements.txt
    touch venv/.requirements_installed
fi

if command -v setsid >/dev/null 2>&1; then
    setsid venv/bin/python app.py &
else
    venv/bin/python app.py &
fi
ML_PID=$!
echo "   ✓ ML Service started (PID: $ML_PID)"
cd ..

sleep 2

# Install Node.js dependencies if needed
echo ""
echo "2️⃣  Starting MediNova Web + API (Port 3000)..."
if [ ! -d "node_modules" ]; then
    echo "   Installing Node.js dependencies..."
    npm install
fi
if command -v setsid >/dev/null 2>&1; then
    setsid npm run dev &
else
    npm run dev &
fi
WEB_PID=$!
echo "   ✓ Next.js UI + API started (PID: $WEB_PID)"

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📱 Access MediNova at: http://localhost:3000"
echo ""
echo "🔗 API Endpoints:"
echo "   - Next.js UI + Backend API: http://localhost:3000"
echo "   - ML Service: http://localhost:5001"
echo ""
echo "💾 Process IDs:"
echo "   - Next.js UI + API: $WEB_PID"
echo "   - ML Service: $ML_PID"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Wait for all background processes
cleanup() {
    if command -v setsid >/dev/null 2>&1; then
        # Each service was started in its own process group. The negative PID
        # stops npm and its child Node server together, preventing stale routes.
        kill -TERM -- "-$WEB_PID" "-$ML_PID" 2>/dev/null || true
    else
        kill "$WEB_PID" "$ML_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

wait "$WEB_PID" "$ML_PID"
