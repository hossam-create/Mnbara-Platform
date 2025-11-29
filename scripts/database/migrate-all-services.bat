@echo off
echo Running migrations for Auth Service...
cd services\auth-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo Running migrations for Listing Service...
cd ..\listing-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo Running migrations for Auction Service...
cd ..\auction-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo Running migrations for Payment Service...
cd ..\payment-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo Running migrations for Crowdship Service...
cd ..\crowdship-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo Running migrations for Recommendation Service...
cd ..\recommendation-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo Running migrations for Rewards Service...
cd ..\rewards-service
call npx prisma migrate dev --name init
if %errorlevel% neq 0 exit /b %errorlevel%

echo All migrations completed successfully!
