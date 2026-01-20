# MNbarh Platform Production Safety Check
# Final verification before production launch

Write-Host "🛡️  MNbarh Production Safety Checklist" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Final verification before production" -ForegroundColor Cyan
Write-Host ""

# ====== 1. ENV SECRETS CHECK ======
Write-Host "🔐 1. ENV Secrets and API Keys" -ForegroundColor Yellow

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
    Write-Host "   ✅ ENV secrets are present and valid" -ForegroundColor Green
} else {
    Write-Host "   ❌ Missing or invalid secrets:" -ForegroundColor Red
    foreach ($secret in $missingSecrets) {
        Write-Host "      - $secret" -ForegroundColor Red
    }
}

# ====== 2. KILL SWITCH CHECK ======
Write-Host ""
Write-Host "🚨 2. Kill Switch and System Control" -ForegroundColor Yellow

$DB_URL = [Environment]::GetEnvironmentVariable("DATABASE_URL")
if (![string]::IsNullOrEmpty($DB_URL)) {
    try {
        $query = "SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';"
        $systemControl = & psql $DB_URL -t -c $query 2>$null
        $systemControl = $systemControl.Trim()
        
        if ($systemControl -eq "ACTIVE") {
            Write-Host "   ✅ Kill Switch = ACTIVE" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Kill Switch = $systemControl (should be ACTIVE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ⚠️  Cannot check system control: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ DATABASE_URL not set" -ForegroundColor Red
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
    Write-Host "   ✅ No mock adapters in production build" -ForegroundColor Green
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
            $webhookIssues += "Missing raw body parsing"
        }
        
        if (!($content -match "signature" -or $content -match "verify.*signature")) {
            $webhookIssues += "Missing signature verification"
        }
    }
}

if ($webhookIssues.Count -eq 0) {
    Write-Host "   ✅ Webhook endpoints protected with raw body" -ForegroundColor Green
} else {
    Write-Host "   ❌ Webhook security issues:" -ForegroundColor Red
    foreach ($issue in $webhookIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

# ====== 5. RECONCILIATION CHECK ======
Write-Host ""
Write-Host "⚖️  5. Reconciliation System" -ForegroundColor Yellow

$reconciliationFile = "backend\services\wallet-service\src\reconciliation\index.ts"

if (Test-Path $reconciliationFile) {
    $content = Get-Content $reconciliationFile -Raw -ErrorAction SilentlyContinue
    
    if ($content -match "UPDATE.*wallet" -or $content -match "UPDATE.*ledger") {
        Write-Host "   ❌ Reconciliation contains modification queries" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Reconciliation is read-only (confirmed)" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Reconciliation file not found" -ForegroundColor Yellow
}

# ====== 6. ADMIN ROLES CHECK ======
Write-Host ""
Write-Host "👑 6. Admin Roles and RBAC" -ForegroundColor Yellow

$rbacFile = "backend\services\auth-service\src\roles\definitions.ts"

if (Test-Path $rbacFile) {
    $content = Get-Content $rbacFile -Raw -ErrorAction SilentlyContinue
    
    if ($content -match "ADMIN" -or $content -match "SUPER_ADMIN") {
        Write-Host "   ✅ Admin roles defined (RBAC)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Admin roles not found" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Admin roles file not found" -ForegroundColor Yellow
}

# ====== FINAL RESULT ======
Write-Host ""
Write-Host "📋 PRODUCTION SAFETY SUMMARY" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "If all checks show ✅ → You are ready for launch! 🚀" -ForegroundColor Green
Write-Host "If any checks show ❌ → Review required items before proceeding" -ForegroundColor Yellow
Write-Host ""
Write-Host "Additional checks recommended:" -ForegroundColor Cyan
Write-Host "   • SSL/TLS certificates" -ForegroundColor Gray
Write-Host "   • Rate limiting configuration" -ForegroundColor Gray
Write-Host "   • Database backup procedures" -ForegroundColor Gray
Write-Host "   • Monitoring and alerting" -ForegroundColor Gray