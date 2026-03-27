# PHASE 4.1 — Wallet & Ledger Schema Invariants

## 🔐 Core Invariants

| # | Invariant | Enforcement |
|---|-----------|-------------|
| **1** | **Ledger is append-only** | `BEFORE UPDATE/DELETE` triggers raise exception |
| **2** | **Balance = Σ(credits) - Σ(debits)** | No balance column in `wallet`; derived from `ledger_entry.balance_after` |
| **3** | **No negative balances** | `insert_ledger_entry()` function validates before insert |
| **4** | **Idempotency guaranteed** | `UNIQUE(wallet_id, idempotency_key)` constraint |
| **5** | **All amounts positive** | `CHECK (amount > 0)` constraint; direction via `entry_type` |
| **6** | **Integer-only money** | `BIGINT` type; minor units (1000 = 10.00 EGP) |
| **7** | **Single wallet per owner/currency** | `UNIQUE(owner_type, owner_id, currency)` constraint |
| **8** | **Frozen wallets reject mutations** | `insert_ledger_entry()` checks `status = 'ACTIVE'` |
| **9** | **Every entry is traceable** | `reference_type`, `reference_id`, `created_by` required |
| **10** | **Running balance for O(1) reads** | `balance_after` stored on each entry |

---

## 📊 Money Representation

```
┌─────────────────────────────────────────────────────┐
│  ALL MONEY STORED AS INTEGER (MINOR UNITS)          │
├─────────────────────────────────────────────────────┤
│  10.00 EGP  →  1000  (piasters)                     │
│  10.50 EGP  →  1050                                 │
│  0.01 EGP   →  1                                    │
│  1,234.56   →  123456                               │
└─────────────────────────────────────────────────────┘
```

**Why?**
- No floating point rounding errors
- Exact arithmetic in all operations
- Standard practice in financial systems

---

## 🔄 Balance Calculation

```sql
-- FAST: O(1) - Get last entry's running balance
SELECT balance_after FROM ledger_entry 
WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 1;

-- VERIFY: O(n) - Recalculate from all entries
SELECT SUM(CASE 
    WHEN entry_type = 'CREDIT' THEN amount 
    ELSE -amount 
END) FROM ledger_entry WHERE wallet_id = ?;
```

Both methods MUST return the same value. Discrepancy indicates data corruption.

---

## 🛡️ Idempotency Pattern

```
idempotency_key = "{operation}:{reference_id}:{amount}"

Examples:
  "deposit:pay_abc123:5000"
  "refund:order_xyz789:2500"
  "fee:order_xyz789:250"
```

**Behavior:**
- First request → Entry created, returns entry ID
- Duplicate request → Unique constraint violation, returns existing entry ID
- Safe for retries in distributed systems

---

## ⚡ Critical Operations

### Credit (Money In)
```
balance_after = current_balance + amount
```

### Debit (Money Out)
```
IF current_balance < amount THEN
    RAISE 'INSUFFICIENT_BALANCE'
END IF
balance_after = current_balance - amount
```

### Wallet Freeze
```
UPDATE wallet SET status = 'FROZEN' WHERE id = ?;
-- All subsequent ledger entries will be rejected
```

---

## 🚫 Prohibited Operations

| Operation | Status |
|-----------|--------|
| `UPDATE ledger_entry` | ❌ Blocked by trigger |
| `DELETE FROM ledger_entry` | ❌ Blocked by trigger |
| `INSERT INTO ledger_entry` with negative amount | ❌ Blocked by CHECK constraint |
| Debit exceeding balance | ❌ Blocked by function |
| Entry on frozen wallet | ❌ Blocked by function |
| Duplicate idempotency key | ❌ Blocked by UNIQUE constraint |

---

## 📋 Entry Types vs Reasons

| Entry Type | Direction | Example Reasons |
|------------|-----------|-----------------|
| `CREDIT` | Money IN | `DEPOSIT`, `REFUND`, `PAYOUT`, `TRANSFER_IN` |
| `DEBIT` | Money OUT | `WITHDRAWAL`, `PURCHASE_HOLD`, `FEE`, `TRANSFER_OUT` |

---

## 🔗 Reference Linking

Every ledger entry MUST have:
- `reference_type` — What system triggered this entry
- `reference_id` — Optional ID of the triggering entity
- `created_by` — User ID or `'system'`

This enables complete audit trail reconstruction.

---

## ✅ Verification Queries

```sql
-- Check wallet balance consistency
SELECT 
    w.id,
    get_wallet_balance(w.id) as func_balance,
    (SELECT balance_after FROM ledger_entry 
     WHERE wallet_id = w.id 
     ORDER BY created_at DESC LIMIT 1) as last_entry_balance,
    (SELECT SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END) 
     FROM ledger_entry WHERE wallet_id = w.id) as sum_balance
FROM wallet w;

-- All three values MUST match. Any discrepancy = data corruption.
```
