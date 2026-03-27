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

# Restart Go backend workflow so it picks up new compiled code
echo "Restarting Go backend (kill port 9000 so workflow restarts)..."
fuser -k 9000/tcp 2>/dev/null || true

echo "=== Done ==="
