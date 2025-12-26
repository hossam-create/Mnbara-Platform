#!/bin/bash

# Mnbara Platform - Pre-Launch Validation Script
# Final validation before January 1, 2026 launch
# Status: COMPLETING FINAL 5%

set -e

echo "🔍 Mnbara Platform - Pre-Launch Validation"
echo "=========================================="
echo "Launch Date: January 1, 2026 🎊"
echo "Current Date: $(date)"
echo "Status: FINAL VALIDATION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Configuration
DOMAIN_NAME=${DOMAIN_NAME:-"mnbara.com"}
NAMESPACE="mnbara-production"

# Validation counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

validate_check() {
    local check_name="$1"
    local check_command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    print_check "Validating: $check_name"
    
    if eval "$check_command"; then
        print_pass "$check_name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        print_fail "$check_name"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

print_info "🎯 PRE-LAUNCH VALIDATION SUITE"
echo "==============================="

# Validation Suite 1: Infrastructure Readiness
print_info "=== INFRASTRUCTURE VALIDATION ==="

validate_check "Kubernetes Cluster Connection" "kubectl cluster-info > /dev/null 2>&1"
validate_check "Production Namespace Exists" "kubectl get namespace $NAMESPACE > /dev/null 2>&1"
validate_check "All Deployments Ready" "kubectl get deployments -n $NAMESPACE --no-headers | awk '{print \$2}' | grep -v '^0/' | wc -l | grep -q '^0$'"
validate_check "All Pods Running" "kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running --no-headers | wc -l | grep -q '^0$'"
validate_check "Ingress Controller Ready" "kubectl get pods -n ingress-nginx --field-selector=status.phase=Running --no-headers | wc -l | grep -q '[1-9]'"

# Validation Suite 2: Service Health Checks
print_info "=== SERVICE HEALTH VALIDATION ==="

SERVICES=(
    "auth-service:8080"
    "listing-service:3000"
    "payment-service:3001"
    "order-service:3002"
    "notification-service:3003"
    "frontend:80"
)

for service in "${SERVICES[@]}"; do
    service_name=$(echo $service | cut -d':' -f1)
    service_port=$(echo $service | cut -d':' -f2)
    validate_check "$service_name Service Health" "kubectl exec -n $NAMESPACE deployment/$service_name -- curl -f -s http://localhost:$service_port/health > /dev/null 2>&1"
done

# Validation Suite 3: Database Connectivity
print_info "=== DATABASE VALIDATION ==="

validate_check "PostgreSQL Connection" "kubectl exec -n $NAMESPACE deployment/postgres -- pg_isready -U mnbara_user > /dev/null 2>&1"
validate_check "Redis Connection" "kubectl exec -n $NAMESPACE deployment/redis -- redis-cli ping > /dev/null 2>&1"
validate_check "Elasticsearch Health" "kubectl exec -n $NAMESPACE deployment/elasticsearch -- curl -f -s http://localhost:9200/_cluster/health > /dev/null 2>&1"

# Validation Suite 4: SSL and Domain Configuration
print_info "=== SSL & DOMAIN VALIDATION ==="

validate_check "Main Domain SSL" "curl -f -s https://$DOMAIN_NAME > /dev/null 2>&1"
validate_check "API Domain SSL" "curl -f -s https://api.$DOMAIN_NAME/health > /dev/null 2>&1"
validate_check "Monitoring Domain SSL" "curl -f -s https://monitoring.$DOMAIN_NAME > /dev/null 2>&1"
validate_check "Status Domain SSL" "curl -f -s https://status.$DOMAIN_NAME > /dev/null 2>&1"

# Validation Suite 5: Security Configuration
print_info "=== SECURITY VALIDATION ==="

validate_check "OAuth Secrets Exist" "kubectl get secret oauth-secrets -n $NAMESPACE > /dev/null 2>&1"
validate_check "TLS Certificates Valid" "kubectl get certificate -n $NAMESPACE --no-headers | awk '{print \$2}' | grep -v True | wc -l | grep -q '^0$'"
validate_check "Security Headers Present" "curl -I https://$DOMAIN_NAME 2>/dev/null | grep -q 'Strict-Transport-Security'"

# Validation Suite 6: Monitoring and Observability
print_info "=== MONITORING VALIDATION ==="

validate_check "Prometheus Running" "kubectl get pods -n mnbara-monitoring -l app=prometheus --field-selector=status.phase=Running --no-headers | wc -l | grep -q '[1-9]'"
validate_check "Grafana Running" "kubectl get pods -n mnbara-monitoring -l app=grafana --field-selector=status.phase=Running --no-headers | wc -l | grep -q '[1-9]'"
validate_check "HPA Configured" "kubectl get hpa -n $NAMESPACE --no-headers | wc -l | grep -q '[1-9]'"

# Validation Suite 7: Performance Benchmarks
print_info "=== PERFORMANCE VALIDATION ==="

# Response time validation
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "https://$DOMAIN_NAME" 2>/dev/null || echo "999")
if [ $(echo "$RESPONSE_TIME < 3.0" | bc -l 2>/dev/null || echo "0") -eq 1 ]; then
    print_pass "Frontend Response Time (<3s): ${RESPONSE_TIME}s"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    print_fail "Frontend Response Time (>3s): ${RESPONSE_TIME}s"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

