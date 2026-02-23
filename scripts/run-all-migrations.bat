@echo off
REM ============================================
REM Run Database Migrations for All Services
REM ============================================

echo.
echo ========================================
echo Running Database Migrations
echo ========================================
echo.

REM Auth Service
echo [1/10] Auth Service...
cd backend\services\auth-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/auth_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Auth Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM User Service
echo [2/10] User Service...
cd backend\services\user-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/user_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: User Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Payment Service
echo [3/10] Payment Service...
cd backend\services\payment-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/payment_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Payment Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Product Service
echo [4/10] Product Service...
cd backend\services\product-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/product_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Product Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Wallet Service
echo [5/10] Wallet Service...
cd backend\services\wallet-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/wallet_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Wallet Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Orders Service
echo [6/10] Orders Service...
cd backend\services\orders-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/orders_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Orders Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Escrow Service
echo [7/10] Escrow Service...
cd backend\services\escrow-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/escrow_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Escrow Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Trips Service
echo [8/10] Trips Service...
cd backend\services\trips-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/trips_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Trips Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Matching Service
echo [9/10] Matching Service...
cd backend\services\matching-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/matching_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Matching Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Notification Service
echo [10/10] Notification Service...
cd backend\services\notification-service
set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/notification_db?schema=public
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Notification Service migration failed
    cd ..\..\..
    pause
    exit /b 1
)
cd ..\..\..

REM Subscription Service (if exists)
if exist backend\services\subscription-service (
    echo [11/10] Subscription Service...
    cd backend\services\subscription-service
    set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/subscription_db?schema=public
    call npx prisma migrate deploy
    cd ..\..\..
)

echo.
echo ========================================
echo All migrations completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Run: scripts\start-services-manual.bat
echo 2. Wait 60 seconds for services to start
echo 3. Run: cd scripts ^&^& npm run seed
echo.
pause
