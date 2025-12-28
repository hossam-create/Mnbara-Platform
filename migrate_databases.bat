@echo off
echo ===================================================
echo     MNBARA DATABASE MIGRATOR 🛠️
echo ===================================================
echo.
echo This script ensures all database schemas are up to date.
echo It requires Node.js and dependencies to be installed locally
echo OR it can be run inside containers.
echo.
echo For this Windows environment, we will assume local execution via npx.
echo.

cd backend/services/auth-service
echo [1/6] Migrating Auth Service...
call npx prisma db push --accept-data-loss
cd ../../../

cd backend/services/wallet-service
echo [2/6] Migrating Wallet Service...
call npx prisma db push --accept-data-loss
cd ../../../

cd backend/services/orders-service
echo [3/6] Migrating Orders Service...
call npx prisma db push --accept-data-loss
cd ../../../

cd backend/services/listing-service
echo [4/6] Migrating Listing Service...
call npx prisma db push --accept-data-loss
cd ../../../

cd backend/services/settlement-service
echo [5/6] Migrating Settlement Service...
call npx prisma db push --accept-data-loss
cd ../../../

cd backend/services/crowdship-service
echo [6/6] Migrating Crowdship Service...
call npx prisma db push --accept-data-loss
cd ../../../

cd backend/services/card-service
echo [7/7] Migrating Card Service (New)...
call npx prisma db push --accept-data-loss
cd ../../../

echo.
echo ===================================================
echo    ✅ ALL DATABASES SYNCHRONIZED
echo ===================================================
pause
