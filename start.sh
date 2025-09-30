#!/bin/bash

# RFP Management System Frontend Startup Script

echo "Starting RFP Management System Frontend..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from template..."
    cp env.example .env.local
    echo "Please edit .env.local file with your configuration if needed."
fi

# Start the development server
echo "Starting Next.js development server..."
npm run dev
