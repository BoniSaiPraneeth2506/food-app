#!/bin/bash

echo "🚀 Starting FoodieHub Development Environment"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: mongod"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Go back to root
cd ..

# Install root dependencies
echo "📦 Installing root dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# Seed database
echo "🌱 Seeding database..."
npm run seed

# Start the application
echo "🎉 Starting FoodieHub..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "Press Ctrl+C to stop"

npm run dev