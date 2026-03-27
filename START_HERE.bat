@echo off
REM ============================================
REM MNBARA Platform - Quick Start with Docker
REM ============================================

echo.
echo ========================================
echo MNBARA Platform - Phase 2.5 Setup
echo ========================================
echo.

echo Step 1: Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Docker is not running!
    echo.
    echo Please:
    echo 1. Open Docker Desktop
    echo 2. Wait until it says "Docker Desktop is running"
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✓ Docker is running!
echo.

echo Step 2: Starting PostgreSQL in Docker...
docker ps -a --filter name=postgres-mnbarh --format "{{.Names}}" | findstr postgres-mnbarh >nul
if %errorlevel% equ 0 (
    echo PostgreSQL container exists, starting it...
    docker start postgres-mnbarh
) else (
    echo Creating new PostgreSQL container...
    docker run -d --name postgres-mnbarh -e POSTGRES_PASSWORD=mnbarh123 -e POSTGRES_USER=mnbarh -p 5432:5432 postgres:15-alpine
)

echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Step 3: Running migrations...
call scripts\run-all-migrations.bat

echo.
echo Step 4: Starting services...
call scripts\start-services-manual.bat

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Wait 60 seconds for services to start
echo 2. Run: cd scripts ^&^& npm run seed
echo 3. Run: cd scripts ^&^& npm test
echo.
echo Database Info:
echo   Host: localhost:5432
echo   User: mnbarh
echo   Password: mnbarh123
echo.
pause
