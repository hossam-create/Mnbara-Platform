# FX Restriction Engine - Country-Level Rules

## Core Tables

### 1. FX_RULE_TYPES

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| rule_type_id | UUID | PK | Unique identifier |
| rule_type_code | VARCHAR(50) | UNIQUE NOT NULL | ALLOWED / ADVISORY / BLOCKED |
| rule_type_name | VARCHAR(255) | NOT NULL | Human-readable name |
| enforcement_level | INT | NOT NULL | 0=permissive, 1=warning, 2=hard_block |
| description | TEXT | | Rule behavior documentation |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |

**Enum Values:**
- ALLOWED (0): Transaction proceeds without friction
- ADVISORY (1): Transaction allowed with warning/disclosure
- BLOCKED (2): Transaction rejected at gateway

---

### 2. FX_COUNTRY_CAPABILITIES

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| capability_id | UUID | PK | Unique identifier |
| country_code | VARCHAR(2) | NOT NULL | ISO 3166-1 alpha-2 |
| source_currency | VARCHAR(3) | NOT NULL | ISO 4217 code |
| target_currency | VARCHAR(3) | NOT NULL | ISO 4217 code |
| rule_type_id | UUID | FK → FX_RULE_TYPES | Applied rule type |
| min_amount | DECIMAL(19,4) | | Minimum transaction amount |
| max_amount | DECIMAL(19,4) | | Maximum transaction amount |
| daily_limit | DECIMAL(19,4) | | Daily aggregate limit |
| monthly_limit | DECIMAL(19,4) | | Monthly aggregate limit |
| kyc_level_required | INT | | 0=none, 1=basic, 2=intermediate, 3=full |
| psp_whitelist | TEXT | | Comma-separated PSP codes allowed |
| psp_blacklist | TEXT | | Comma-separated PSP codes blocked |
| requires_disclosure | BOOLEAN | DEFAULT FALSE | Show FX advisory |
| requires_confirmation | BOOLEAN | DEFAULT FALSE | Explicit user confirmation |
| effective_date | DATE | NOT NULL | When rule becomes active |
| expiry_date | DATE | | When rule expires (NULL = indefinite) |
| version | INT | NOT NULL DEFAULT 1 | Rule version for tracking |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |
| created_by | UUID | FK → users | Admin who created rule |
| updated_by | UUID | FK → users | Admin who updated rule |

**Indexes:**
- (country_code, source_currency, target_currency, is_active)
- (country_code, effective_date, expiry_date)
- (rule_type_id, is_active)

---

### 3. FX_COUNTRY_RESTRICTIONS

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| restriction_id | UUID | PK | Unique identifier |
| country_code | VARCHAR(2) | NOT NULL | ISO 3166-1 alpha-2 |
| restriction_type | VARCHAR(50) | NOT NULL | INBOUND / OUTBOUND / BIDIRECTIONAL |
| affected_currencies | TEXT | NOT NULL | JSON array of currency codes |
| restriction_reason | VARCHAR(255) | | Regulatory/compliance reason |
| rule_type_id | UUID | FK → FX_RULE_TYPES | Default rule for this country |
| requires_license | BOOLEAN | DEFAULT FALSE | Requires special license |
| license_type | VARCHAR(100) | | Type of license required |
| sanctions_list_check | BOOLEAN | DEFAULT TRUE | Must check sanctions lists |
| aml_scoring_threshold | INT | | Risk score threshold (0-100) |
| effective_date | DATE | NOT NULL | When restriction becomes active |
| expiry_date | DATE | | When restriction expires |
| version | INT | NOT NULL DEFAULT 1 | Restriction version |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |
| created_by | UUID | FK → users | Admin who created |
| updated_by | UUID | FK → users | Admin who updated |

**Indexes:**
- (country_code, restriction_type, is_active)
- (effective_date, expiry_date)

---

