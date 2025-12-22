# Vault Secrets Rotation Validation Tests for MNBARA Platform (PowerShell)
# Tests credential rotation and certificate renewal configurations
# Requirements: 19.1 - API Gateway Security

param(
    [string]$VaultPath = "infrastructure/k8s/vault"
)

$ErrorActionPreference = "Stop"

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0

# File paths
$DatabaseSecretsFile = Join-Path $VaultPath "vault-database-secrets.yaml"
$PkiFile = Join-Path $VaultPath "vault-pki.yaml"
$SecretsConfigFile = Join-Path $VaultPath "vault-secrets-config.yaml"
$KubernetesAuthFile = Join-Path $VaultPath "vault-kubernetes-auth.yaml"
$AgentInjectorFile = Join-Path $VaultPath "vault-agent-injector.yaml"

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
Write-Host "MNBARA Vault Secrets Rotation Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Credential Rotation Tests
# ============================================
Write-Host "--- Credential Rotation Tests ---" -ForegroundColor Cyan
Write-Host ""

# Test 1: Database secrets configuration file exists
$DatabaseSecretsExist = Test-Path $DatabaseSecretsFile
Write-TestResult -TestName "Database secrets configuration file exists" -Passed $DatabaseSecretsExist -Message ("File not found: " + $DatabaseSecretsFile)

if ($DatabaseSecretsExist) {
    $DatabaseContent = Get-Content $DatabaseSecretsFile -Raw
    
    # Test 2: Database secrets engine is enabled
    $HasDatabaseEngine = $DatabaseContent -match "vault secrets enable.*database"
    Write-TestResult -TestName "Database secrets engine is enabled" -Passed $HasDatabaseEngine -Message "Database secrets engine enable command not found"
    
    # Test 3: PostgreSQL plugin is configured
    $HasPostgresPlugin = $DatabaseContent -match "plugin_name=postgresql-database-plugin"
    Write-TestResult -TestName "PostgreSQL database plugin is configured" -Passed $HasPostgresPlugin -Message "PostgreSQL plugin configuration not found"
    
    # Test 4: Dynamic roles are defined
    $HasReadonlyRole = $DatabaseContent -match "database/roles/mnbara-readonly"
    $HasReadwriteRole = $DatabaseContent -match "database/roles/mnbara-readwrite"
    $HasAdminRole = $DatabaseContent -match "database/roles/mnbara-admin"
    $AllRolesDefined = $HasReadonlyRole -and $HasReadwriteRole -and $HasAdminRole
    Write-TestResult -TestName "All database roles are defined (readonly, readwrite, admin)" -Passed $AllRolesDefined -Message "Missing roles: readonly=$HasReadonlyRole, readwrite=$HasReadwriteRole, admin=$HasAdminRole"
    
    # Test 5: TTL is configured for credential rotation
    $HasDefaultTtl = $DatabaseContent -match "default_ttl="
    $HasMaxTtl = $DatabaseContent -match "max_ttl="
    $TtlConfigured = $HasDefaultTtl -and $HasMaxTtl
    Write-TestResult -TestName "TTL is configured for credential rotation" -Passed $TtlConfigured -Message "TTL configuration not found"
    
    # Test 6: Readonly role has appropriate TTL (1h default, 24h max)
    $ReadonlyTtlMatch = $DatabaseContent -match 'mnbara-readonly[\s\S]*?default_ttl="1h"[\s\S]*?max_ttl="24h"'
    Write-TestResult -TestName "Readonly role has appropriate TTL (1h/24h)" -Passed $ReadonlyTtlMatch -Message "Expected default_ttl=1h and max_ttl=24h for readonly role"
    
    # Test 7: Admin role has shorter TTL for security (30m default, 2h max)
    $AdminTtlMatch = $DatabaseContent -match 'mnbara-admin[\s\S]*?default_ttl="30m"[\s\S]*?max_ttl="2h"'
    Write-TestResult -TestName "Admin role has shorter TTL for security (30m/2h)" -Passed $AdminTtlMatch -Message "Expected default_ttl=30m and max_ttl=2h for admin role"
    
    # Test 8: Revocation statements are configured
    $HasRevocationStatements = $DatabaseContent -match "revocation_statements="
    Write-TestResult -TestName "Revocation statements are configured for credential cleanup" -Passed $HasRevocationStatements -Message "Revocation statements not found"
    
    # Test 9: Password authentication method is secure
    $HasScramAuth = $DatabaseContent -match "password_authentication.*scram-sha-256"
    Write-TestResult -TestName "Password authentication uses SCRAM-SHA-256" -Passed $HasScramAuth -Message "SCRAM-SHA-256 authentication not configured"
    
    # Test 10: SSL mode is required for database connection
    $HasSslRequired = $DatabaseContent -match "sslmode=require"
    Write-TestResult -TestName "SSL mode is required for database connections" -Passed $HasSslRequired -Message "SSL mode not set to require"
}

