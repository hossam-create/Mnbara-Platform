# security_check.ps1
Write-Host "====================="
Write-Host "Security Scan Report"
Write-Host "=====================`n"

$projectRoot = Get-Location

# 1️⃣ فحص .gitignore
$gitignorePath = Join-Path $projectRoot ".gitignore"
if (Test-Path $gitignorePath) {
    Write-Host "[OK] .gitignore exists:`n"
    Get-Content $gitignorePath | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host "[WARN] .gitignore not found!"
}

# 2️⃣ البحث عن ملفات حساسة محتملة
$sensitivePatterns = @(".env","*.pem","*.key","*.p12","*.crt","*.pfx")
Write-Host "`n[INFO] Searching for sensitive files..."
foreach ($pattern in $sensitivePatterns) {
    $files = Get-ChildItem -Recurse -Force -Filter $pattern
    if ($files) {
        Write-Host "[WARN] Found sensitive files matching pattern '$pattern':"
        $files | ForEach-Object { Write-Host " - $_.FullName" }
    } else {
        Write-Host "[OK] No files found for pattern '$pattern'"
    }
}

# 3️⃣ البحث عن كلمات سر في الملفات النصية
$keywords = @("password","secret","api_key","token","ACCESS_KEY","SECRET_KEY")
Write-Host "`n[INFO] Scanning for suspicious keywords in text files..."
$textFiles = Get-ChildItem -Recurse -Include *.yml,*.yaml,*.env,*.json,*.js,*.ts,*.py,*.sh,*.ps1 -Force
foreach ($file in $textFiles) {
    $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
    foreach ($keyword in $keywords) {
        if ($content -match $keyword) {
            Write-Host "[WARN] Possible secret found in file '$($file.FullName)' containing keyword '$keyword'"
        }
    }
}

Write-Host "`nScan completed!"
Write-Host "====================="
