#!/bin/bash
# Monitoring Validation Tests for MNBARA Platform
# Tests alert firing conditions and dashboard data accuracy
# Requirements: 20.1, 20.3 - Monitoring and Observability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Paths
MONITORING_PATH="${MONITORING_PATH:-infrastructure/k8s/monitoring}"
ALERT_RULES_FILE="$MONITORING_PATH/alertmanager/prometheus-alert-rules.yaml"
DASHBOARDS_PATH="$MONITORING_PATH/grafana/dashboards"

# Function to print test results
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo -e "  ${YELLOW}Reason${NC}: $message"
        ((TESTS_FAILED++))
    fi
}

echo "=========================================="
echo "MNBARA Monitoring Validation Tests"
echo "=========================================="
echo ""

# ============================================
# Alert Rules Validation Tests
# ============================================
echo "--- Alert Rules Validation Tests ---"
echo ""

# Test 1: Alert rules file exists
test_alert_rules_exist() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        print_result "Alert rules file exists" "PASS"
    else
        print_result "Alert rules file exists" "FAIL" "File not found: $ALERT_RULES_FILE"
    fi
}

# Test 2: Alert rules have valid PrometheusRule kind
test_alert_rules_kind() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        if grep -q "kind: PrometheusRule" "$ALERT_RULES_FILE"; then
            print_result "Alert rules have valid PrometheusRule kind" "PASS"
        else
            print_result "Alert rules have valid PrometheusRule kind" "FAIL" "Missing 'kind: PrometheusRule'"
        fi
    else
        print_result "Alert rules have valid PrometheusRule kind" "FAIL" "Alert rules file not found"
    fi
}

# Test 3: Critical alerts have severity label
test_critical_alerts_severity() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        local critical_alerts=$(grep -c "severity: critical" "$ALERT_RULES_FILE" 2>/dev/null || echo "0")
        if [ "$critical_alerts" -gt 0 ]; then
            print_result "Critical alerts have severity label ($critical_alerts found)" "PASS"
        else
            print_result "Critical alerts have severity label" "FAIL" "No critical severity alerts found"
        fi
    else
        print_result "Critical alerts have severity label" "FAIL" "Alert rules file not found"
    fi
}

# Test 4: Payment failure alert exists with correct threshold
test_payment_failure_alert() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        if grep -q "PaymentFailureRateHigh" "$ALERT_RULES_FILE"; then
            # Check threshold is 5% (0.05)
            if grep -A10 "PaymentFailureRateHigh" "$ALERT_RULES_FILE" | grep -q "> 0.05"; then
                print_result "PaymentFailureRateHigh alert exists with 5% threshold" "PASS"
            else
                print_result "PaymentFailureRateHigh alert exists with 5% threshold" "FAIL" "Threshold not set to 0.05"
            fi
        else
            print_result "PaymentFailureRateHigh alert exists with 5% threshold" "FAIL" "Alert not found"
        fi
    else
        print_result "PaymentFailureRateHigh alert exists with 5% threshold" "FAIL" "Alert rules file not found"
    fi
}

# Test 5: Auction timer drift alert exists with correct threshold
test_auction_timer_drift_alert() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        if grep -q "AuctionTimerDrift" "$ALERT_RULES_FILE"; then
            # Check threshold is 1 second
            if grep -A10 "AuctionTimerDrift" "$ALERT_RULES_FILE" | grep -q "> 1"; then
                print_result "AuctionTimerDrift alert exists with 1s threshold" "PASS"
            else
                print_result "AuctionTimerDrift alert exists with 1s threshold" "FAIL" "Threshold not set to 1 second"
            fi
        else
            print_result "AuctionTimerDrift alert exists with 1s threshold" "FAIL" "Alert not found"
        fi
    else
        print_result "AuctionTimerDrift alert exists with 1s threshold" "FAIL" "Alert rules file not found"
    fi
}

