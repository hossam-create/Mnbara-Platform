# PowerShell script to create Frontend Pull Requests (PR2 & PR3)
# Usage: .\create_frontend_prs.ps1

Write-Host "========================================"
Write-Host "Frontend Setup - Pull Request Creator"
Write-Host "========================================"
Write-Host ""

# Check if GitHub CLI is installed
$ghCommand = "gh"
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    $standardPath = "C:\Program Files\GitHub CLI\gh.exe"
    if (Test-Path $standardPath) {
        Write-Host "✅ GitHub CLI found at $standardPath" -ForegroundColor Green
        $ghCommand = "& '$standardPath'"
        $ghAvailable = $true
    }
    else {
        Write-Host "⚠️  GitHub CLI (gh) is not installed or not found in PATH." -ForegroundColor Yellow
        Write-Host "Script will continue with Git operations only." -ForegroundColor Yellow
        Write-Host "You will need to create PRs manually from the provided links." -ForegroundColor Yellow
        $ghAvailable = $false
    }
}
else {
    $ghAvailable = $true
}

# Ensure we are on main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Cyan
    git checkout main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to main." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Preparing PR #2: Frontend Infrastructure..." -ForegroundColor Cyan

# Create branch for PR2
git checkout -b feat/frontend-infrastructure
if ($LASTEXITCODE -ne 0) {
    # If branch exists, switch to it
    git checkout feat/frontend-infrastructure
}

# Stage files for PR2
Write-Host "Staging files for PR2..."
git add .gitignore
git add web/

# Unstage PR3 files (Components & Cart Logic)
Write-Host "Unstaging PR3 files..."
git reset HEAD web/src/hooks/useCart.ts
git reset HEAD web/src/hooks/useCart.test.ts
git reset HEAD web/src/components/ProductCard.tsx
git reset HEAD web/src/components/ProductCard.test.tsx
git reset HEAD web/src/services/cart.service.ts
git reset HEAD web/src/services/api.service.ts
git reset HEAD web/src/types/cart.types.ts

# Commit PR2
Write-Host "Committing PR2..."
git commit -F commit_msg_pr2.txt

# Push PR2
Write-Host "Pushing PR2 branch..."
git push origin feat/frontend-infrastructure

# Create PR2
if ($ghAvailable) {
    Write-Host "Creating PR #2 on GitHub..."
    Invoke-Expression "$ghCommand pr create --title 'feat(frontend): initialize Vite + React + TypeScript project' --body-file PR2_BODY.md --base main --head feat/frontend-infrastructure"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PR #2 created successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to create PR #2" -ForegroundColor Red
    }
}
else {
    Write-Host "⚠️  Skipping automatic PR creation (gh not installed)" -ForegroundColor Yellow
    Write-Host "👉 Create PR #2 manually: https://github.com/hossam-create/Mnbara-Platform/compare/main...feat/frontend-infrastructure" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Preparing PR #3: Cart & Components..." -ForegroundColor Cyan

# Create branch for PR3 (from PR2 branch)
git checkout -b feat/frontend-components feat/frontend-infrastructure
if ($LASTEXITCODE -ne 0) {
    git checkout feat/frontend-components
}

# Stage files for PR3
Write-Host "Staging files for PR3..."
git add web/src/hooks/useCart.ts
git add web/src/hooks/useCart.test.ts
git add web/src/components/ProductCard.tsx
git add web/src/components/ProductCard.test.tsx
git add web/src/services/cart.service.ts
git add web/src/services/api.service.ts
git add web/src/types/cart.types.ts

# Commit PR3
Write-Host "Committing PR3..."
git commit -F commit_msg_pr3.txt

# Push PR3
Write-Host "Pushing PR3 branch..."
git push origin feat/frontend-components

# Create PR3
if ($ghAvailable) {
    Write-Host "Creating PR #3 on GitHub..."
    # Note: Base is feat/frontend-infrastructure (Stacked PR)
    Invoke-Expression "$ghCommand pr create --title 'feat(frontend): add cart management hook and product card component' --body-file PR3_BODY.md --base feat/frontend-infrastructure --head feat/frontend-components"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PR #3 created successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to create PR #3" -ForegroundColor Red
    }
}
else {
    Write-Host "⚠️  Skipping automatic PR creation (gh not installed)" -ForegroundColor Yellow
    Write-Host "👉 Create PR #3 manually: https://github.com/hossam-create/Mnbara-Platform/compare/feat/frontend-infrastructure...feat/frontend-components" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 All Frontend PRs processed!" -ForegroundColor Green
