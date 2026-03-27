#!/bin/bash

# Nx Cloud Setup Script
# This script helps set up Nx Cloud for the Mnbara Platform monorepo

set -e

echo "=========================================="
echo "Nx Cloud Setup for Mnbara Platform"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✓ .env.local file exists"
else
    echo "ℹ Creating .env.local file..."
    touch .env.local
    echo "✓ .env.local created"
fi

# Check if NX_CLOUD_ACCESS_TOKEN is set
if [ -z "$NX_CLOUD_ACCESS_TOKEN" ]; then
    echo ""
    echo "⚠ NX_CLOUD_ACCESS_TOKEN is not set"
    echo ""
    echo "To set up Nx Cloud:"
    echo "1. Visit https://cloud.nx.app"
    echo "2. Sign up or log in with your GitHub account"
    echo "3. Create a new workspace for Mnbara Platform"
    echo "4. Copy your access token"
    echo "5. Run: export NX_CLOUD_ACCESS_TOKEN=your_token_here"
    echo "   Or add to .env.local: NX_CLOUD_ACCESS_TOKEN=your_token_here"
    echo ""
    read -p "Enter your Nx Cloud access token (or press Enter to skip): " token
    
    if [ -n "$token" ]; then
        echo "NX_CLOUD_ACCESS_TOKEN=$token" >> .env.local
        export NX_CLOUD_ACCESS_TOKEN=$token
        echo "✓ Access token saved to .env.local"
    else
        echo "⚠ Skipping Nx Cloud setup"
        exit 0
    fi
else
    echo "✓ NX_CLOUD_ACCESS_TOKEN is set"
fi

echo ""
echo "Testing Nx Cloud connection..."
echo ""

# Test Nx Cloud connection
if nx build @mnbara/types --dry-run 2>&1 | grep -q "Nx Cloud"; then
    echo "✓ Nx Cloud is connected and working"
else
    echo "⚠ Nx Cloud connection test inconclusive"
fi

echo ""
echo "=========================================="
echo "Nx Cloud Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run: nx build @mnbara/types"
echo "2. Check the output for 'Nx Cloud cache hit'"
echo "3. Visit https://cloud.nx.app to view your dashboard"
echo ""
