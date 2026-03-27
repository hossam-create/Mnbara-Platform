#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║        MNBARA - Frontend Deep Diagnostic               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════
# SECTION 1: Frontend Structure Detection
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 SECTION 1: Frontend Directory Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "frontend" ]; then
    echo "✅ Frontend directory found"
    echo ""
    
    echo "📂 Top-level structure:"
    ls -lah frontend/
    echo ""
    
    echo "🌳 Full directory tree (3 levels):"
    tree frontend/ -L 3 -I 'node_modules' 2>/dev/null || find frontend/ -maxdepth 3 -type d -not -path '*/node_modules/*' | head -50
    echo ""
else
    echo "❌ Frontend directory NOT found!"
    exit 1
fi

# ═══════════════════════════════════════════════════════════
# SECTION 2: Framework Detection
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SECTION 2: Framework & Technology Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find package.json
PACKAGE_JSON_PATH=""
if [ -f "frontend/package.json" ]; then
    PACKAGE_JSON_PATH="frontend/package.json"
elif [ -f "frontend/client/package.json" ]; then
    PACKAGE_JSON_PATH="frontend/client/package.json"
elif [ -f "frontend/web/package.json" ]; then
    PACKAGE_JSON_PATH="frontend/web/package.json"
fi

if [ -n "$PACKAGE_JSON_PATH" ]; then
    echo "✅ package.json found at: $PACKAGE_JSON_PATH"
    echo ""
    
    echo "📦 Full package.json content:"
    cat "$PACKAGE_JSON_PATH"
    echo ""
    echo ""
    
    echo "🎯 Framework Detection:"
    if grep -q "\"react\"" "$PACKAGE_JSON_PATH"; then
        echo "   ✅ React.js detected"
    fi
    if grep -q "\"next\"" "$PACKAGE_JSON_PATH"; then
        echo "   ✅ Next.js detected"
    fi
    if grep -q "\"vue\"" "$PACKAGE_JSON_PATH"; then
        echo "   ✅ Vue.js detected"
    fi
    if grep -q "\"angular\"" "$PACKAGE_JSON_PATH"; then
        echo "   ✅ Angular detected"
    fi
    echo ""
    
    echo "🎨 UI Libraries:"
    grep -E "\"tailwind|\"bootstrap|\"mui|\"antd|\"chakra|\"shadcn" "$PACKAGE_JSON_PATH" || echo "   No major UI library detected"
    echo ""
    
    echo "🔌 API Client:"
    grep -E "\"axios|\"fetch|\"swr|\"react-query" "$PACKAGE_JSON_PATH" || echo "   No API client library detected"
    echo ""
    
else
    echo "⚠️  No package.json found in frontend directory!"
    echo ""
    
    echo "🔍 Searching for package.json in subdirectories..."
    find frontend/ -name "package.json" -not -path "*/node_modules/*" 2>/dev/null
    echo ""
fi

# ═══════════════════════════════════════════════════════════
# SECTION 3: Pages & Components Count
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 SECTION 3: Pages & Components Inventory"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 File Count by Type:"
echo "   React/JSX files: $(find frontend/ -name "*.jsx" -o -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   JavaScript files: $(find frontend/ -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   TypeScript files: $(find frontend/ -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   Vue files: $(find frontend/ -name "*.vue" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   HTML files: $(find frontend/ -name "*.html" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   CSS files: $(find frontend/ -name "*.css" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo ""

echo "📂 Pages Directory:"
if [ -d "frontend/pages" ] || [ -d "frontend/src/pages" ] || [ -d "frontend/app" ]; then
    find frontend/ -type d -name "pages" -o -name "app" -not -path "*/node_modules/*" 2>/dev/null
    echo ""
    echo "📝 Page Files:"
    find frontend/ \( -path "*/pages/*" -o -path "*/app/*" \) -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) -not -path "*/node_modules/*" 2>/dev/null | head -30
else
    echo "   ⚠️  No standard pages directory found"
fi
echo ""

