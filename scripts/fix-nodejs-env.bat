@echo off
REM Node.js Environment Fix Script for Windows

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Node.js Environment Fix Script
echo ========================================
echo.

REM Step 1: Check Node.js and npm versions
echo Step 1: Checking Node.js and npm versions...
node --version
npm --version
echo.

REM Step 2: Clean up node_modules and lock files
echo Step 2: Cleaning up node_modules and lock files...
echo Removing root node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Removing frontend node_modules...
if exist frontend\web-app\node_modules rmdir /s /q frontend\web-app\node_modules
if exist frontend\web-app\package-lock.json del frontend\web-app\package-lock.json

echo Removing backend services node_modules...
for /d /r backend\services %%D in (node_modules) do (
    if exist "%%D" rmdir /s /q "%%D"
)
for /r backend\services %%F in (package-lock.json) do (
    if exist "%%F" del "%%F"
)

echo Cleanup completed
echo.

REM Step 3: Clear npm cache
echo Step 3: Clearing npm cache...
call npm cache clean --force
echo npm cache cleared
echo.

REM Step 4: Install root dependencies
echo Step 4: Installing root dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install root dependencies
    exit /b 1
)
echo Root dependencies installed
echo.

REM Step 5: Install frontend dependencies
echo Step 5: Installing frontend dependencies...
cd frontend\web-app
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies
    exit /b 1
)
cd ..\..
echo Frontend dependencies installed
echo.

REM Step 6: Install backend services dependencies
echo Step 6: Installing backend services dependencies...

setlocal enabledelayedexpansion
set services=listing-service-node cart-service payment-service crowdship-service compliance-service

for %%S in (%services%) do (
    echo Installing dependencies for %%S...
    cd backend\services\%%S
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies for %%S
        exit /b 1
    )
    cd ..\..\..\
    echo %%S dependencies installed
)
echo.

REM Step 7: Verify installations
echo Step 7: Verifying installations...
echo Checking vite...
call npx vite --version
if errorlevel 1 (
    echo Vite verification failed
    exit /b 1
)

echo Checking TypeScript...
call npx tsc --version
if errorlevel 1 (
    echo TypeScript verification failed
    exit /b 1
)
echo All verifications passed
echo.

echo ========================================
echo Node.js Environment Fix Completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run start:mvp:win
echo 2. Or run individual services:
echo    - npm run dev:listing
echo    - npm run dev:cart
echo    - npm run dev:payment
echo.

endlocal
