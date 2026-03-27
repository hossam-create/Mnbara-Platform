@echo off
REM Nx Cloud Setup Script for Windows
REM This script helps set up Nx Cloud for the Mnbara Platform monorepo

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Nx Cloud Setup for Mnbara Platform
echo ==========================================
echo.

REM Check if .env.local exists
if exist .env.local (
    echo [OK] .env.local file exists
) else (
    echo [INFO] Creating .env.local file...
    type nul > .env.local
    echo [OK] .env.local created
)

REM Check if NX_CLOUD_ACCESS_TOKEN is set
if "%NX_CLOUD_ACCESS_TOKEN%"=="" (
    echo.
    echo [WARNING] NX_CLOUD_ACCESS_TOKEN is not set
    echo.
    echo To set up Nx Cloud:
    echo 1. Visit https://cloud.nx.app
    echo 2. Sign up or log in with your GitHub account
    echo 3. Create a new workspace for Mnbara Platform
    echo 4. Copy your access token
    echo 5. Run: set NX_CLOUD_ACCESS_TOKEN=your_token_here
    echo    Or add to .env.local: NX_CLOUD_ACCESS_TOKEN=your_token_here
    echo.
    set /p token="Enter your Nx Cloud access token (or press Enter to skip): "
    
    if not "!token!"=="" (
        echo NX_CLOUD_ACCESS_TOKEN=!token!>> .env.local
        set NX_CLOUD_ACCESS_TOKEN=!token!
        echo [OK] Access token saved to .env.local
    ) else (
        echo [WARNING] Skipping Nx Cloud setup
        exit /b 0
    )
) else (
    echo [OK] NX_CLOUD_ACCESS_TOKEN is set
)

echo.
echo Testing Nx Cloud connection...
echo.

REM Test Nx Cloud connection
nx build @mnbara/types --dry-run 2>&1 | findstr /i "Nx Cloud" >nul
if %errorlevel% equ 0 (
    echo [OK] Nx Cloud is connected and working
) else (
    echo [WARNING] Nx Cloud connection test inconclusive
)

echo.
echo ==========================================
echo Nx Cloud Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Run: nx build @mnbara/types
echo 2. Check the output for 'Nx Cloud cache hit'
echo 3. Visit https://cloud.nx.app to view your dashboard
echo.

endlocal
