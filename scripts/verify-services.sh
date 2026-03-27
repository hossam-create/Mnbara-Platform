#!/bin/bash

echo "========================================"
echo "Service Verification Script"
echo "========================================"
echo ""

echo "🔍 Checking service health..."
echo ""

# Check Listing Service
echo "[1/5] Listing Service (Port 3001)..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Listing Service is running"
else
    echo "❌ Listing Service is not responding"
fi

# Check Cart Service
echo "[2/5] Cart Service (Port 3002)..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Cart Service is running"
else
    echo "❌ Cart Service is not responding"
fi

# Check Payment Service
echo "[3/5] Payment Service (Port 3003)..."
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ Payment Service is running"
else
    echo "❌ Payment Service is not responding"
fi

# Check Crowdship Service
echo "[4/5] Crowdship Service (Port 3004)..."
if curl -s http://localhost:3004/health > /dev/null 2>&1; then
    echo "✅ Crowdship Service is running"
else
    echo "❌ Crowdship Service is not responding"
fi

# Check Compliance Service
echo "[5/5] Compliance Service (Port 3005)..."
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Compliance Service is running"
else
    echo "❌ Compliance Service is not responding"
fi

echo ""
echo "========================================"
echo "🔍 Testing API Endpoints..."
echo "========================================"
echo ""

# Test Products API
echo "Testing GET /api/products..."
if curl -s http://localhost:3001/api/products | grep -q "id"; then
    echo "✅ Products API working"
else
    echo "❌ Products API failed"
fi

echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
