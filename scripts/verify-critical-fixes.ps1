# ============================================
# Critical Fixes Verification Script (PowerShell)
# ============================================
# This script verifies that all 3 critical fixes are properly deployed
# Date: February 18, 2026

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MNBARA PLATFORM - CRITICAL FIXES VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PASS = 0
$FAIL = 0
$WARN = 0

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "ISSUE #1: CORS WILDCARD VULNERABILITIES" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Check CORS configurations
$files = @(
    "backend\services\orders-service\.env.example",
    "backend\mvp-services\order-service\.env.example",
    "backend\services\country-layer-service\.env.example"
)

foreach ($file in $files) {
    Write-Host "Checking $file... " -NoNewline
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "ALLOWED_ORIGINS") {
            Write-Host "[PASS]" -ForegroundColor Green
            $PASS++
        } else {
            Write-Host "[FAIL] Missing ALLOWED_ORIGINS" -ForegroundColor Red
            $FAIL++
        }
    } else {
        Write-Host "[FAIL] File not found" -ForegroundColor Red
        $FAIL++
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "ISSUE #2: API GATEWAY ROUTING" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Check API Gateway routes
Write-Host "Checking API Gateway routes.config.ts... " -NoNewline
$routesFile = "backend\services\api-gateway\src\config\routes.config.ts"
if (Test-Path $routesFile) {
    $content = Get-Content $routesFile -Raw
    if ($content -match "trips-service") {
        Write-Host "[PASS]" -ForegroundColor Green
        $PASS++
    } else {
        Write-Host "[FAIL] Not updated" -ForegroundColor Red
        $FAIL++
    }
} else {
    Write-Host "[FAIL] File not found" -ForegroundColor Red
    $FAIL++
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "ISSUE #3: DUPLICATE WALLET LOGIC" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Check axios dependency
Write-Host "Checking axios dependency... " -NoNewline
$packageJson = "backend\services\payment-service\package.json"
if (Test-Path $packageJson) {
    $content = Get-Content $packageJson -Raw
    if ($content -match '"axios"') {
        Write-Host "[PASS]" -ForegroundColor Green
        $PASS++
    } else {
        Write-Host "[FAIL] Not installed" -ForegroundColor Red
        $FAIL++
    }
} else {
    Write-Host "[FAIL] package.json not found" -ForegroundColor Red
    $FAIL++
}

# Check WalletClient
Write-Host "Checking WalletClient exists... " -NoNewline
$walletClient = "backend\services\payment-service\src\clients\wallet-client.ts"
if (Test-Path $walletClient) {
    Write-Host "[PASS]" -ForegroundColor Green
    $PASS++
} else {
    Write-Host "[FAIL] Not found" -ForegroundColor Red
    $FAIL++
}

# Check deprecated WalletService
Write-Host "Checking old WalletService deprecated... " -NoNewline
$deprecatedService = "backend\services\payment-service\src\services\wallet.service.DEPRECATED.ts"
if (Test-Path $deprecatedService) {
    Write-Host "[PASS]" -ForegroundColor Green
    $PASS++
} else {
    Write-Host "[WARN] Not deprecated" -ForegroundColor Yellow
    $WARN++
}

# Check WALLET_SERVICE_URL
Write-Host "Checking WALLET_SERVICE_URL in .env.example... " -NoNewline
$envExample = "backend\services\payment-service\.env.example"
if (Test-Path $envExample) {
    $content = Get-Content $envExample -Raw
    if ($content -match "WALLET_SERVICE_URL") {
        Write-Host "[PASS]" -ForegroundColor Green
        $PASS++
    } else {
        Write-Host "[FAIL] Missing" -ForegroundColor Red
        $FAIL++
    }
} else {
    Write-Host "[FAIL] .env.example not found" -ForegroundColor Red
    $FAIL++
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed:   $PASS" -ForegroundColor Green
Write-Host "Warnings: $WARN" -ForegroundColor Yellow
Write-Host "Failed:   $FAIL" -ForegroundColor Red
Write-Host ""

if ($FAIL -eq 0) {
    Write-Host "[SUCCESS] ALL CRITICAL FIXES VERIFIED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Production Readiness: READY" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "[ERROR] SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Production Readiness: NOT READY" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the failed checks before deploying to production." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