# Test 6: ServiceDown alert exists
test_service_down_alert() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        if grep -q "ServiceDown" "$ALERT_RULES_FILE"; then
            # Check it uses up metric
            if grep -A5 "alert: ServiceDown" "$ALERT_RULES_FILE" | grep -q "up == 0"; then
                print_result "ServiceDown alert exists with correct expression" "PASS"
            else
                print_result "ServiceDown alert exists with correct expression" "FAIL" "Expression should use 'up == 0'"
            fi
        else
            print_result "ServiceDown alert exists with correct expression" "FAIL" "Alert not found"
        fi
    else
        print_result "ServiceDown alert exists with correct expression" "FAIL" "Alert rules file not found"
    fi
}

# Test 7: All alerts have annotations
test_alerts_have_annotations() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        local alerts_count=$(grep -c "alert:" "$ALERT_RULES_FILE" 2>/dev/null || echo "0")
        local annotations_count=$(grep -c "annotations:" "$ALERT_RULES_FILE" 2>/dev/null || echo "0")
        
        if [ "$alerts_count" -eq "$annotations_count" ]; then
            print_result "All alerts have annotations ($alerts_count alerts)" "PASS"
        else
            print_result "All alerts have annotations" "FAIL" "Found $alerts_count alerts but only $annotations_count annotations blocks"
        fi
    else
        print_result "All alerts have annotations" "FAIL" "Alert rules file not found"
    fi
}

# Test 8: Alerts have 'for' duration configured
test_alerts_have_for_duration() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        local alerts_count=$(grep -c "alert:" "$ALERT_RULES_FILE" 2>/dev/null || echo "0")
        local for_count=$(grep -c "for:" "$ALERT_RULES_FILE" 2>/dev/null || echo "0")
        
        if [ "$for_count" -ge "$alerts_count" ]; then
            print_result "All alerts have 'for' duration configured" "PASS"
        else
            print_result "All alerts have 'for' duration configured" "FAIL" "Found $alerts_count alerts but only $for_count 'for' clauses"
        fi
    else
        print_result "All alerts have 'for' duration configured" "FAIL" "Alert rules file not found"
    fi
}

# Test 9: Alert groups are properly named
test_alert_groups_named() {
    if [ -f "$ALERT_RULES_FILE" ]; then
        local expected_groups=("payment.alerts" "auction.alerts" "service.health" "infrastructure.alerts")
        local all_found=true
        local missing_groups=""
        
        for group in "${expected_groups[@]}"; do
            if ! grep -q "name: $group" "$ALERT_RULES_FILE"; then
                all_found=false
                missing_groups="$missing_groups $group"
            fi
        done
        
        if [ "$all_found" = true ]; then
            print_result "All expected alert groups exist" "PASS"
        else
            print_result "All expected alert groups exist" "FAIL" "Missing groups:$missing_groups"
        fi
    else
        print_result "All expected alert groups exist" "FAIL" "Alert rules file not found"
    fi
}

# Run alert rules tests
test_alert_rules_exist
test_alert_rules_kind
test_critical_alerts_severity
test_payment_failure_alert
test_auction_timer_drift_alert
test_service_down_alert
test_alerts_have_annotations
test_alerts_have_for_duration
test_alert_groups_named

echo ""
echo "--- Dashboard Validation Tests ---"
echo ""

# ============================================
# Dashboard Validation Tests
# ============================================

# Test 10: Service health dashboard exists
test_service_health_dashboard() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        print_result "Service health dashboard exists" "PASS"
    else
        print_result "Service health dashboard exists" "FAIL" "File not found: $dashboard_file"
    fi
}

# Test 11: Dashboard has valid JSON structure
test_dashboard_valid_json() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        if python3 -c "import json; json.load(open('$dashboard_file'))" 2>/dev/null || \
           python -c "import json; json.load(open('$dashboard_file'))" 2>/dev/null; then
            print_result "Service health dashboard has valid JSON" "PASS"
        else
            print_result "Service health dashboard has valid JSON" "FAIL" "Invalid JSON structure"
        fi
    else
        print_result "Service health dashboard has valid JSON" "FAIL" "Dashboard file not found"
    fi
}

