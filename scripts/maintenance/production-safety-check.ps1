# MNbarh Platform Production Safety Verification Script
# Comprehensive checklist for production readiness

$ErrorActionPreference = "Stop"

Write-Host "🛡️  MNbarh Production Safety Checklist" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "مراجعة شاملة قبل الإطلاق" -ForegroundColor Cyan
Write-Host ""

# Initialize results tracking
$results = @{
    ENV_SECRETS = $false
    KILL_SWITCH = $false
    MOCK_ADAPTERS = $false
    WEBHOOK_SECURITY = $false
    RECONCILIATION = $false
    ADMIN_ROLES = $false
    OVERALL = $false
}

# ====== 1. ENV SECRETS CHECK ======
Write-Host "🔐 1. ENV Secrets & API Keys" -ForegroundColor Yellow
Write-Host "   Checking Stripe, Paymob, and critical secrets..." -ForegroundColor Gray

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

$secretsStatus = @{}
$missingSecrets = @()

foreach ($secret in $requiredSecrets) {
    $value = [Environment]::GetEnvironmentVariable($secret)
    if ([string]::IsNullOrEmpty($value) -or $value -like "*your-*" -or $value -like "*placeholder*" -or $value -like "*mock*") {
        $secretsStatus[$secret] = $false
        $missingSecrets += $secret
    } else {
        $secretsStatus[$secret] = $true
    }
}

if ($missingSecrets.Count -eq 0) {
    Write-Host "   ✅ All ENV secrets are properly configured" -ForegroundColor Green
    $results.ENV_SECRETS = $true
} else {
    Write-Host "   ❌ Missing or invalid secrets:" -ForegroundColor Red
    foreach ($secret in $missingSecrets) {
        Write-Host "      - $secret" -ForegroundColor Red
    }
}

# ====== 2. KILL SWITCH CHECK ======
Write-Host ""
Write-Host "🚨 2. Kill Switch & System Control" -ForegroundColor Yellow
Write-Host "   Verifying SYSTEM_FINANCIAL_MODE = ACTIVE..." -ForegroundColor Gray

$DB_URL = [Environment]::GetEnvironmentVariable("DATABASE_URL")
if (![string]::IsNullOrEmpty($DB_URL)) {
    try {
        # Check system control
        $systemControl = & psql $DB_URL -t -c "SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';" 2>$null
        $systemControl = $systemControl.Trim()
        
        if ($systemControl -eq "ACTIVE") {
            Write-Host "   ✅ Kill Switch is ACTIVE" -ForegroundColor Green
            $results.KILL_SWITCH = $true
        } else {
            Write-Host "   ❌ Kill Switch is: $systemControl (should be ACTIVE)" -ForegroundColor Red
        }
        
        # Check other critical system controls
        $criticalControls = @(
            "PAYMENT_PROCESSING_MODE",
            "ESCROW_OPERATIONS_MODE", 
            "RECONCILIATION_MODE"
        )
        
        Write-Host "   Checking other system controls..." -ForegroundColor Gray
        foreach ($control in $criticalControls) {
            $value = & psql $DB_URL -t -c "SELECT value FROM system_control WHERE key = '$control';" 2>$null
            if (![string]::IsNullOrEmpty($value.Trim())) {
                Write-Host "   📊 $control = $($value.Trim())" -ForegroundColor Cyan
            }
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
Write-Host "   Checking for development/test mocks in production build..." -ForegroundColor Gray

$mockPatterns = @(
    "mock",
    "test",
    "fake",
    "stub",
    "development",
    "dev-mode"
)

$filesToCheck = @(
    "backend\services\payment-service\src\index.ts",
    "backend\services\wallet-service\src\index.ts",
    "backend\services\api-gateway\src\index.ts",
    "backend\services\auth-service\src\index.ts"
)

$mockFound = $false
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        foreach ($pattern in $mockPatterns) {
            if ($content -match "(?i)$pattern" -and $content -match "(?i)process\.env\.NODE_ENV.*production") {
                Write-Host "   ⚠️  Potential mock found in $file : $pattern" -ForegroundColor Yellow
                $mockFound = $true
            }
        }
    }
}

if (!$mockFound) {
    Write-Host "   ✅ No mock adapters detected in production build" -ForegroundColor Green
    $results.MOCK_ADAPTERS = $true
} else {
    Write-Host "   ❌ Mock adapters detected - review production build" -ForegroundColor Red
}

# ====== 4. WEBHOOK SECURITY CHECK ======
Write-Host ""
Write-Host "🔗 4. Webhook Security" -ForegroundColor Yellow
Write-Host "   Verifying webhook endpoints protection..." -ForegroundColor Gray

$webhookFiles = @(
    "backend\services\payment-service\src\webhooks\stripe.ts",
    "backend\services\payment-service\src\webhooks\paymob.ts",
    "backend\services\api-gateway\src\middleware\webhook.ts"
)

$webhookSecurityIssues = @()
foreach ($file in $webhookFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        
        # Check for raw body parsing
        if (!($content -match "raw.*body" -or $content -match "req\.body")) {
            $webhookSecurityIssues += "Missing raw body parsing in $file"
        }
        
        # Check for signature verification
        if (!($content -match "signature" -or $content -match "verify.*signature")) {
            $webhookSecurityIssues += "Missing signature verification in $file"
        }
        
        # Check for IP whitelist/rate limiting
        if (!($content -match "ip.*whitelist" -or $content -match "rate.*limit")) {
            $webhookSecurityIssues += "Missing IP protection in $file"
        }
    }
}

