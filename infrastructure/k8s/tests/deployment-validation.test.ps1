# Deployment Validation Tests for MNBARA Platform (PowerShell)
# Tests rolling update strategy and pod disruption budgets
# Requirements: 20.1 - Monitoring and Observability

param(
    [string]$ChartPath = "infrastructure/k8s/mnbara"
)

$ErrorActionPreference = "Stop"

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = ""
    )
    
    if ($Passed) {
        Write-Host "✓ PASS: $TestName" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "✗ FAIL: $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "  Reason: $Message" -ForegroundColor Yellow
        }
        $script:TestsFailed++
    }
}

function Test-HelmInstalled {
    try {
        $null = Get-Command helm -ErrorAction Stop
        return $true
    } catch {
        Write-Host "Error: helm is not installed" -ForegroundColor Red
        return $false
    }
}

function Render-HelmTemplates {
    param([string]$OutputDir)
    
    try {
        helm template test-release $ChartPath --output-dir $OutputDir 2>$null
        return $true
    } catch {
        return $false
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MNBARA Deployment Validation Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
if (-not (Test-HelmInstalled)) {
    exit 1
}

# Create temp directory
$TempDir = Join-Path $env:TEMP "mnbara-helm-test-$(Get-Random)"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    Write-Host "Rendering Helm templates..."
    if (-not (Render-HelmTemplates -OutputDir $TempDir)) {
        Write-Host "Failed to render Helm templates" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "--- Rolling Update Strategy Tests ---" -ForegroundColor Cyan
    Write-Host ""
    
    # Find all deployment files
    $DeploymentFiles = Get-ChildItem -Path $TempDir -Recurse -Filter "*.yaml" | 
        Where-Object { (Get-Content $_.FullName -Raw) -match "kind:\s*Deployment" }
    
    # Test 1: Verify all deployments have RollingUpdate strategy
    $AllRollingUpdate = $true
    $FailedDeployments = @()
    
    foreach ($file in $DeploymentFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -notmatch "type:\s*RollingUpdate") {
            $AllRollingUpdate = $false
            $name = if ($content -match "name:\s*(\S+)") { $matches[1] } else { $file.Name }
            $FailedDeployments += $name
        }
    }
    Write-TestResult -TestName "All deployments use RollingUpdate strategy" -Passed $AllRollingUpdate -Message "Missing: $($FailedDeployments -join ', ')"
    
    # Test 2: Verify maxSurge is configured
    $AllMaxSurge = $true
    $FailedDeployments = @()
    
    foreach ($file in $DeploymentFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -notmatch "maxSurge:") {
            $AllMaxSurge = $false
            $name = if ($content -match "name:\s*(\S+)") { $matches[1] } else { $file.Name }
            $FailedDeployments += $name
        }
    }
    Write-TestResult -TestName "All deployments have maxSurge configured" -Passed $AllMaxSurge -Message "Missing: $($FailedDeployments -join ', ')"
    
    # Test 3: Verify maxUnavailable is set to 0
    $AllMaxUnavailableZero = $true
    $FailedDeployments = @()
    
    foreach ($file in $DeploymentFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "maxUnavailable:\s*(\S+)") {
            if ($matches[1] -ne "0") {
                $AllMaxUnavailableZero = $false
                $name = if ($content -match "name:\s*(\S+)") { $matches[1] } else { $file.Name }
                $FailedDeployments += "$name($($matches[1]))"
            }
        }
    }
    Write-TestResult -TestName "All deployments have maxUnavailable=0" -Passed $AllMaxUnavailableZero -Message "Non-zero: $($FailedDeployments -join ', ')"
    
    # Test 4: Verify terminationGracePeriodSeconds
    $AllGracePeriod = $true
    $FailedDeployments = @()
    
    foreach ($file in $DeploymentFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "terminationGracePeriodSeconds:\s*(\d+)") {
            if ([int]$matches[1] -lt 30) {
                $AllGracePeriod = $false
                $name = if ($content -match "name:\s*(\S+)") { $matches[1] } else { $file.Name }
                $FailedDeployments += $name
            }
        } else {
            $AllGracePeriod = $false
            $name = if ($content -match "name:\s*(\S+)") { $matches[1] } else { $file.Name }
            $FailedDeployments += $name
        }
    }
    Write-TestResult -TestName "All deployments have terminationGracePeriodSeconds >= 30" -Passed $AllGracePeriod -Message "Missing/low: $($FailedDeployments -join ', ')"
    
    # Test 5: Verify preStop lifecycle hook
    $AllPreStop = $true
    $FailedDeployments = @()
    
    foreach ($file in $DeploymentFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -notmatch "preStop:") {
            $AllPreStop = $false
            $name = if ($content -match "name:\s*(\S+)") { $matches[1] } else { $file.Name }
            $FailedDeployments += $name
        }
    }
    Write-TestResult -TestName "All deployments have preStop lifecycle hook" -Passed $AllPreStop -Message "Missing: $($FailedDeployments -join ', ')"
    
    Write-Host ""
    Write-Host "--- Pod Disruption Budget Tests ---" -ForegroundColor Cyan
    Write-Host ""
    
    # Find PDB file
    $PdbFile = Get-ChildItem -Path $TempDir -Recurse -Filter "pdb.yaml" | Select-Object -First 1
    
    # Test 6: PDB exists
    $PdbExists = $null -ne $PdbFile
    Write-TestResult -TestName "Pod Disruption Budget file exists" -Passed $PdbExists -Message "pdb.yaml not found"
    
    if ($PdbExists) {
        $PdbContent = Get-Content $PdbFile.FullName -Raw
        
        # Test 7: minAvailable configured
        $HasMinAvailable = $PdbContent -match "minAvailable:"
        Write-TestResult -TestName "PDBs have minAvailable configured" -Passed $HasMinAvailable -Message "No minAvailable found"
        
        # Test 8: Critical services have higher PDB
        $AuctionPdb = $false
        if ($PdbContent -match "auction-service-pdb[\s\S]*?minAvailable:\s*(\d+)") {
            $AuctionPdb = $matches[1] -eq "2"
        }
        Write-TestResult -TestName "Critical services (auction) have higher PDB minAvailable" -Passed $AuctionPdb -Message "Expected minAvailable=2 for auction-service"
        
        # Test 9: PDB selector match
        $HasSelector = $PdbContent -match "matchLabels:"
        Write-TestResult -TestName "PDBs have matchLabels selector configured" -Passed $HasSelector -Message "No matchLabels found"
        
        # Test 10: API version
        $HasApiVersion = $PdbContent -match "apiVersion:\s*policy/v1"
        Write-TestResult -TestName "PDBs use policy/v1 API version" -Passed $HasApiVersion -Message "Expected policy/v1"
    }
    
} finally {
    # Cleanup
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Passed: $script:TestsPassed" -ForegroundColor Green
Write-Host "Failed: $script:TestsFailed" -ForegroundColor Red
Write-Host ""

if ($script:TestsFailed -gt 0) {
    exit 1
}

exit 0
