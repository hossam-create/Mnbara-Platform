@echo off
REM P2P Exchange Service - Staging Deployment Script (Windows)
REM This script deploys the p2p-exchange-service to staging environment

setlocal enabledelayedexpansion

echo ==========================================
echo P2P Exchange Service - Staging Deployment
echo ==========================================
echo.

REM Configuration
set SERVICE_NAME=p2p-exchange-service
set STAGING_ENV=staging
set DOCKER_IMAGE=mnbarh/%SERVICE_NAME%:staging
set CONTAINER_NAME=%SERVICE_NAME%-staging

REM Check prerequisites
echo [INFO] Checking prerequisites...

docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed
    exit /b 1
)

if not exist ".env.staging" (
    echo [ERROR] .env.staging file not found
    exit /b 1
)

echo [INFO] Prerequisites check passed

REM Build Docker image
echo [INFO] Building Docker image...
docker build -t %DOCKER_IMAGE% .
if errorlevel 1 (
    echo [ERROR] Docker build failed
    exit /b 1
)
echo [INFO] Docker image built successfully

REM Stop existing container
echo [INFO] Stopping existing container (if any)...
docker stop %CONTAINER_NAME% 2>nul
docker rm %CONTAINER_NAME% 2>nul
echo [INFO] Existing container stopped

REM Run database migrations
echo [INFO] Running database migrations...
call npm run prisma:deploy
if errorlevel 1 (
    echo [ERROR] Database migrations failed
    exit /b 1
)
echo [INFO] Database migrations completed

REM Seed database
echo [INFO] Seeding database...
call npm run prisma:seed
if errorlevel 1 (
    echo [ERROR] Database seeding failed
    exit /b 1
)
echo [INFO] Database seeded successfully

REM Start service
echo [INFO] Starting service...
docker run -d ^
    --name %CONTAINER_NAME% ^
    --env-file .env.staging ^
    -p 3005:3005 ^
    --network mnbarh-network ^
    --restart unless-stopped ^
    %DOCKER_IMAGE%

if errorlevel 1 (
    echo [ERROR] Failed to start service
    exit /b 1
)
echo [INFO] Service started

REM Wait for health
echo [INFO] Waiting for service to be healthy...
set MAX_ATTEMPTS=30
set ATTEMPT=0

:health_check_loop
if %ATTEMPT% geq %MAX_ATTEMPTS% (
    echo [ERROR] Service failed to become healthy
    exit /b 1
)

curl -f http://localhost:3005/health >nul 2>&1
if errorlevel 1 (
    set /a ATTEMPT+=1
    timeout /t 2 /nobreak >nul
    goto health_check_loop
)

echo [INFO] Service is healthy!

REM Verify deployment
echo [INFO] Verifying deployment...
curl -s http://localhost:3005/health
echo.

curl -f http://localhost:3005/metrics >nul 2>&1
if errorlevel 1 (
    echo [WARN] Metrics endpoint is not accessible
) else (
    echo [INFO] Metrics endpoint is accessible
)

echo [INFO] Recent logs:
docker logs --tail 20 %CONTAINER_NAME%

REM Run smoke tests
echo [INFO] Running smoke tests...

curl -f http://localhost:3005/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Health check failed
    exit /b 1
)
echo [INFO] Health check passed

curl -f http://localhost:3005/metrics >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Metrics endpoint failed
    exit /b 1
)
echo [INFO] Metrics endpoint passed

echo [INFO] All smoke tests passed!

echo.
echo ==========================================
echo Deployment completed successfully!
echo ==========================================
echo.
echo Service URL: http://localhost:3005
echo Health Check: http://localhost:3005/health
echo Metrics: http://localhost:3005/metrics
echo.
echo Next steps:
echo 1. Monitor logs: docker logs -f %CONTAINER_NAME%
echo 2. Check metrics in Grafana
echo 3. Run integration tests
echo 4. Invite pilot users
echo.

endlocal
