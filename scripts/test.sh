#!/bin/bash

# Test script for Live Retro

set -e

echo "🧪 Running Live Retro tests..."

# Test backend
echo "🔧 Testing Go backend..."
cd server

# Check Go modules
if [ ! -f go.mod ]; then
    echo "❌ go.mod not found"
    exit 1
fi

# Lint Go code (if golangci-lint is available)
if command -v golangci-lint &> /dev/null; then
    echo "📝 Running Go linter..."
    golangci-lint run
else
    echo "⚠️ golangci-lint not found, skipping Go linting"
fi

# Format check
echo "🎨 Checking Go code formatting..."
UNFORMATTED=$(gofmt -l .)
if [ -n "$UNFORMATTED" ]; then
    echo "❌ The following files are not properly formatted:"
    echo "$UNFORMATTED"
    echo "Run 'gofmt -w .' to fix formatting"
    exit 1
fi

# Build test
echo "🏗️ Testing Go build..."
go build -o /tmp/live-retro-test cmd/server/main.go
rm -f /tmp/live-retro-test

cd ..

# Test frontend
echo "🌐 Testing Next.js frontend..."
cd client

# Check if package.json exists
if [ ! -f package.json ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    npm ci
fi

# TypeScript check
echo "🔍 Running TypeScript check..."
npm run typecheck

# Lint frontend
echo "📝 Running frontend linter..."
npm run lint

# Build test
echo "🏗️ Testing frontend build..."
npm run build

cd ..

echo ""
echo "✅ All tests passed!"
echo ""
echo "🚀 Ready for deployment!"