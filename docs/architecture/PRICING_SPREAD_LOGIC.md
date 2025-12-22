# Pricing & Spread Logic - Transparent Fee Architecture

## 1. FEE_COMPONENTS Table

| Column | Type | Formula | Purpose |
|--------|------|---------|---------|
| component_id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK | Links to transaction |
| component_type | VARCHAR(50) | ENUM | PSP_GATEWAY / PLATFORM / FX_SPREAD / REGULATORY / SETTLEMENT |
| component_name | VARCHAR(255) | | Human-readable name |
| base_amount | DECIMAL(19,4) | | Amount before calculation |
| rate_percent | DECIMAL(5,4) | | Percentage rate (0.0000 to 100.0000) |
| rate_fixed | DECIMAL(19,4) | | Fixed amount (flat fee) |
| calculated_amount | DECIMAL(19,4) | `CASE WHEN rate_percent > 0 THEN (base_amount * rate_percent / 100) ELSE rate_fixed END` | Computed fee |
| min_amount | DECIMAL(19,4) | | Minimum fee floor |
| max_amount | DECIMAL(19,4) | | Maximum fee cap |
| final_amount | DECIMAL(19,4) | `GREATEST(LEAST(calculated_amount, max_amount), min_amount)` | Fee after min/max |
| currency | VARCHAR(3) | | ISO 4217 code |
| is_waived | BOOLEAN | DEFAULT FALSE | Fee waiver flag |
| waiver_reason | VARCHAR(255) | | Why fee was waived |
| waiver_approved_by | UUID | FK → users | Admin who approved waiver |
| is_visible_to_user | BOOLEAN | DEFAULT TRUE | Show in breakdown |
| display_order | INT | | Sort order in UI |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |

**Indexes:**
- (transaction_id, component_type)
- (component_type, is_visible_to_user)

---

## 2. SPREAD_CALCULATION Table

| Column | Type | Formula | Purpose |
|--------|------|---------|---------|
| spread_id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK | Links to transaction |
| source_currency | VARCHAR(3) | | From currency |
| dest_currency | VARCHAR(3) | | To currency |
| mid_market_rate | DECIMAL(19,8) | | Interbank rate (read-only) |
| psp_rate | DECIMAL(19,8) | | PSP's quoted rate (read-only) |
| spread_basis_points | INT | `ROUND((ABS(psp_rate - mid_market_rate) / mid_market_rate) * 10000)` | Spread in bps (read-only) |
| spread_percent | DECIMAL(5,4) | `(spread_basis_points / 10000)` | Spread as % (read-only) |
| spread_amount | DECIMAL(19,4) | `(source_amount * spread_percent / 100)` | Spread in source currency (read-only) |
| source_amount | DECIMAL(19,4) | | Amount being converted |
| dest_amount_before_spread | DECIMAL(19,4) | `(source_amount * mid_market_rate)` | Destination before spread (read-only) |
| dest_amount_after_spread | DECIMAL(19,4) | `(source_amount * psp_rate)` | Destination after spread (read-only) |
| user_receives | DECIMAL(19,4) | `(dest_amount_after_spread - SUM(fees))` | Final amount to user (read-only) |
| rate_source | VARCHAR(50) | | LIVE / CACHED / FALLBACK |
| rate_timestamp | TIMESTAMP | | When rate was fetched |
| rate_validity_seconds | INT | | How long rate is valid |
| is_locked | BOOLEAN | DEFAULT FALSE | Rate locked for transaction |
| locked_at | TIMESTAMP | | When rate was locked |
| locked_by_user_id | UUID | FK → users | User who locked rate |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |

**Indexes:**
- (transaction_id)
- (source_currency, dest_currency, rate_timestamp DESC)
- (is_locked, locked_at DESC)

**Non-Negotiables:**
✓ All columns read-only after creation (no mutations)
✓ Spread calculated from mid-market, never manipulated
✓ Rate locked before payment execution
✓ All calculations immutable in ledger

---

## 3. TRANSPARENCY_RULES Table

