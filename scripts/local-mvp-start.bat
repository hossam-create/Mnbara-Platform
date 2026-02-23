@echo off
REM 🔒 LOCAL MVP VALIDATION - Startup Script (Windows)
REM Starts all services for local testing
REM NO PRODUCTION. NO REAL STRIPE. NO PUBLIC DEPLOYMENT.

echo.
echo ========================================
echo 🔒 LOCAL MVP VALIDATION - Phase 2.5
echo ========================================
echo.
echo ⚠️  TEST MODE ONLY - NO PRODUCTION
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.local-mvp.yml down
echo.

REM Clean up old volumes (optional - comment out to preserve data)
REM echo 🧹 Cleaning up old volumes...
REM docker volume rm mnbara-platform_postgres_local_data 2>nul
REM docker volume rm mnbara-platform_redis_local_data 2>nul
REM docker volume rm mnbara-platform_rabbitmq_local_data 2>nul
REM echo.

REM Start infrastructure first
echo 🚀 Starting infrastructure (PostgreSQL, Redis, RabbitMQ)...
docker-compose -f docker-compose.local-mvp.yml up -d postgres redis rabbitmq
echo.

echo ⏳ Waiting for infrastructure to be ready (30 seconds)...
timeout /t 30 /nobreak >nul
echo.

REM Check infrastructure health
echo 🏥 Checking infrastructure health...
docker-compose -f docker-compose.local-mvp.yml ps
echo.

REM Start services
echo 🚀 Starting backend services...
docker-compose -f docker-compose.local-mvp.yml up -d auth-service user-service product-service wallet-service payment-service orders-service escrow-service trips-service matching-service notification-service subscription-service
echo.

echo ⏳ Waiting for services to be ready (30 seconds)...
timeout /t 30 /nobreak >nul
echo.

REM Check services health
echo 🏥 Checking services health...
docker-compose -f docker-compose.local-mvp.yml ps
echo.

REM Run database migrations
echo 📊 Running database migrations...
echo ⚠️  Note: Run migrations manually if needed:
echo    cd backend/services/auth-service ^&^& npx prisma migrate deploy
echo    cd backend/services/user-service ^&^& npx prisma migrate deploy
echo    cd backend/services/wallet-service ^&^& npx prisma migrate deploy
echo    cd backend/services/payment-service ^&^& npx prisma migrate deploy
echo    cd backend/services/escrow-service ^&^& npx prisma migrate deploy
echo    cd backend/services/orders-service ^&^& npx prisma migrate deploy
echo    cd backend/services/trips-service ^&^& npx prisma migrate deploy
echo    cd backend/services/matching-service ^&^& npx prisma migrate deploy
echo    cd backend/services/notification-service ^&^& npx prisma migrate deploy
echo    cd backend/services/subscription-service ^&^& npx prisma migrate deploy
echo.

REM Start frontend (optional)
echo 🌐 Starting frontend...
echo ⚠️  Note: Start frontend manually if needed:
echo    cd frontend/web-app ^&^& npm run dev
echo.

echo ========================================
echo ✅ LOCAL MVP SYSTEM STARTED
echo ========================================
echo.
echo 📊 Service URLs:
echo    - Auth Service:         http://localhost:3001
echo    - User Service:         http://localhost:3002
echo    - Payment Service:      http://localhost:3003
echo    - Product Service:      http://localhost:3004
echo    - Wallet Service:       http://localhost:3005
echo    - Orders Service:       http://localhost:3006
echo    - Escrow Service:       http://localhost:3007
echo    - Trips Service:        http://localhost:3009
echo    - Matching Service:     http://localhost:3010
echo    - Notification Service: http://localhost:3011
echo    - Subscription Service: http://localhost:3012
echo.
echo 🗄️  Infrastructure:
echo    - PostgreSQL:           localhost:5432
echo    - Redis:                localhost:6379
echo    - RabbitMQ Management:  http://localhost:15672
echo      (user: mnbarh_local, pass: local_test_password)
echo.
echo 🌐 Frontend:
echo    - Web App:              http://localhost:5173
echo.
echo 📝 Next Steps:
echo    1. Seed test data:      node scripts/local-mvp-seed-test-data.js
echo    2. Run tests:           scripts\local-mvp-test.bat
echo    3. View logs:           docker-compose -f docker-compose.local-mvp.yml logs -f
echo    4. Stop system:         docker-compose -f docker-compose.local-mvp.yml down
echo.
echo ⚠️  REMEMBER: TEST MODE ONLY - NO PRODUCTION DATA
echo.

pause
