# Fix BOM in JSON files
$jsonFiles = Get-ChildItem -Path "backend/services/auction-service" -Filter "*.json" -Recurse

foreach ($file in $jsonFiles) {
    $content = Get-Content $file.FullName -Raw
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "Done!"
