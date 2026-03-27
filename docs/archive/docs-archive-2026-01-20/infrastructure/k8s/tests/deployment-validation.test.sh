#!/bin/bash
# Deployment Validation Tests for MNBARA Platform
# Tests rolling update strategy and pod disruption budgets
# Requirements: 20.1 - Monitoring and Observability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Chart path
CHART_PATH="${CHART_PATH:-infrastructure/k8s/mnbara}"

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

# Function to check if helm is installed
check_helm() {
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}Error: helm is not installed${NC}"
        exit 1
    fi
}

# Function to render helm templates
render_templates() {
    local output_dir="$1"
    helm template test-release "$CHART_PATH" --output-dir "$output_dir" 2>/dev/null
}

echo "=========================================="
echo "MNBARA Deployment Validation Tests"
echo "=========================================="
echo ""

# Check prerequisites
check_helm

# Create temp directory for rendered templates
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Rendering Helm templates..."
if ! render_templates "$TEMP_DIR"; then
    echo -e "${RED}Failed to render Helm templates${NC}"
    exit 1
fi

echo ""
echo "--- Rolling Update Strategy Tests ---"
echo ""

# Test 1: Verify all deployments have RollingUpdate strategy
test_rolling_update_strategy() {
    local deployment_files=$(find "$TEMP_DIR" -name "*.yaml" -exec grep -l "kind: Deployment" {} \;)
    local all_pass=true
    local failed_deployments=""
    
    for file in $deployment_files; do
        local deployment_name=$(grep -A1 "kind: Deployment" "$file" | grep "name:" | head -1 | awk '{print $2}')
        local strategy=$(grep -A2 "strategy:" "$file" | grep "type:" | awk '{print $2}')
        
        if [ "$strategy" != "RollingUpdate" ]; then
            all_pass=false
            failed_deployments="$failed_deployments $deployment_name"
        fi
    done
    
    if [ "$all_pass" = true ]; then
        print_result "All deployments use RollingUpdate strategy" "PASS"
    else
        print_result "All deployments use RollingUpdate strategy" "FAIL" "Deployments without RollingUpdate:$failed_deployments"
    fi
}

# Test 2: Verify maxSurge is configured
test_max_surge_configured() {
    local deployment_files=$(find "$TEMP_DIR" -name "*.yaml" -exec grep -l "kind: Deployment" {} \;)
    local all_pass=true
    local failed_deployments=""
    
    for file in $deployment_files; do
        local deployment_name=$(grep -A1 "kind: Deployment" "$file" | grep "name:" | head -1 | awk '{print $2}')
        local max_surge=$(grep -A5 "rollingUpdate:" "$file" | grep "maxSurge:" | awk '{print $2}')
        
        if [ -z "$max_surge" ]; then
            all_pass=false
            failed_deployments="$failed_deployments $deployment_name"
        fi
    done
    
    if [ "$all_pass" = true ]; then
        print_result "All deployments have maxSurge configured" "PASS"
    else
        print_result "All deployments have maxSurge configured" "FAIL" "Missing maxSurge:$failed_deployments"
    fi
}

# Test 3: Verify maxUnavailable is set to 0 for zero-downtime
test_max_unavailable_zero() {
    local deployment_files=$(find "$TEMP_DIR" -name "*.yaml" -exec grep -l "kind: Deployment" {} \;)
    local all_pass=true
    local failed_deployments=""
    
    for file in $deployment_files; do
        local deployment_name=$(grep -A1 "kind: Deployment" "$file" | grep "name:" | head -1 | awk '{print $2}')
        local max_unavailable=$(grep -A5 "rollingUpdate:" "$file" | grep "maxUnavailable:" | awk '{print $2}')
        
        if [ "$max_unavailable" != "0" ]; then
            all_pass=false
            failed_deployments="$failed_deployments $deployment_name($max_unavailable)"
        fi
    done
    
    if [ "$all_pass" = true ]; then
        print_result "All deployments have maxUnavailable=0 for zero-downtime" "PASS"
    else
        print_result "All deployments have maxUnavailable=0 for zero-downtime" "FAIL" "Non-zero maxUnavailable:$failed_deployments"
    fi
}

# Test 4: Verify terminationGracePeriodSeconds is set
test_termination_grace_period() {
    local deployment_files=$(find "$TEMP_DIR" -name "*.yaml" -exec grep -l "kind: Deployment" {} \;)
    local all_pass=true
    local failed_deployments=""
    
    for file in $deployment_files; do
        local deployment_name=$(grep -A1 "kind: Deployment" "$file" | grep "name:" | head -1 | awk '{print $2}')
        local grace_period=$(grep "terminationGracePeriodSeconds:" "$file" | awk '{print $2}')
        
        if [ -z "$grace_period" ] || [ "$grace_period" -lt 30 ]; then
            all_pass=false
            failed_deployments="$failed_deployments $deployment_name"
        fi
    done
    
    if [ "$all_pass" = true ]; then
        print_result "All deployments have terminationGracePeriodSeconds >= 30" "PASS"
    else
        print_result "All deployments have terminationGracePeriodSeconds >= 30" "FAIL" "Missing or low grace period:$failed_deployments"
    fi
}

