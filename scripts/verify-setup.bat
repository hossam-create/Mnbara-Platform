@echo off
REM Development Environment Verification Script for Windows

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Mnbara Platform - Setup Verification
echo ==========================================
echo.

set ERRORS=0
set WARNINGS=0

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found
    set /a ERRORS=!ERRORS!+1
) else (
    for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
    echo OK: !NODE_VERSION!
)

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: npm not found
    set /a ERRORS=!ERRORS!+1
) else (
    for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo OK: npm !NPM_VERSION!
)

REM Check Nx
echo Checking Nx...
nx --version >nul 2>&1
if errorlevel 1 (
    echo Warning: Nx not found globally
    set /a WARNINGS=!WARNINGS!+1
) else (
    for /f "tokens=1" %%i in ('nx --version') do set NX_VERSION=%%i
    echo OK: Nx !NX_VERSION!
)

REM Check Git
echo Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git not found
    set /a ERRORS=!ERRORS!+1
) else (
    echo OK: Git installed
)

REM Check node_modules
echo.
echo Checking dependencies...
if exist "node_modules" (
    echo OK: node_modules directory exists
) else (
    echo Warning: node_modules directory not found
    set /a WARNINGS=!WARNINGS!+1
)

REM Check .env file
echo.
echo Checking configuration...
if exist ".env" (
    echo OK: .env file exists
) else (
    if exist ".env.example" (
        echo Warning: .env file not found
        set /a WARNINGS=!WARNINGS!+1
    ) else (
        echo Error: .env.example not found
        set /a ERRORS=!ERRORS!+1
    )
)

REM Check nx.json
echo Checking Nx configuration...
if exist "nx.json" (
    echo OK: nx.json exists
) else (
    echo Warning: nx.json not found
    set /a WARNINGS=!WARNINGS!+1
)

REM Check tsconfig.json
echo Checking TypeScript configuration...
if exist "tsconfig.json" (
    echo OK: tsconfig.json exists
) else (
    echo Error: tsconfig.json not found
    set /a ERRORS=!ERRORS!+1
)

REM Check package.json
echo Checking package.json...
if exist "package.json" (
    echo OK: package.json exists
) else (
    echo Error: package.json not found
    set /a ERRORS=!ERRORS!+1
)

REM Check directory structure
echo.
echo Checking directory structure...
for %%d in (apps services packages infrastructure docs scripts) do (
    if exist "%%d" (
        echo OK: %%d\ directory exists
    ) else (
        echo Warning: %%d\ directory not found
        set /a WARNINGS=!WARNINGS!+1
    )
)

REM Check VS Code configuration
echo.
echo Checking VS Code configuration...
if exist ".vscode" (
    echo OK: .vscode directory exists
    if exist ".vscode\settings.json" (
        echo OK: .vscode\settings.json exists
    ) else (
        echo Warning: .vscode\settings.json not found
        set /a WARNINGS=!WARNINGS!+1
    )
) else (
    echo Warning: .vscode directory not found
    set /a WARNINGS=!WARNINGS!+1
)

REM Summary
echo.
echo ==========================================
if !ERRORS! equ 0 (
    if !WARNINGS! equ 0 (
        echo All checks passed!
        echo ==========================================
        echo.
        echo Your development environment is ready!
        echo Next steps:
        echo 1. Run 'npm run build' to build all packages
        echo 2. Run 'npm run test' to run tests
        echo 3. Run 'npm run dev' to start development servers
        exit /b 0
    ) else (
        echo Setup complete with !WARNINGS! warning(s)
        echo ==========================================
        echo.
        echo Please address the warnings above before starting development.
        exit /b 0
    )
) else (
    echo Setup failed with !ERRORS! error(s) and !WARNINGS! warning(s)
    echo ==========================================
    echo.
    echo Please fix the errors above and run this script again.
    exit /b 1
)
