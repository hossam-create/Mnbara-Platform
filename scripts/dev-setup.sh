#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment for the Mnbara Platform monorepo

set -e

echo "=========================================="
echo "Mnbara Platform - Development Setup"
echo "=========================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) is installed"

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
    echo "❌ npm 10+ is required. Current version: $(npm -v)"
    exit 1
fi
echo "✅ npm $(npm -v) is installed"

# Check Nx CLI
echo "Checking Nx CLI..."
if ! command -v nx &> /dev/null; then
    echo "⚠️  Nx CLI not found globally. Installing..."
    npm install -g nx
fi
echo "✅ Nx $(nx --version) is installed"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your local configuration"
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p .nx/cache
mkdir -p logs
mkdir -p tmp

# Verify Nx workspace
echo ""
echo "Verifying Nx workspace..."
nx list

echo ""
echo "=========================================="
echo "✅ Development environment setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your local configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Run 'npm run build' to build all packages"
echo "4. Run 'npm run test' to run tests"
echo ""
