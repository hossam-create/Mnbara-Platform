@echo off
REM Nx Cloud Verification Script for Windows
REM This script verifies that Nx Cloud is properly configured

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Nx Cloud Verification
echo ==========================================
echo.

REM Check if nx.json exists
if exist nx.json (
    echo [OK] nx.json found
) else (
    echo [ERROR] nx.json not found
    exit /b 1
)

REM Check if .nxignore exists
if exist .nxignore (
    echo [OK] .nxignore found
) else (
    echo [ERROR] .nxignore not found
    exit /b 1
)

REM Check if NX_CLOUD_ACCESS_TOKEN is set
if "%NX_CLOUD_ACCESS_TOKEN%"=="" (
    echo [WARNING] NX_CLOUD_ACCESS_TOKEN not set
    echo   Set it with: set NX_CLOUD_ACCESS_TOKEN=your_token_here
) else (
    echo [OK] NX_CLOUD_ACCESS_TOKEN is set
)

REM Check if packages exist
echo.
echo Checking packages...

set packages=packages\shared-types packages\ui-components packages\utils packages\api-client packages\validation

for %%p in (%packages%) do (
    if exist %%p (
        echo [OK] %%p exists
    ) else (
        echo [ERROR] %%p not found
    )
)

REM Check nx.json configuration
echo.
echo Checking nx.json configuration...

findstr /i "cacheableOperations" nx.json >nul
if %errorlevel% equ 0 (
    echo [OK] cacheableOperations configured
) else (
    echo [ERROR] cacheableOperations not configured
)

findstr /i "targetDefaults" nx.json >nul
if %errorlevel% equ 0 (
    echo [OK] targetDefaults configured
) else (
    echo [ERROR] targetDefaults not configured
)

findstr /i "\"build\"" nx.json >nul
if %errorlevel% equ 0 (
    echo [OK] build target configured
) else (
    echo [ERROR] build target not configured
)

findstr /i "\"test\"" nx.json >nul
if %errorlevel% equ 0 (
    echo [OK] test target configured
) else (
    echo [ERROR] test target not configured
)

findstr /i "\"lint\"" nx.json >nul
if %errorlevel% equ 0 (
    echo [OK] lint target configured
) else (
    echo [ERROR] lint target not configured
)

REM Test cache functionality
echo.
echo Testing cache functionality...

where nx >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Nx CLI is installed
    
    REM Get Nx version
    for /f "tokens=*" %%i in ('nx --version') do set nx_version=%%i
    echo   Nx version: !nx_version!
) else (
    echo [ERROR] Nx CLI not found
    echo   Install with: npm install -g nx
)

REM Summary
echo.
echo ==========================================
echo Verification Complete
echo ==========================================
echo.
echo Next steps:
echo 1. Set NX_CLOUD_ACCESS_TOKEN if not already set
echo 2. Run: nx build @mnbara/shared-types
echo 3. Check output for Nx Cloud messages
echo 4. Visit https://cloud.nx.app to view dashboard
echo.

endlocal
