@echo off
echo ========================================
echo Resetting Database (Fixing Password Issue)
echo ========================================
echo.
echo ⚠️  WARNING: This will delete all data in the database!
echo This is necessary to fix the "Authentication failed" error.
echo.
echo Press Ctrl+C to cancel, or any key to continue...
pause

echo.
echo 1. Stopping containers...
docker-compose down

echo.
echo 2. Removing database volume...
docker volume rm mnbara-platform_postgres_data
docker volume prune -f

echo.
echo 3. Starting containers...
docker-compose up -d

echo.
echo 4. Waiting for database to start (10 seconds)...
timeout /t 10

echo.
echo 5. Running Seed Script...
node scripts/run-seed-direct.js

echo.
echo ========================================
echo Done!
echo ========================================
pause
