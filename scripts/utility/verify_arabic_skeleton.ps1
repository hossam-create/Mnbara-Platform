# Arabic Skeleton Verification Script
$ErrorActionPreference = "Stop"

Write-Host "Verifying Arabic Skeleton..."

# 1. Check Directory Structure
$i18nPath = "e:\New computer\Development Coding\Projects\Repos\geo\mnbara-platform\frontend\web-app\src\i18n"
if (Test-Path "$i18nPath\ar") { Write-Host "PASS: ar folder exists" } else { Write-Error "FAIL: ar folder missing" }
if (Test-Path "$i18nPath\en") { Write-Host "PASS: en folder exists" } else { Write-Error "FAIL: en folder missing" }

# 2. Check Index File
if (Test-Path "$i18nPath\index.ts") { Write-Host "PASS: i18n/index.ts exists" } else { Write-Error "FAIL: i18n/index.ts missing" }

# 3. Check CSS for RTL
$cssPath = "e:\New computer\Development Coding\Projects\Repos\geo\mnbara-platform\frontend\web-app\src\styles\globals.css"
$cssContent = Get-Content $cssPath -Raw
if ($cssContent -match 'html\[lang="ar"\]\s*{\s*direction:\s*rtl;') {
    Write-Host "PASS: CSS RTL rule found"
} else {
    Write-Error "FAIL: CSS RTL rule missing"
}

# 4. Check Common JSON
$arJsonPath = "$i18nPath\ar\common.json"
if (Test-Path $arJsonPath) {
    try {
        $json = Get-Content $arJsonPath -Raw | ConvertFrom-Json
        if ($json.app_name) { Write-Host "PASS: ar/common.json valid" } else { Write-Error "FAIL: ar/common.json missing keys" }
    } catch {
        Write-Error "FAIL: ar/common.json invalid JSON"
    }
}

Write-Host "ARABIC SKELETON VERIFIED SUCCESSFULLY"
