param (
    [string]$FilePath
)

if (-not (Test-Path $FilePath)) {
    Write-Host "File not found: $FilePath" -ForegroundColor Red
    return
}

$content = Get-Content $FilePath -Raw

# Case-sensitive replacements (-creplace)
$newContent = $content -creplace 'mnbara', 'mnbarh'
$newContent = $newContent -creplace 'Mnbara', 'Mnbarh'
$newContent = $newContent -creplace 'MNBARA', 'MNBARH'
$newContent = $newContent -creplace 'MNBara', 'Mnbarh' 

if ($content -ne $newContent) {
    Set-Content -Path $FilePath -Value $newContent -Encoding UTF8
    Write-Host "Updated: $FilePath" -ForegroundColor Green
} else {
    Write-Host "No changes: $FilePath" -ForegroundColor Gray
}
