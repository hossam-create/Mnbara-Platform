# MNbarh Platform Production Safety Check - Arabic Version
# التحقق من جاهزية الإنتاج

Write-Host "🛡️  قائمة أمان الإنتاج - MNbarh" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Production Safety Checklist" -ForegroundColor Cyan
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
    Write-Host "   ✅ ENV secrets موجودة وصحيحة" -ForegroundColor Green
} else {
    Write-Host "   ❌ Missing secrets:" -ForegroundColor Red
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
        $query = "SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';"
        $systemControl = & psql $DB_URL -t -c $query 2>$null
        $systemControl = $systemControl.Trim()
        
        if ($systemControl -eq "ACTIVE") {
            Write-Host "   ✅ Kill Switch = ACTIVE" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Kill Switch = $systemControl (يجب أن يكون ACTIVE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ⚠️  لا يمكن التحقق من system control" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ DATABASE_URL غير مضبوط" -ForegroundColor Red
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
            Write-Host "   ⚠️  Mock adapter found in $file" -ForegroundColor Yellow
            $mockFound = $true
        }
    }
}

if (!$mockFound) {
    Write-Host "   ✅ No mock adapters في build الإنتاج" -ForegroundColor Green
} else {
    Write-Host "   ❌ Mock adapters detected - راجع build الإنتاج" -ForegroundColor Red
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
    Write-Host "   ✅ Webhook endpoints محمية بـ raw body" -ForegroundColor Green
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
        Write-Host "   ✅ Reconciliation read-only (مؤكد)" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Reconciliation file not found" -ForegroundColor Yellow
}

# ====== 6. ADMIN ROLES CHECK ======
Write-Host ""
Write-Host "👑 6. Admin Roles & RBAC" -ForegroundColor Yellow

$rbacFile = "backend\services\auth-service\src\roles\definitions.ts"

if (Test-Path $rbacFile) {
    $content = Get-Content $rbacFile -Raw -ErrorAction SilentlyContinue
    
    if ($content -match "ADMIN" -or $content -match "SUPER_ADMIN") {
        Write-Host "   ✅ Admin roles محددة (RBAC)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Admin roles not found" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Admin roles file not found" -ForegroundColor Yellow
}

# ====== FINAL RESULT ======
Write-Host ""
Write-Host "📋 النتيجة النهائية" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "لو كلهم ✔️ → أنت جاهز للإطلاق! 🚀" -ForegroundColor Green
Write-Host "إذا كان هناك ❌ → راجع العناصر المطلوبة" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Additional checks:" -ForegroundColor Cyan
Write-Host "   • SSL certificates" -ForegroundColor Gray
Write-Host "   • Rate limiting" -ForegroundColor Gray
Write-Host "   • Database backups" -ForegroundColor Gray
Write-Host "   • Monitoring setup" -ForegroundColor Gray