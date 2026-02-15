#!/bin/bash

# Horn System - Quick Setup Script
# This script helps you set up the Horn system quickly

set -e

echo "🎯 Horn System - Quick Setup"
echo "================================"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✓ Docker detected"
    echo ""
    echo "Do you want to use Docker? (recommended) [Y/n]"
    read -r use_docker
    
    if [[ "$use_docker" =~ ^[Yy]$ ]] || [[ -z "$use_docker" ]]; then
        echo ""
        echo "🐳 Setting up with Docker..."
        docker compose down -v 2>/dev/null || true
        docker compose up --build -d
        echo ""
        echo "✅ Done! System is running:"
        echo "   - Web App: http://localhost:8080"
        echo "   - API: http://localhost:3005"
        echo ""
        echo "Demo Login:"
        echo "   Email: commander.north@horn.local"
        echo "   Password: Horn12345!"
        exit 0
    fi
fi

# Manual setup
echo ""
echo "📦 Manual Setup..."
echo ""

# Setup server
echo "1️⃣ Setting up Server..."
cd server

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit server/.env with your database credentials"
    echo "Press Enter to continue..."
    read
fi

echo "Installing server dependencies..."
npm install

echo "Running database migrations..."
npx prisma migrate deploy
npx prisma generate

echo ""
echo "2️⃣ Setting up Client..."
cd ../client

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Installing client dependencies..."
npm install

echo ""
echo "✅ Setup Complete!"
echo ""
echo "To start the system:"
echo "   Server: cd server && npm run dev"
echo "   Client: cd client && npm run dev"
echo ""
echo "Then visit: http://localhost:5173"
echo ""
echo "Demo Login:"
echo "   Email: commander.north@horn.local"
echo "   Password: Horn12345!"
