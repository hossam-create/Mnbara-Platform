#!/bin/bash
set -e

echo "=== GeoCore Post-Merge Setup ==="

# Install frontend monorepo dependencies
echo "Installing frontend dependencies..."
cd geocore-next/frontend && pnpm install --frozen-lockfile=false
cd ../..

# Build Go backend (compile check)
echo "Building Go backend..."
cd geocore-next/backend && go build ./...
cd ../..

echo "=== Done ==="
