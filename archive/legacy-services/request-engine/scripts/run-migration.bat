@echo off
REM Request Engine - Database Migration Script (Windows)
REM Runs the payment fields migration

echo =========================================
echo Request Engine - Payment Fields Migration
echo =========================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL environment variable is not set
  echo Please set it to your PostgreSQL connection string
  echo Example: set DATABASE_URL=postgresql://user:password@localhost:5432/mnbara_requests
  exit /b 1
)

echo Database URL: %DATABASE_URL%
echo.

REM Run migration
echo Running migration: 002_add_payment_fields.sql
echo.

psql "%DATABASE_URL%" -f migrations/002_add_payment_fields.sql

echo.
echo =========================================
echo Migration completed successfully!
echo =========================================
echo.
echo New fields added to requests table:
echo   - payment_intent_id
echo   - payment_client_secret
echo   - payment_amount
echo   - payment_platform_fee
echo   - payment_total_amount
echo   - payment_status
echo   - escrow_status
echo   - escrow_created_at
echo   - escrow_released_at
echo   - escrow_refunded_at
echo.
echo Indexes created:
echo   - idx_requests_payment_intent_id
echo   - idx_requests_payment_status
echo   - idx_requests_escrow_status
echo.
