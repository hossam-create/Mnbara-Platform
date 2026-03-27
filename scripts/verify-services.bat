@echo off
echo ========================================
echo Service Verification Script
echo ========================================
echo.

echo 🔍 Checking service health...
echo.

REM Check Listing Service
echo [1/5] Listing Service (Port 3001)...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Listing Service is running
) else (
    echo ❌ Listing Service is not responding
)

REM Check Cart Service
echo [2/5] Cart Service (Port 3002)...
curl -s http://localhost:3002/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Cart Service is running
) else (
    echo ❌ Cart Service is not responding
)

REM Check Payment Service
echo [3/5] Payment Service (Port 3003)...
curl -s http://localhost:3003/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Payment Service is running
) else (
    echo ❌ Payment Service is not responding
)

REM Check Crowdship Service
echo [4/5] Crowdship Service (Port 3004)...
curl -s http://localhost:3004/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Crowdship Service is running
) else (
    echo ❌ Crowdship Service is not responding
)

REM Check Compliance Service
echo [5/5] Compliance Service (Port 3005)...
curl -s http://localhost:3005/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Compliance Service is running
) else (
    echo ❌ Compliance Service is not responding
)

echo.
echo ========================================
echo 🔍 Testing API Endpoints...
echo ========================================
echo.

REM Test Products API
echo Testing GET /api/products...
curl -s http://localhost:3001/api/products | findstr "id" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Products API working
) else (
    echo ❌ Products API failed
)

echo.
echo ========================================
echo Verification Complete
echo ========================================