Write-Host ""
Write-Host "--- Certificate Renewal Tests ---" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Certificate Renewal Tests
# ============================================

# Test 11: PKI configuration file exists
$PkiExists = Test-Path $PkiFile
Write-TestResult -TestName "PKI configuration file exists" -Passed $PkiExists -Message ("File not found: " + $PkiFile)

if ($PkiExists) {
    $PkiContent = Get-Content $PkiFile -Raw
    
    # Test 12: Root PKI secrets engine is enabled
    $HasRootPki = $PkiContent -match "vault secrets enable.*-path=pki\s+pki"
    Write-TestResult -TestName "Root PKI secrets engine is enabled" -Passed $HasRootPki -Message "Root PKI engine not enabled"
    
    # Test 13: Intermediate PKI secrets engine is enabled
    $HasIntermediatePki = $PkiContent -match "vault secrets enable.*-path=pki_int\s+pki"
    Write-TestResult -TestName "Intermediate PKI secrets engine is enabled" -Passed $HasIntermediatePki -Message "Intermediate PKI engine not enabled"
    
    # Test 14: Root CA has long TTL (10 years)
    $HasRootTtl = $PkiContent -match "max-lease-ttl=87600h"
    Write-TestResult -TestName "Root CA has 10-year TTL configured" -Passed $HasRootTtl -Message "Root CA TTL not set to 87600h (10 years)"
    
    # Test 15: Intermediate CA has appropriate TTL (5 years)
    $HasIntermediateTtl = $PkiContent -match "pki_int[\s\S]*?max-lease-ttl=43800h"
    Write-TestResult -TestName "Intermediate CA has 5-year TTL configured" -Passed $HasIntermediateTtl -Message "Intermediate CA TTL not set to 43800h (5 years)"
    
    # Test 16: Service certificate role is defined
    $HasServiceRole = $PkiContent -match "pki_int/roles/mnbara-service"
    Write-TestResult -TestName "Service certificate role is defined" -Passed $HasServiceRole -Message "mnbara-service PKI role not found"
    
    # Test 17: Internal service role is defined with shorter TTL
    $HasInternalRole = $PkiContent -match "pki_int/roles/mnbara-internal"
    Write-TestResult -TestName "Internal service certificate role is defined" -Passed $HasInternalRole -Message "mnbara-internal PKI role not found"
    
    # Test 18: Service certificates have reasonable TTL (72h default, 720h max)
    $HasServiceTtl = $PkiContent -match "mnbara-service[\s\S]*?max_ttl=720h[\s\S]*?ttl=72h"
    Write-TestResult -TestName "Service certificates have 72h/720h TTL" -Passed ([bool]$HasServiceTtl) -Message "Expected ttl=72h and max_ttl=720h for service certificates"
    
    # Test 19: Internal certificates have shorter TTL (24h default)
    $InternalTtlMatch = $PkiContent -match 'mnbara-internal[\s\S]*?ttl=24h'
    Write-TestResult -TestName "Internal certificates have 24h TTL for frequent rotation" -Passed $InternalTtlMatch -Message "Expected ttl=24h for internal certificates"
    
    # Test 20: CRL distribution points are configured
    $HasCrl = $PkiContent -match "crl_distribution_points="
    Write-TestResult -TestName "CRL distribution points are configured" -Passed $HasCrl -Message "CRL distribution points not configured"
    
    # Test 21: Issuing certificates URL is configured
    $HasIssuingUrl = $PkiContent -match "issuing_certificates="
    Write-TestResult -TestName "Issuing certificates URL is configured" -Passed $HasIssuingUrl -Message "Issuing certificates URL not configured"
    
    # Test 22: Key usage is properly configured
    $HasKeyUsage = $PkiContent -match 'key_usage="DigitalSignature,KeyEncipherment"'
    Write-TestResult -TestName "Key usage includes DigitalSignature and KeyEncipherment" -Passed $HasKeyUsage -Message "Key usage not properly configured"
    
    # Test 23: Extended key usage includes ServerAuth and ClientAuth
    $HasExtKeyUsage = $PkiContent -match 'ext_key_usage="ServerAuth,ClientAuth"'
    Write-TestResult -TestName "Extended key usage includes ServerAuth and ClientAuth" -Passed $HasExtKeyUsage -Message "Extended key usage not properly configured"
    
    # Test 24: Allowed domains are configured for service certificates
    $HasAllowedDomains = $PkiContent -match "allowed_domains="
    Write-TestResult -TestName "Allowed domains are configured for certificate issuance" -Passed $HasAllowedDomains -Message "Allowed domains not configured"
}

