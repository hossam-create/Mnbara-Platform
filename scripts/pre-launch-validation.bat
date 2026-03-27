@echo off
REM MNBARA Platform - Pre-Launch Validation Script
REM Comprehensive production readiness check

echo ========================================
echo MNBARA PRE-LAUNCH VALIDATION
echo ========================================
echo.

set PASSED=0
set FAILED=0
set API_URL=http://localhost:3000
set FRONTEND_URL=http://localhost:4173

echo Checking if services are running...
echo.

REM Check API Gateway
echo [1] API Gateway Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ API Gateway: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ API Gateway: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Auth Service
echo [2] Auth Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/auth/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Auth Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Auth Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check User Service
echo [3] User Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/users/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ User Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ User Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Product Service
echo [4] Product Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/products/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Product Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Product Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Payment Service
echo [5] Payment Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/payments/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Payment Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Payment Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Wallet Service
echo [6] Wallet Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/wallet/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Wallet Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Wallet Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Escrow Service
echo [7] Escrow Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/escrow/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Escrow Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Escrow Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Matching Service
echo [8] Matching Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/matching/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Matching Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Matching Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Notification Service
echo [9] Notification Service Health Check...
curl -s -o nul -w "%%{http_code}" %API_URL%/api/notifications/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Notification Service: HEALTHY
    set /a PASSED+=1
) else (
    echo ❌ Notification Service: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Frontend
echo [10] Frontend Application...
curl -s -o nul -w "%%{http_code}" %FRONTEND_URL% > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Frontend: ACCESSIBLE
    set /a PASSED+=1
) else (
    echo ❌ Frontend: FAILED ^(Status: %STATUS%^)
    set /a FAILED+=1
)

REM Check Database Connection
echo [11] Database Connection...
cd backend\services\auth-service
call npx prisma db execute --stdin < nul > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database: CONNECTED
    set /a PASSED+=1
) else (
    echo ❌ Database: CONNECTION FAILED
    set /a FAILED+=1
)
cd ..\..\..

REM Check Redis Connection
echo [12] Redis Connection...
REM This would need redis-cli installed
echo ⚠️  Redis: MANUAL CHECK REQUIRED

REM Environment Variables Check
echo [13] Environment Variables...
if defined JWT_SECRET (
    echo ✅ JWT_SECRET: SET
    set /a PASSED+=1
) else (
    echo ❌ JWT_SECRET: NOT SET
    set /a FAILED+=1
)

if defined STRIPE_SECRET_KEY (
    echo ✅ STRIPE_SECRET_KEY: SET
    set /a PASSED+=1
) else (
    echo ❌ STRIPE_SECRET_KEY: NOT SET
    set /a FAILED+=1
)

if defined DATABASE_URL (
    echo ✅ DATABASE_URL: SET
    set /a PASSED+=1
) else (
    echo ❌ DATABASE_URL: NOT SET
    set /a FAILED+=1
)

REM Cleanup
del temp.txt 2>nul

echo.
echo ========================================
echo VALIDATION SUMMARY
echo ========================================
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED% EQU 0 (
    echo ✅ SYSTEM READY FOR PRODUCTION
    echo ========================================
    exit /b 0
) else (
    echo ❌ SYSTEM NOT READY - FIX FAILURES ABOVE
    echo ========================================
    exit /b 1
)
