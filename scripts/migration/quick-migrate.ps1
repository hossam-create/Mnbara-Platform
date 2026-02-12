# Quick Migration Script for MNbarh Platform (PowerShell)
# Simplified version for immediate execution

$ErrorActionPreference = "Stop"

Write-Host "🔒 MNbarh Quick Migration Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Configuration
$SCHEMA_PATH = "backend\services\wallet-service\prisma\schema-v2.prisma"
$DB_URL = $env:DATABASE_URL

if ([string]::IsNullOrEmpty($DB_URL)) {
    Write-Host "❌ DATABASE_URL is not set" -ForegroundColor Red
    Write-Host "💡 Set it with: `$env:DATABASE_URL = 'postgresql://user:password@host:5432/database'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Using schema: $SCHEMA_PATH" -ForegroundColor Cyan
Write-Host "🔗 Database: $($DB_URL -replace '://[^@]*@', '://*****@')" -ForegroundColor Cyan

# Navigate to wallet service directory
Push-Location "backend\services\wallet-service"

try {
    Write-Host "🚀 Starting migration process..." -ForegroundColor Yellow
    
    # Step 1: Apply migrations
    Write-Host "📊 Applying database migrations..." -ForegroundColor Yellow
    & npx prisma migrate deploy --schema=$SCHEMA_PATH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
    
    # Step 2: Generate Prisma client
    Write-Host "🧬 Generating Prisma client..." -ForegroundColor Yellow
    & npx prisma generate --schema=$SCHEMA_PATH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Client generation failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
    
    # Step 3: Verify system control
    Write-Host "🔐 Verifying system control..." -ForegroundColor Yellow
    
    $checkQuery = "SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';"
    $result = & psql $DB_URL -t -c $checkQuery 2>$null
    
    if ([string]::IsNullOrEmpty($result.Trim())) {
        Write-Host "⚠️  SYSTEM_FINANCIAL_MODE not found, creating..." -ForegroundColor Yellow
        $insertQuery = @"
INSERT INTO system_control (key, value, "updatedBy", "updatedAt") 
VALUES ('SYSTEM_FINANCIAL_MODE', 'ACTIVE', 'system', NOW()) 
ON CONFLICT (key) DO NOTHING;
"@
        & psql $DB_URL -c $insertQuery
        Write-Host "✅ SYSTEM_FINANCIAL_MODE created and set to ACTIVE" -ForegroundColor Green
    } else {
        Write-Host "✅ SYSTEM_FINANCIAL_MODE is currently: $($result.Trim())" -ForegroundColor Green
        
        # Update to ACTIVE if needed
        if ($result.Trim() -ne "ACTIVE") {
            $update = Read-Host "Update to ACTIVE? (y/N)"
            if ($update -match "^[Yy]$") {
                & psql $DB_URL -c "UPDATE system_control SET value = 'ACTIVE', `"updatedBy`" = 'system', `"updatedAt`" = NOW() WHERE key = 'SYSTEM_FINANCIAL_MODE';"
                Write-Host "✅ SYSTEM_FINANCIAL_MODE updated to ACTIVE" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "🎉 Migration completed successfully!" -ForegroundColor Green
    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "   - Database migrations: Applied" -ForegroundColor Cyan
    Write-Host "   - Prisma client: Generated" -ForegroundColor Cyan
    Write-Host "   - System control: Verified" -ForegroundColor Cyan
    Write-Host "   - Status: READY FOR PRODUCTION" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Migration error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure PostgreSQL client tools (psql) are installed and accessible" -ForegroundColor Yellow
    exit 1
} finally {
    Pop-Location
}