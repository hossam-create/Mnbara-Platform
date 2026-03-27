@echo off
echo ===================================================
echo     mnbarh PLATFORM - PRODUCTION LAUNCHER ًںڑ€
echo ===================================================
echo.
echo [1/3] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is NOT running. Please start Docker Desktop and try again.
    pause
    exit /b
)
echo [OK] Docker is online.

echo.
echo [2/3] Building and Starting Services...
echo      (This may take a few minutes for the first run)
docker-compose up --build -d

echo.
echo [3/3] Platform is Launching...
echo      - Backend Services: Starting...
echo      - Databases: Starting...
echo.
echo ===================================================
echo    âœ… SYSTEM DEPLOYMENT INITIATED
echo ===================================================
echo.
echo Useful Commands:
echo  - View Logs:    docker-compose logs -f
echo  - Stop System:  docker-compose down
echo.
pause

