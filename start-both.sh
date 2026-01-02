#!/bin/bash

echo "Starting MediNova Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo ""
echo "Backend server starting on http://localhost:5000"
echo "Backend PID: $BACKEND_PID"
echo ""

sleep 3

echo "Starting MediNova Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Frontend starting on http://localhost:5173"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Both servers are running!"
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
