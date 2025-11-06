#!/bin/bash

echo "🚀 Starting setLedger Services"
echo "=============================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./setup-venv.sh first"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

echo "🔧 Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "📱 Starting Frontend Application..."
cd frontend  
npm start &
FRONTEND_PID=$!
cd ..

echo "🤖 Starting AI Service..."
cd ai-service
source venv/bin/activate
python3 app.py &
AI_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo "🌐 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000/api/v1/health"
echo "   AI Service: http://localhost:5001/health"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID $AI_PID 2>/dev/null; exit 0' INT

wait