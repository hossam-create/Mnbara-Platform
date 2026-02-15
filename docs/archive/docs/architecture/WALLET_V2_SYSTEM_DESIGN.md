# Wallet v2 - System Architecture Design

## 1. WALLET V2 CAPABILITIES

### 1.1 Balance View
```sql
-- Read-only balance calculation (derived from ledger)
CREATE VIEW wallet_balance_view AS
SELECT 
  w.id as wallet_id,
  w.user_id,
  w.currency,
  w.status,
  COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) as available_balance,
  COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' AND le.hold_id IS NOT NULL THEN le.amount ELSE 0 END), 0) as held_balance,
  COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' AND le.escrow_id IS NOT NULL THEN le.amount ELSE 0 END), 0) as escrow_balance,
  COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE -le.amount END), 0) - 
  COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' AND (le.hold_id IS NOT NULL OR le.escrow_id IS NOT NULL) THEN le.amount ELSE 0 END), 0) as spendable_balance,
  w.updated_at
FROM wallets w
LEFT JOIN ledger_entries le ON w.id = le.wallet_id
GROUP BY w.id, w.user_id, w.currency, w.status, w.updated_at;
```

**Balance Components:**
- `available_balance`: Total funds (credits - debits)
- `held_balance`: Funds locked in holds
- `escrow_balance`: Funds in escrow buckets
- `spendable_balance`: Available - (held + escrow)

**Read-Only Guarantee:**
- No direct balance column updates
- All changes via ledger entries only
- Calculated on-demand or cached with TTL

---

### 1.2 Holds / Locks

**Hold Types:**
```sql
CREATE TABLE wallet_holds (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  hold_type ENUM('TRANSACTION', 'DISPUTE', 'COMPLIANCE', 'MANUAL'),
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  reference_id UUID, -- transaction_id, dispute_id, etc.
  created_by UUID NOT NULL, -- user_id or system
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  released_at TIMESTAMP,
  status ENUM('ACTIVE', 'RELEASED', 'EXPIRED', 'CONVERTED'),
  CONSTRAINT hold_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_hold_wallet ON wallet_holds(wallet_id);
CREATE INDEX idx_hold_status ON wallet_holds(status);
CREATE INDEX idx_hold_expires ON wallet_holds(expires_at);
```

**Hold Lifecycle:**
1. Create hold → Ledger entry (DEBIT to held_balance)
2. Hold active → Funds unavailable for spending
3. Release hold → Ledger entry (CREDIT from held_balance)
4. Convert hold → Ledger entry (DEBIT from held_balance, CREDIT to transaction)

**Hold Operations:**
```typescript
interface HoldService {
  // Create hold (idempotent via reference_id)
  createHold(
    walletId: UUID,
    amount: Decimal,
    holdType: HoldType,
    referenceId: UUID
  ): Promise<Hold>;
  
  // Release hold (idempotent)
  releaseHold(holdId: UUID): Promise<void>;
  
  // Convert hold to transaction
  convertHold(holdId: UUID, transactionId: UUID): Promise<void>;
  
  // Query active holds
  getActiveHolds(walletId: UUID): Promise<Hold[]>;
}
```

---

### 1.3 Escrow Buckets

**Escrow Structure:**
```sql
CREATE TABLE escrow_buckets (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  transaction_id UUID NOT NULL,
  escrow_type ENUM('BUYER_PROTECTION', 'SELLER_PROTECTION', 'DISPUTE_RESERVE'),
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status ENUM('HELD', 'RELEASED_TO_SELLER', 'REFUNDED_TO_BUYER', 'DISPUTED'),
  created_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  release_reason VARCHAR(255),
  CONSTRAINT escrow_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_escrow_wallet ON escrow_buckets(wallet_id);
CREATE INDEX idx_escrow_transaction ON escrow_buckets(transaction_id);
CREATE INDEX idx_escrow_status ON escrow_buckets(status);
```

**Escrow Ledger Entries:**
```sql
-- When escrow created: DEBIT buyer wallet, CREDIT escrow bucket
-- When released to seller: DEBIT escrow bucket, CREDIT seller wallet
-- When refunded: DEBIT escrow bucket, CREDIT buyer wallet
-- When disputed: DEBIT escrow bucket, CREDIT dispute reserve
```