# Test 12: Dashboard has required panels
test_dashboard_has_panels() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        local panels_count=$(grep -c '"type":' "$dashboard_file" 2>/dev/null || echo "0")
        if [ "$panels_count" -gt 5 ]; then
            print_result "Service health dashboard has panels ($panels_count found)" "PASS"
        else
            print_result "Service health dashboard has panels" "FAIL" "Expected more than 5 panels, found $panels_count"
        fi
    else
        print_result "Service health dashboard has panels" "FAIL" "Dashboard file not found"
    fi
}

# Test 13: Dashboard queries use Prometheus datasource
test_dashboard_prometheus_datasource() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        if grep -q '"type": "prometheus"' "$dashboard_file"; then
            print_result "Dashboard uses Prometheus datasource" "PASS"
        else
            print_result "Dashboard uses Prometheus datasource" "FAIL" "Prometheus datasource not found"
        fi
    else
        print_result "Dashboard uses Prometheus datasource" "FAIL" "Dashboard file not found"
    fi
}

# Test 14: Dashboard has service status panels
test_dashboard_service_status() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        local services=("api-gateway" "auth-service" "auction-service" "payment-service")
        local all_found=true
        local missing=""
        
        for service in "${services[@]}"; do
            if ! grep -q "$service" "$dashboard_file"; then
                all_found=false
                missing="$missing $service"
            fi
        done
        
        if [ "$all_found" = true ]; then
            print_result "Dashboard has all service status panels" "PASS"
        else
            print_result "Dashboard has all service status panels" "FAIL" "Missing services:$missing"
        fi
    else
        print_result "Dashboard has all service status panels" "FAIL" "Dashboard file not found"
    fi
}

# Test 15: Dashboard has request rate query
test_dashboard_request_rate() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        if grep -q "http_requests_total" "$dashboard_file"; then
            print_result "Dashboard has request rate metrics" "PASS"
        else
            print_result "Dashboard has request rate metrics" "FAIL" "http_requests_total metric not found"
        fi
    else
        print_result "Dashboard has request rate metrics" "FAIL" "Dashboard file not found"
    fi
}

# Test 16: Dashboard has error rate query
test_dashboard_error_rate() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        if grep -q 'status=~\\"5..\\"' "$dashboard_file"; then
            print_result "Dashboard has error rate metrics" "PASS"
        else
            print_result "Dashboard has error rate metrics" "FAIL" "5xx error rate query not found"
        fi
    else
        print_result "Dashboard has error rate metrics" "FAIL" "Dashboard file not found"
    fi
}

# Test 17: Dashboard has latency metrics
test_dashboard_latency() {
    local dashboard_file="$DASHBOARDS_PATH/service-health.json"
    if [ -f "$dashboard_file" ]; then
        if grep -q "histogram_quantile" "$dashboard_file"; then
            print_result "Dashboard has latency metrics (histogram_quantile)" "PASS"
        else
            print_result "Dashboard has latency metrics (histogram_quantile)" "FAIL" "histogram_quantile not found"
        fi
    else
        print_result "Dashboard has latency metrics (histogram_quantile)" "FAIL" "Dashboard file not found"
    fi
}

# Test 18: All required dashboards exist
test_all_dashboards_exist() {
    local required_dashboards=("service-health.json" "auction-activity.json" "payment-transactions.json" "crowdship-delivery.json")
    local all_found=true
    local missing=""
    
    for dashboard in "${required_dashboards[@]}"; do
        if [ ! -f "$DASHBOARDS_PATH/$dashboard" ]; then
            all_found=false
            missing="$missing $dashboard"
        fi
    done
    
    if [ "$all_found" = true ]; then
        print_result "All required dashboards exist" "PASS"
    else
        print_result "All required dashboards exist" "FAIL" "Missing:$missing"
    fi
}

# Run dashboard tests
test_service_health_dashboard
test_dashboard_valid_json
test_dashboard_has_panels
test_dashboard_prometheus_datasource
test_dashboard_service_status
test_dashboard_request_rate
test_dashboard_error_rate
test_dashboard_latency
test_all_dashboards_exist

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
fi

exit 0
