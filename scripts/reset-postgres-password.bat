@echo off
REM ============================================
REM Reset PostgreSQL Password
REM ============================================

echo.
echo ========================================
echo Resetting PostgreSQL Password
echo ========================================
echo.

echo Step 1: Stopping PostgreSQL service...
sc stop postgresql-x64-18
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Finding PostgreSQL config file...
set PG_DATA=C:\Program Files\PostgreSQL\18\data
set PG_HBA=%PG_DATA%\pg_hba.conf
set PG_HBA_BACKUP=%PG_DATA%\pg_hba.conf.backup

echo Config file: %PG_HBA%

echo.
echo Step 3: Backing up pg_hba.conf...
copy "%PG_HBA%" "%PG_HBA_BACKUP%"

echo.
echo Step 4: Modifying pg_hba.conf to allow trust authentication...
echo # Temporary trust authentication > "%PG_HBA%.temp"
echo host    all             all             127.0.0.1/32            trust >> "%PG_HBA%.temp"
echo host    all             all             ::1/128                 trust >> "%PG_HBA%.temp"
copy /Y "%PG_HBA%.temp" "%PG_HBA%"
del "%PG_HBA%.temp"

echo.
echo Step 5: Starting PostgreSQL service...
sc start postgresql-x64-18
timeout /t 5 /nobreak >nul

echo.
echo Step 6: Changing postgres password to 'postgres123'...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres123';"

echo.
echo Step 7: Restoring original pg_hba.conf...
copy /Y "%PG_HBA_BACKUP%" "%PG_HBA%"

echo.
echo Step 8: Restarting PostgreSQL service...
sc stop postgresql-x64-18
timeout /t 3 /nobreak >nul
sc start postgresql-x64-18
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Password Reset Complete!
echo ========================================
echo.
echo New postgres password: postgres123
echo.
echo Now you can run:
echo   scripts\setup-local-postgres.bat
echo.
pause
