@echo off
REM Development Environment Setup Script for Windows
REM This script sets up the development environment for the Mnbara Platform monorepo

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Mnbara Platform - Development Setup
echo ==========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js %NODE_VERSION% is installed
echo.

REM Check npm version
echo Checking npm version...
for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i
echo npm %NPM_VERSION% is installed
echo.

REM Check Nx CLI
echo Checking Nx CLI...
nx --version >nul 2>&1
if errorlevel 1 (
    echo Warning: Nx CLI not found globally. Installing...
    call npm install -g nx
)
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    exit /b 1
)
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Warning: Please update .env with your local configuration
    echo.
)

REM Create necessary directories
echo Creating necessary directories...
if not exist .nx\cache mkdir .nx\cache
if not exist logs mkdir logs
if not exist tmp mkdir tmp
echo.

REM Verify Nx workspace
echo Verifying Nx workspace...
call nx list
echo.

echo ==========================================
echo Development environment setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Update .env with your local configuration
echo 2. Run 'npm run dev' to start development servers
echo 3. Run 'npm run build' to build all packages
echo 4. Run 'npm run test' to run tests
echo.
