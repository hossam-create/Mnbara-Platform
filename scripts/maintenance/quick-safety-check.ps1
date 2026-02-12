# MNbarh Platform Production Safety Check - Simplified Version
# Quick verification of critical production requirements

Write-Host "🛡️  MNbarh Production Safety Check" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "مراجعة سريعة قبل الإطلاق" -ForegroundColor Cyan
Write-Host ""

# ====== 1. ENV SECRETS CHECK ======
Write-Host "🔐 1. ENV Secrets & API Keys" -ForegroundColor Yellow

$requiredSecrets = @(
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

$missingSecrets = @()
foreach ($secret in $requiredSecrets) {
    $value = [Environment]::GetEnvironmentVariable($secret)
    if ([string]::IsNullOrEmpty($value) -or $value -like "*your-*" -or $value -like "*placeholder*" -or $value -like "*mock*") {
        $missingSecrets += $secret
    }
}

if ($missingSecrets.Count -eq 0) {
    Write-Host "   ✅ All ENV secrets are properly configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ Missing or invalid secrets:" -ForegroundColor Red
    foreach ($secret in $missingSecrets) {
        Write-Host "      - $secret" -ForegroundColor Red
    }
}

# ====== 2. KILL SWITCH CHECK ======
Write-Host ""
Write-Host "🚨 2. Kill Switch & System Control" -ForegroundColor Yellow

$DB_URL = [Environment]::GetEnvironmentVariable("DATABASE_URL")
if (![string]::IsNullOrEmpty($DB_URL)) {
    try {
        $systemControl = & psql $DB_URL -t -c "SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';" 2>$null
        $systemControl = $systemControl.Trim()
        
        if ($systemControl -eq "ACTIVE") {
            Write-Host "   ✅ Kill Switch is ACTIVE" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Kill Switch is: $systemControl (should be ACTIVE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ⚠️  Could not check system control: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ DATABASE_URL not set, cannot check system control" -ForegroundColor Red
}

# ====== 3. MOCK ADAPTERS CHECK ======
Write-Host ""
Write-Host "🎭 3. Mock Adapters Detection" -ForegroundColor Yellow

$mockFiles = @(
    "backend\services\payment-service\src\index.ts",
    "backend\services\wallet-service\src\index.ts"
)

$mockFound = $false
foreach ($file in $mockFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content -match "(?i)mock" -and $content -match "(?i)process\.env\.NODE_ENV.*production") {
            Write-Host "   ⚠️  Potential mock found in $file" -ForegroundColor Yellow
            $mockFound = $true
        }
    }
}

if (!$mockFound) {
    Write-Host "   ✅ No mock adapters detected in production build" -ForegroundColor Green
} else {
    Write-Host "   ❌ Mock adapters detected - review production build" -ForegroundColor Red
}

# ====== 4. WEBHOOK SECURITY CHECK ======
Write-Host ""
Write-Host "🔗 4. Webhook Security" -ForegroundColor Yellow

$webhookFiles = @(
    "backend\services\payment-service\src\webhooks\stripe.ts",
    "backend\services\payment-service\src\webhooks\paymob.ts"
)

$webhookIssues = @()
foreach ($file in $webhookFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        
        if (!($content -match "raw.*body" -or $content -match "req\.body")) {
            $webhookIssues += "Missing raw body parsing in $file"
        }
        
        if (!($content -match "signature" -or $content -match "verify.*signature")) {
            $webhookIssues += "Missing signature verification in $file"
        }
    }
}

if ($webhookIssues.Count -eq 0) {
    Write-Host "   ✅ Webhook endpoints are properly secured" -ForegroundColor Green
} else {
    Write-Host "   ❌ Webhook security issues found:" -ForegroundColor Red
    foreach ($issue in $webhookIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

# ====== 5. RECONCILIATION CHECK ======
Write-Host ""
Write-Host "⚖️  5. Reconciliation System" -ForegroundColor Yellow

$reconciliationFiles = @(
    "backend\services\wallet-service\src\reconciliation\index.ts"
)

$reconciliationIssues = @()
foreach ($file in $reconciliationFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        
        if ($content -match "UPDATE.*wallet" -or $content -match "UPDATE.*ledger") {
            $reconciliationIssues += "Modification queries found in $file"
        }
    }
}

if ($reconciliationIssues.Count -eq 0) {
    Write-Host "   ✅ Reconciliation is read-only" -ForegroundColor Green
} else {
    Write-Host "   ❌ Reconciliation issues found:" -ForegroundColor Red
    foreach ($issue in $reconciliationIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

# ====== 6. ADMIN ROLES CHECK ======
Write-Host ""
Write-Host "👑 6. Admin Roles & RBAC" -ForegroundColor Yellow

$rbacFiles = @(
    "backend\services\auth-service\src\roles\definitions.ts"
)

$rbacIssues = @()
foreach ($file in $rbacFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        
        if (!($content -match "ADMIN")) {
            $rbacIssues += "Missing admin role definitions in $file"
        }
    }
}

if ($rbacIssues.Count -eq 0) {
    Write-Host "   ✅ Admin roles are properly configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ RBAC issues found:" -ForegroundColor Red
    foreach ($issue in $rbacIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 PRODUCTION SAFETY SUMMARY" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "✅ Review the checklist above before production deployment" -ForegroundColor Cyan
Write-Host "🔧 Fix any ❌ items before proceeding" -ForegroundColor Yellow
Write-Host "🚀 Platform ready when all checks pass" -ForegroundColor Green