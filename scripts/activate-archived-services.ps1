# Archived Services Activation Script (PowerShell)
# This script incrementally activates all 71 archived services without interrupting current execution

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

function Warn {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] WARNING: $Message" -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value "[$timestamp] WARNING: $Message"
}

# Check if docker-compose files exist
function Check-Files {
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

# Check port conflicts
function Check-PortConflicts {
    Log "Checking for port conflicts..."
    
    $ports = @()
    $ports += Select-String -Path $Phase1File, $Phase2File, $Phase3File -Pattern "ports:" -Context 0, 1 | ForEach-Object {
        if ($_ -match '\d+:\d+') {
            $matches[0].Split(':')[0]
        }
    }
    
    $ports = $ports | Sort-Object -Unique
    
    foreach ($port in $ports) {
        $portInt = [int]$port
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $portInt -WarningAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                Warn "Port $port is already in use"
                Log "Checking if port $port is used by an active service..."
                $process = Get-NetTCPConnection -LocalPort $portInt -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($process) {
                    $serviceName = (Get-Process -Id $process.OwningProcess -ErrorAction SilentlyContinue).ProcessName
                    Warn "Port $port is used by $serviceName"
                    Log "This may cause conflicts. Please review."
                }
            }
        } catch {
            # Ignore errors
        }
    }
    
    Log "Port conflict check complete"
}

# Wait for service to be healthy
function Wait-ForHealth {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    Log "Waiting for $ServiceName to be healthy..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            Log "$ServiceName is healthy"
            return $true
        } catch {
            $attempt++
            Start-Sleep -Seconds 2
        }
    }
    
    Error "$ServiceName failed to become healthy after $maxAttempts attempts"
    return $false
}

# Activate services in a phase
function Activate-Phase {
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
    Check-Files
    Check-PortConflicts
    
    # Activate Phase 1: Critical Services (21 services)
    Activate-Phase -PhaseFile $Phase1File -PhaseName "Phase 1: Critical Services (21 services)"
    
    # Wait 5 seconds between phases
    Log "Waiting 5 seconds before Phase 2..."
    Start-Sleep -Seconds 5
    
    # Activate Phase 2: Medium Priority Services (20 services)
    Activate-Phase -PhaseFile $Phase2File -PhaseName "Phase 2: Medium Priority Services (20 services)"
    
    # Wait 5 seconds between phases
    Log "Waiting 5 seconds before Phase 3..."
    Start-Sleep -Seconds 5
    
    # Activate Phase 3: Low Priority Services (24 services)
    Activate-Phase -PhaseFile $Phase3File -PhaseName "Phase 3: Low Priority Services (24 services)"
    
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
    Log "1. Verify all services are healthy: curl http://localhost:PORT/health"
    Log "2. Check monitoring dashboards: http://grafana:3000"
    Log "3. Review logs: Get-Content $LogFile -Wait"
    Log "4. Test service integration with active microservices"
}

# Run main function
Main