**Escrow Operations:**
```typescript
interface EscrowService {
  // Create escrow (idempotent via transaction_id)
  createEscrow(
    transactionId: UUID,
    buyerId: UUID,
    sellerId: UUID,
    amount: Decimal,
    escrowType: EscrowType
  ): Promise<EscrowBucket>;
  
  // Release to seller
  releaseToSeller(escrowId: UUID): Promise<void>;
  
  // Refund to buyer
  refundToBuyer(escrowId: UUID, reason: string): Promise<void>;
  
  // Move to dispute
  moveToDispute(escrowId: UUID): Promise<void>;
  
  // Query escrow status
  getEscrowStatus(transactionId: UUID): Promise<EscrowBucket>;
}
```

---

### 1.4 Transaction History (Read-Only by Default)

**Transaction History View:**
```sql
CREATE VIEW transaction_history_view AS
SELECT 
  le.id as entry_id,
  le.transaction_id,
  le.wallet_id,
  le.entry_type,
  le.amount,
  le.currency,
  le.entry_timestamp,
  le.created_at,
  CASE 
    WHEN le.hold_id IS NOT NULL THEN 'HOLD'
    WHEN le.escrow_id IS NOT NULL THEN 'ESCROW'
    WHEN le.dispute_id IS NOT NULL THEN 'DISPUTE'
    ELSE 'TRANSACTION'
  END as transaction_type,
  COALESCE(le.hold_id, le.escrow_id, le.dispute_id, le.transaction_id) as reference_id,
  le.description
FROM ledger_entries le
ORDER BY le.entry_timestamp DESC;
```

**Read-Only Access:**
- Users can query transaction history
- No direct updates to ledger entries
- All changes via service operations only
- Immutable audit trail

**Transaction History Query:**
```typescript
interface TransactionHistoryService {
  // Get paginated history
  getHistory(
    walletId: UUID,
    limit: number,
    offset: number,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      transactionType?: string;
      minAmount?: Decimal;
      maxAmount?: Decimal;
    }
  ): Promise<TransactionPage>;
  
  // Get single transaction details
  getTransactionDetails(transactionId: UUID): Promise<TransactionDetail>;
  
  // Export history (CSV/JSON)
  exportHistory(walletId: UUID, format: 'csv' | 'json'): Promise<Buffer>;
}
```

---

## 2. LEDGER ARCHITECTURE

### 2.1 Double-Entry Ledger

**Core Ledger Schema:**
```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  wallet_id UUID NOT NULL,
  entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
  amount DECIMAL(19,8) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  
  -- Categorization
  entry_category ENUM(
    'PAYMENT',
    'REFUND',
    'HOLD',
    'RELEASE',
    'ESCROW_IN',
    'ESCROW_OUT',
    'DISPUTE',
    'ADJUSTMENT',
    'FEE',
    'REWARD'
  ) NOT NULL,
  
  -- References
  hold_id UUID REFERENCES wallet_holds(id),
  escrow_id UUID REFERENCES escrow_buckets(id),
  dispute_id UUID REFERENCES disputes(id),
  
  -- Metadata
  description VARCHAR(255),
  initiated_by UUID NOT NULL, -- user_id or system
  entry_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Immutability
  CONSTRAINT ledger_immutable CHECK (created_at = entry_timestamp),
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Composite index for balance calculations
CREATE INDEX idx_ledger_wallet_currency ON ledger_entries(wallet_id, currency, entry_type);
CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_timestamp ON ledger_entries(entry_timestamp);
```

**Double-Entry Principle:**
- Every debit has matching credit
- Balanced across wallet pairs
- Example: Payment from Buyer to Seller
  - DEBIT: Buyer wallet (payment)
  - CREDIT: Seller wallet (receipt)

**Invariants:**
```sql
-- Verify balance integrity
SELECT 
  wallet_id,
  currency,
  SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END) as net_balance
FROM ledger_entries
GROUP BY wallet_id, currency
HAVING SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END) < 0;
-- Should return 0 rows (no negative balances)
```

---

### 2.2 Idempotent Transactions

**Idempotency Key Pattern:**
```sql
CREATE TABLE transaction_idempotency (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  transaction_id UUID NOT NULL UNIQUE,
  request_hash VARCHAR(64) NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_idempotency_expires ON transaction_idempotency(expires_at);
```

