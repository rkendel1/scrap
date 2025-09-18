#!/bin/bash

# Website Design Token Extractor - Quick Setup Script
echo "🚀 Setting up Website Design Token Extractor..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created backend/.env file - update with your database credentials if using PostgreSQL"
fi

npm install
echo "✅ Backend dependencies installed"

npm run build
echo "✅ Backend built successfully"

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
cd ../frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created frontend/.env file"
fi

npm install
echo "✅ Frontend dependencies installed"

npm run build
echo "✅ Frontend built successfully"

# Back to root
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚦 Quick Start Options:"
echo ""
echo "Option 1: Run with Mock Database (No PostgreSQL required)"
echo "  Terminal 1: cd backend && npm run dev:mock"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Then visit: http://localhost:5173"
echo ""
echo "Option 2: Run with PostgreSQL"
echo "  1. Setup PostgreSQL database (see README_FULLSTACK.md)"
echo "  2. Update backend/.env with your database credentials"
echo "  3. Run: cd backend && npm run migrate"
echo "  4. Terminal 1: cd backend && npm run dev"
echo "  5. Terminal 2: cd frontend && npm run dev"
echo "  6. Visit: http://localhost:5173"
echo ""
echo "📖 For detailed documentation, see:"
echo "  - README_FULLSTACK.md (Complete setup guide)"
echo "  - IMPLEMENTATION_SUMMARY.md (Technical overview)"
echo ""
echo "🔍 API Documentation: http://localhost:3001/api/docs"
echo "🏥 Health Check: http://localhost:3001/health"