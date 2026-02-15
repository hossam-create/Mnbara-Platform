# ====================================
# Mnbara Platform - GitHub Upload Script
# ====================================
# This script prepares and uploads the project to GitHub
# يقوم هذا السكريبت بتجهيز ورفع المشروع على GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mnbara Platform - GitHub Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Git is installed
Write-Host "[1/6] Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed. Please install Git first from https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Step 2: Check project size
Write-Host ""
Write-Host "[2/6] Checking project size (excluding node_modules)..." -ForegroundColor Yellow
$totalSize = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "✓ Project size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Green

if ($totalSize -gt 1000) {
    Write-Host "⚠ Warning: Project is large (>1GB). This may take time to upload." -ForegroundColor Yellow
} else {
    Write-Host "✓ Size is within GitHub limits" -ForegroundColor Green
}

# Step 3: Initialize Git (if not already)
Write-Host ""
Write-Host "[3/6] Initializing Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# Step 4: Check for large files (>100MB)
Write-Host ""
Write-Host "[4/6] Checking for large files (>100MB)..." -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { $_.Length -gt 100MB -and $_.FullName -notmatch '\\node_modules\\' }

if ($largeFiles.Count -gt 0) {
    Write-Host "⚠ Warning: Found $($largeFiles.Count) large file(s):" -ForegroundColor Yellow
    $largeFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.FullName) ($sizeMB MB)" -ForegroundColor Yellow
    }
    Write-Host "  These files may cause issues. Consider using Git LFS or excluding them." -ForegroundColor Yellow
} else {
    Write-Host "✓ No large files found" -ForegroundColor Green
}

# Step 5: Prompt for GitHub repository URL
Write-Host ""
Write-Host "[5/6] GitHub Repository Setup" -ForegroundColor Yellow
Write-Host "Please enter your GitHub repository URL" -ForegroundColor Cyan
Write-Host "Example: https://github.com/username/mnbara-platform.git" -ForegroundColor Gray
$repoUrl = Read-Host "Repository URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "✗ No repository URL provided. Exiting." -ForegroundColor Red
    exit 1
}

# Check if remote already exists
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
    $updateRemote = Read-Host "Update to new URL? (y/n)"
    if ($updateRemote -eq 'y') {
        git remote set-url origin $repoUrl
        Write-Host "✓ Remote URL updated" -ForegroundColor Green
    }
} else {
    git remote add origin $repoUrl
    Write-Host "✓ Remote 'origin' added" -ForegroundColor Green
}

# Step 6: Add, Commit, and Push
Write-Host ""
Write-Host "[6/6] Preparing to push to GitHub..." -ForegroundColor Yellow

# Add all files (respecting .gitignore)
Write-Host "Adding files..." -ForegroundColor Cyan
git add .

# Show what will be committed
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

Write-Host ""
$proceed = Read-Host "Proceed with commit and push? (y/n)"

if ($proceed -ne 'y') {
    Write-Host "✗ Upload cancelled" -ForegroundColor Yellow
    exit 0
}

# Commit
Write-Host ""
Write-Host "Enter commit message (or press Enter for default):" -ForegroundColor Cyan
$commitMsg = Read-Host "Commit message"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Initial commit - Mnbara Platform with 8 microservices"
}

git commit -m "$commitMsg"
Write-Host "✓ Changes committed" -ForegroundColor Green

# Set main branch
git branch -M main

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "This may take several minutes..." -ForegroundColor Yellow

try {
    git push -u origin main
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ SUCCESS! Project uploaded to GitHub" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to your GitHub repository: $repoUrl" -ForegroundColor White
    Write-Host "2. Set up GitHub Secrets for deployment" -ForegroundColor White
    Write-Host "3. Deploy to Render.com using render.yaml" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Push failed. Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor White
    Write-Host "2. Verify repository URL is correct" -ForegroundColor White
    Write-Host "3. Ensure you have write access to the repository" -ForegroundColor White
    Write-Host "4. Try: git pull origin main --rebase" -ForegroundColor White
    Write-Host "   Then: git push origin main" -ForegroundColor White
    exit 1
}
