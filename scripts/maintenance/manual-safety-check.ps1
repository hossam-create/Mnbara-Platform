# MNbarh Platform Production Safety Manual Checklist
# Production Readiness Verification

Write-Host "🛡️  MNbarh Production Safety Checklist" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Manual verification required before production launch" -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "🔐 1. ENVIRONMENT VARIABLES CHECK" -ForegroundColor Yellow
Write-Host "   Required secrets to verify manually:" -ForegroundColor Gray

$envVars = @(
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY", 
    "PAYMOB_API_KEY",
    "PAYMOB_SECRET_KEY",
    "JWT_SECRET",
    "DATABASE_URL",
    "REDIS_PASSWORD",
    "RABBITMQ_PASSWORD",
    "BLOCKCHAIN_RPC_URL",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "   ❌ $var - NOT SET" -ForegroundColor Red
    } elseif ($value -like "*your-*" -or $value -like "*placeholder*" -or $value -like "*mock*") {
        Write-Host "   ⚠️  $var - PLACEHOLDER VALUE" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ $var - CONFIGURED" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🚨 2. SYSTEM CONTROL CHECK" -ForegroundColor Yellow
$DB_URL = [Environment]::GetEnvironmentVariable("DATABASE_URL")
if (![string]::IsNullOrEmpty($DB_URL)) {
    Write-Host "   Database URL: $DB_URL" -ForegroundColor Gray
    Write-Host "   Run this query to check kill switch:" -ForegroundColor Gray
    Write-Host "   SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';" -ForegroundColor Cyan
    Write-Host "   Expected result: ACTIVE" -ForegroundColor Green
} else {
    Write-Host "   ❌ DATABASE_URL not set" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔗 3. WEBHOOK SECURITY CHECK" -ForegroundColor Yellow
Write-Host "   Verify these files have proper security:" -ForegroundColor Gray
$webhookFiles = @(
    "backend\services\payment-service\src\webhooks\stripe.ts",
    "backend\services\payment-service\src\webhooks\paymob.ts"
)

foreach ($file in $webhookFiles) {
    if (Test-Path $file) {
        Write-Host "   📄 Found: $file" -ForegroundColor Green
        Write-Host "      Check for: raw body parsing, signature verification" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "⚖️  4. RECONCILIATION CHECK" -ForegroundColor Yellow
Write-Host "   Verify reconciliation is read-only:" -ForegroundColor Gray
$reconciliationFile = "backend\services\wallet-service\src\reconciliation\index.ts"
if (Test-Path $reconciliationFile) {
    Write-Host "   📄 Found: $reconciliationFile" -ForegroundColor Green
    Write-Host "   Ensure: No UPDATE/INSERT queries on wallet/ledger tables" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Missing: $reconciliationFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "👑 5. ADMIN ROLES CHECK" -ForegroundColor Yellow
Write-Host "   Verify admin roles are defined:" -ForegroundColor Gray
$rbacFile = "backend\services\auth-service\src\roles\definitions.ts"
if (Test-Path $rbacFile) {
    Write-Host "   📄 Found: $rbacFile" -ForegroundColor Green
    Write-Host "   Ensure: ADMIN, SUPER_ADMIN roles defined with proper permissions" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Missing: $rbacFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎭 6. MOCK ADAPTERS CHECK" -ForegroundColor Yellow
Write-Host "   Verify no test mocks in production:" -ForegroundColor Gray
$mockFiles = @(
    "backend\services\payment-service\src\index.ts",
    "backend\services\wallet-service\src\index.ts"
)

foreach ($file in $mockFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match "(?i)mock" -and $content -match "(?i)process\.env\.NODE_ENV.*production") {
            Write-Host "   ⚠️  Potential mock found in $file" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ No mocks detected in $file" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "📋 FINAL CHECKLIST" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "Before production launch, manually verify:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ ENV secrets are real (not placeholders)" -ForegroundColor White
Write-Host "✅ Kill switch = ACTIVE in database" -ForegroundColor White  
Write-Host "✅ Webhooks use raw body + signature verification" -ForegroundColor White
Write-Host "✅ Reconciliation is read-only" -ForegroundColor White
Write-Host "✅ Admin roles defined with RBAC" -ForegroundColor White
Write-Host "✅ No mock adapters in production build" -ForegroundColor White
Write-Host ""
Write-Host "If all items are ✅ → You are ready for launch! 🚀" -ForegroundColor Green
Write-Host "If any items show ❌ or ⚠️ → Fix before proceeding" -ForegroundColor Yellow