@echo off
REM Node.js Setup Verification Script for Windows

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Node.js Setup Verification Script
echo ========================================
echo.

set failed=0

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo X Node.js not found
    set failed=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set node_version=%%i
    echo [OK] Node.js installed: !node_version!
)
echo.

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo X npm not found
    set failed=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set npm_version=%%i
    echo [OK] npm installed: !npm_version!
)
echo.

REM Check root node_modules
echo Checking root node_modules...
if exist node_modules (
    echo [OK] Root node_modules exists
) else (
    echo X Root node_modules missing
    set failed=1
)
echo.

REM Check frontend node_modules
echo Checking frontend node_modules...
if exist frontend\web-app\node_modules (
    echo [OK] Frontend node_modules exists
) else (
    echo X Frontend node_modules missing
    set failed=1
)
echo.

REM Check vite
echo Checking vite...
npx vite --version >nul 2>&1
if errorlevel 1 (
    echo X Vite not available
    set failed=1
) else (
    for /f "tokens=*" %%i in ('npx vite --version') do set vite_version=%%i
    echo [OK] Vite available: !vite_version!
)
echo.

REM Check TypeScript
echo Checking TypeScript...
npx tsc --version >nul 2>&1
if errorlevel 1 (
    echo X TypeScript not available
    set failed=1
) else (
    for /f "tokens=*" %%i in ('npx tsc --version') do set tsc_version=%%i
    echo [OK] TypeScript available: !tsc_version!
)
echo.

REM Check backend services
echo Checking backend services node_modules...
set services=listing-service-node cart-service payment-service crowdship-service compliance-service

for %%S in (%services%) do (
    if exist backend\services\%%S\node_modules (
        echo [OK] %%S node_modules exists
    ) else (
        echo X %%S node_modules missing
        set failed=1
    )
)
echo.

REM Check Docker
echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker not found
    set failed=1
) else (
    for /f "tokens=*" %%i in ('docker --version') do set docker_version=%%i
    echo [OK] Docker installed: !docker_version!
)
echo.

REM Check Docker Compose
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo X Docker Compose not found
    set failed=1
) else (
    for /f "tokens=*" %%i in ('docker-compose --version') do set compose_version=%%i
    echo [OK] Docker Compose installed: !compose_version!
)
echo.

REM Summary
echo ========================================
if !failed! equ 0 (
    echo All checks passed!
    echo ========================================
    echo.
    echo You can now run:
    echo   npm run start:mvp:win
    exit /b 0
) else (
    echo Some checks failed!
    echo ========================================
    echo.
    echo Please run:
    echo   scripts\fix-nodejs-env.bat
    exit /b 1
)

endlocal