| Column | Type | Formula | Purpose |
|--------|------|---------|---------|
| rule_id | UUID | PK | Unique identifier |
| rule_type | VARCHAR(50) | NOT NULL | BREAKDOWN / ROUNDING / DISCLOSURE / COMPARISON |
| rule_name | VARCHAR(255) | | Human-readable name |
| applies_to_transaction_type | VARCHAR(50) | | PAYMENT / CROWDSHIP / AUCTION / ALL |
| applies_to_amount_range | VARCHAR(50) | | MICRO / SMALL / MEDIUM / LARGE / ALL |
| min_amount | DECIMAL(19,4) | | Minimum transaction amount |
| max_amount | DECIMAL(19,4) | | Maximum transaction amount |
| rule_description | TEXT | | What this rule enforces |
| enforcement_level | INT | | 0=advisory, 1=required, 2=hard_block |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| effective_date | DATE | NOT NULL | When rule becomes active |
| expiry_date | DATE | | When rule expires |
| version | INT | NOT NULL DEFAULT 1 | Rule version |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |
| created_by | UUID | FK → users | Admin who created |
| updated_by | UUID | FK → users | Admin who updated |

**Indexes:**
- (rule_type, applies_to_transaction_type, is_active)
- (effective_date, expiry_date)

---

## 4. TRANSPARENCY_BREAKDOWN Table

| Column | Type | Formula | Purpose |
|--------|------|---------|---------|
| breakdown_id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK | Links to transaction |
| breakdown_type | VARCHAR(50) | | ITEMIZED / SUMMARY / DETAILED |
| source_amount | DECIMAL(19,4) | | Original amount |
| source_currency | VARCHAR(3) | | Original currency |
| mid_market_rate | DECIMAL(19,8) | | Reference rate (read-only) |
| psp_rate | DECIMAL(19,8) | | Applied rate (read-only) |
| spread_bps | INT | | Spread in basis points (read-only) |
| total_fees | DECIMAL(19,4) | `SUM(fee_components.final_amount)` | All fees combined (read-only) |
| dest_amount | DECIMAL(19,4) | | Final amount user receives |
| dest_currency | VARCHAR(3) | | Destination currency |
| breakdown_json | JSONB | | Structured breakdown for UI |
| is_shown_to_user | BOOLEAN | DEFAULT TRUE | User can see this |
| shown_at | TIMESTAMP | | When shown to user |
| user_acknowledged | BOOLEAN | DEFAULT FALSE | User confirmed |
| acknowledged_at | TIMESTAMP | | When user confirmed |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |

**Breakdown JSON Structure:**
```json
{
  "source": {
    "amount": 1000.00,
    "currency": "USD"
  },
  "rates": {
    "mid_market": 0.92,
    "applied": 0.91,
    "spread_bps": 109
  },
  "fees": [
    {
      "name": "PSP Gateway Fee",
      "type": "PSP_GATEWAY",
      "amount": 15.00,
      "visible": true
    },
    {
      "name": "Platform Fee",
      "type": "PLATFORM",
      "amount": 5.00,
      "visible": true
    }
  ],
  "destination": {
    "amount": 910.00,
    "currency": "EUR"
  }
}
```

**Indexes:**
- (transaction_id)
- (user_acknowledged, shown_at DESC)

---

## 5. NO_HIDDEN_FEES_GUARANTEE Table

