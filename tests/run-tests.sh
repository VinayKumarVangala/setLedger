#!/bin/bash

echo "🚀 Starting setLedger Security Test Suite"
echo "=========================================="

# Start backend server in background
echo "📡 Starting backend server..."
cd ../backend && npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:5000/api/v1/health > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Run tests
echo "🧪 Running concurrent signup tests..."
cd ../tests
npm install
node concurrent-signup-test.js

# Cleanup
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null
echo "✅ Tests completed"