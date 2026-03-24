#!/bin/bash

# Development Environment Verification Script
# This script verifies that the development environment is properly configured

set -e

echo "=========================================="
echo "Mnbara Platform - Setup Verification"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo "✅ Node.js $NODE_VERSION"
    else
        echo "❌ Node.js $NODE_VERSION (requires 20+)"
        ((ERRORS++))
    fi
else
    echo "❌ Node.js not found"
    ((ERRORS++))
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    NPM_MAJOR=$(echo $NPM_VERSION | cut -d'.' -f1)
    if [ "$NPM_MAJOR" -ge 10 ]; then
        echo "✅ npm $NPM_VERSION"
    else
        echo "❌ npm $NPM_VERSION (requires 10+)"
        ((ERRORS++))
    fi
else
    echo "❌ npm not found"
    ((ERRORS++))
fi

# Check Nx
echo "Checking Nx..."
if command -v nx &> /dev/null; then
    NX_VERSION=$(nx --version)
    echo "✅ Nx $NX_VERSION"
else
    echo "⚠️  Nx not found globally (will use npx)"
    ((WARNINGS++))
fi

# Check Git
echo "Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ $GIT_VERSION"
else
    echo "❌ Git not found"
    ((ERRORS++))
fi

# Check node_modules
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "⚠️  node_modules directory not found (run 'npm install')"
    ((WARNINGS++))
fi

# Check .env file
echo ""
echo "Checking configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    if [ -f ".env.example" ]; then
        echo "⚠️  .env file not found (copy from .env.example)"
        ((WARNINGS++))
    else
        echo "❌ .env.example not found"
        ((ERRORS++))
    fi
fi

# Check nx.json
echo "Checking Nx configuration..."
if [ -f "nx.json" ]; then
    echo "✅ nx.json exists"
else
    echo "⚠️  nx.json not found"
    ((WARNINGS++))
fi

# Check tsconfig.json
echo "Checking TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
else
    echo "❌ tsconfig.json not found"
    ((ERRORS++))
fi

# Check package.json
echo "Checking package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json not found"
    ((ERRORS++))
fi

# Check directory structure
echo ""
echo "Checking directory structure..."
DIRS=("apps" "services" "packages" "infrastructure" "docs" "scripts")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "⚠️  $dir/ directory not found"
        ((WARNINGS++))
    fi
done

# Check VS Code configuration
echo ""
echo "Checking VS Code configuration..."
if [ -d ".vscode" ]; then
    echo "✅ .vscode directory exists"
    if [ -f ".vscode/settings.json" ]; then
        echo "✅ .vscode/settings.json exists"
    else
        echo "⚠️  .vscode/settings.json not found"
        ((WARNINGS++))
    fi
else
    echo "⚠️  .vscode directory not found"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo "=========================================="
    echo ""
    echo "Your development environment is ready!"
    echo "Next steps:"
    echo "1. Run 'npm run build' to build all packages"
    echo "2. Run 'npm run test' to run tests"
    echo "3. Run 'npm run dev' to start development servers"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup complete with $WARNINGS warning(s)"
    echo "=========================================="
    echo ""
    echo "Please address the warnings above before starting development."
    exit 0
else
    echo "❌ Setup failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo "=========================================="
    echo ""
    echo "Please fix the errors above and run this script again."
    exit 1
fi
