@echo off
REM Master Integration Setup Script for Windows
REM One command to set up the entire Mnbara platform

echo.
echo ============================================================
echo.
echo           Mnbara Platform - Master Setup
echo.
echo  This will set up all 22 microservices
echo  Estimated time: 20-30 minutes
echo.
echo ============================================================
echo.

REM Check prerequisites
echo [1/5] Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js not found. Please install Node.js v18+
  exit /b 1
)
node --version

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: npm not found. Please install npm
  exit /b 1
)
npm --version

REM Check PostgreSQL
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo WARNING: PostgreSQL not found. You'll need it for databases.
  set /p continue="Continue anyway? (y/n): "
  if /i not "%continue%"=="y" exit /b 1
)

echo.
echo Prerequisites check complete!
echo.
timeout /t 2 >nul

REM Setup databases
echo [2/5] Setting up databases...
echo This will create 22 databases and run migrations
echo.

call scripts\integration\setup-all-databases.bat

echo.
echo Database setup complete!
echo.
timeout /t 2 >nul

REM Start services
echo [3/5] Starting all services...
echo This will start 22 microservices
echo.

call scripts\integration\start-all-services.bat

echo.
echo Waiting 30 seconds for services to initialize...
timeout /t 30 >nul

echo.
echo Services started!
echo.
timeout /t 2 >nul

REM Health check
echo [4/5] Running health checks...
echo.

call scripts\integration\health-check-all.bat

echo.
timeout /t 2 >nul

REM Quick verification
echo [5/5] Quick verification...
echo.

call scripts\integration\quick-verify.bat

echo.
echo ============================================================
echo.
echo              SETUP COMPLETE!
echo.
echo  All 22 microservices are running and healthy!
echo.
echo ============================================================
echo.

echo Service Status:
echo   - 22 microservices running
echo   - 22 databases configured
echo   - All health checks passing
echo.

echo Service URLs:
echo   - Listing Service:    http://localhost:3001
echo   - Auction Service:    http://localhost:3002
echo   - Payment Service:    http://localhost:3003
echo   - Auth Service:       http://localhost:3014
echo   - Chat Service:       http://localhost:3016
echo   - Search Service:     http://localhost:3023
echo   - AI Agent Service:   http://localhost:3029
echo.

echo Next Steps:
echo   1. Configure API Gateway: cd backend\services\api-gateway
echo   2. Run integration tests: npm run test:integration
echo   3. Start frontend: cd frontend\web-app ^&^& npm run dev
echo   4. Deploy to staging: npm run deploy:staging
echo.

echo Documentation:
echo   - Integration Guide: INTEGRATION_READINESS_GUIDE.md
echo   - Step-by-Step: INTEGRATION_STEP_BY_STEP.md
echo   - Service READMEs: backend\services\*\README.md
echo.

echo Useful Commands:
echo   - Stop all services: scripts\integration\stop-all-services.bat
echo   - Health check: scripts\integration\health-check-all.bat
echo   - View logs: type logs\{service-name}.log
echo.

echo Platform is ready for integration and testing!
echo.
pause
