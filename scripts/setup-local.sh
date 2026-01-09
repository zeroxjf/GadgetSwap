#!/bin/bash

# GadgetSwap Local Development Setup
# Run this script to get everything running locally

set -e

echo "🚀 Setting up GadgetSwap locally..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Desktop."
    exit 1
fi

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "   ✅ Created .env file"
else
    echo "   ✅ .env file already exists"
fi

# Start Docker containers
echo "🐳 Starting PostgreSQL database..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run Prisma migrations
echo "🗄️  Setting up database schema..."
npx prisma generate
npx prisma db push

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start developing:"
echo "  npm run dev"
echo ""
echo "Your services:"
echo "  🌐 App:      http://localhost:3000"
echo "  🗄️  Database: postgresql://localhost:5432/gadgetswap"
echo "  📊 Adminer:  http://localhost:8080 (database GUI)"
echo ""
echo "To stop the database:"
echo "  docker compose down"
echo ""
echo "To view database in Adminer:"
echo "  System: PostgreSQL"
echo "  Server: db"
echo "  Username: gadgetswap"
echo "  Password: gadgetswap_local_dev"
echo "  Database: gadgetswap"
