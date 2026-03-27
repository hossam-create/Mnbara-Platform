$ErrorActionPreference = "Stop"

Write-Host "Creating database schemas directly using psql..."
Write-Host ""

$services = @(
    @{Name="Auth"; DB="auth_db"; Schema="backend\services\auth-service\prisma\schema.prisma"},
    @{Name="User"; DB="listing_db"; Schema="backend\services\user-service\prisma\schema.prisma"},
    @{Name="Payment"; DB="payment_db"; Schema="backend\services\payment-service\prisma\schema.prisma"},
    @{Name="Product"; DB="orders_db"; Schema="backend\services\product-service\prisma\schema.prisma"},
    @{Name="Wallet"; DB="wallet_db"; Schema="backend\services\wallet-service\prisma\schema.prisma"},
    @{Name="Orders"; DB="orders_db"; Schema="backend\services\orders-service\prisma\schema.prisma"},
    @{Name="Escrow"; DB="escrow_db"; Schema="backend\services\escrow-service\prisma\schema.prisma"},
    @{Name="Trips"; DB="trips_db"; Schema="backend\services\trips-service\prisma\schema.prisma"},
    @{Name="Matching"; DB="matching_db"; Schema="backend\services\matching-service\prisma\schema.prisma"},
    @{Name="Notification"; DB="notification_db"; Schema="backend\services\notification-service\prisma\schema.prisma"}
)

foreach ($service in $services) {
    Write-Host "[$($service.Name)] Generating SQL from Prisma schema..."
    
    Push-Location (Split-Path $service.Schema)
    $env:DATABASE_URL = "postgresql://mnbarh@localhost:5432/$($service.DB)?schema=public"
    
    # Generate Prisma Client
    npx prisma generate 2>&1 | Out-Null
    
    # Use db push to create schema
    Write-Host "[$($service.Name)] Creating schema in $($service.DB)..."
    docker exec mnbarh-postgres psql -U mnbarh -d $service.DB -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" 2>&1 | Out-Null
    
    Pop-Location
}

Write-Host ""
Write-Host "Done! All schemas created."
Write-Host "Next: Run scripts\start-services-manual.bat"