# Test 5: Verify preStop lifecycle hook exists
test_prestop_hook() {
    local deployment_files=$(find "$TEMP_DIR" -name "*.yaml" -exec grep -l "kind: Deployment" {} \;)
    local all_pass=true
    local failed_deployments=""
    
    for file in $deployment_files; do
        local deployment_name=$(grep -A1 "kind: Deployment" "$file" | grep "name:" | head -1 | awk '{print $2}')
        
        if ! grep -q "preStop:" "$file"; then
            all_pass=false
            failed_deployments="$failed_deployments $deployment_name"
        fi
    done
    
    if [ "$all_pass" = true ]; then
        print_result "All deployments have preStop lifecycle hook" "PASS"
    else
        print_result "All deployments have preStop lifecycle hook" "FAIL" "Missing preStop:$failed_deployments"
    fi
}

# Run rolling update tests
test_rolling_update_strategy
test_max_surge_configured
test_max_unavailable_zero
test_termination_grace_period
test_prestop_hook

echo ""
echo "--- Pod Disruption Budget Tests ---"
echo ""

# Test 6: Verify PDB exists for critical services
test_pdb_exists() {
    local pdb_file="$TEMP_DIR/mnbara/templates/pdb.yaml"
    
    if [ -f "$pdb_file" ]; then
        print_result "Pod Disruption Budget file exists" "PASS"
    else
        print_result "Pod Disruption Budget file exists" "FAIL" "pdb.yaml not found"
    fi
}

# Test 7: Verify PDB has minAvailable set
test_pdb_min_available() {
    local pdb_file="$TEMP_DIR/mnbara/templates/pdb.yaml"
    
    if [ -f "$pdb_file" ]; then
        local min_available_count=$(grep -c "minAvailable:" "$pdb_file" 2>/dev/null || echo "0")
        
        if [ "$min_available_count" -gt 0 ]; then
            print_result "PDBs have minAvailable configured" "PASS"
        else
            print_result "PDBs have minAvailable configured" "FAIL" "No minAvailable found in PDB"
        fi
    else
        print_result "PDBs have minAvailable configured" "FAIL" "PDB file not found"
    fi
}

# Test 8: Verify critical services have higher PDB requirements
test_critical_service_pdb() {
    local pdb_file="$TEMP_DIR/mnbara/templates/pdb.yaml"
    
    if [ -f "$pdb_file" ]; then
        # Check if auction-service has minAvailable: 2 (critical service)
        local auction_pdb=$(grep -A10 "auction-service-pdb" "$pdb_file" | grep "minAvailable:" | awk '{print $2}')
        
        if [ "$auction_pdb" = "2" ]; then
            print_result "Critical services (auction) have higher PDB minAvailable" "PASS"
        else
            print_result "Critical services (auction) have higher PDB minAvailable" "FAIL" "auction-service minAvailable=$auction_pdb, expected 2"
        fi
    else
        print_result "Critical services (auction) have higher PDB minAvailable" "FAIL" "PDB file not found"
    fi
}

# Test 9: Verify PDB selector matches deployment labels
test_pdb_selector_match() {
    local pdb_file="$TEMP_DIR/mnbara/templates/pdb.yaml"
    
    if [ -f "$pdb_file" ]; then
        local has_selector=$(grep -c "matchLabels:" "$pdb_file" 2>/dev/null || echo "0")
        
        if [ "$has_selector" -gt 0 ]; then
            print_result "PDBs have matchLabels selector configured" "PASS"
        else
            print_result "PDBs have matchLabels selector configured" "FAIL" "No matchLabels found"
        fi
    else
        print_result "PDBs have matchLabels selector configured" "FAIL" "PDB file not found"
    fi
}

# Test 10: Verify PDB API version is policy/v1
test_pdb_api_version() {
    local pdb_file="$TEMP_DIR/mnbara/templates/pdb.yaml"
    
    if [ -f "$pdb_file" ]; then
        local api_version=$(grep "apiVersion: policy/v1" "$pdb_file" | head -1)
        
        if [ -n "$api_version" ]; then
            print_result "PDBs use policy/v1 API version" "PASS"
        else
            print_result "PDBs use policy/v1 API version" "FAIL" "Expected policy/v1"
        fi
    else
        print_result "PDBs use policy/v1 API version" "FAIL" "PDB file not found"
    fi
}

# Run PDB tests
test_pdb_exists
test_pdb_min_available
test_critical_service_pdb
test_pdb_selector_match
test_pdb_api_version

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