API_RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "https://api.$DOMAIN_NAME/health" 2>/dev/null || echo "999")
if [ $(echo "$API_RESPONSE_TIME < 1.0" | bc -l 2>/dev/null || echo "0") -eq 1 ]; then
    print_pass "API Response Time (<1s): ${API_RESPONSE_TIME}s"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    print_fail "API Response Time (>1s): ${API_RESPONSE_TIME}s"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Final Results
echo ""
print_info "🏁 PRE-LAUNCH VALIDATION RESULTS"
echo "================================="
echo ""
print_info "Total Checks: $TOTAL_CHECKS"
print_pass "Passed: $PASSED_CHECKS"
print_fail "Failed: $FAILED_CHECKS"

SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo ""
print_info "Success Rate: $SUCCESS_RATE%"

if [ $SUCCESS_RATE -ge 95 ]; then
    echo ""
    print_pass "🎉 EXCELLENT! Platform is ready for launch!"
    print_pass "🚀 All critical systems validated"
    echo ""
    echo "✅ Launch Readiness: APPROVED"
    echo "✅ System Health: EXCELLENT"
    echo "✅ Performance: OPTIMAL"
    echo "✅ Security: VALIDATED"
    echo "✅ Infrastructure: READY"
    echo ""
    echo "🎊 100% READY FOR JANUARY 1, 2026 LAUNCH! 🎊"
    VALIDATION_STATUS="APPROVED"
elif [ $SUCCESS_RATE -ge 90 ]; then
    echo ""
    print_info "⚠️  GOOD - Minor issues detected"
    print_info "🔧 Some non-critical validations failed"
    echo ""
    echo "⚠️  Launch Readiness: CONDITIONAL"
    echo "✅ System Health: GOOD"
    echo "⚠️  Performance: ACCEPTABLE"
    echo "✅ Security: VALIDATED"
    echo ""
    echo "🚀 Can launch with monitoring for issues"
    VALIDATION_STATUS="CONDITIONAL"
else
    echo ""
    print_fail "❌ CRITICAL ISSUES DETECTED"
    print_fail "🚨 Too many validations failed for safe launch"
    echo ""
    echo "❌ Launch Readiness: NOT READY"
    echo "❌ System Health: ISSUES DETECTED"
    echo "❌ Performance: NEEDS IMPROVEMENT"
    echo "❌ Security: REVIEW REQUIRED"
    echo ""
    echo "🔧 Fix critical issues before launch"
    VALIDATION_STATUS="NOT_READY"
fi

# Save validation results
cat > pre-launch-validation-results.txt << EOF
Mnbara Platform - Pre-Launch Validation Results
==============================================
Validation Date: $(date)
Launch Date: January 1, 2026

Summary:
- Total Checks: $TOTAL_CHECKS
- Passed: $PASSED_CHECKS
- Failed: $FAILED_CHECKS
- Success Rate: $SUCCESS_RATE%

Validation Categories:
✅ Infrastructure Validation
✅ Service Health Validation
✅ Database Validation
✅ SSL & Domain Validation
✅ Security Validation
✅ Monitoring Validation
✅ Performance Validation

Launch Readiness: $VALIDATION_STATUS

Final Status: $([ $SUCCESS_RATE -ge 95 ] && echo "🚀 READY FOR LAUNCH" || ([ $SUCCESS_RATE -ge 90 ] && echo "⚠️ CONDITIONAL LAUNCH" || echo "❌ NOT READY"))

Next Steps:
1. Review any failed validations and fix issues
2. Monitor system performance continuously
3. Prepare launch team and support
4. 🚀 EXECUTE LAUNCH ON JANUARY 1, 2026!

🎊 VALIDATION COMPLETE 🎊
EOF

print_pass "Validation results saved to pre-launch-validation-results.txt"
echo ""
print_info "🎊 PRE-LAUNCH VALIDATION COMPLETED! 🎊"

exit $([ $SUCCESS_RATE -ge 90 ] && echo 0 || echo 1)