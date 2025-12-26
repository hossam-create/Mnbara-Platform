@echo off
REM ============================================
REM Owner Account Setup Script for Windows
REM This script sets up owner accounts for both dashboards
REM ============================================

echo 🚀 Setting up Owner Accounts for Mnbara Platform...
echo ============================================

REM Check if PostgreSQL is accessible
echo Checking PostgreSQL connection...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not running. Please start PostgreSQL first.
    echo Run: docker-compose up -d postgres
    pause
    exit /b 1
)

echo ✅ PostgreSQL is running

REM Run the SQL setup script
echo Creating owner accounts...
psql -h localhost -p 5432 -U postgres -d mnbara_platform -f scripts/setup-owner-accounts.sql
if %errorlevel% neq 0 (
    echo ❌ Failed to create owner accounts
    pause
    exit /b 1
)

echo.
echo ============================================
echo 🎉 Setup Complete!
echo ============================================
echo.
echo 📊 Admin Dashboard (Business Management):
echo URL: http://localhost:3000
echo Email: owner@mnbarh.com
echo Password: MnbaraOwner2026!
echo Role: SUPER_ADMIN (Full Access)
echo.
echo 🚀 System Control Dashboard (Technical):
echo URL: http://localhost:3001
echo Email: owner@mnbarh.com
echo Password: SystemControl2026!
echo Role: SYSTEM_ADMIN (L5 Clearance)
echo MFA: Required (scan QR code on first login)
echo.
echo 🔐 MFA Backup Codes (save these):
echo 123456, 789012, 345678, 901234, 567890
echo.
echo 📱 MFA Setup Instructions:
echo 1. Download Google Authenticator or Authy
echo 2. Go to http://localhost:3001 and login
echo 3. Scan the QR code that appears
echo 4. Enter the 6-digit code from your app
echo.
echo 🛡️ Security Notes:
echo - Change default passwords after first login
echo - Keep MFA backup codes in a safe place
echo - System Control dashboard has 1-hour session timeout
echo - All access attempts are logged for security
echo.
echo Ready to launch! 🚀
echo ============================================
pause