if ($webhookSecurityIssues.Count -eq 0) {
    Write-Host "   ✅ Webhook endpoints are properly secured" -ForegroundColor Green
    $results.WEBHOOK_SECURITY = $true
} else {
    Write-Host "   ❌ Webhook security issues found:" -ForegroundColor Red
    foreach ($issue in $webhookSecurityIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

# ====== 5. RECONCILIATION CHECK ======
Write-Host ""
Write-Host "⚖️  5. Reconciliation System" -ForegroundColor Yellow
Write-Host "   Verifying read-only reconciliation..." -ForegroundColor Gray

$reconciliationFiles = @(
    "backend\services\wallet-service\src\reconciliation\index.ts",
    "backend\services\wallet-service\src\reconciliation\service.ts"
)

$reconciliationIssues = @()
foreach ($file in $reconciliationFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        
        # Check for read-only operations
        if ($content -match "UPDATE.*wallet" -or $content -match "UPDATE.*ledger" -or $content -match "INSERT.*wallet") {
            $reconciliationIssues += "Modification queries found in $file"
        }
        
        # Check for proper logging
        if (!($content -match "log.*reconciliation" -or $content -match "audit.*log")) {
            $reconciliationIssues += "Missing audit logging in $file"
        }
    }
}

if ($reconciliationIssues.Count -eq 0) {
    Write-Host "   ✅ Reconciliation is read-only and properly audited" -ForegroundColor Green
    $results.RECONCILIATION = $true
} else {
    Write-Host "   ❌ Reconciliation issues found:" -ForegroundColor Red
    foreach ($issue in $reconciliationIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

# ====== 6. ADMIN ROLES & RBAC CHECK ======
Write-Host ""
Write-Host "👑 6. Admin Roles & RBAC" -ForegroundColor Yellow
Write-Host "   Checking admin role definitions..." -ForegroundColor Gray

$rbacFiles = @(
    "backend\services\auth-service\src\roles\definitions.ts",
    "backend\services\auth-service\src\middleware\authorization.ts",
    "backend\services\api-gateway\src\middleware\rbac.ts"
)

$rbacIssues = @()
foreach ($file in $rbacFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        
        # Check for admin role definitions
        if (!($content -match "ADMIN" -or $content -match "SUPER_ADMIN")) {
            $rbacIssues += "Missing admin role definitions in $file"
        }
        
        # Check for role-based permissions
        if (!($content -match "permission" -or $content -match "can.*access")) {
            $rbacIssues += "Missing permission system in $file"
        }
        
        # Check for dual approval system
        if (!($content -match "dual.*approval" -or $content -match "second.*approval")) {
            $rbacIssues += "Missing dual approval system in $file"
        }
    }
}

# Check database for admin roles
if (![string]::IsNullOrEmpty($DB_URL)) {
    try {
        $adminRoles = & psql $DB_URL -t -c "SELECT COUNT(*) FROM roles WHERE name LIKE '%ADMIN%';" 2>$null
        if ([int]$adminRoles.Trim() -gt 0) {
            Write-Host "   📊 Admin roles found in database: $($adminRoles.Trim())" -ForegroundColor Cyan
        } else {
            $rbacIssues += "No admin roles found in database"
        }
    } catch {
        Write-Host "   ⚠️  Could not check database roles: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ($rbacIssues.Count -eq 0) {
    Write-Host "   ✅ Admin roles and RBAC are properly configured" -ForegroundColor Green
    $results.ADMIN_ROLES = $true
} else {
    Write-Host "   ❌ RBAC issues found:" -ForegroundColor Red
    foreach ($issue in $rbacIssues) {
        Write-Host "      - $issue" -ForegroundColor Red
    }
}

# ====== FINAL RESULTS ======
Write-Host ""
Write-Host "📊 PRODUCTION SAFETY SUMMARY" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

$passedChecks = ($results.Values | Where-Object { $_ -eq $true }).Count
$totalChecks = $results.Count

Write-Host "Passed: $passedChecks/$totalChecks checks" -ForegroundColor Cyan

foreach ($key in $results.Keys) {
    $status = if ($results[$key]) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($results[$key]) { "Green" } else { "Red" }
    Write-Host "$status - $key" -ForegroundColor $color
}

$results.OVERALL = ($passedChecks -eq $totalChecks)

if ($results.OVERALL) {
    Write-Host ""
    Write-Host "🎉 ALL CHECKS PASSED! Platform is ready for production." -ForegroundColor Green
    Write-Host "✅ You are cleared for launch! 🚀" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some checks failed. Review and fix issues before production deployment." -ForegroundColor Yellow
    Write-Host "🔧 Address the failed items above before proceeding." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Additional Checks Recommended:" -ForegroundColor Cyan
Write-Host "   • SSL/TLS certificate validation" -ForegroundColor Gray
Write-Host "   • Rate limiting configuration" -ForegroundColor Gray
Write-Host "   • Database connection pooling" -ForegroundColor Gray
Write-Host "   • Monitoring and alerting setup" -ForegroundColor Gray
Write-Host "   • Backup and disaster recovery" -ForegroundColor Gray