### 4. FX_OVERRIDE_HOOKS

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| override_id | UUID | PK | Unique identifier |
| capability_id | UUID | FK → FX_COUNTRY_CAPABILITIES | Rule being overridden |
| override_type | VARCHAR(50) | NOT NULL | MANUAL / EXCEPTION / TEMPORARY |
| override_reason | VARCHAR(255) | NOT NULL | Why override is needed |
| override_action | VARCHAR(50) | NOT NULL | ALLOW / BLOCK / ADVISORY |
| override_scope | VARCHAR(50) | NOT NULL | USER / TRANSACTION / CORRIDOR |
| target_user_id | UUID | FK → users | User affected (if USER scope) |
| target_transaction_id | UUID | FK → transactions | Transaction affected (if TRANSACTION scope) |
| source_country | VARCHAR(2) | | For CORRIDOR scope |
| dest_country | VARCHAR(2) | | For CORRIDOR scope |
| min_amount | DECIMAL(19,4) | | Override applies above this amount |
| max_amount | DECIMAL(19,4) | | Override applies below this amount |
| approval_required | BOOLEAN | DEFAULT TRUE | Requires approval |
| approved_by | UUID | FK → users | Admin who approved |
| approval_timestamp | TIMESTAMP | | When approved |
| approval_notes | TEXT | | Approval justification |
| effective_date | TIMESTAMP | NOT NULL | When override starts |
| expiry_date | TIMESTAMP | | When override expires |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |
| created_by | UUID | FK → users | Admin who created override |
| updated_by | UUID | FK → users | Admin who updated override |

**Indexes:**
- (capability_id, override_type, is_active)
- (target_user_id, effective_date, expiry_date)
- (target_transaction_id)
- (source_country, dest_country, override_scope)

---

### 5. FX_RULE_VERSIONS

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| version_id | UUID | PK | Unique identifier |
| capability_id | UUID | FK → FX_COUNTRY_CAPABILITIES | Rule being versioned |
| version_number | INT | NOT NULL | Sequential version |
| rule_type_id | UUID | FK → FX_RULE_TYPES | Rule type in this version |
| min_amount | DECIMAL(19,4) | | Amount limit in this version |
| max_amount | DECIMAL(19,4) | | Amount limit in this version |
| daily_limit | DECIMAL(19,4) | | Daily limit in this version |
| monthly_limit | DECIMAL(19,4) | | Monthly limit in this version |
| kyc_level_required | INT | | KYC requirement in this version |
| psp_whitelist | TEXT | | PSP whitelist in this version |
| psp_blacklist | TEXT | | PSP blacklist in this version |
| requires_disclosure | BOOLEAN | | Disclosure requirement in this version |
| requires_confirmation | BOOLEAN | | Confirmation requirement in this version |
| change_reason | VARCHAR(255) | NOT NULL | Why this version was created |
| change_type | VARCHAR(50) | NOT NULL | CREATED / UPDATED / REVERTED |
| previous_version_id | UUID | FK → FX_RULE_VERSIONS | Link to previous version |
| effective_date | DATE | NOT NULL | When this version became active |
| superseded_date | DATE | | When this version was superseded |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| created_by | UUID | FK → users | Admin who created version |

**Indexes:**
- (capability_id, version_number DESC)
- (effective_date, superseded_date)

---

### 6. FX_RESTRICTION_AUDIT_LOG

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| audit_id | UUID | PK | Unique identifier |
| entity_type | VARCHAR(50) | NOT NULL | CAPABILITY / RESTRICTION / OVERRIDE |
| entity_id | UUID | NOT NULL | ID of affected entity |
| action | VARCHAR(50) | NOT NULL | CREATE / UPDATE / DELETE / APPROVE / REJECT |
| old_values | JSONB | | Previous state (for updates) |
| new_values | JSONB | | New state (for updates) |
| change_reason | TEXT | | Why change was made |
| approval_status | VARCHAR(50) | | PENDING / APPROVED / REJECTED |
| approver_id | UUID | FK → users | Who approved/rejected |
| approver_notes | TEXT | | Approval/rejection notes |
| ip_address | VARCHAR(45) | | IP of admin making change |
| user_agent | TEXT | | Browser/client info |
| created_at | TIMESTAMP | NOT NULL | When change occurred |
| created_by | UUID | FK → users | Admin who made change |

**Indexes:**
- (entity_type, entity_id, created_at DESC)
- (created_by, created_at DESC)
- (approval_status, created_at DESC)

---

### 7. FX_COUNTRY_RISK_MATRIX

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| risk_id | UUID | PK | Unique identifier |
| country_code | VARCHAR(2) | NOT NULL | ISO 3166-1 alpha-2 |
| risk_category | VARCHAR(50) | NOT NULL | SANCTIONS / AML / REGULATORY / GEOPOLITICAL |
| risk_level | INT | NOT NULL | 0=low, 1=medium, 2=high, 3=critical |
| risk_score | INT | NOT NULL | 0-100 score |
| description | TEXT | | Risk description |
| source | VARCHAR(100) | | Data source (OFAC, EU, etc.) |
| last_updated | DATE | NOT NULL | When risk assessment was updated |
| next_review_date | DATE | | When to review again |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |

**Indexes:**
- (country_code, risk_category, is_active)
- (risk_level DESC, risk_score DESC)

