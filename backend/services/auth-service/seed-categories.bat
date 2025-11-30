@echo off
echo ========================================
echo Seeding eBay Categories to Database
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Generating Prisma Client...
if exist "node_modules\.bin\prisma.cmd" (
  call "node_modules\.bin\prisma.cmd" generate
) else (
  if exist "..\..\node_modules\.bin\prisma.cmd" (
    echo Local prisma not found, using root...
    call "..\..\node_modules\.bin\prisma.cmd" generate
  ) else (
    echo ❌ Error: Prisma binary not found!
    echo Please run 'npm install' in the root directory.
    pause
    exit /b 1
  )
)

echo.
echo Step 2: Running seed...
if exist "node_modules\.bin\ts-node.cmd" (
  call "node_modules\.bin\ts-node.cmd" prisma/seeds/ebay-categories-from-file.seed.ts
) else (
  if exist "..\..\node_modules\.bin\ts-node.cmd" (
    echo Local ts-node not found, using root...
    call "..\..\node_modules\.bin\ts-node.cmd" prisma/seeds/ebay-categories-from-file.seed.ts
  ) else (
    echo ❌ Error: ts-node binary not found!
    echo Trying direct node execution...
    call node -r ts-node/register prisma/seeds/ebay-categories-from-file.seed.ts
  )
)

echo.
echo ========================================
echo Execution Finished
echo ========================================
echo.
echo If you see errors above, please take a screenshot or copy them.
echo.
pause
