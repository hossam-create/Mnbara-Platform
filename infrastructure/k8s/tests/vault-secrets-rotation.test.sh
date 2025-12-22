#!/bin/bash
# Vault Secrets Rotation Validation Tests for MNBARA Platform (Bash)
# Tests credential rotation and certificate renewal configurations
# Requirements: 19.1 - API Gateway Security

set -e

# Configuration
VAULT_PATH="${VAULT_PATH:-infrastructure/k8s/vault}"

# File paths
DATABASE_SECRETS_FILE="$VAULT_PATH/vault-database-secrets.yaml"
PKI_FILE="$VAULT_PATH/vault-pki.yaml"
SECRETS_CONFIG_FILE="$VAULT_PATH/vault-secrets-config.yaml"
KUBERNETES_AUTH_FILE="$VAULT_PATH/vault-kubernetes-auth.yaml"
AGENT_INJECTOR_FILE="$VAULT_PATH/vault-agent-injector.yaml"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test result function
test_result() {
    local test_name="$1"
    local passed="$2"
    local message="${3:-}"
    
    if [ "$passed" = "true" ]; then
        echo -e "${GREEN}PASS: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}FAIL: $test_name${NC}"
        if [ -n "$message" ]; then
            echo -e "${YELLOW}  Reason: $message${NC}"
        fi
        ((TESTS_FAILED++))
    fi
}

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}MNBARA Vault Secrets Rotation Tests${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# ============================================
# Credential Rotation Tests
# ============================================
echo -e "${CYAN}--- Credential Rotation Tests ---${NC}"
echo ""

# Test 1: Database secrets configuration file exists
if [ -f "$DATABASE_SECRETS_FILE" ]; then
    test_result "Database secrets configuration file exists" "true"
    DATABASE_CONTENT=$(cat "$DATABASE_SECRETS_FILE")
    
    # Test 2: Database secrets engine is enabled
    if echo "$DATABASE_CONTENT" | grep -q "vault secrets enable.*database"; then
        test_result "Database secrets engine is enabled" "true"
    else
        test_result "Database secrets engine is enabled" "false" "Database secrets engine enable command not found"
    fi
    
    # Test 3: PostgreSQL plugin is configured
    if echo "$DATABASE_CONTENT" | grep -q "plugin_name=postgresql-database-plugin"; then
        test_result "PostgreSQL database plugin is configured" "true"
    else
        test_result "PostgreSQL database plugin is configured" "false" "PostgreSQL plugin configuration not found"
    fi
    
    # Test 4: Dynamic roles are defined
    HAS_READONLY=$(echo "$DATABASE_CONTENT" | grep -c "database/roles/mnbara-readonly" || true)
    HAS_READWRITE=$(echo "$DATABASE_CONTENT" | grep -c "database/roles/mnbara-readwrite" || true)
    HAS_ADMIN=$(echo "$DATABASE_CONTENT" | grep -c "database/roles/mnbara-admin" || true)
    
    if [ "$HAS_READONLY" -gt 0 ] && [ "$HAS_READWRITE" -gt 0 ] && [ "$HAS_ADMIN" -gt 0 ]; then
        test_result "All database roles are defined (readonly, readwrite, admin)" "true"
    else
        test_result "All database roles are defined (readonly, readwrite, admin)" "false" "Missing roles"
    fi
    
    # Test 5: TTL is configured for credential rotation
    HAS_DEFAULT_TTL=$(echo "$DATABASE_CONTENT" | grep -c "default_ttl=" || true)
    HAS_MAX_TTL=$(echo "$DATABASE_CONTENT" | grep -c "max_ttl=" || true)
    
    if [ "$HAS_DEFAULT_TTL" -gt 0 ] && [ "$HAS_MAX_TTL" -gt 0 ]; then
        test_result "TTL is configured for credential rotation" "true"
    else
        test_result "TTL is configured for credential rotation" "false" "TTL configuration not found"
    fi
    
    # Test 6: Readonly role has appropriate TTL (1h default, 24h max)
    if echo "$DATABASE_CONTENT" | grep -A 20 "mnbara-readonly" | grep -q 'default_ttl="1h"'; then
        test_result "Readonly role has appropriate TTL (1h/24h)" "true"
    else
        test_result "Readonly role has appropriate TTL (1h/24h)" "false" "Expected default_ttl=1h for readonly role"
    fi
    
    # Test 7: Admin role has shorter TTL for security (30m default, 2h max)
    if echo "$DATABASE_CONTENT" | grep -A 20 "mnbara-admin" | grep -q 'default_ttl="30m"'; then
        test_result "Admin role has shorter TTL for security (30m/2h)" "true"
    else
        test_result "Admin role has shorter TTL for security (30m/2h)" "false" "Expected default_ttl=30m for admin role"
    fi
    
    # Test 8: Revocation statements are configured
    if echo "$DATABASE_CONTENT" | grep -q "revocation_statements="; then
        test_result "Revocation statements are configured for credential cleanup" "true"
    else
        test_result "Revocation statements are configured for credential cleanup" "false" "Revocation statements not found"
    fi
    
    # Test 9: Password authentication method is secure
    if echo "$DATABASE_CONTENT" | grep -q "password_authentication.*scram-sha-256"; then
        test_result "Password authentication uses SCRAM-SHA-256" "true"
    else
        test_result "Password authentication uses SCRAM-SHA-256" "false" "SCRAM-SHA-256 authentication not configured"
    fi
    
    # Test 10: SSL mode is required for database connection
    if echo "$DATABASE_CONTENT" | grep -q "sslmode=require"; then
        test_result "SSL mode is required for database connections" "true"
    else
        test_result "SSL mode is required for database connections" "false" "SSL mode not set to require"
    fi
else
    test_result "Database secrets configuration file exists" "false" "File not found: $DATABASE_SECRETS_FILE"
fi

echo ""
echo -e "${CYAN}--- Certificate Renewal Tests ---${NC}"
echo ""

# ============================================
# Certificate Renewal Tests
# ============================================

# Test 11: PKI configuration file exists
if [ -f "$PKI_FILE" ]; then
    test_result "PKI configuration file exists" "true"
    PKI_CONTENT=$(cat "$PKI_FILE")
    
    # Test 12: Root PKI secrets engine is enabled
    if echo "$PKI_CONTENT" | grep -q "vault secrets enable.*-path=pki.*pki"; then
        test_result "Root PKI secrets engine is enabled" "true"
    else
        test_result "Root PKI secrets engine is enabled" "false" "Root PKI engine not enabled"
    fi
    
    # Test 13: Intermediate PKI secrets engine is enabled
    if echo "$PKI_CONTENT" | grep -q "vault secrets enable.*-path=pki_int.*pki"; then
        test_result "Intermediate PKI secrets engine is enabled" "true"
    else
        test_result "Intermediate PKI secrets engine is enabled" "false" "Intermediate PKI engine not enabled"
    fi
    
    # Test 14: Root CA has long TTL (10 years)
    if echo "$PKI_CONTENT" | grep -q "max-lease-ttl=87600h"; then
        test_result "Root CA has 10-year TTL configured" "true"
    else
        test_result "Root CA has 10-year TTL configured" "false" "Root CA TTL not set to 87600h (10 years)"
    fi
    
    # Test 15: Intermediate CA has appropriate TTL (5 years)
    if echo "$PKI_CONTENT" | grep -q "max-lease-ttl=43800h"; then
        test_result "Intermediate CA has 5-year TTL configured" "true"
    else
        test_result "Intermediate CA has 5-year TTL configured" "false" "Intermediate CA TTL not set to 43800h (5 years)"
    fi
    
    # Test 16: Service certificate role is defined
    if echo "$PKI_CONTENT" | grep -q "pki_int/roles/mnbara-service"; then
        test_result "Service certificate role is defined" "true"
    else
        test_result "Service certificate role is defined" "false" "mnbara-service PKI role not found"
    fi
    
    # Test 17: Internal service role is defined with shorter TTL
    if echo "$PKI_CONTENT" | grep -q "pki_int/roles/mnbara-internal"; then
        test_result "Internal service certificate role is defined" "true"
    else
        test_result "Internal service certificate role is defined" "false" "mnbara-internal PKI role not found"
    fi
    
    # Test 18: Service certificates have reasonable TTL (72h default)
    HAS_SERVICE_TTL=$(echo "$PKI_CONTENT" | grep -A 20 "mnbara-service" | grep -c "ttl=72h" || true)
    HAS_SERVICE_MAX_TTL=$(echo "$PKI_CONTENT" | grep -A 20 "mnbara-service" | grep -c "max_ttl=720h" || true)
    if [ "$HAS_SERVICE_TTL" -gt 0 ] && [ "$HAS_SERVICE_MAX_TTL" -gt 0 ]; then
        test_result "Service certificates have 72h/720h TTL" "true"
    else
        test_result "Service certificates have 72h/720h TTL" "false" "Expected ttl=72h and max_ttl=720h for service certificates"
    fi
    
    # Test 19: Internal certificates have shorter TTL (24h default)
    if echo "$PKI_CONTENT" | grep -A 20 "mnbara-internal" | grep -q "ttl=24h"; then
        test_result "Internal certificates have 24h TTL for frequent rotation" "true"
    else
        test_result "Internal certificates have 24h TTL for frequent rotation" "false" "Expected ttl=24h for internal certificates"
    fi
    
    # Test 20: CRL distribution points are configured
    if echo "$PKI_CONTENT" | grep -q "crl_distribution_points="; then
        test_result "CRL distribution points are configured" "true"
    else
        test_result "CRL distribution points are configured" "false" "CRL distribution points not configured"
    fi
    
    # Test 21: Issuing certificates URL is configured
    if echo "$PKI_CONTENT" | grep -q "issuing_certificates="; then
        test_result "Issuing certificates URL is configured" "true"
    else
        test_result "Issuing certificates URL is configured" "false" "Issuing certificates URL not configured"
    fi
    
    # Test 22: Key usage is properly configured
    if echo "$PKI_CONTENT" | grep -q 'key_usage="DigitalSignature,KeyEncipherment"'; then
        test_result "Key usage includes DigitalSignature and KeyEncipherment" "true"
    else
        test_result "Key usage includes DigitalSignature and KeyEncipherment" "false" "Key usage not properly configured"
    fi
    
    # Test 23: Extended key usage includes ServerAuth and ClientAuth
    if echo "$PKI_CONTENT" | grep -q 'ext_key_usage="ServerAuth,ClientAuth"'; then
        test_result "Extended key usage includes ServerAuth and ClientAuth" "true"
    else
        test_result "Extended key usage includes ServerAuth and ClientAuth" "false" "Extended key usage not properly configured"
    fi
    
    # Test 24: Allowed domains are configured for service certificates
    if echo "$PKI_CONTENT" | grep -q "allowed_domains="; then
        test_result "Allowed domains are configured for certificate issuance" "true"
    else
        test_result "Allowed domains are configured for certificate issuance" "false" "Allowed domains not configured"
    fi
else
    test_result "PKI configuration file exists" "false" "File not found: $PKI_FILE"
fi

echo ""
echo -e "${CYAN}--- Vault Agent Integration Tests ---${NC}"
echo ""

# ============================================
# Vault Agent Integration Tests (for auto-renewal)
# ============================================

# Test 25: Agent Injector configuration exists
if [ -f "$AGENT_INJECTOR_FILE" ]; then
    test_result "Vault Agent Injector configuration exists" "true"
    AGENT_CONTENT=$(cat "$AGENT_INJECTOR_FILE")
    
    # Test 26: Agent Injector deployment is configured
    if echo "$AGENT_CONTENT" | grep -q "kind:.*Deployment"; then
        test_result "Agent Injector deployment is configured" "true"
    else
        test_result "Agent Injector deployment is configured" "false" "Deployment kind not found"
    fi
    
    # Test 27: MutatingWebhookConfiguration is present
    if echo "$AGENT_CONTENT" | grep -q "kind:.*MutatingWebhookConfiguration"; then
        test_result "MutatingWebhookConfiguration is present for pod injection" "true"
    else
        test_result "MutatingWebhookConfiguration is present for pod injection" "false" "MutatingWebhookConfiguration not found"
    fi
else
    test_result "Vault Agent Injector configuration exists" "false" "File not found: $AGENT_INJECTOR_FILE"
fi

# Test 28: Kubernetes auth configuration exists
if [ -f "$KUBERNETES_AUTH_FILE" ]; then
    test_result "Kubernetes authentication configuration exists" "true"
    KUBE_AUTH_CONTENT=$(cat "$KUBERNETES_AUTH_FILE")
    
    # Test 29: Kubernetes auth method is enabled
    if echo "$KUBE_AUTH_CONTENT" | grep -q "auth enable kubernetes"; then
        test_result "Kubernetes authentication method is enabled" "true"
    else
        test_result "Kubernetes authentication method is enabled" "false" "Kubernetes auth enable command not found"
    fi
    
    # Test 30: Token TTL is configured for Kubernetes auth roles
    if echo "$KUBE_AUTH_CONTENT" | grep -q "ttl=1h"; then
        test_result "Token TTL is configured for Kubernetes authentication" "true"
    else
        test_result "Token TTL is configured for Kubernetes authentication" "false" "Token TTL not configured"
    fi
else
    test_result "Kubernetes authentication configuration exists" "false" "File not found: $KUBERNETES_AUTH_FILE"
fi

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}Test Summary${NC}"
echo -e "${CYAN}==========================================${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
    exit 1
fi

exit 0
