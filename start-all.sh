#!/bin/bash

# MediNova Complete Startup Script (Frontend + Backend + ML Service)

echo "🏥 MediNova Complete Startup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
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
if [ ! -d "venv" ]; then
    echo "   Setting up virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
python app.py &
ML_PID=$!
echo "   ✓ ML Service started (PID: $ML_PID)"
cd ..

sleep 2

# Install backend dependencies if needed
echo ""
echo "2️⃣  Starting Backend API (Port 5000)..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi
npm run dev &
BACKEND_PID=$!
echo "   ✓ Backend started (PID: $BACKEND_PID)"
cd ..

sleep 2

# Install frontend dependencies if needed
echo ""
echo "3️⃣  Starting Frontend (Port 5173)..."
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "   ✓ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📱 Access MediNova at: http://localhost:5173"
echo ""
echo "🔗 API Endpoints:"
echo "   - Backend API: http://localhost:5000"
echo "   - ML Service: http://localhost:5001"
echo ""
echo "💾 Process IDs:"
echo "   - Frontend: $FRONTEND_PID"
echo "   - Backend: $BACKEND_PID"
echo "   - ML Service: $ML_PID"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Wait for all background processes
wait
