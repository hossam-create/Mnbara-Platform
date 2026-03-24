$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Running Prisma Migrations"
Write-Host "========================================"
Write-Host ""

$DB_PASS = "mnbarh_dev_password"
$services = @(
    @{Name="Auth"; Path="backend\services\auth-service"; DB="auth_db"},
    @{Name="User"; Path="backend\services\user-service"; DB="listing_db"},
    @{Name="Payment"; Path="backend\services\payment-service"; DB="payment_db"},
    @{Name="Product"; Path="backend\services\product-service"; DB="orders_db"},
    @{Name="Wallet"; Path="backend\services\wallet-service"; DB="wallet_db"},
    @{Name="Orders"; Path="backend\services\orders-service"; DB="orders_db"},
    @{Name="Escrow"; Path="backend\services\escrow-service"; DB="escrow_db"},
    @{Name="Trips"; Path="backend\services\trips-service"; DB="trips_db"},
    @{Name="Matching"; Path="backend\services\matching-service"; DB="matching_db"},
    @{Name="Notification"; Path="backend\services\notification-service"; DB="notification_db"}
)

$count = 1
foreach ($service in $services) {
    Write-Host "[$count/10] $($service.Name) Service..."
    
    Push-Location $service.Path
    $env:DATABASE_URL = "postgresql://mnbarh:$DB_PASS@localhost:5432/$($service.DB)?schema=public"
    
    try {
        npx prisma migrate deploy 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Migration failed for $($service.Name)"
        }
    } catch {
        Write-Host "FAILED: $($service.Name) Service" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    $count++
}

Write-Host ""
Write-Host "========================================"
Write-Host "All migrations completed successfully!"
Write-Host "========================================"
Write-Host ""
Write-Host "Next: Run scripts\start-services-manual.bat"
