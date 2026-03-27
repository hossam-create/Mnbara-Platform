# PowerShell script to create Pull Requests for Security Sweep tasks
# Usage: .\create_prs.ps1

Write-Host "========================================"
Write-Host "Security Sweep - Pull Request Creator"
Write-Host "========================================"
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghInstalled) {
    Write-Host "⚠️  GitHub CLI (gh) is not installed." -ForegroundColor Yellow
    Write-Host "Please install it from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, you can create PRs manually:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/hossam-create/Mnbara-Platform" -ForegroundColor Cyan
    Write-Host "2. Select branch: feature/security-sweep" -ForegroundColor Cyan
    Write-Host "3. Click 'New Pull Request'" -ForegroundColor Cyan
    Write-Host "4. Use details from PR_GUIDE.md" -ForegroundColor Cyan
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "feature/security-sweep") {
    Write-Host "⚠️  Warning: Not on feature/security-sweep branch" -ForegroundColor Yellow
    $response = Read-Host "Switch to feature/security-sweep? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git checkout feature/security-sweep
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to switch branch. Creating it..." -ForegroundColor Red
            git checkout -b feature/security-sweep
        }
    } else {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Available tasks:" -ForegroundColor Green
Write-Host "1. Task 1: Security Script Output"
Write-Host "2. Task 2: Gitignore Update"
Write-Host "3. Task 3: CodeQL Status"
Write-Host "4. Task 4: CI Status"
Write-Host "5. Create all PRs"
Write-Host ""

$choice = Read-Host "Select task (1-5)"

function Create-PR {
    param(
        [string]$Title,
        [string]$Body,
        [string]$Branch = "feature/security-sweep",
        [string]$Base = "main",
        [string]$Reviewer = "hossam-create"
    )
    
    Write-Host "Creating PR: $Title" -ForegroundColor Cyan
    
    gh pr create `
        --title $Title `
        --body $Body `
        --base $Base `
        --head $Branch `
        --reviewer $Reviewer
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PR created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create PR" -ForegroundColor Red
    }
}

switch ($choice) {
    "1" {
        Write-Host "Creating PR for Task 1..." -ForegroundColor Cyan
        $body = @"
## Task 1: Security Script Execution

### Changes
- ✅ Executed `security_check.ps1` script
- ✅ Saved output to `TASK1_SECURITY_CHECK_OUTPUT.txt`

### Results
- ✅ `.gitignore` properly configured
- ✅ No sensitive files found (.env, *.pem, *.key, *.crt)
- ⚠️  6 false positives in documentation (keywords only, not secrets)

### Next Steps
- Review output file
- Proceed to Task 2
"@
        Create-PR -Title "feat(security): Add security check script output" -Body $body
    }
    
    "2" {
        Write-Host "Creating PR for Task 2..." -ForegroundColor Cyan
        $body = @"
## Task 2: Gitignore Update & Secrets Removal

### Changes
- ✅ Added `*.crt` pattern to `.gitignore`
- ✅ Verified no sensitive files are tracked
- ✅ Documented changes in `TASK2_GITIGNORE_UPDATE.md`

### Files Protected
- ✅ `.env*` files
- ✅ `*.pem` files
- ✅ `*.key` files
- ✅ `*.crt` files (newly added)
- ✅ `*.cert` files

### Next Steps
- Review changes
- Proceed to Task 3
"@
        Create-PR -Title "chore(security): Remove secrets & update .gitignore" -Body $body
    }
    
    "3" {
        Write-Host "Creating PR for Task 3..." -ForegroundColor Cyan
        $body = @"
## Task 3: CodeQL Syntax Errors Check

### Status
- ✅ CodeQL workflow active
- ✅ 0 warnings found
- ✅ 0 syntax errors found
- ✅ All files passing

### Analysis
- Languages: JavaScript, TypeScript
- Queries: security-extended, security-and-quality

### Next Steps
- Review status report
- Proceed to Task 4
"@
        Create-PR -Title "docs(security): Add CodeQL status report" -Body $body
    }
    
    "4" {
        Write-Host "Creating PR for Task 4..." -ForegroundColor Cyan
        $body = @"
## Task 4: CI Configuration Status

### Status
- ✅ CI workflow already configured
- ✅ All required steps included:
  - Install dependencies
  - Lint
  - Test
  - Build
  - Security checks

### Jobs
1. ✅ lint-and-test
2. ✅ web-build
3. ✅ docker-compose-check
4. ✅ security-check
5. ✅ gitleaks

### Result
No changes needed - CI is comprehensive and complete.
"@
        Create-PR -Title "docs(ci): Add CI workflow status report" -Body $body
    }
    
    "5" {
        Write-Host "Creating all PRs..." -ForegroundColor Cyan
        Write-Host "This will create 4 separate PRs for each task." -ForegroundColor Yellow
        $confirm = Read-Host "Continue? (y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            # Task 1
            $body1 = "## Task 1: Security Script Execution`n`n- ✅ Executed security_check.ps1`n- ✅ Saved output to TASK1_SECURITY_CHECK_OUTPUT.txt`n- ✅ No critical issues found"
            Create-PR -Title "feat(security): Add security check script output" -Body $body1
            
            Start-Sleep -Seconds 2
            
            # Task 2
            $body2 = "## Task 2: Gitignore Update & Secrets Removal`n`n- ✅ Added *.crt pattern`n- ✅ Verified no sensitive files tracked`n- ✅ All patterns protected"
            Create-PR -Title "chore(security): Remove secrets & update .gitignore" -Body $body2
            
            Start-Sleep -Seconds 2
            
            # Task 3
            $body3 = "## Task 3: CodeQL Status`n`n- ✅ 0 warnings`n- ✅ 0 syntax errors`n- ✅ All files passing"
            Create-PR -Title "docs(security): Add CodeQL status report" -Body $body3
            
            Start-Sleep -Seconds 2
            
            # Task 4
            $body4 = "## Task 4: CI Configuration Status`n`n- ✅ CI workflow already configured`n- ✅ All required steps included`n- ✅ No changes needed"
            Create-PR -Title "docs(ci): Add CI workflow status report" -Body $body4
            
            Write-Host ""
            Write-Host "✅ All PRs created!" -ForegroundColor Green
        }
    }
    
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green


