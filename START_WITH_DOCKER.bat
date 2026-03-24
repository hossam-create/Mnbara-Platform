@echo off
echo ========================================
echo Starting MVP System with Docker Compose
echo ========================================
echo.

echo This will start all services in Docker containers
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/3] Starting all services...
docker-compose -f docker-compose.local-mvp.yml up -d

echo.
echo [2/3] Waiting for services to initialize (30 seconds)...
timeout /t 30 /nobreak

echo.
echo [3/3] Services are ready!
echo.

echo ========================================
echo System is running!
echo ========================================
echo.

echo Next steps:
echo 1. Seed test data: cd scripts ^&^& npm run seed
echo 2. Run tests: cd scripts ^&^& npm test
echo.

echo To stop all services: docker-compose -f docker-compose.local-mvp.yml down
echo.

pause
