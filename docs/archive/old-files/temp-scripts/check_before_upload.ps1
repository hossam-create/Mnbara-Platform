# Mnbara Platform - Quick Check Script
# سكريبت فحص سريع للمشروع قبل الرفع

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mnbara Platform - Quick Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Count node_modules folders
Write-Host "[1/4] Counting node_modules folders..." -ForegroundColor Yellow
$nodeModulesCount = (Get-ChildItem -Path . -Recurse -Directory -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -eq "node_modules" }).Count
Write-Host "Found: $nodeModulesCount node_modules folders" -ForegroundColor $(if ($nodeModulesCount -eq 0) { "Green" } else { "Yellow" })

# Check total project size
Write-Host ""
Write-Host "[2/4] Calculating total project size..." -ForegroundColor Yellow
$totalSizeGB = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "Total size: $([math]::Round($totalSizeGB, 2)) GB" -ForegroundColor $(if ($totalSizeGB -lt 1) { "Green" } else { "Red" })

# Check size without node_modules
Write-Host ""
Write-Host "[3/4] Size without node_modules..." -ForegroundColor Yellow
$sizeWithoutNM = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Size without node_modules: $([math]::Round($sizeWithoutNM, 2)) MB" -ForegroundColor Green

# Check for files >100MB
Write-Host ""
Write-Host "[4/4] Checking for large files (>100MB)..." -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { $_.Length -gt 100MB -and $_.FullName -notmatch '\\node_modules\\' }

if ($largeFiles.Count -gt 0) {
    Write-Host "⚠ Found $($largeFiles.Count) large file(s):" -ForegroundColor Red
    $largeFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) - $sizeMB MB" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ No large files found" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total size: $([math]::Round($totalSizeGB, 2)) GB" -ForegroundColor White
Write-Host "Size for GitHub: $([math]::Round($sizeWithoutNM, 2)) MB" -ForegroundColor $(if ($sizeWithoutNM -lt 1000) { "Green" } else { "Yellow" })
Write-Host "node_modules folders: $nodeModulesCount" -ForegroundColor White
Write-Host "Large files: $($largeFiles.Count)" -ForegroundColor $(if ($largeFiles.Count -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($sizeWithoutNM -lt 1000 -and $largeFiles.Count -eq 0) {
    Write-Host "✓ Ready to upload to GitHub!" -ForegroundColor Green
    Write-Host "Run: .\upload_to_github.ps1" -ForegroundColor Cyan
} else {
    Write-Host "⚠ Review the issues above before uploading" -ForegroundColor Yellow
}
