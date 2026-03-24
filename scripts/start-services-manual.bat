@echo off
REM ============================================
REM Start All Backend Services Manually
REM ============================================

echo.
echo ========================================
echo Starting Backend Services Manually
echo ========================================
echo.

REM Set environment variables
set NODE_ENV=development
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set POSTGRES_USER=mnbarh_local
set POSTGRES_PASSWORD=local_test_password
set REDIS_URL=redis://localhost:6379
set RABBITMQ_URL=amqp://mnbarh_local:local_test_password@localhost:5672
set JWT_SECRET=local-test-jwt-secret-key-not-for-production
set JWT_EXPIRES_IN=7d

echo Starting services in separate windows...
echo.

REM Auth Service (Port 3001)
start "Auth Service" cmd /k "cd services\auth-service && set PORT=3001 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/auth_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM User Service (Port 3002)
start "User Service" cmd /k "cd services\user-service && set PORT=3002 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/user_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Payment Service (Port 3003)
start "Payment Service" cmd /k "cd services\payment-service && set PORT=3003 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/payment_db?schema=public && set STRIPE_SECRET_KEY=sk_test_dummy && npm run dev"

timeout /t 3 /nobreak >nul

REM Product Service (Port 3004)
start "Product Service" cmd /k "cd services\product-service && set PORT=3004 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/product_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Wallet Service (Port 3005)
start "Wallet Service" cmd /k "cd services\wallet-service && set PORT=3005 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/wallet_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Orders Service (Port 3006)
start "Orders Service" cmd /k "cd services\orders-service && set PORT=3006 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/orders_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Escrow Service (Port 3007)
start "Escrow Service" cmd /k "cd services\escrow-service && set PORT=3007 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/escrow_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Trips Service (Port 3009)
start "Trips Service" cmd /k "cd services\trips-service && set PORT=3009 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/trips_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Matching Service (Port 3010)
start "Matching Service" cmd /k "cd services\matching-service && set PORT=3010 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/matching_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Notification Service (Port 3011)
start "Notification Service" cmd /k "cd services\notification-service && set PORT=3011 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/notification_db?schema=public && npm run dev"

timeout /t 3 /nobreak >nul

REM Subscription Service (Port 3012)
start "Subscription Service" cmd /k "cd services\subscription-service && set PORT=3012 && set DATABASE_URL=postgresql://mnbarh_local:local_test_password@localhost:5432/subscription_db?schema=public && npm run dev"

echo.
echo ========================================
echo All services started in separate windows
echo ========================================
echo.
echo Wait 30-60 seconds for all services to initialize
echo Then run: cd scripts ^&^& npm run seed
echo.
pause
