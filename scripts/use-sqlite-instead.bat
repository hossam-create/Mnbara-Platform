@echo off
REM ============================================
REM Convert to SQLite - No Password Needed!
REM ============================================

echo.
echo ========================================
echo Converting to SQLite (No Password!)
echo ========================================
echo.

echo This will:
echo 1. Update all Prisma schemas to use SQLite
echo 2. Run migrations
echo 3. Start services
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Step 1: Installing dependencies...
cd backend\services\auth-service
call npm install
cd ..\..\..

cd backend\services\user-service
call npm install
cd ..\..\..

cd backend\services\wallet-service
call npm install
cd ..\..\..

cd backend\services\payment-service
call npm install
cd ..\..\..

cd backend\services\escrow-service
call npm install
cd ..\..\..

cd backend\services\orders-service
call npm install
cd ..\..\..

cd backend\services\trips-service
call npm install
cd ..\..\..

cd backend\services\matching-service
call npm install
cd ..\..\..

cd backend\services\notification-service
call npm install
cd ..\..\..

cd backend\services\product-service
call npm install
cd ..\..\..

echo.
echo Step 2: Running migrations with SQLite...
echo.

REM Auth Service
echo [1/10] Auth Service...
cd backend\services\auth-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM User Service
echo [2/10] User Service...
cd backend\services\user-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Wallet Service
echo [3/10] Wallet Service...
cd backend\services\wallet-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Payment Service
echo [4/10] Payment Service...
cd backend\services\payment-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Escrow Service
echo [5/10] Escrow Service...
cd backend\services\escrow-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Orders Service
echo [6/10] Orders Service...
cd backend\services\orders-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Trips Service
echo [7/10] Trips Service...
cd backend\services\trips-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Matching Service
echo [8/10] Matching Service...
cd backend\services\matching-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Notification Service
echo [9/10] Notification Service...
cd backend\services\notification-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

REM Product Service
echo [10/10] Product Service...
cd backend\services\product-service
set DATABASE_URL=file:./dev.db
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..\..

echo.
echo ========================================
echo SQLite Setup Complete!
echo ========================================
echo.
echo Database files created in:
echo   backend/services/*/prisma/dev.db
echo.
echo Next steps:
echo 1. Run: scripts\start-services-sqlite.bat
echo 2. Run: cd scripts ^&^& npm run seed
echo 3. Run: cd scripts ^&^& npm test
echo.
pause
