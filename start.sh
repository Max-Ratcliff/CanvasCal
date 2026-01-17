#!/bin/bash

echo "Starting CanvasCal Backend and Frontend..."

# Start backend
echo "Starting backend on http://localhost:8000..."
cd backend
PYTHONPATH=$(pwd) ../.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend  
echo "Starting frontend on http://localhost:5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "======================================"
echo "✅ Backend running: http://localhost:8000"
echo "✅ Frontend running: http://localhost:5173"
echo "✅ API Docs: http://localhost:8000/docs"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait
