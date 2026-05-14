#!/bin/bash

# PebelAI Careers Backend Setup Script

echo "🚀 Setting up PebelAI Careers Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install chromium
playwright install-deps chromium

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and fill in your credentials!"
fi

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis is not installed. Install Redis or use Docker:"
    echo "   docker run -d -p 6379:6379 redis:7-alpine"
else
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Start it with: redis-server"
    fi
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Apply database migration:"
echo "   psql \$DATABASE_URL < ../supabase/migrations/20260515000000_careers_module_v2.sql"
echo "3. Start the server:"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "Or use Docker:"
echo "   docker-compose up -d"
echo ""
