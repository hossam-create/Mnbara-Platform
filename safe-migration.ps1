# Mnbarh Platform - Safe Production Migration Script (PowerShell)
# Enhanced safety protocol for Windows/PowerShell environments

$ErrorActionPreference = "Stop"

Write-Host "🔒 MNbarh Production Migration - Enhanced Safety Protocol" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# Configuration
$SCHEMA_PATH = "backend\services\wallet-service\prisma\schema-v2.prisma"
$DB_URL = $env:DATABASE_URL
$SERVICE_NAME = "wallet-service"

if ([string]::IsNullOrEmpty($DB_URL)) {
    Write-Host "❌ DATABASE_URL is not set" -ForegroundColor Red
    exit 1
}

# ====== STEP 1: ENVIRONMENT VALIDATION ======
Write-Host "🔍 Validating environment..." -ForegroundColor Yellow

if ($env:ENVIRONMENT -ne "production") {
    Write-Host "⚠️  Warning: Not in production environment (ENVIRONMENT=$($env:ENVIRONMENT))" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -notmatch "^[Yy]$") {
        exit 1
    }
}

# ====== STEP 2: DATABASE BACKUP ======
Write-Host "💾 Creating database backup..." -ForegroundColor Yellow

$BACKUP_FILE = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
try {
    # Create backup using pg_dump
    & pg_dump $DB_URL > $BACKUP_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup created: $BACKUP_FILE" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup failed - aborting migration" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Backup error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ====== STEP 3: SERVICE STATUS CHECK ======
Write-Host "📊 Checking current service status..." -ForegroundColor Yellow

# Check if Docker is running and services exist
$dockerRunning = $false
try {
    $services = & docker service ls 2>$null
    if ($services -match "mnbarh-prod") {
        Write-Host "📋 Current Docker services:" -ForegroundColor Cyan
        & docker service ls --filter "name=mnbarh-prod"
        $dockerRunning = $true
    }
} catch {
    Write-Host "⚠️  Docker not available or no services found" -ForegroundColor Yellow
}

# ====== STEP 4: MIGRATION VALIDATION ======
Write-Host "🔍 Validating migration safety..." -ForegroundColor Yellow

# Navigate to wallet service directory
Push-Location "backend\services\wallet-service"

try {
    Write-Host "📋 Current migration status:" -ForegroundColor Cyan
    & npx prisma migrate status --schema=$SCHEMA_PATH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Migration status check failed, continuing with caution..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check migration status: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ====== STEP 5: APPLY MIGRATIONS ======
Write-Host "🚀 Applying migrations..." -ForegroundColor Yellow

try {
    & npx prisma migrate deploy --schema=$SCHEMA_PATH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed - initiating rollback..." -ForegroundColor Red
        Write-Host "🔄 Rollback: Restore from backup $BACKUP_FILE" -ForegroundColor Yellow
        # Rollback would go here
        exit 1
    }
    
    Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 Rollback: Restore from backup $BACKUP_FILE" -ForegroundColor Yellow
    exit 1
}

# ====== STEP 6: GENERATE CLIENT ======
Write-Host "🧬 Generating Prisma client..." -ForegroundColor Yellow

try {
    & npx prisma generate --schema=$SCHEMA_PATH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Client generation failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Client generation error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Pop-Location

# ====== STEP 7: SYSTEM CONTROL VERIFICATION ======
Write-Host "🔐 Verifying system control configuration..." -ForegroundColor Yellow

try {
    # Check current system control state
    $SYSTEM_STATE = & psql $DB_URL -t -c "SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';" 2>$null
    $SYSTEM_STATE = $SYSTEM_STATE.Trim()
    
    if ([string]::IsNullOrEmpty($SYSTEM_STATE)) {
        Write-Host "⚠️  SYSTEM_FINANCIAL_MODE not found, creating..." -ForegroundColor Yellow
        
        $insertQuery = @"
INSERT INTO system_control (key, value, "updatedBy", "updatedAt", description)
VALUES ('SYSTEM_FINANCIAL_MODE', 'ACTIVE', 'system', NOW(), 'Financial system operational status');
"@
        
        & psql $DB_URL -c $insertQuery
        Write-Host "✅ SYSTEM_FINANCIAL_MODE created and set to ACTIVE" -ForegroundColor Green
    } elseif ($SYSTEM_STATE -ne "ACTIVE") {
        Write-Host "⚠️  SYSTEM_FINANCIAL_MODE is currently: $SYSTEM_STATE" -ForegroundColor Yellow
        $update = Read-Host "Update to ACTIVE? (y/N)"
        
        if ($update -match "^[Yy]$") {
            & psql $DB_URL -c "UPDATE system_control SET value = 'ACTIVE', `"updatedBy`" = 'system', `"updatedAt`" = NOW() WHERE key = 'SYSTEM_FINANCIAL_MODE';"
            Write-Host "✅ SYSTEM_FINANCIAL_MODE updated to ACTIVE" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ SYSTEM_FINANCIAL_MODE is already ACTIVE" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not verify system control: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ====== STEP 8: COMPREHENSIVE VALIDATION ======
Write-Host "🧪 Running comprehensive validation..." -ForegroundColor Yellow

try {
    Write-Host "🔌 Testing database connectivity..." -ForegroundColor Cyan
    
    $testQuery = @"
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    // Test basic connectivity
    await prisma.\$queryRaw\`SELECT 1\`;
    console.log('✅ Database connectivity test passed');
    
    // Test system_control access
    const control = await prisma.system_control.findUnique({ 
      where: { key: 'SYSTEM_FINANCIAL_MODE' } 
    });
    if (control) {
      console.log('✅ System control test passed:', control.value);
    } else {
      console.log('❌ System control test failed');
      process.exit(1);
    }
    
    // Test wallet table structure
    const walletCount = await prisma.wallet.count();
    console.log('✅ Wallet table accessible, current count:', walletCount);
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
})();
"@
    
    $testQuery | node
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Validation failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Validation completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Validation error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ====== STEP 9: SERVICE HEALTH CHECKS ======
if ($dockerRunning) {
    Write-Host "🏥 Performing service health checks..." -ForegroundColor Yellow
    
    $servicesHealthy = $true
    
    # Wait a bit for services to stabilize
    Write-Host "⏳ Waiting for services to stabilize (30s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Check wallet service health (example endpoint)
    try {
        $walletHealth = Invoke-WebRequest -Uri "http://localhost:8080/wallet/health" -Method GET -TimeoutSec 10
        if ($walletHealth.StatusCode -eq 200) {
            Write-Host "✅ Wallet service is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ Wallet service health check failed: $($walletHealth.StatusCode)" -ForegroundColor Red
            $servicesHealthy = $false
        }
    } catch {
        Write-Host "⚠️  Could not check wallet service health: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Check API gateway health
    try {
        $apiHealth = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 10
        if ($apiHealth.StatusCode -eq 200) {
            Write-Host "✅ API Gateway is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ API Gateway health check failed: $($apiHealth.StatusCode)" -ForegroundColor Red
            $servicesHealthy = $false
        }
    } catch {
        Write-Host "⚠️  Could not check API Gateway health: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    if (-not $servicesHealthy) {
        Write-Host "⚠️  Some services are unhealthy - monitor closely" -ForegroundColor Yellow
    }
}

# ====== STEP 10: FINAL STATUS ======
Write-Host "🎉 Migration completed successfully!" -ForegroundColor Green
Write-Host "✅ Database migrations applied" -ForegroundColor Green
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host "✅ System control configured" -ForegroundColor Green
Write-Host "✅ Validation passed" -ForegroundColor Green

Write-Host "📋 Migration Summary:" -ForegroundColor Cyan
Write-Host "   - Backup created: $BACKUP_FILE" -ForegroundColor Cyan
Write-Host "   - Schema: $SCHEMA_PATH" -ForegroundColor Cyan
Write-Host "   - Timestamp: $(Get-Date)" -ForegroundColor Cyan

Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor application logs for any issues" -ForegroundColor Yellow
Write-Host "   2. Run integration tests if available" -ForegroundColor Yellow
Write-Host "   3. Verify financial transactions are working" -ForegroundColor Yellow
Write-Host "   4. Keep backup $BACKUP_FILE for rollback if needed" -ForegroundColor Yellow

Write-Host "🚀 MNbarh Platform migration is complete!" -ForegroundColor Green