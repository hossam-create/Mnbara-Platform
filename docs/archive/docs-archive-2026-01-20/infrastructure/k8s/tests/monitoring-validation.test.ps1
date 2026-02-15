# Monitoring Validation Tests for MNBARA Platform (PowerShell)
# Tests alert firing conditions and dashboard data accuracy
# Requirements: 20.1, 20.3 - Monitoring and Observability

param(
    [string]$MonitoringPath = "infrastructure/k8s/monitoring"
)

$ErrorActionPreference = "Stop"

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0

# Paths
$AlertRulesFile = Join-Path $MonitoringPath "alertmanager/prometheus-alert-rules.yaml"
$DashboardsPath = Join-Path $MonitoringPath "grafana/dashboards"

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = ""
    )
    
    if ($Passed) {
        Write-Host ("PASS: " + $TestName) -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host ("FAIL: " + $TestName) -ForegroundColor Red
        if ($Message) {
            Write-Host ("  Reason: " + $Message) -ForegroundColor Yellow
        }
        $script:TestsFailed++
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MNBARA Monitoring Validation Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Alert Rules Validation Tests
# ============================================
Write-Host "--- Alert Rules Validation Tests ---" -ForegroundColor Cyan
Write-Host ""

# Test 1: Alert rules file exists
$AlertRulesExist = Test-Path $AlertRulesFile
Write-TestResult -TestName "Alert rules file exists" -Passed $AlertRulesExist -Message ("File not found: " + $AlertRulesFile)

if ($AlertRulesExist) {
    $AlertRulesContent = Get-Content $AlertRulesFile -Raw
    
    # Test 2: Alert rules have valid PrometheusRule kind
    $HasPrometheusRuleKind = $AlertRulesContent -match "kind:\s*PrometheusRule"
    Write-TestResult -TestName "Alert rules have valid PrometheusRule kind" -Passed $HasPrometheusRuleKind -Message "Missing kind: PrometheusRule"
    
    # Test 3: Critical alerts have severity label
    $CriticalAlerts = ([regex]::Matches($AlertRulesContent, "severity:\s*critical")).Count
    $HasCriticalAlerts = $CriticalAlerts -gt 0
    Write-TestResult -TestName ("Critical alerts have severity label - " + $CriticalAlerts + " found") -Passed $HasCriticalAlerts -Message "No critical severity alerts found"
    
    # Test 4: Payment failure alert exists with correct threshold
    $HasPaymentAlert = $AlertRulesContent -match "PaymentFailureRateHigh"
    $HasCorrectThreshold = $AlertRulesContent -match "PaymentFailureRateHigh[\s\S]*?>\s*0\.05"
    Write-TestResult -TestName "PaymentFailureRateHigh alert exists with 5 percent threshold" -Passed ($HasPaymentAlert -and $HasCorrectThreshold) -Message "Alert not found or threshold not 0.05"
    
    # Test 5: Auction timer drift alert exists with correct threshold
    $HasAuctionAlert = $AlertRulesContent -match "AuctionTimerDrift"
    $HasAuctionThreshold = $AlertRulesContent -match "AuctionTimerDrift[\s\S]*?>\s*1"
    Write-TestResult -TestName "AuctionTimerDrift alert exists with 1s threshold" -Passed ($HasAuctionAlert -and $HasAuctionThreshold) -Message "Alert not found or threshold not 1 second"
    
    # Test 6: ServiceDown alert exists with correct expression
    $HasServiceDownAlert = $AlertRulesContent -match "alert:\s*ServiceDown"
    $HasUpMetric = $AlertRulesContent -match "up\s*==\s*0"
    Write-TestResult -TestName "ServiceDown alert exists with correct expression" -Passed ($HasServiceDownAlert -and $HasUpMetric) -Message "Alert not found or expression incorrect"
    
    # Test 7: All alerts have annotations
    $AlertsCount = ([regex]::Matches($AlertRulesContent, "- alert:")).Count
    $AnnotationsCount = ([regex]::Matches($AlertRulesContent, "annotations:")).Count
    $AllHaveAnnotations = $AlertsCount -eq $AnnotationsCount
    Write-TestResult -TestName ("All alerts have annotations - " + $AlertsCount + " alerts") -Passed $AllHaveAnnotations -Message ("Found " + $AlertsCount + " alerts but " + $AnnotationsCount + " annotations")
    
    # Test 8: Alerts have for duration configured
    $ForCount = ([regex]::Matches($AlertRulesContent, "\bfor:")).Count
    $AllHaveFor = $ForCount -ge $AlertsCount
    Write-TestResult -TestName "All alerts have for duration configured" -Passed $AllHaveFor -Message ("Found " + $AlertsCount + " alerts but only " + $ForCount + " for clauses")
    
    # Test 9: Alert groups are properly named
    $ExpectedGroups = @("payment.alerts", "auction.alerts", "service.health", "infrastructure.alerts")
    $MissingGroups = @()
    foreach ($group in $ExpectedGroups) {
        if ($AlertRulesContent -notmatch ("name:\s*" + $group)) {
            $MissingGroups += $group
        }
    }
    $AllGroupsExist = $MissingGroups.Count -eq 0
    Write-TestResult -TestName "All expected alert groups exist" -Passed $AllGroupsExist -Message ("Missing groups: " + ($MissingGroups -join ", "))
}

Write-Host ""
Write-Host "--- Dashboard Validation Tests ---" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Dashboard Validation Tests
# ============================================

$ServiceHealthDashboard = Join-Path $DashboardsPath "service-health.json"

# Test 10: Service health dashboard exists
$DashboardExists = Test-Path $ServiceHealthDashboard
Write-TestResult -TestName "Service health dashboard exists" -Passed $DashboardExists -Message ("File not found: " + $ServiceHealthDashboard)

if ($DashboardExists) {
    $DashboardContent = Get-Content $ServiceHealthDashboard -Raw
    
    # Test 11: Dashboard has valid JSON structure
    $ValidJson = $false
    try {
        $null = $DashboardContent | ConvertFrom-Json
        $ValidJson = $true
    } catch {
        $ValidJson = $false
    }
    Write-TestResult -TestName "Service health dashboard has valid JSON" -Passed $ValidJson -Message "Invalid JSON structure"
    
    # Test 12: Dashboard has required panels
    $PanelsCount = ([regex]::Matches($DashboardContent, '"type":')).Count
    $HasEnoughPanels = $PanelsCount -gt 5
    Write-TestResult -TestName ("Service health dashboard has panels - " + $PanelsCount + " found") -Passed $HasEnoughPanels -Message "Expected more than 5 panels"
    
    # Test 13: Dashboard queries use Prometheus datasource
    $HasPrometheusDatasource = $DashboardContent -match '"type":\s*"prometheus"'
    Write-TestResult -TestName "Dashboard uses Prometheus datasource" -Passed $HasPrometheusDatasource -Message "Prometheus datasource not found"
    
    # Test 14: Dashboard has service status panels
    $Services = @("api-gateway", "auth-service", "auction-service", "payment-service")
    $MissingServices = @()
    foreach ($service in $Services) {
        if ($DashboardContent -notmatch $service) {
            $MissingServices += $service
        }
    }
    $AllServicesFound = $MissingServices.Count -eq 0
    Write-TestResult -TestName "Dashboard has all service status panels" -Passed $AllServicesFound -Message ("Missing services: " + ($MissingServices -join ", "))
    
    # Test 15: Dashboard has request rate query
    $HasRequestRate = $DashboardContent -match "http_requests_total"
    Write-TestResult -TestName "Dashboard has request rate metrics" -Passed $HasRequestRate -Message "http_requests_total metric not found"
    
    # Test 16: Dashboard has error rate query
    $HasErrorRate = $DashboardContent -match 'status=~\\"5\.\.\\"'
    Write-TestResult -TestName "Dashboard has error rate metrics" -Passed $HasErrorRate -Message "5xx error rate query not found"
    
    # Test 17: Dashboard has latency metrics
    $HasLatency = $DashboardContent -match "histogram_quantile"
    Write-TestResult -TestName "Dashboard has latency metrics using histogram_quantile" -Passed $HasLatency -Message "histogram_quantile not found"
}

# Test 18: All required dashboards exist
$RequiredDashboards = @("service-health.json", "auction-activity.json", "payment-transactions.json", "crowdship-delivery.json")
$MissingDashboards = @()
foreach ($dashboard in $RequiredDashboards) {
    $dashboardPath = Join-Path $DashboardsPath $dashboard
    if (-not (Test-Path $dashboardPath)) {
        $MissingDashboards += $dashboard
    }
}
$AllDashboardsExist = $MissingDashboards.Count -eq 0
Write-TestResult -TestName "All required dashboards exist" -Passed $AllDashboardsExist -Message ("Missing: " + ($MissingDashboards -join ", "))

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ("Passed: " + $script:TestsPassed) -ForegroundColor Green
Write-Host ("Failed: " + $script:TestsFailed) -ForegroundColor Red
Write-Host ""

if ($script:TestsFailed -gt 0) {
    exit 1
}

exit 0
