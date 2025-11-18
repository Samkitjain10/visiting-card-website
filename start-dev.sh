#!/bin/bash

# Smart Scan Development Startup Script
# This script helps you start both frontend and backend servers

echo "🚀 Smart Scan Development Startup"
echo ""

# Check if we're in the right directory
if [ ! -d "Smart_Scan_Frontend" ] || [ ! -d "Smart_Scan_Backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   (the directory containing Smart_Scan_Frontend and Smart_Scan_Backend)"
    exit 1
fi

echo "Starting Backend Server..."
echo "📁 Backend: Smart_Scan_Backend/"
cd Smart_Scan_Backend
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in Smart_Scan_Backend/"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
echo "🔧 Starting backend server on port 5000..."
npm run dev &
BACKEND_PID=$!

cd ..

echo ""
echo "Starting Frontend Server..."
echo "📁 Frontend: Smart_Scan_Frontend/"
cd Smart_Scan_Frontend
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in Smart_Scan_Frontend/"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "   Creating .env.local with default API URL..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
fi

echo "🎨 Starting frontend server on port 3000..."
echo ""
echo "✅ Both servers are starting..."
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start frontend (this will block)
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM

