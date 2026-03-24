@echo off
REM ============================================
REM Start All Backend Services with SQLite
REM ============================================

echo.
echo ========================================
echo Starting Backend Services (SQLite)
echo ========================================
echo.

REM Set environment variables
set NODE_ENV=development
set REDIS_URL=redis://localhost:6379
set RABBITMQ_URL=amqp://guest:guest@localhost:5672
set JWT_SECRET=local_jwt_secret_key_for_testing_only
set JWT_EXPIRES_IN=7d

echo Starting services in separate windows...
echo.

REM Auth Service (Port 3001)
start "Auth Service" cmd /k "cd backend\services\auth-service && set PORT=3001 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM User Service (Port 3002)
start "User Service" cmd /k "cd backend\services\user-service && set PORT=3002 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Payment Service (Port 3003)
start "Payment Service" cmd /k "cd backend\services\payment-service && set PORT=3003 && set DATABASE_URL=file:./prisma/dev.db && set STRIPE_SECRET_KEY=sk_test_dummy && npm run dev"

timeout /t 3 /nobreak >nul

REM Product Service (Port 3004)
start "Product Service" cmd /k "cd backend\services\product-service && set PORT=3004 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Wallet Service (Port 3005)
start "Wallet Service" cmd /k "cd backend\services\wallet-service && set PORT=3005 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Orders Service (Port 3006)
start "Orders Service" cmd /k "cd backend\services\orders-service && set PORT=3006 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Escrow Service (Port 3007)
start "Escrow Service" cmd /k "cd backend\services\escrow-service && set PORT=3007 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Trips Service (Port 3009)
start "Trips Service" cmd /k "cd backend\services\trips-service && set PORT=3009 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Matching Service (Port 3010)
start "Matching Service" cmd /k "cd backend\services\matching-service && set PORT=3010 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Notification Service (Port 3011)
start "Notification Service" cmd /k "cd backend\services\notification-service && set PORT=3011 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

timeout /t 3 /nobreak >nul

REM Subscription Service (Port 3012)
start "Subscription Service" cmd /k "cd backend\services\subscription-service && set PORT=3012 && set DATABASE_URL=file:./prisma/dev.db && npm run dev"

echo.
echo ========================================
echo All services started with SQLite!
echo ========================================
echo.
echo Wait 30-60 seconds for all services to initialize
echo Then run: cd scripts ^&^& npm run seed
echo.
pause
