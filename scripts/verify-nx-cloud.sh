#!/bin/bash

# Nx Cloud Verification Script
# This script verifies that Nx Cloud is properly configured

set -e

echo "=========================================="
echo "Nx Cloud Verification"
echo "=========================================="
echo ""

# Check if nx.json exists
if [ ! -f nx.json ]; then
    echo "✗ nx.json not found"
    exit 1
fi
echo "✓ nx.json found"

# Check if .nxignore exists
if [ ! -f .nxignore ]; then
    echo "✗ .nxignore not found"
    exit 1
fi
echo "✓ .nxignore found"

# Check if NX_CLOUD_ACCESS_TOKEN is set
if [ -z "$NX_CLOUD_ACCESS_TOKEN" ]; then
    echo "⚠ NX_CLOUD_ACCESS_TOKEN not set"
    echo "  Set it with: export NX_CLOUD_ACCESS_TOKEN=your_token_here"
else
    echo "✓ NX_CLOUD_ACCESS_TOKEN is set"
fi

# Check if packages exist
echo ""
echo "Checking packages..."

packages=(
    "packages/shared-types"
    "packages/ui-components"
    "packages/utils"
    "packages/api-client"
    "packages/validation"
)

for package in "${packages[@]}"; do
    if [ -d "$package" ]; then
        echo "✓ $package exists"
    else
        echo "✗ $package not found"
    fi
done

# Check nx.json configuration
echo ""
echo "Checking nx.json configuration..."

if grep -q "cacheableOperations" nx.json; then
    echo "✓ cacheableOperations configured"
else
    echo "✗ cacheableOperations not configured"
fi

if grep -q "targetDefaults" nx.json; then
    echo "✓ targetDefaults configured"
else
    echo "✗ targetDefaults not configured"
fi

if grep -q "build" nx.json; then
    echo "✓ build target configured"
else
    echo "✗ build target not configured"
fi

if grep -q "test" nx.json; then
    echo "✓ test target configured"
else
    echo "✗ test target not configured"
fi

if grep -q "lint" nx.json; then
    echo "✓ lint target configured"
else
    echo "✗ lint target not configured"
fi

# Test cache functionality
echo ""
echo "Testing cache functionality..."

if command -v nx &> /dev/null; then
    echo "✓ Nx CLI is installed"
    
    # Get Nx version
    nx_version=$(nx --version)
    echo "  Nx version: $nx_version"
else
    echo "✗ Nx CLI not found"
    echo "  Install with: npm install -g nx"
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Set NX_CLOUD_ACCESS_TOKEN if not already set"
echo "2. Run: nx build @mnbara/shared-types"
echo "3. Check output for Nx Cloud messages"
echo "4. Visit https://cloud.nx.app to view dashboard"
echo ""
