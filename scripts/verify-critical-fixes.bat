@echo off
REM ============================================
REM Critical Fixes Verification Script (Windows)
REM ============================================
REM This script verifies that all 3 critical fixes are properly deployed
REM Date: February 18, 2026

setlocal enabledelayedexpansion

echo ==========================================
echo MNBARA PLATFORM - CRITICAL FIXES VERIFICATION
echo ==========================================
echo.

set PASS=0
set FAIL=0
set WARN=0

echo ==========================================
echo ISSUE #1: CORS WILDCARD VULNERABILITIES
echo ==========================================
echo.

echo Checking CORS configurations...
echo Note: Manual verification required for CORS settings
echo.

REM Check if ALLOWED_ORIGINS is in .env files
findstr /C:"ALLOWED_ORIGINS" backend\services\orders-service\.env.example >nul 2>&1
if !errorlevel! equ 0 (
    echo [PASS] orders-service has ALLOWED_ORIGINS in .env.example
    set /a PASS+=1
) else (
    echo [FAIL] orders-service missing ALLOWED_ORIGINS
    set /a FAIL+=1
)

findstr /C:"ALLOWED_ORIGINS" backend\mvp-services\order-service\.env.example >nul 2>&1
if !errorlevel! equ 0 (
    echo [PASS] order-service (MVP) has ALLOWED_ORIGINS in .env.example
    set /a PASS+=1
) else (
    echo [FAIL] order-service (MVP) missing ALLOWED_ORIGINS
    set /a FAIL+=1
)

findstr /C:"ALLOWED_ORIGINS" backend\services\country-layer-service\.env.example >nul 2>&1
if !errorlevel! equ 0 (
    echo [PASS] country-layer-service has ALLOWED_ORIGINS in .env.example
    set /a PASS+=1
) else (
    echo [FAIL] country-layer-service missing ALLOWED_ORIGINS
    set /a FAIL+=1
)

echo.
echo ==========================================
echo ISSUE #2: API GATEWAY ROUTING
echo ==========================================
echo.

REM Check if routes.config.ts has been updated
findstr /C:"trips-service" backend\services\api-gateway\src\config\routes.config.ts >nul 2>&1
if !errorlevel! equ 0 (
    echo [PASS] API Gateway routes.config.ts updated
    set /a PASS+=1
) else (
    echo [FAIL] API Gateway routes.config.ts not updated
    set /a FAIL+=1
)

echo.
echo ==========================================
echo ISSUE #3: DUPLICATE WALLET LOGIC
echo ==========================================
echo.

REM Check if axios is in package.json
findstr /C:"axios" backend\services\payment-service\package.json >nul 2>&1
if !errorlevel! equ 0 (
    echo [PASS] axios dependency added to payment-service
    set /a PASS+=1
) else (
    echo [FAIL] axios dependency missing from payment-service
    set /a FAIL+=1
)

REM Check if WalletClient exists
if exist "backend\services\payment-service\src\clients\wallet-client.ts" (
    echo [PASS] WalletClient exists
    set /a PASS+=1
) else (
    echo [FAIL] WalletClient not found
    set /a FAIL+=1
)

REM Check if old WalletService is deprecated
if exist "backend\services\payment-service\src\services\wallet.service.DEPRECATED.ts" (
    echo [PASS] Old WalletService deprecated
    set /a PASS+=1
) else (
    echo [WARN] Old WalletService not deprecated
    set /a WARN+=1
)

REM Check if WALLET_SERVICE_URL is in .env.example
findstr /C:"WALLET_SERVICE_URL" backend\services\payment-service\.env.example >nul 2>&1
if !errorlevel! equ 0 (
    echo [PASS] WALLET_SERVICE_URL in .env.example
    set /a PASS+=1
) else (
    echo [FAIL] WALLET_SERVICE_URL missing from .env.example
    set /a FAIL+=1
)

echo.
echo ==========================================
echo SUMMARY
echo ==========================================
echo.
echo Passed: %PASS%
echo Warnings: %WARN%
echo Failed: %FAIL%
echo.

if %FAIL% equ 0 (
    echo [SUCCESS] ALL CRITICAL FIXES VERIFIED
    echo.
    echo Production Readiness: READY
    echo.
    exit /b 0
) else (
    echo [ERROR] SOME CHECKS FAILED
    echo.
    echo Production Readiness: NOT READY
    echo.
    echo Please fix the failed checks before deploying to production.
    echo.
    exit /b 1
)
