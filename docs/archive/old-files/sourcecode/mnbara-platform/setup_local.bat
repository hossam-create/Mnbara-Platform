@echo off
echo Starting Mnbara Platform Local Setup...

echo [1/2] Building and Starting Services...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo Docker Compose failed. Please check logs.
    exit /b %errorlevel%
)

echo [2/2] Running Database Migrations...
call migrate_docker.bat

echo Setup Complete! Access the services at:
echo Auth Service: http://localhost:3001
echo Listing Service: http://localhost:3002
echo Auction Service: http://localhost:3003
echo Payment Service: http://localhost:3004
echo Crowdship Service: http://localhost:3005
echo Notification Service: http://localhost:3006
echo Recommendation Service: http://localhost:3007
echo Rewards Service: http://localhost:3008
