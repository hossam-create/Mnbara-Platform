@echo off
echo Starting mnbarh MVP Platform...
echo.

echo Starting Docker services...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo Waiting for services to start...
timeout /t 10

echo.
echo Running database migrations...
cd backend\services\listing-service-node
call npm run prisma:migrate
cd ..\..\..

cd backend\services\cart-service
call npm run prisma:migrate
cd ..\..\..

cd backend\services\payment-service
call npm run prisma:migrate
cd ..\..\..

cd backend\services\crowdship-service
call npm run prisma:migrate
cd ..\..\..

cd backend\services\compliance-service
call npm run prisma:migrate
cd ..\..\..

echo.
echo ========================================
echo mnbarh MVP Platform Started!
echo ========================================
echo.
echo Services:
echo - Listing Service: http://localhost:3001
echo - Cart Service: http://localhost:3002
echo - Payment Service: http://localhost:3003
echo - Crowdship Service: http://localhost:3004
echo - Compliance Service: http://localhost:3005
echo - PostgreSQL: localhost:5432
echo - Redis: localhost:6379
echo.
echo To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo To stop: docker-compose -f docker-compose.dev.yml down
echo.

