#!/bin/bash

# Development setup script for Live Retro

set -e

echo "🚀 Starting Live Retro development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Development environment variables
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
EOF
fi

# Start services
echo "🐳 Starting services with Docker Compose..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not responding"
fi

# Check backend
if curl -sf http://localhost:8080/api/boards > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8080"
else
    echo "❌ Backend is not responding at http://localhost:8080"
fi

# Check frontend
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "❌ Frontend is not responding at http://localhost:3000"
fi

echo ""
echo "🎉 Live Retro is ready!"
echo ""
echo "📖 Quick links:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Redis: localhost:6379"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📊 To view logs: docker-compose logs -f"