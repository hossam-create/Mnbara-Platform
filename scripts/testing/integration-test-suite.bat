@echo off
REM MNBARA Platform - Integration Test Suite
REM Runs comprehensive integration tests for all critical flows

echo ========================================
echo MNBARA INTEGRATION TEST SUITE
echo ========================================
echo.

set FAILED=0

echo [1/5] Testing Authentication Flow...
cd backend\services\auth-service
call npm test -- --testPathPattern=auth.service.test
if %ERRORLEVEL% NEQ 0 set FAILED=1

echo.
echo [2/5] Testing Payment Flow...
cd ..\..\..\backend\services\payment-service
call npm test -- --testPathPattern=stripe
if %ERRORLEVEL% NEQ 0 set FAILED=1

echo.
echo [3/5] Testing Product Service...
cd ..\product-service
call npm test
if %ERRORLEVEL% NEQ 0 set FAILED=1

echo.
echo [4/5] Testing Matching Service...
cd ..\matching-service
call npm test
if %ERRORLEVEL% NEQ 0 set FAILED=1

echo.
echo [5/5] Testing Escrow & Wallet...
cd ..\escrow-service
call npm test
if %ERRORLEVEL% NEQ 0 set FAILED=1

cd ..\wallet-service
call npm test
if %ERRORLEVEL% NEQ 0 set FAILED=1

echo.
echo ========================================
if %FAILED% EQU 0 (
    echo ✅ ALL TESTS PASSED
    echo ========================================
    exit /b 0
) else (
    echo ❌ SOME TESTS FAILED
    echo ========================================
    exit /b 1
)
