@echo off
REM Setup All Databases for Mnbara Platform (Windows)
REM Run this script to create and migrate all service databases

setlocal enabledelayedexpansion

echo Setting up all databases for Mnbara Platform...
echo.

set BASE_DIR=backend\services
set /a total=0
set /a current=0

REM Count services
for /d %%s in (%BASE_DIR%\*) do set /a total+=1

REM Setup each service
for /d %%s in (%BASE_DIR%\*) do (
  set /a current+=1
  set service=%%~nxs
  
  echo.
  echo [!current!/%total%] Setting up !service!...
  
  if exist "%%s\prisma\schema.prisma" (
    cd %%s
    
    REM Install dependencies if needed
    if not exist "node_modules" (
      echo   Installing dependencies...
      call npm install --silent
    )
    
    REM Generate Prisma client
    echo   Generating Prisma client...
    call npx prisma generate
    
    REM Run migrations
    if exist "prisma\migrations" (
      echo   Running migrations...
      call npx prisma migrate deploy
    )
    
    echo   Setup complete for !service!
    
    cd ..\..\..\..
  ) else (
    echo   No Prisma schema found, skipping...
  )
)

echo.
echo All databases setup complete!
echo.
echo Next steps:
echo 1. Verify connections: npm run db:test
echo 2. Seed data: npm run seed
echo 3. Start services: npm run dev:all
echo.
