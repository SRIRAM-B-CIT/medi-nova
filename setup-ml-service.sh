#!/bin/bash

# MediNova ML Service Setup & Start Script

echo "🚀 MediNova ML Service Setup"
echo "================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "ml_service/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    cd ml_service
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source ml_service/venv/bin/activate

# Install dependencies
echo "📚 Installing Python dependencies..."
cd ml_service
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 To start the ML Service, run:"
echo "   source ml_service/venv/bin/activate"
echo "   cd ml_service"
echo "   python app.py"
echo ""
echo "The ML service will be available at: http://localhost:5001"
echo ""
