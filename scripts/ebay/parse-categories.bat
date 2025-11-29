@echo off
echo ========================================
echo eBay Categories Parser
echo ========================================
echo.
echo Converting ebay catogery.txt to seed file...
echo.

cd /d "%~dp0.."
call npx ts-node scripts/parse-ebay-categories-file.ts

echo.
echo ========================================
echo Done!
echo ========================================
pause
