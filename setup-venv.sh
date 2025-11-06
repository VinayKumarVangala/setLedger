#!/bin/bash

# setLedger Virtual Environment Setup Script

echo "🚀 Setting up setLedger with Virtual Environment"
echo "================================================"

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Create main virtual environment
echo "🔧 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install flask scikit-learn numpy pandas

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Setup AI service virtual environment (separate)
echo "🤖 Setting up AI service environment..."
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask scikit-learn numpy pandas
cd ..

# Setup environment files
echo "🔒 Setting up environment configuration..."
node scripts/setup-env.js

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎯 To start the application:"
echo "   source venv/bin/activate"
echo "   npm run start-all"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo ""
echo "📚 Next steps:"
echo "   1. Review .env files and add your API keys"
echo "   2. Set up your database connections"
echo "   3. Start the application with the commands above"