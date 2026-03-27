$ErrorActionPreference = "Stop"

function Rebrand-File {
    param ([string]$Path)
    Write-Host "Rebrand: $Path"
    & powershell -ExecutionPolicy Bypass -File scripts/rebrand_tool.ps1 -FilePath $Path
}

function Get-Files {
    param ([string]$Path, [string[]]$Include)
    Get-ChildItem -Path $Path -Include $Include -Recurse | 
        Where-Object { $_.FullName -notmatch 'node_modules' -and $_.FullName -notmatch '\.git' }
}

# 1. Root Configuration
$rootFiles = @("render.yaml", "package.json", "start_platform.bat", "docker-compose.yml")
foreach ($f in $rootFiles) {
    if (Test-Path $f) { Rebrand-File -Path $f }
}

# 2. Scripts
Get-Files -Path scripts -Include *.sh,*.bat | ForEach-Object { Rebrand-File -Path $_.FullName }

# 3. Package.json files (Backend & Frontend)
Get-Files -Path backend -Include package.json | ForEach-Object { Rebrand-File -Path $_.FullName }
Get-Files -Path frontend -Include package.json | ForEach-Object { Rebrand-File -Path $_.FullName }

# 4. Documentation
Get-Files -Path docs -Include *.md | ForEach-Object { Rebrand-File -Path $_.FullName }
Get-ChildItem -Path . -Filter *.md -MaxDepth 1 | ForEach-Object { Rebrand-File -Path $_.FullName }

# 5. Source Code
$srcExtensions = @("*.ts", "*.tsx", "*.js", "*.dart", "*.sol", "*.html", "*.css", "*.scss")
Get-Files -Path backend -Include $srcExtensions | ForEach-Object { Rebrand-File -Path $_.FullName }
Get-Files -Path frontend -Include $srcExtensions | ForEach-Object { Rebrand-File -Path $_.FullName }
Get-Files -Path contracts -Include $srcExtensions | ForEach-Object { Rebrand-File -Path $_.FullName }

Write-Host "Mass rebranding completed." -ForegroundColor Green