---

### 8. FX_PSP_CORRIDOR_RULES

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| corridor_rule_id | UUID | PK | Unique identifier |
| psp_code | VARCHAR(50) | NOT NULL | Payment service provider code |
| source_country | VARCHAR(2) | NOT NULL | Origin country |
| dest_country | VARCHAR(2) | NOT NULL | Destination country |
| source_currency | VARCHAR(3) | NOT NULL | Source currency |
| dest_currency | VARCHAR(3) | NOT NULL | Destination currency |
| rule_type_id | UUID | FK → FX_RULE_TYPES | Applied rule type |
| min_amount | DECIMAL(19,4) | | PSP-specific minimum |
| max_amount | DECIMAL(19,4) | | PSP-specific maximum |
| daily_limit | DECIMAL(19,4) | | PSP-specific daily limit |
| psp_fee_percent | DECIMAL(5,2) | | PSP fee percentage |
| psp_fee_fixed | DECIMAL(19,4) | | PSP fixed fee |
| effective_date | DATE | NOT NULL | When rule becomes active |
| expiry_date | DATE | | When rule expires |
| version | INT | NOT NULL DEFAULT 1 | Rule version |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |
| created_by | UUID | FK → users | Admin who created |
| updated_by | UUID | FK → users | Admin who updated |

**Indexes:**
- (psp_code, source_country, dest_country, is_active)
- (source_country, dest_country, effective_date)

---

## Query Patterns

### Get Applicable Rule for Transaction
```sql
SELECT 
  cc.capability_id,
  cc.rule_type_id,
  rt.rule_type_code,
  rt.enforcement_level,
  cc.min_amount,
  cc.max_amount,
  cc.daily_limit,
  cc.kyc_level_required,
  cc.requires_disclosure,
  cc.requires_confirmation
FROM fx_country_capabilities cc
JOIN fx_rule_types rt ON cc.rule_type_id = rt.rule_type_id
WHERE cc.country_code = $1
  AND cc.source_currency = $2
  AND cc.target_currency = $3
  AND cc.is_active = TRUE
  AND cc.effective_date <= NOW()
  AND (cc.expiry_date IS NULL OR cc.expiry_date > NOW())
LIMIT 1;
```

### Check Active Overrides
```sql
SELECT 
  override_id,
  override_action,
  override_scope,
  approval_required,
  approved_by
FROM fx_override_hooks
WHERE capability_id = $1
  AND is_active = TRUE
  AND effective_date <= NOW()
  AND (expiry_date IS NULL OR expiry_date > NOW())
  AND (
    (override_scope = 'TRANSACTION' AND target_transaction_id = $2)
    OR (override_scope = 'USER' AND target_user_id = $3)
    OR override_scope = 'CORRIDOR'
  )
ORDER BY effective_date DESC
LIMIT 1;
```

### Get Country Risk Assessment
```sql
SELECT 
  country_code,
  risk_category,
  risk_level,
  risk_score,
  description
FROM fx_country_risk_matrix
WHERE country_code = $1
  AND is_active = TRUE
ORDER BY risk_level DESC, risk_score DESC;
```

### Audit Trail for Compliance
```sql
SELECT 
  audit_id,
  entity_type,
  entity_id,
  action,
  old_values,
  new_values,
  created_by,
  created_at
FROM fx_restriction_audit_log
WHERE entity_type = $1
  AND entity_id = $2
  AND created_at >= $3
ORDER BY created_at DESC;
```

---

## Rule Application Logic

### Enforcement Hierarchy
1. **BLOCKED (2)**: Reject immediately, no override possible without approval
2. **ADVISORY (1)**: Allow with warning, user must acknowledge
3. **ALLOWED (0)**: Proceed without friction

### Override Precedence
1. Transaction-level override (highest priority)
2. User-level override
3. Corridor-level override
4. Default country capability rule (lowest priority)

### Version Control Strategy
- Immutable version history for audit
- Effective date determines active version
- Superseded date tracks when version expired
- Change reason documents why version was created
- Rollback capability via previous_version_id link

---

## Non-Negotiables

✓ **No direct rule mutations** - All changes create new versions  
✓ **Immutable audit trail** - All changes logged with actor/timestamp  
✓ **Approval workflow** - Overrides require documented approval  
✓ **Effective dating** - Rules have clear activation/expiration  
✓ **Scope isolation** - Overrides scoped to user/transaction/corridor  
✓ **Risk assessment** - Country risk matrix drives default rules  
✓ **PSP-specific rules** - Corridor rules override country rules  
✓ **Soft deletes** - is_active flag preserves history  
