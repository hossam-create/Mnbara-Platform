@echo off
echo ========================================
echo Setting up all database schemas
echo ========================================
echo.

echo Using Docker to run Prisma migrations...
echo.

REM Create a temporary Dockerfile for Prisma
echo FROM node:18-alpine > Dockerfile.prisma
echo WORKDIR /app >> Dockerfile.prisma
echo RUN npm install -g prisma@latest >> Dockerfile.prisma
echo CMD ["sh"] >> Dockerfile.prisma

REM Build the image
docker build -t prisma-runner -f Dockerfile.prisma .

REM Run migrations for each service
echo [1/11] Auth Service...
docker run --rm --network host -v "%CD%\services\auth-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/auth_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [2/11] User Service...
docker run --rm --network host -v "%CD%\services\user-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/listing_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [3/11] Payment Service...
docker run --rm --network host -v "%CD%\services\payment-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/payment_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [4/11] Product Service...
docker run --rm --network host -v "%CD%\services\product-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/orders_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [5/11] Wallet Service...
docker run --rm --network host -v "%CD%\services\wallet-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/wallet_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [6/11] Orders Service...
docker run --rm --network host -v "%CD%\services\orders-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/orders_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [7/11] Escrow Service...
docker run --rm --network host -v "%CD%\services\escrow-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/escrow_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [8/11] Trips Service...
docker run --rm --network host -v "%CD%\services\trips-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/trips_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [9/11] Matching Service...
docker run --rm --network host -v "%CD%\services\matching-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/matching_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [10/11] Notification Service...
docker run --rm --network host -v "%CD%\services\notification-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/notification_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

echo [11/11] Subscription Service...
docker run --rm --network host -v "%CD%\services\subscription-service:/app" -e DATABASE_URL=postgresql://mnbarh@host.docker.internal:5432/subscription_db?schema=public prisma-runner sh -c "cd /app && prisma db push --skip-generate --accept-data-loss"

REM Cleanup
del Dockerfile.prisma

echo.
echo ========================================
echo All schemas created successfully!
echo ========================================
echo.
echo Next: Update scripts\start-services-manual.bat to use 'services' folder
pause
