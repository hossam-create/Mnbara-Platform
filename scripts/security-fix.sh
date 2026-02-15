#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MNBARA - Security Vulnerability Fix Script          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════
# STEP 1: Update Root Dependencies
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 1: Updating Root Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
    echo "📦 Running npm audit fix..."
    npm audit fix --force
    
    echo ""
    echo "📊 Checking remaining vulnerabilities..."
    npm audit
else
    echo "⚠️  No package.json found in root"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# STEP 2: Update All Backend Services
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 2: Updating Backend Services (16 services)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SERVICES=(
    "admin-service"
    "api-gateway"
    "auth-service"
    "cart-service"
    "country-layer-service"
    "escrow-service"
    "feature-management-service"
    "matching-service"
    "notification-service"
    "orders-service"
    "payment-service"
    "product-service"
    "settlement-service"
    "subscription-service"
    "trips-service"
    "user-service"
    "wallet-service"
)

for service in "${SERVICES[@]}"; do
    SERVICE_PATH="backend/services/$service"
    
    if [ -f "$SERVICE_PATH/package.json" ]; then
        echo "────────────────────────────────────────────────────"
        echo "🔍 Updating: $service"
        echo "────────────────────────────────────────────────────"
        
        cd "$SERVICE_PATH"
        
        # Update dependencies
        npm audit fix --force 2>/dev/null
        
        # Check if successful
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $service updated${NC}"
        else
            echo -e "${YELLOW}⚠️  $service has issues (manual check needed)${NC}"
        fi
        
        cd - > /dev/null
        echo ""
    else
        echo -e "${YELLOW}⚠️  $service: No package.json found${NC}"
        echo ""
    fi
done

# ═══════════════════════════════════════════════════════════
# STEP 3: Update Frontend
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 3: Updating Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "frontend/package.json" ]; then
    cd frontend/
    
    echo "📦 Running npm audit fix..."
    npm audit fix --force
    
    echo ""
    echo "📊 Checking remaining vulnerabilities..."
    npm audit
    
    cd ..
else
    echo "⚠️  No package.json found in frontend/"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# STEP 4: Update Mobile App
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 4: Updating Mobile App (Flutter)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "mobile-app-flutter" ]; then
    cd mobile-app-flutter/
    
    echo "📱 Running flutter pub upgrade..."
    flutter pub upgrade 2>/dev/null || echo "⚠️  Flutter not installed or not in PATH"
    
    cd ..
else
    echo "⚠️  Mobile app directory not found"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# STEP 5: Critical Packages Manual Check
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 STEP 5: Critical Packages to Check Manually"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⚠️  These packages often have critical vulnerabilities:"
echo ""
echo "   1. express (should be >= 4.19.2)"
echo "   2. jsonwebtoken (should be >= 9.0.0)"
echo "   3. axios (should be >= 1.6.0)"
echo "   4. cors (should be >= 2.8.5)"
echo "   5. bcrypt (should be >= 5.1.0)"
echo "   6. pg (PostgreSQL - should be >= 8.11.0)"
echo "   7. stripe (should be >= 14.0.0)"
echo ""

echo "🔍 Searching for these packages in project..."
echo ""

for pkg in "express" "jsonwebtoken" "axios" "cors" "bcrypt" "pg" "stripe"; do
    echo "Searching for: $pkg"
    grep -r "\"$pkg\"" --include="package.json" . 2>/dev/null | grep -v node_modules | head -3
    echo ""
done

# ═══════════════════════════════════════════════════════════
# STEP 6: Generate Vulnerability Report
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 6: Generating Comprehensive Audit Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REPORT_FILE="SECURITY_AUDIT_$(date +%Y%m%d_%H%M%S).txt"

echo "Mnbara Platform - Security Audit Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "================================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Root audit
echo "ROOT PROJECT:" >> "$REPORT_FILE"
npm audit --json >> "$REPORT_FILE" 2>/dev/null || echo "No package.json in root" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Backend services audit
echo "BACKEND SERVICES:" >> "$REPORT_FILE"
for service in "${SERVICES[@]}"; do
    if [ -f "backend/services/$service/package.json" ]; then
        echo "--- $service ---" >> "$REPORT_FILE"
        cd "backend/services/$service"
        npm audit --json >> "../../../$REPORT_FILE" 2>/dev/null
        cd - > /dev/null
        echo "" >> "$REPORT_FILE"
    fi
done

# Frontend audit
if [ -f "frontend/package.json" ]; then
    echo "FRONTEND:" >> "$REPORT_FILE"
    cd frontend/
    npm audit --json >> "../$REPORT_FILE" 2>/dev/null
    cd ..
    echo "" >> "$REPORT_FILE"
fi

echo "✅ Report saved to: $REPORT_FILE"
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 7: Summary
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SECURITY UPDATE COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Next Steps:"
echo ""
echo "   1. Review the security report: cat $REPORT_FILE"
echo "   2. Commit the updated dependencies:"
echo "      git add ."
echo "      git commit -m 'fix: Security vulnerabilities patched'"
echo "      git push"
echo ""
echo "   3. Check GitHub Security tab for remaining issues"
echo "   4. Test all services after updates:"
echo "      docker-compose up --build"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║            SECURITY SCRIPT COMPLETED                   ║"
echo "╚════════════════════════════════════════════════════════╝"