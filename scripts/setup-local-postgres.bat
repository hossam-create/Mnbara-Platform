@echo off
REM ============================================
REM Setup Local PostgreSQL for MVP Testing
REM ============================================

echo.
echo ========================================
echo Setting up PostgreSQL for Local MVP
echo ========================================
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL service...
sc query postgresql-x64-18 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running. Starting...
    sc start postgresql-x64-18
    timeout /t 5 /nobreak >nul
) else (
    echo PostgreSQL is already running!
)

echo.
echo ========================================
echo Creating User and Databases
echo ========================================
echo.
echo NOTE: You will be prompted for the postgres password
echo (The password won't show as you type - this is normal)
echo.

REM Create user mnbarh
echo [1/12] Creating user mnbarh...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE USER mnbarh WITH PASSWORD 'mnbarh123';" 2>nul
if %errorlevel% equ 0 (
    echo ✓ User created
) else (
    echo ✓ User already exists
)

REM Create databases
echo [2/12] Creating auth_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE auth_db OWNER mnbarh;" 2>nul

echo [3/12] Creating user_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE user_db OWNER mnbarh;" 2>nul

echo [4/12] Creating payment_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE payment_db OWNER mnbarh;" 2>nul

echo [5/12] Creating product_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE product_db OWNER mnbarh;" 2>nul

echo [6/12] Creating wallet_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE wallet_db OWNER mnbarh;" 2>nul

echo [7/12] Creating orders_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE orders_db OWNER mnbarh;" 2>nul

echo [8/12] Creating escrow_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE escrow_db OWNER mnbarh;" 2>nul

echo [9/12] Creating trips_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE trips_db OWNER mnbarh;" 2>nul

echo [10/12] Creating matching_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE matching_db OWNER mnbarh;" 2>nul

echo [11/12] Creating notification_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE notification_db OWNER mnbarh;" 2>nul

echo [12/12] Creating subscription_db...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE subscription_db OWNER mnbarh;" 2>nul

echo.
echo ========================================
echo Granting Privileges
echo ========================================
echo.

"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE auth_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE user_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE payment_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE product_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE wallet_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE orders_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE escrow_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE trips_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE matching_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE notification_db TO mnbarh;" 2>nul
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE subscription_db TO mnbarh;" 2>nul

echo.
echo ========================================
echo Testing Connection
echo ========================================
echo.

"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U mnbarh -d auth_db -c "SELECT 'Connection successful!' as status;"

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo User: mnbarh
echo Password: mnbarh123
echo Host: localhost:5432
echo.
echo Next steps:
echo 1. Run: scripts\run-all-migrations.bat
echo 2. Run: scripts\start-services-manual.bat
echo.
pause
