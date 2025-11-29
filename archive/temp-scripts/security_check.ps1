# ====================================
# Security Check Script - PowerShell
# سكريبت الفحص الأمني
# ====================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mnbara Platform - Security Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# 1. Check for .env files
Write-Host "[1/8] Checking for .env files..." -ForegroundColor Yellow
$envFiles = git ls-files | Select-String -Pattern '\.env$'
if ($envFiles) {
    Write-Host "❌ ERROR: .env files found in repository:" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    $ErrorCount++
}
else {
    Write-Host "✓ No .env files in repository" -ForegroundColor Green
}

# 2. Check for private keys
Write-Host ""
Write-Host "[2/8] Checking for private keys..." -ForegroundColor Yellow
$keyFiles = git ls-files | Select-String -Pattern '\.(pem|key|crt|p12|pfx)$'
if ($keyFiles) {
    Write-Host "❌ ERROR: Private key files found:" -ForegroundColor Red
    $keyFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    $ErrorCount++
}
else {
    Write-Host "✓ No private keys in repository" -ForegroundColor Green
}

# 3. Check for secrets in code
Write-Host ""
Write-Host "[3/8] Scanning code for hardcoded secrets..." -ForegroundColor Yellow
$secretPatterns = @(
    'password\s*=\s*["\047][^"\047]{3,}["\047]',
    'api_key\s*=\s*["\047][^"\047]{10,}["\047]',
    'secret_key\s*=\s*["\047][^"\047]{10,}["\047]',
    'private_key\s*=\s*["\047][^"\047]{10,}["\047]',
    'token\s*=\s*["\047][^"\047]{20,}["\047]',
    'aws_secret_access_key',
    'AKIA[0-9A-Z]{16}',
    'sk_live_[0-9a-zA-Z]{24,}',
    'pk_live_[0-9a-zA-Z]{24,}'
)

$foundSecrets = $false
foreach ($pattern in $secretPatterns) {
    $matches = git grep -i -E $pattern -- ':!*.md' ':!*.ps1' ':!security_check.ps1' 2>$null
    if ($matches) {
        if (-not $foundSecrets) {
            Write-Host "⚠️ WARNING: Potential secrets found:" -ForegroundColor Yellow
            $foundSecrets = $true
            $WarningCount++
        }
        $matches | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    }
}

if (-not $foundSecrets) {
    Write-Host "✓ No hardcoded secrets detected" -ForegroundColor Green
}

# 4. Check docker-compose.yml
Write-Host ""
Write-Host "[4/8] Checking docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    $dockerContent = Get-Content "docker-compose.yml" -Raw
    $suspiciousPatterns = @('password:', 'secret:', 'token:', 'api_key:')
    $foundIssues = $false
    
    foreach ($pattern in $suspiciousPatterns) {
        if ($dockerContent -match $pattern) {
            if ($dockerContent -match "$pattern\s*\$\{") {
                # Using environment variable - OK
                continue
            }
            if (-not $foundIssues) {
                Write-Host "⚠️ WARNING: Check docker-compose.yml for hardcoded values:" -ForegroundColor Yellow
                $foundIssues = $true
                $WarningCount++
            }
            Write-Host "  - Found: $pattern" -ForegroundColor Yellow
        }
    }
    
    if (-not $foundIssues) {
        Write-Host "✓ docker-compose.yml looks clean" -ForegroundColor Green
    }
}
else {
    Write-Host "⚠️ docker-compose.yml not found" -ForegroundColor Yellow
}

# 5. Check render.yaml
Write-Host ""
Write-Host "[5/8] Checking render.yaml..." -ForegroundColor Yellow
if (Test-Path "render.yaml") {
    $renderContent = Get-Content "render.yaml" -Raw
    if ($renderContent -match 'value:\s*["\047]?[a-zA-Z0-9]{20,}["\047]?\s*$' -and 
        $renderContent -notmatch 'generateValue|fromDatabase|fromService|sync: false') {
        Write-Host "⚠️ WARNING: render.yaml may contain hardcoded values" -ForegroundColor Yellow
        $WarningCount++
    }
    else {
        Write-Host "✓ render.yaml uses proper secret management" -ForegroundColor Green
    }
}
else {
    Write-Host "⚠️ render.yaml not found" -ForegroundColor Yellow
}

# 6. Check infrastructure files
Write-Host ""
Write-Host "[6/8] Checking infrastructure files..." -ForegroundColor Yellow
$infraFiles = Get-ChildItem -Path "infrastructure" -Recurse -Include "*.tf", "*.tfvars", "*.yml", "*.yaml" -ErrorAction SilentlyContinue

$infraIssues = $false
foreach ($file in $infraFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'password\s*=\s*["\047][^"\047]{3,}["\047]' -or
        $content -match 'secret\s*=\s*["\047][^"\047]{10,}["\047]') {
        if (-not $infraIssues) {
            Write-Host "⚠️ WARNING: Infrastructure files may contain secrets:" -ForegroundColor Yellow
            $infraIssues = $true
            $WarningCount++
        }
        Write-Host "  - $($file.FullName)" -ForegroundColor Yellow
    }
}

if (-not $infraIssues) {
    Write-Host "✓ Infrastructure files look clean" -ForegroundColor Green
}

# 7. Check for large files
Write-Host ""
Write-Host "[7/8] Checking for large files (>100MB)..." -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
Where-Object { $_.Length -gt 100MB -and $_.FullName -notmatch '\\node_modules\\' }

if ($largeFiles) {
    Write-Host "⚠️ WARNING: Large files found:" -ForegroundColor Yellow
    $largeFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) ($sizeMB MB)" -ForegroundColor Yellow
    }
    $WarningCount++
}
else {
    Write-Host "✓ No large files found" -ForegroundColor Green
}

# 8. Check .gitignore coverage
Write-Host ""
Write-Host "[8/8] Verifying .gitignore coverage..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore" -Raw
    $requiredPatterns = @('.env', 'node_modules', '*.pem', '*.key', 'secrets/', '.secrets/')
    $missingPatterns = @()
    
    foreach ($pattern in $requiredPatterns) {
        if ($gitignore -notmatch [regex]::Escape($pattern)) {
            $missingPatterns += $pattern
        }
    }
    
    if ($missingPatterns) {
        Write-Host "⚠️ WARNING: .gitignore missing patterns:" -ForegroundColor Yellow
        $missingPatterns | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        $WarningCount++
    }
    else {
        Write-Host "✓ .gitignore has comprehensive coverage" -ForegroundColor Green
    }
}
else {
    Write-Host "❌ ERROR: .gitignore not found!" -ForegroundColor Red
    $ErrorCount++
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Security Check Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Errors:   $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $WarningCount" -ForegroundColor $(if ($WarningCount -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ PASSED: Repository is secure!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Grade: A" -ForegroundColor Green
    exit 0
}
elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️ PASSED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "Please review the warnings above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Grade: B" -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "❌ FAILED: Critical security issues found!" -ForegroundColor Red
    Write-Host "Please fix the errors above before proceeding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Grade: F" -ForegroundColor Red
    exit 1
}
