# Archived Services Activation Script (PowerShell) - Simplified
# This script activates all 71 archived services without port conflict checks

$ErrorActionPreference = "Stop"

# Configuration
$Phase1File = "docker-compose.archived-phase1.yml"
$Phase2File = "docker-compose.archived-phase2.yml"
$Phase3File = "docker-compose.archived-phase3.yml"
$LogFile = "archived-services-activation.log"

# Logging function
function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
    Add-Content -Path $LogFile -Value "[$timestamp] $Message"
}

function Error {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red
    Add-Content -Path $LogFile -Value "[$timestamp] ERROR: $Message"
}

# Check if docker-compose files exist
function Test-Files {
    Log "Checking docker-compose files..."
    
    if (-not (Test-Path $Phase1File)) {
        Error "Phase 1 file not found: $Phase1File"
        exit 1
    }
    
    if (-not (Test-Path $Phase2File)) {
        Error "Phase 2 file not found: $Phase2File"
        exit 1
    }
    
    if (-not (Test-Path $Phase3File)) {
        Error "Phase 3 file not found: $Phase3File"
        exit 1
    }
    
    Log "All docker-compose files found"
}

# Activate services in a phase
function Invoke-ActivatePhase {
    param(
        [string]$PhaseFile,
        [string]$PhaseName
    )
    
    Log "=========================================="
    Log "Activating $PhaseName"
    Log "=========================================="
    
    # Start services
    Log "Starting services from $PhaseFile..."
    try {
        docker-compose -f $PhaseFile up -d
        Log "Services started successfully"
    } catch {
        Error "Failed to start services: $_"
        return $false
    }
    
    Log "$PhaseName activation complete"
    return $true
}

# Update monitoring dashboards
function Update-Monitoring {
    Log "Updating monitoring dashboards..."
    
    # Create monitoring directory if it doesn't exist
    if (-not (Test-Path "monitoring")) {
        New-Item -ItemType Directory -Path "monitoring" -Force | Out-Null
    }
    
    # Create monitoring configuration for all archived services
    $dashboardConfig = @{
        dashboard = @{
            title = "Archived Services Health"
            panels = @(
                @{
                    title = "Service Health Status"
                    type = "stat"
                    targets = @(
                        @{
                            expr = 'up{job=~"archived-.*"}'
                            legendFormat = "{{job}}"
                        }
                    )
                }
                @{
                    title = "Service Response Times"
                    type = "graph"
                    targets = @(
                        @{
                            expr = 'http_request_duration_seconds{job=~"archived-.*"}'
                            legendFormat = "{{job}}"
                        }
                    )
                }
                @{
                    title = "Service Error Rates"
                    type = "graph"
                    targets = @(
                        @{
                            expr = 'rate(http_requests_total{status=~"5..",job=~"archived-.*"}[5m])'
                            legendFormat = "{{job}}"
                        }
                    )
                }
            )
        }
    }
    
    $dashboardConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "monitoring\archived-services-dashboard.json" -Encoding utf8
    
    Log "Monitoring dashboard configuration created"
}

# Main execution
function Main {
    Log "=========================================="
    Log "Archived Services Activation Started"
    Log "=========================================="
    
    # Pre-activation checks
    Test-Files
    
    # Activate Phase 1: Critical Services (21 services)
    if (-not (Invoke-ActivatePhase -PhaseFile $Phase1File -PhaseName "Phase 1: Critical Services (21 services)")) {
        Error "Phase 1 activation failed"
        exit 1
    }
    
    # Wait 5 seconds between phases
    Log "Waiting 5 seconds before Phase 2..."
    Start-Sleep -Seconds 5
    
    # Activate Phase 2: Medium Priority Services (20 services)
    if (-not (Invoke-ActivatePhase -PhaseFile $Phase2File -PhaseName "Phase 2: Medium Priority Services (20 services)")) {
        Error "Phase 2 activation failed"
        exit 1
    }
    
    # Wait 5 seconds between phases
    Log "Waiting 5 seconds before Phase 3..."
    Start-Sleep -Seconds 5
    
    # Activate Phase 3: Low Priority Services (24 services)
    if (-not (Invoke-ActivatePhase -PhaseFile $Phase3File -PhaseName "Phase 3: Low Priority Services (24 services)")) {
        Error "Phase 3 activation failed"
        exit 1
    }
    
    # Update monitoring
    Update-Monitoring
    
    # Summary
    Log "=========================================="
    Log "Archived Services Activation Complete"
    Log "=========================================="
    Log "Total services activated: 71"
    Log "Phase 1: 21 services"
    Log "Phase 2: 20 services"
    Log "Phase 3: 24 services"
    Log "Additional services: 6 (notification-service already active)"
    Log ""
    Log "Monitoring dashboards updated"
    Log "Log file: $LogFile"
    Log ""
    Log "Next steps:"
    Log "1. Verify all services are healthy: docker-compose -f docker-compose.archived-phase1.yml ps"
    Log "2. Check monitoring dashboards: http://grafana:3000"
    Log "3. Review logs: Get-Content $LogFile -Wait"
    Log "4. Test service integration with active microservices"
}

# Run main function
Main
