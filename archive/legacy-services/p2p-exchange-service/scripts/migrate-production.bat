@echo off
REM P2P Exchange Service - Production Migration Script (Windows)
REM Usage: scripts\migrate-production.bat

echo.
echo ========================================
echo P2P Exchange Service - Production Migration
echo ========================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL environment variable is not set
  exit /b 1
)

echo Database URL: %DATABASE_URL%
echo.

REM Confirm migration
set /p confirm="WARNING: This will run migrations on PRODUCTION database. Continue? (yes/no): "
if not "%confirm%"=="yes" (
  echo Migration cancelled
  exit /b 0
)

echo.
echo Step 1: Generate Prisma Client...
call npm run prisma:generate

echo.
echo Step 2: Running database migrations...
call npm run prisma:deploy

echo.
echo Step 3: Seeding initial data...
call npm run prisma:seed

echo.
echo Production migration completed successfully!
echo.
echo Next steps:
echo    1. Verify database schema
echo    2. Check seeded data
echo    3. Run smoke tests
echo    4. Deploy application
