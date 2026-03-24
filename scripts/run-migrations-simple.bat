@echo off
echo ========================================
echo Running Prisma Migrations
echo ========================================
echo.

set DB_PASS=mnbarh_dev_password

echo [1/10] Auth Service...
cd backend\services\auth-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/auth_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Auth Service && pause && exit /b 1)
cd ..\..\..

echo [2/10] User Service...
cd backend\services\user-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/listing_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: User Service && pause && exit /b 1)
cd ..\..\..

echo [3/10] Payment Service...
cd backend\services\payment-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/payment_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Payment Service && pause && exit /b 1)
cd ..\..\..

echo [4/10] Product Service...
cd backend\services\product-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/orders_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Product Service && pause && exit /b 1)
cd ..\..\..

echo [5/10] Wallet Service...
cd backend\services\wallet-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/wallet_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Wallet Service && pause && exit /b 1)
cd ..\..\..

echo [6/10] Orders Service...
cd backend\services\orders-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/orders_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Orders Service && pause && exit /b 1)
cd ..\..\..

echo [7/10] Escrow Service...
cd backend\services\escrow-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/escrow_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Escrow Service && pause && exit /b 1)
cd ..\..\..

echo [8/10] Trips Service...
cd backend\services\trips-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/trips_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Trips Service && pause && exit /b 1)
cd ..\..\..

echo [9/10] Matching Service...
cd backend\services\matching-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/matching_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Matching Service && pause && exit /b 1)
cd ..\..\..

echo [10/10] Notification Service...
cd backend\services\notification-service
set DATABASE_URL=postgresql://mnbarh:%DB_PASS%@localhost:5432/notification_db?schema=public
call npx prisma migrate deploy
if errorlevel 1 (echo FAILED: Notification Service && pause && exit /b 1)
cd ..\..\..

echo.
echo ========================================
echo All migrations completed successfully!
echo ========================================
echo.
echo Next: Run scripts\start-services-manual.bat
pause