echo "🧩 Components Directory:"
if [ -d "frontend/components" ] || [ -d "frontend/src/components" ]; then
    echo "   ✅ Components directory found"
    echo ""
    echo "📝 Component Files (first 30):"
    find frontend/ -path "*/components/*" -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" \) -not -path "*/node_modules/*" 2>/dev/null | head -30
else
    echo "   ⚠️  No standard components directory found"
fi
echo ""

# ═══════════════════════════════════════════════════════════
# SECTION 4: API Integration Analysis
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 SECTION 4: API Integration Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 API Configuration Files:"
find frontend/ -name "*api*" -o -name "*config*" -o -name "*axios*" -not -path "*/node_modules/*" 2>/dev/null | head -10
echo ""

echo "🌐 API Base URL Configuration:"
grep -r "baseURL\|BASE_URL\|API_URL\|REACT_APP_API" frontend/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.env*" 2>/dev/null | grep -v node_modules | head -10
echo ""

echo "📡 API Calls Found (first 30):"
grep -rn "axios\|fetch\|api\." frontend/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -30
echo ""

echo "🔌 Service Integration:"
echo "   Auth calls: $(grep -r "login\|register\|auth" frontend/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | wc -l)"
echo "   Product calls: $(grep -r "product\|listing" frontend/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | wc -l)"
echo "   Order calls: $(grep -r "order\|checkout" frontend/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | wc -l)"
echo "   Payment calls: $(grep -r "payment\|stripe" frontend/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | wc -l)"
echo ""

# ═══════════════════════════════════════════════════════════
# SECTION 5: Routing Configuration
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛣️  SECTION 5: Routing Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Router Files:"
find frontend/ -name "*router*" -o -name "*routes*" -o -name "App.*" -not -path "*/node_modules/*" 2>/dev/null
echo ""

echo "🛤️  Route Definitions:"
grep -rn "Route\|path:\|route" frontend/ --include="*.jsx" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v node_modules | head -20
echo ""

# ═══════════════════════════════════════════════════════════
# SECTION 6: State Management
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  SECTION 6: State Management"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$PACKAGE_JSON_PATH" ]; then
    echo "📦 State Management Libraries:"
    grep -E "\"redux|\"zustand|\"mobx|\"recoil|\"jotai" "$PACKAGE_JSON_PATH" || echo "   No state management library detected"
    echo ""
fi

echo "🔍 Store/Context Files:"
find frontend/ -name "*store*" -o -name "*context*" -o -name "*state*" -not -path "*/node_modules/*" 2>/dev/null | head -10
echo ""

# ═══════════════════════════════════════════════════════════
# SECTION 7: Environment Variables
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 SECTION 7: Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📄 Environment Files:"
find frontend/ -name ".env*" 2>/dev/null
echo ""

if [ -f "frontend/.env" ] || [ -f "frontend/.env.example" ]; then
    echo "🔍 Environment Variables (sanitized):"
    cat frontend/.env* 2>/dev/null | sed 's/=.*/=***HIDDEN***/'
    echo ""
fi

# ═══════════════════════════════════════════════════════════
# SECTION 8: Build Configuration
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  SECTION 8: Build Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📦 Build Config Files:"
find frontend/ -name "vite.config.*" -o -name "webpack.config.*" -o -name "next.config.*" -o -name "tsconfig.json" -not -path "*/node_modules/*" 2>/dev/null
echo ""

if [ -n "$PACKAGE_JSON_PATH" ]; then
    echo "🔧 Build Scripts:"
    grep -A 10 '"scripts"' "$PACKAGE_JSON_PATH"
    echo ""
fi

# ═══════════════════════════════════════════════════════════
# SECTION 9: Critical Files Check
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SECTION 9: Critical Files Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo "   ✅ $1"
    else
        echo "   ❌ $1 (MISSING)"
    fi
}

echo "📋 Essential Files:"
check_file "frontend/package.json"
check_file "frontend/package-lock.json"
check_file "frontend/node_modules"
check_file "frontend/src/index.js" || check_file "frontend/src/index.jsx" || check_file "frontend/src/main.jsx"
check_file "frontend/src/App.js" || check_file "frontend/src/App.jsx"
check_file "frontend/public/index.html"
echo ""

# ═══════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FRONTEND DIAGNOSTIC COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 SUMMARY:"
echo "   Total Files: $(find frontend/ -type f -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   React/JSX: $(find frontend/ -name "*.jsx" -o -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null | wc -l)"
echo "   Pages: $(find frontend/ -path "*/pages/*" -type f 2>/dev/null | wc -l)"
echo "   Components: $(find frontend/ -path "*/components/*" -type f 2>/dev/null | wc -l)"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║     COPY OUTPUT AND SEND FOR DETAILED ANALYSIS        ║"
echo "╚════════════════════════════════════════════════════════╝"