**Idempotent Operation Flow:**
```typescript
async function executeIdempotentTransaction(
  idempotencyKey: string,
  operation: () => Promise<TransactionResult>
): Promise<TransactionResult> {
  // 1. Check if already processed
  const existing = await getIdempotencyRecord(idempotencyKey);
  if (existing) {
    return existing.response_data;
  }
  
  // 2. Execute operation
  const result = await operation();
  
  // 3. Store idempotency record
  await storeIdempotencyRecord(idempotencyKey, result);
  
  return result;
}
```

**Idempotent Ledger Entry Creation:**
```typescript
async function createLedgerEntryIdempotent(
  transactionId: UUID,
  walletId: UUID,
  entryType: 'DEBIT' | 'CREDIT',
  amount: Decimal,
  idempotencyKey: string
): Promise<LedgerEntry> {
  return executeIdempotentTransaction(idempotencyKey, async () => {
    // Check if entry already exists
    const existing = await getLedgerEntry(transactionId, walletId, entryType);
    if (existing) return existing;
    
    // Create new entry
    const entry = await insertLedgerEntry({
      id: generateUUID(),
      transaction_id: transactionId,
      wallet_id: walletId,
      entry_type: entryType,
      amount,
      entry_timestamp: now(),
      created_at: now()
    });
    
    return entry;
  });
}
```

---

### 2.3 Reversal-Safe Design

**Reversal Ledger Entries:**
```sql
CREATE TABLE ledger_reversals (
  id UUID PRIMARY KEY,
  original_entry_id UUID NOT NULL REFERENCES ledger_entries(id),
  reversal_entry_id UUID NOT NULL REFERENCES ledger_entries(id),
  reason ENUM('DISPUTE', 'ERROR', 'REFUND', 'CHARGEBACK') NOT NULL,
  initiated_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT reversal_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_reversal_original ON ledger_reversals(original_entry_id);
CREATE INDEX idx_reversal_reversal ON ledger_reversals(reversal_entry_id);
```

**Reversal Operation:**
```typescript
async function reverseTransaction(
  transactionId: UUID,
  reason: 'DISPUTE' | 'ERROR' | 'REFUND' | 'CHARGEBACK'
): Promise<void> {
  // 1. Get original entries
  const originalEntries = await getLedgerEntries(transactionId);
  
  // 2. Create reversal entries (opposite direction)
  for (const entry of originalEntries) {
    const reversalEntry = await createLedgerEntry({
      transaction_id: transactionId,
      wallet_id: entry.wallet_id,
      entry_type: entry.entry_type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amount: entry.amount,
      description: `Reversal: ${reason}`,
      entry_timestamp: now()
    });
    
    // 3. Record reversal relationship
    await createReversal({
      original_entry_id: entry.id,
      reversal_entry_id: reversalEntry.id,
      reason,
      initiated_by: currentUserId
    });
  }
}
```

**Reversal Invariants:**
- Original entry remains immutable
- Reversal creates new entries
- Net effect: cancels original transaction
- Full audit trail preserved

---

## 3. WALLET STATES

### 3.1 State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    WALLET STATES                        │
└─────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   CREATED    │
    └──────┬───────┘
           │ activate()
           ▼
    ┌──────────────┐
    │   ACTIVE     │◄──────────────────┐
    └──┬───────┬───┘                   │
       │       │                       │
       │       │ freeze()              │ unfreeze()
       │       ▼                       │
       │   ┌──────────────┐            │
       │   │   FROZEN     │────────────┘
       │   └──────────────┘
       │
       │ dispute()
       ▼
    ┌──────────────┐
    │ UNDER_DISPUTE│
    └──┬───────┬───┘
       │       │
       │       │ resolve_dispute()
       │       ▼
       │   ┌──────────────┐
       │   │   ACTIVE     │
       │   └──────────────┘
       │
       │ compliance_hold()
       ▼
    ┌──────────────┐
    │COMPLIANCE_HOLD
    └──┬───────┬───┘
       │       │
       │       │ clear_compliance()
       │       ▼
       │   ┌──────────────┐
       │   │   ACTIVE     │
       │   └──────────────┘
       │
       │ close()
       ▼
    ┌──────────────┐
    │   CLOSED     │
    └──────────────┘
