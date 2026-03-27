@echo off
echo ========================================
echo Setting up all databases using Prisma
echo ========================================
echo.

echo This will use db push to create all schemas
echo.

REM Auth Service
echo [1/10] Auth Service...
cd backend\services\auth-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/auth_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM User Service
echo [2/10] User Service...
cd backend\services\user-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/listing_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Payment Service
echo [3/10] Payment Service...
cd backend\services\payment-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/payment_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Product Service
echo [4/10] Product Service...
cd backend\services\product-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/orders_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Wallet Service
echo [5/10] Wallet Service...
cd backend\services\wallet-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/wallet_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Orders Service
echo [6/10] Orders Service...
cd backend\services\orders-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/orders_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Escrow Service
echo [7/10] Escrow Service...
cd backend\services\escrow-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/escrow_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Trips Service
echo [8/10] Trips Service...
cd backend\services\trips-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/trips_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Matching Service
echo [9/10] Matching Service...
cd backend\services\matching-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/matching_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

REM Notification Service
echo [10/10] Notification Service...
cd backend\services\notification-service
set DATABASE_URL=postgresql://mnbarh@localhost:5432/notification_db?schema=public
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate --accept-data-loss --force-reset
cd ..\..\..

echo.
echo ========================================
echo All databases set up successfully!
echo ========================================
echo.
echo Next: Run scripts\start-services-manual.bat
pause