Write-Host ""
Write-Host "--- Vault Agent Integration Tests ---" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Vault Agent Integration Tests (for auto-renewal)
# ============================================

# Test 25: Agent Injector configuration exists
$AgentInjectorExists = Test-Path $AgentInjectorFile
Write-TestResult -TestName "Vault Agent Injector configuration exists" -Passed $AgentInjectorExists -Message ("File not found: " + $AgentInjectorFile)

if ($AgentInjectorExists) {
    $AgentContent = Get-Content $AgentInjectorFile -Raw
    
    # Test 26: Agent Injector deployment is configured
    $HasInjectorDeployment = $AgentContent -match "kind:\s*Deployment"
    Write-TestResult -TestName "Agent Injector deployment is configured" -Passed $HasInjectorDeployment -Message "Deployment kind not found"
    
    # Test 27: MutatingWebhookConfiguration is present
    $HasWebhook = $AgentContent -match "kind:\s*MutatingWebhookConfiguration"
    Write-TestResult -TestName "MutatingWebhookConfiguration is present for pod injection" -Passed $HasWebhook -Message "MutatingWebhookConfiguration not found"
}

# Test 28: Kubernetes auth configuration exists
$KubernetesAuthExists = Test-Path $KubernetesAuthFile
Write-TestResult -TestName "Kubernetes authentication configuration exists" -Passed $KubernetesAuthExists -Message ("File not found: " + $KubernetesAuthFile)

if ($KubernetesAuthExists) {
    $KubeAuthContent = Get-Content $KubernetesAuthFile -Raw
    
    # Test 29: Kubernetes auth method is enabled
    $HasKubeAuth = $KubeAuthContent -match "auth enable kubernetes"
    Write-TestResult -TestName "Kubernetes authentication method is enabled" -Passed ([bool]$HasKubeAuth) -Message "Kubernetes auth enable command not found"
    
    # Test 30: Token TTL is configured for Kubernetes auth roles
    $HasTokenTtl = $KubeAuthContent -match "ttl=1h"
    Write-TestResult -TestName "Token TTL is configured for Kubernetes authentication" -Passed ([bool]$HasTokenTtl) -Message "Token TTL not configured"
}

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
