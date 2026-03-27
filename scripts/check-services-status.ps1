# Check Archived Services Status
# Simple script to verify archived services are running

$ports = 3017..3087
$runningServices = 0

Write-Host "Checking archived services status..."
Write-Host "========================================"

foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "Port $port: RUNNING" -ForegroundColor Green
            $runningServices++
        } else {
            Write-Host "Port $port: NOT RUNNING" -ForegroundColor Red
        }
    } catch {
        Write-Host "Port $port: ERROR" -ForegroundColor Yellow
    }
}

Write-Host "========================================"
Write-Host "Total running services: $runningServices / 71"

if ($runningServices -eq 71) {
    Write-Host "All archived services running successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: Not all services are running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Check monitoring dashboards: http://grafana:3000"
Write-Host "2. Test service integration with active microservices"
Write-Host "3. Review archived-services-activation.log"
