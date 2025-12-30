@echo off
echo ========================================
echo Database Setup Script
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Start database containers
echo 📦 Starting database containers...
docker-compose up -d postgres redis

REM Wait for databases to be ready
echo ⏳ Waiting for databases to be ready...
timeout /t 10 /nobreak >nul

REM Run migrations for each service
echo.
echo 🔄 Running database migrations...
echo.

echo [1/5] Listing Service...
cd backend\services\listing-service-node
call npx prisma migrate dev --name init
call npx prisma generate
call npx ts-node prisma/seed.ts
cd ..\..\..

echo.
echo [2/5] Payment Service...
cd backend\services\payment-service
call npx prisma migrate dev --name init
call npx prisma generate
call npx ts-node prisma/seed.ts
cd ..\..\..

echo.
echo [3/5] Cart Service...
cd backend\services\cart-service
call npx prisma migrate dev --name init
call npx prisma generate
cd ..\..\..

echo.
echo [4/5] Compliance Service...
cd backend\services\compliance-service
call npx prisma migrate dev --name init
call npx prisma generate
cd ..\..\..

echo.
echo [5/5] Crowdship Service...
cd backend\services\crowdship-service
call npx prisma migrate dev --name init
call npx prisma generate
cd ..\..\..

echo.
echo ========================================
echo ✅ Database setup complete!
echo ========================================
echo.
echo 📊 Database Status:
docker-compose ps postgres redis
echo.
echo 🎉 Ready to start services!