| Column | Type | Formula | Purpose |
|--------|------|---------|---------|
| guarantee_id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK | Links to transaction |
| guarantee_type | VARCHAR(50) | | QUOTED_PRICE / ZERO_SURPRISE / FULL_DISCLOSURE |
| quoted_amount | DECIMAL(19,4) | | Amount promised to user |
| quoted_currency | VARCHAR(3) | | Currency of quote |
| quote_timestamp | TIMESTAMP | | When quote was given |
| quote_valid_until | TIMESTAMP | | Quote expiration |
| actual_amount | DECIMAL(19,4) | | Actual amount after all fees |
| actual_currency | VARCHAR(3) | | Actual currency |
| variance_amount | DECIMAL(19,4) | `(actual_amount - quoted_amount)` | Difference (read-only) |
| variance_percent | DECIMAL(5,4) | `(variance_amount / quoted_amount * 100)` | Variance % (read-only) |
| variance_acceptable | BOOLEAN | `(ABS(variance_percent) <= max_variance_percent)` | Within tolerance (read-only) |
| max_variance_percent | DECIMAL(5,4) | | Allowed variance (typically 0.5%) |
| all_fees_disclosed | BOOLEAN | | All fees shown to user |
| no_surprise_fees | BOOLEAN | | No undisclosed fees |
| guarantee_honored | BOOLEAN | | Guarantee met |
| guarantee_broken_reason | VARCHAR(255) | | Why guarantee failed (if applicable) |
| compensation_amount | DECIMAL(19,4) | | Refund if guarantee broken |
| compensation_status | VARCHAR(50) | | PENDING / APPROVED / PAID |
| created_at | TIMESTAMP | NOT NULL | Audit trail |
| updated_at | TIMESTAMP | NOT NULL | Audit trail |

**Indexes:**
- (transaction_id)
- (guarantee_honored, created_at DESC)
- (variance_acceptable, created_at DESC)

---

## 6. FEE_CALCULATION_AUDIT Table

| Column | Type | Formula | Purpose |
|--------|------|---------|---------|
| audit_id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK | Links to transaction |
| calculation_step | INT | | Step number in calculation |
| step_name | VARCHAR(255) | | Name of calculation step |
| input_values | JSONB | | Input to this step |
| formula_applied | TEXT | | Formula used |
| output_value | DECIMAL(19,4) | | Result of calculation |
| timestamp | TIMESTAMP | NOT NULL | When calculated |
| calculated_by | VARCHAR(50) | | SYSTEM / USER / ADMIN |
| is_correct | BOOLEAN | | Validation result |
| validation_notes | TEXT | | Any issues found |
| created_at | TIMESTAMP | NOT NULL | Audit trail |

**Indexes:**
- (transaction_id, calculation_step)
- (is_correct, created_at DESC)

---

## Calculation Formulas

### Total Transaction Cost
```
TOTAL_COST = source_amount + SUM(all_fees)
```

### User Receives (Destination)
```
USER_RECEIVES = (source_amount * psp_rate) - SUM(visible_fees)
```

### Spread Calculation
```
SPREAD_BPS = ROUND(ABS(psp_rate - mid_market_rate) / mid_market_rate * 10000)
SPREAD_PERCENT = SPREAD_BPS / 10000
SPREAD_AMOUNT = source_amount * SPREAD_PERCENT / 100
```

### Fee Calculation
```
CALCULATED_FEE = CASE 
  WHEN rate_percent > 0 THEN (base_amount * rate_percent / 100)
  ELSE rate_fixed
END

FINAL_FEE = GREATEST(
  LEAST(calculated_fee, max_amount),
  min_amount
)
```

### Variance Check
```
VARIANCE_AMOUNT = actual_amount - quoted_amount
VARIANCE_PERCENT = (variance_amount / quoted_amount) * 100
VARIANCE_ACCEPTABLE = ABS(variance_percent) <= max_variance_percent
```

---

## Transparency Rules Enforcement

| Rule Type | Enforcement | Trigger |
|-----------|-------------|---------|
| BREAKDOWN | Required (1) | All transactions > $100 |
| ROUNDING | Required (1) | All FX conversions |
| DISCLOSURE | Required (1) | All fees must be shown |
| COMPARISON | Advisory (0) | Transactions > $1000 |

---

## Non-Negotiables

✓ **No hidden fees** - All fees calculated and shown before confirmation  
✓ **Read-only spreads** - Spread derived from rates, never manipulated  
✓ **Immutable calculations** - All calculations logged in audit table  
✓ **Rate locking** - Rate locked before payment execution  
✓ **Variance tolerance** - Max 0.5% variance from quoted amount  
✓ **Full disclosure** - Breakdown shown to user with acknowledgment  
✓ **Audit trail** - Every calculation step logged with timestamp  
✓ **No surprise fees** - All fees disclosed upfront  