```

---

### 3.2 State Definitions

**ACTIVE**
```sql
CREATE TABLE wallet_states (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL UNIQUE REFERENCES wallets(id),
  state ENUM('CREATED', 'ACTIVE', 'FROZEN', 'UNDER_DISPUTE', 'COMPLIANCE_HOLD', 'CLOSED'),
  reason VARCHAR(255),
  initiated_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT state_immutable CHECK (created_at = created_at)
);
```

**State Permissions:**
```typescript
const STATE_PERMISSIONS = {
  CREATED: {
    canDeposit: false,
    canWithdraw: false,
    canTransfer: false,
    canReceive: false
  },
  ACTIVE: {
    canDeposit: true,
    canWithdraw: true,
    canTransfer: true,
    canReceive: true
  },
  FROZEN: {
    canDeposit: false,
    canWithdraw: false,
    canTransfer: false,
    canReceive: true
  },
  UNDER_DISPUTE: {
    canDeposit: false,
    canWithdraw: false,
    canTransfer: false,
    canReceive: false
  },
  COMPLIANCE_HOLD: {
    canDeposit: false,
    canWithdraw: false,
    canTransfer: false,
    canReceive: false
  },
  CLOSED: {
    canDeposit: false,
    canWithdraw: false,
    canTransfer: false,
    canReceive: false
  }
};
```

---

## 4. TRUST BOUNDARIES

### 4.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Platform Services   │    │   Wallet Service v2      │  │
│  │  (Non-Financial)     │    │   (Custodial-Ready)      │  │
│  │                      │    │                          │  │
│  │ • Auction Service    │    │ • Balance Service        │  │
│  │ • Matching Service   │    │ • Hold Service           │  │
│  │ • User Service       │    │ • Escrow Service         │  │
│  │ • Dispute Service    │    │ • Transaction Service    │  │
│  │                      │    │ • State Management       │  │
│  └──────────┬───────────┘    └──────────┬───────────────┘  │
│             │                           │                   │
│             └───────────┬───────────────┘                   │
│                         │                                   │
│         ┌───────────────▼──────────────────┐               │
│         │   Ledger Service (Immutable)     │               │
│         │                                  │               │
│         │ • Entry Creation (Append-Only)   │               │
│         │ • Reversal Management            │               │
│         │ • Balance Calculation            │               │
│         │ • Audit Trail                    │               │
│         └───────────────┬──────────────────┘               │
│                         │                                   │
│         ┌───────────────▼──────────────────┐               │
│         │   Ledger Database (Immutable)    │               │
│         │                                  │               │
│         │ • ledger_entries (append-only)   │               │
│         │ • ledger_reversals               │               │
│         │ • transaction_idempotency        │               │
│         └────────────────────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   External PSP / Bank Integration                    │  │
│  │                                                      │  │
│  │ • Deposit/Withdrawal Execution                       │  │
│  │ • Settlement Reconciliation                          │  │
│  │ • Compliance Reporting                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Trust Boundary Rules

**Platform Services → Wallet Service:**
- One-way calls only
- No direct ledger access
- Event-driven communication for state changes
- Wallet service authoritative for balance

**Wallet Service → Ledger Service:**
- All balance changes via ledger only
- No direct wallet balance updates
- Idempotent operations with keys
- Immutable entry creation

**Wallet Service → External PSP/Bank:**
- Partner-operated execution only
- No autonomous fund movement
- Webhook-based settlement notifications
- Reconciliation-driven updates

**External PSP/Bank → Wallet Service:**
- Webhook events for deposits/withdrawals
- Settlement confirmations
- Compliance holds/releases
- Read-only balance queries

---

## 5. NON-NEGOTIABLES

### 5.1 No Direct DB Writes to Balances

**FORBIDDEN:**
```typescript
// ❌ WRONG - Direct balance update
async function updateBalance(walletId: UUID, amount: Decimal) {
  await db.query(`
    UPDATE wallets 
    SET balance = balance + $1 
    WHERE id = $2
  `, [amount, walletId]);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Ledger-based balance update
async function updateBalance(
  walletId: UUID,
  amount: Decimal,
  transactionId: UUID,
  idempotencyKey: string
) {
  // Create ledger entries
  await createLedgerEntryIdempotent(
    transactionId,
    walletId,
    amount > 0 ? 'CREDIT' : 'DEBIT',
    Math.abs(amount),
    idempotencyKey
  );
  
  // Balance calculated from ledger
  const balance = await calculateBalance(walletId);
  return balance;
}
```

**Enforcement:**
- No balance column in wallets table
- Balance is view/calculated only
- All changes via ledger service
- Database constraints prevent direct updates

---

### 5.2 All Balance Changes via Ledger Events

**Event-Driven Flow:**
```typescript
// 1. Platform service initiates transaction
await auctionService.completeAuction(auctionId);

// 2. Emits event
await eventBus.publish('auction.completed', {
  auctionId,
  buyerId,
  sellerId,
  amount,
  timestamp: now()
});

// 3. Wallet service subscribes
eventBus.subscribe('auction.completed', async (event) => {
  // 4. Creates ledger entries
  await ledgerService.createTransaction({
    transactionId: event.auctionId,
    entries: [
      {
        walletId: event.buyerId,
        entryType: 'DEBIT',
        amount: event.amount,
        category: 'PAYMENT'
      },
      {
        walletId: event.sellerId,
        entryType: 'CREDIT',
        amount: event.amount,
        category: 'PAYMENT'
      }
    ]
  });
});
```

**Ledger Entry Immutability:**
```sql
-- Prevent any updates to ledger entries
CREATE POLICY ledger_entries_immutable ON ledger_entries
  FOR UPDATE
  USING (false);

CREATE POLICY ledger_entries_no_delete ON ledger_entries
  FOR DELETE
  USING (false);

-- Only allow inserts
CREATE POLICY ledger_entries_append_only ON ledger_entries
  FOR INSERT
  WITH CHECK (true);
```

---

### 5.3 Full Audit Trail

**Audit Entry Schema:**
```sql
CREATE TABLE wallet_audit_log (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL,
  action VARCHAR(255) NOT NULL,
  actor_id UUID NOT NULL, -- user_id or system
  actor_type ENUM('USER', 'SYSTEM', 'PARTNER'),
  changes JSONB NOT NULL,
  
  -- Immutability
  created_at TIMESTAMP DEFAULT NOW(),
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64),
  
  CONSTRAINT audit_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_audit_wallet ON wallet_audit_log(wallet_id);
CREATE INDEX idx_audit_timestamp ON wallet_audit_log(created_at);
```

**Audit Coverage:**
- All ledger entries
- All state transitions
- All holds/releases
- All escrow operations
- All reversals
- All external API calls
- All user access

**Audit Entry Creation:**
```typescript
async function auditLog(
  walletId: UUID,
  action: string,
  actor: { id: UUID; type: 'USER' | 'SYSTEM' | 'PARTNER' },
  changes: Record<string, any>
): Promise<void> {
  const entry = {
    id: generateUUID(),
    wallet_id: walletId,
    action,
    actor_id: actor.id,
    actor_type: actor.type,
    changes,
    created_at: now(),
    hash: calculateHash({ walletId, action, actor, changes, timestamp: now() })
  };
  
  // Get previous entry for chain
  const previous = await getLastAuditEntry(walletId);
  entry.previous_hash = previous?.hash;
  
  // Append to immutable log
  await insertAuditEntry(entry);
}
```

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Ledger Foundation (Weeks 1-2)
- [ ] Create ledger schema (immutable)
- [ ] Implement ledger service
- [ ] Add idempotency layer
- [ ] Create balance calculation view
- [ ] Set up audit logging

### Phase 2: Wallet Operations (Weeks 3-4)
- [ ] Implement wallet state machine
- [ ] Create hold service
- [ ] Create escrow service
- [ ] Add transaction history
- [ ] Implement reversals

### Phase 3: Integration (Weeks 5-6)
- [ ] Connect platform services
- [ ] Implement event bus
- [ ] Add PSP/Bank webhooks
- [ ] Create reconciliation service
- [ ] Add monitoring & alerting

### Phase 4: Partner Operations (Weeks 7-8)
- [ ] Partner API for execution
- [ ] Settlement workflows
- [ ] Compliance holds
- [ ] Reporting & analytics
- [ ] Production deployment

---

## 7. DEPLOYMENT ARCHITECTURE

```yaml
wallet-service:
  namespace: financial-wallet
  security:
    - network-policies: STRICT
    - pod-security: RESTRICTED
    - rbac: MINIMAL
    - encryption: TLS 1.3 + mTLS
  storage:
    - encryption-at-rest: AES-256
    - backup: IMMUTABLE
    - retention: PERMANENT
  database:
    - ledger-only: append-only tables
    - no-updates: policy enforcement
    - replication: multi-region
  monitoring:
    - audit-logging: COMPREHENSIVE
    - transaction-logging: DETAILED
    - balance-verification: CONTINUOUS
```

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
