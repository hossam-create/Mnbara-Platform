# Settlement & Reconciliation - System Architecture Design

## 1. SETTLEMENT LIFECYCLE

### Daily Settlement Flow

```
┌─────────────────────────────────────────────────────────┐
│              DAILY SETTLEMENT PROCESS                   │
└─────────────────────────────────────────────────────────┘

1. T+0 (Transaction Day)
   ├─ Transaction posted to ledger
   ├─ Escrow created (if applicable)
   └─ Settlement scheduled for T+1

2. T+1 (Settlement Day - 00:00 UTC)
   ├─ Cutoff: No new transactions accepted
   ├─ Reconciliation: Verify all T+0 transactions
   ├─ Calculation: Compute net positions
   └─ Settlement: Execute fund movements

3. T+1 (Settlement Day - 06:00 UTC)
   ├─ Bank transfer initiated
   ├─ PSP settlement executed
   └─ Confirmation received

4. T+2 (Confirmation Day)
   ├─ Funds cleared
   ├─ Final reconciliation
   └─ Settlement complete
```

---

## 2. SETTLEMENT DATA MODEL

### Settlement Batch Schema

```sql
CREATE TABLE settlement_batches (
  id UUID PRIMARY KEY,
  batch_date DATE NOT NULL UNIQUE,
  
  -- Batch details
  status ENUM(
    'PENDING',
    'RECONCILING',
    'CALCULATED',
    'EXECUTING',
    'EXECUTED',
    'CONFIRMED',
    'FAILED'
  ) NOT NULL,
  
  -- Transactions
  transaction_count INT NOT NULL,
  total_volume DECIMAL(19,8) NOT NULL,
  
  -- Settlement amounts
  total_buyer_refunds DECIMAL(19,8),
  total_seller_payouts DECIMAL(19,8),
  total_platform_fees DECIMAL(19,8),
  total_adjustments DECIMAL(19,8),
  
  -- Reconciliation
  reconciliation_status ENUM('PENDING', 'PASSED', 'FAILED'),
  reconciliation_discrepancies INT,
  
  -- Execution
  executed_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  
  -- Immutability
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT batch_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_batch_date ON settlement_batches(batch_date);
CREATE INDEX idx_batch_status ON settlement_batches(status);
```

---

### Settlement Entry Schema

```sql
CREATE TABLE settlement_entries (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES settlement_batches(id),
  
  -- Account details
  account_id UUID NOT NULL,
  account_type ENUM('USER', 'MERCHANT', 'PLATFORM'),
  
  -- Entry details
  entry_type ENUM('CREDIT', 'DEBIT'),
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Categorization
  category ENUM(
    'TRANSACTION_PAYOUT',
    'REFUND',
    'PLATFORM_FEE',
    'ADJUSTMENT',
    'CHARGEBACK',
    'REVERSAL'
  ) NOT NULL,
  
  -- References
  transaction_id UUID,
  dispute_id UUID,
  
  -- Immutability
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT entry_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_entry_batch ON settlement_entries(batch_id);
CREATE INDEX idx_entry_account ON settlement_entries(account_id);
CREATE INDEX idx_entry_category ON settlement_entries(category);
```

---

### Settlement Instruction Schema

```sql
CREATE TABLE settlement_instructions (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES settlement_batches(id),
  
  -- Destination
  destination_type ENUM('BANK_ACCOUNT', 'WALLET', 'PSP'),
  destination_id VARCHAR(255) NOT NULL,
  
  -- Amount
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Status
  status ENUM(
    'PENDING',
    'SUBMITTED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REVERSED'
  ) NOT NULL,
  
  -- Execution
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  reference_id VARCHAR(255), -- Bank/PSP reference
  
  -- Immutability
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT instruction_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_instruction_batch ON settlement_instructions(batch_id);
CREATE INDEX idx_instruction_status ON settlement_instructions(status);
```

---

## 3. SETTLEMENT OPERATIONS

### Settlement Service

```typescript
interface SettlementService {
  // Create settlement batch
  createSettlementBatch(batchDate: Date): Promise<SettlementBatch>;
  
  // Calculate settlement
  calculateSettlement(batchId: UUID): Promise<SettlementCalculation>;
  
  // Execute settlement
  executeSettlement(batchId: UUID): Promise<void>;
  
  // Confirm settlement
  confirmSettlement(batchId: UUID): Promise<void>;
  
  // Get settlement details
  getSettlement(batchId: UUID): Promise<SettlementDetail>;
  
  // Get settlement entries
  getSettlementEntries(batchId: UUID): Promise<SettlementEntry[]>;
}
```

---

### Settlement Calculation

```typescript
async function calculateSettlement(batchId: UUID): Promise<SettlementCalculation> {
  // 1. Get all transactions for batch date
  const batch = await getSettlementBatch(batchId);
  const transactions = await getTransactionsForDate(batch.batch_date);
  
  // 2. Group by account
  const accountBalances = new Map<UUID, Decimal>();
  
  for (const txn of transactions) {
    // Get ledger entries for transaction
    const entries = await getLedgerEntries(txn.id);
    
    for (const entry of entries) {
      const current = accountBalances.get(entry.account_id) || new Decimal(0);
      const delta = entry.entry_type === 'CREDIT' 
        ? entry.amount 
        : entry.amount.negate();
      accountBalances.set(entry.account_id, current.add(delta));
    }
  }
  
  // 3. Create settlement entries
  const entries: SettlementEntry[] = [];
  
  for (const [accountId, balance] of accountBalances) {
    if (balance.isZero()) continue;
    
    entries.push({
      id: generateUUID(),
      batch_id: batchId,
      account_id: accountId,
      entry_type: balance.isPositive() ? 'CREDIT' : 'DEBIT',
      amount: balance.abs(),
      category: 'TRANSACTION_PAYOUT',
      created_at: now()
    });
  }
  
  // 4. Store entries
  await insertSettlementEntries(entries);
  
  // 5. Calculate totals
  const totals = {
    totalCredits: entries
      .filter(e => e.entry_type === 'CREDIT')
      .reduce((sum, e) => sum.add(e.amount), new Decimal(0)),
    totalDebits: entries
      .filter(e => e.entry_type === 'DEBIT')
      .reduce((sum, e) => sum.add(e.amount), new Decimal(0))
  };
  
  // 6. Verify balance
  if (!totals.totalCredits.equals(totals.totalDebits)) {
    throw new Error('Settlement does not balance');
  }
  
  return { entries, totals };
}
```

---

## 4. RECONCILIATION ENGINE

### Reconciliation Schema

```sql
CREATE TABLE reconciliation_reports (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES settlement_batches(id),
  
  -- Report details
  report_type ENUM(
    'INTERNAL',
    'EXTERNAL_PSP',
    'EXTERNAL_BANK',
    'CROSS_VALIDATION'
  ) NOT NULL,
  
  -- Status
  status ENUM('PENDING', 'PASSED', 'FAILED', 'MANUAL_REVIEW'),
  
  -- Results
  total_transactions INT,
  matched_transactions INT,
  unmatched_transactions INT,
  discrepancy_amount DECIMAL(19,8),
  
  -- Details
  discrepancies JSONB, -- Array of mismatches
  
  -- Review
  reviewed_by UUID,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  CONSTRAINT report_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_report_batch ON reconciliation_reports(batch_id);
CREATE INDEX idx_report_type ON reconciliation_reports(report_type);
CREATE INDEX idx_report_status ON reconciliation_reports(status);
```

---

### Reconciliation Service

```typescript
interface ReconciliationService {
  // Reconcile internal ledger
  reconcileInternal(batchId: UUID): Promise<ReconciliationReport>;
  
  // Reconcile with PSP
  reconcileWithPSP(batchId: UUID): Promise<ReconciliationReport>;
  
  // Reconcile with bank
  reconcileWithBank(batchId: UUID): Promise<ReconciliationReport>;
  
  // Cross-validate all sources
  crossValidate(batchId: UUID): Promise<ReconciliationReport>;
  
  // Get reconciliation details
  getReconciliation(reportId: UUID): Promise<ReconciliationDetail>;
}
```

---

### Reconciliation Logic

```typescript
async function reconcileInternal(batchId: UUID): Promise<ReconciliationReport> {
  // 1. Get settlement entries
  const entries = await getSettlementEntries(batchId);
  
  // 2. Verify against ledger
  const discrepancies: Discrepancy[] = [];
  
  for (const entry of entries) {
    // Calculate expected balance from ledger
    const ledgerBalance = await calculateLedgerBalance(
      entry.account_id,
      entry.currency
    );
    
    // Compare with settlement entry
    if (!ledgerBalance.equals(entry.amount)) {
      discrepancies.push({
        accountId: entry.account_id,
        expectedAmount: ledgerBalance,
        settlementAmount: entry.amount,
        difference: ledgerBalance.subtract(entry.amount)
      });
    }
  }
  
  // 3. Create report
  const report = {
    id: generateUUID(),
    batch_id: batchId,
    report_type: 'INTERNAL',
    total_transactions: entries.length,
    matched_transactions: entries.length - discrepancies.length,
    unmatched_transactions: discrepancies.length,
    discrepancy_amount: discrepancies
      .reduce((sum, d) => sum.add(d.difference.abs()), new Decimal(0)),
    discrepancies,
    status: discrepancies.length === 0 ? 'PASSED' : 'FAILED',
    created_at: now()
  };
  
  // 4. Store report
  await insertReconciliationReport(report);
  
  return report;
}
```

---

## 5. FUND FLOW TRACKING

### Fund Flow Schema

```sql
CREATE TABLE fund_flows (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES settlement_batches(id),
  
  -- Source and destination
  source_account_id UUID NOT NULL,
  destination_account_id UUID NOT NULL,
  
  -- Amount
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Flow type
  flow_type ENUM(
    'BUYER_TO_ESCROW',
    'ESCROW_TO_SELLER',
    'ESCROW_TO_BUYER',
    'PLATFORM_FEE',
    'REFUND',
    'ADJUSTMENT'
  ) NOT NULL,
  
  -- Status
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'),
  
  -- Timestamps
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT flow_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_flow_batch ON fund_flows(batch_id);
CREATE INDEX idx_flow_source ON fund_flows(source_account_id);
CREATE INDEX idx_flow_destination ON fund_flows(destination_account_id);
CREATE INDEX idx_flow_type ON fund_flows(flow_type);
```

---

### Fund Flow Visualization

```typescript
interface FundFlowReport {
  batchId: UUID;
  totalInflow: Decimal;
  totalOutflow: Decimal;
  netFlow: Decimal;
  
  // By flow type
  flowsByType: Map<FlowType, Decimal>;
  
  // By account
  accountFlows: Map<UUID, {
    inflow: Decimal;
    outflow: Decimal;
    net: Decimal;
  }>;
  
  // Timing
  flowTimeline: FlowEvent[];
}

async function generateFundFlowReport(batchId: UUID): Promise<FundFlowReport> {
  const flows = await getFundFlows(batchId);
  
  const report: FundFlowReport = {
    batchId,
    totalInflow: new Decimal(0),
    totalOutflow: new Decimal(0),
    netFlow: new Decimal(0),
    flowsByType: new Map(),
    accountFlows: new Map(),
    flowTimeline: []
  };
  
  for (const flow of flows) {
    // Aggregate by type
    const typeTotal = report.flowsByType.get(flow.flow_type) || new Decimal(0);
    report.flowsByType.set(flow.flow_type, typeTotal.add(flow.amount));
    
    // Aggregate by account
    const srcFlow = report.accountFlows.get(flow.source_account_id) || {
      inflow: new Decimal(0),
      outflow: new Decimal(0),
      net: new Decimal(0)
    };
    srcFlow.outflow = srcFlow.outflow.add(flow.amount);
    srcFlow.net = srcFlow.inflow.subtract(srcFlow.outflow);
    report.accountFlows.set(flow.source_account_id, srcFlow);
    
    const dstFlow = report.accountFlows.get(flow.destination_account_id) || {
      inflow: new Decimal(0),
      outflow: new Decimal(0),
      net: new Decimal(0)
    };
    dstFlow.inflow = dstFlow.inflow.add(flow.amount);
    dstFlow.net = dstFlow.inflow.subtract(dstFlow.outflow);
    report.accountFlows.set(flow.destination_account_id, dstFlow);
    
    // Update totals
    report.totalInflow = report.totalInflow.add(flow.amount);
    report.totalOutflow = report.totalOutflow.add(flow.amount);
  }
  
  report.netFlow = report.totalInflow.subtract(report.totalOutflow);
  
  return report;
}
```

---

## 6. SETTLEMENT FAILURES & REVERSALS

### Failure Handling

```sql
CREATE TABLE settlement_failures (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES settlement_batches(id),
  instruction_id UUID NOT NULL REFERENCES settlement_instructions(id),
  
  -- Failure details
  failure_reason VARCHAR(500) NOT NULL,
  failure_code VARCHAR(50),
  
  -- Retry
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMP,
  
  -- Resolution
  resolution_status ENUM('PENDING', 'RESOLVED', 'ESCALATED'),
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_failure_batch ON settlement_failures(batch_id);
CREATE INDEX idx_failure_status ON settlement_failures(resolution_status);
```

---

### Reversal Logic

```typescript
async function reverseSettlement(
  batchId: UUID,
  reason: 'FAILED' | 'DISPUTED' | 'ERROR'
): Promise<void> {
  // 1. Get settlement batch
  const batch = await getSettlementBatch(batchId);
  
  // 2. Get all settlement entries
  const entries = await getSettlementEntries(batchId);
  
  // 3. Create reversal entries (opposite direction)
  for (const entry of entries) {
    await createLedgerEntry({
      transaction_id: generateUUID(),
      wallet_id: entry.account_id,
      entry_type: entry.entry_type === 'CREDIT' ? 'DEBIT' : 'CREDIT',
      amount: entry.amount,
      category: 'SETTLEMENT_REVERSAL',
      description: `Settlement reversal: ${reason}`,
      entry_timestamp: now()
    });
  }
  
  // 4. Update batch status
  await updateBatchStatus(batchId, 'FAILED');
  
  // 5. Audit log
  await auditLog(batchId, 'SETTLEMENT_REVERSED', { reason });
}
```

---

## 7. NON-NEGOTIABLES

### Settlement Must Balance

**FORBIDDEN:**
```typescript
// ❌ WRONG - Settlement doesn't balance
async function executeSettlement(batchId: UUID) {
  const entries = await getSettlementEntries(batchId);
  
  // No balance verification
  for (const entry of entries) {
    await executePayment(entry);
  }
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Verify balance before execution
async function executeSettlement(batchId: UUID) {
  const entries = await getSettlementEntries(batchId);
  
  // Verify balance
  const credits = entries
    .filter(e => e.entry_type === 'CREDIT')
    .reduce((sum, e) => sum.add(e.amount), new Decimal(0));
  
  const debits = entries
    .filter(e => e.entry_type === 'DEBIT')
    .reduce((sum, e) => sum.add(e.amount), new Decimal(0));
  
  if (!credits.equals(debits)) {
    throw new Error('Settlement does not balance');
  }
  
  // Execute
  for (const entry of entries) {
    await executePayment(entry);
  }
}
```

---

### Reconciliation Before Settlement

**FORBIDDEN:**
```typescript
// ❌ WRONG - No reconciliation
async function settleWithoutReconciliation(batchId: UUID) {
  await executeSettlement(batchId);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Reconcile first
async function settleWithReconciliation(batchId: UUID) {
  // 1. Reconcile internal
  const internalReport = await reconcileInternal(batchId);
  if (internalReport.status === 'FAILED') {
    throw new Error('Internal reconciliation failed');
  }
  
  // 2. Reconcile with external sources
  const externalReport = await reconcileWithPSP(batchId);
  if (externalReport.status === 'FAILED') {
    throw new Error('External reconciliation failed');
  }
  
  // 3. Execute settlement
  await executeSettlement(batchId);
}
```

---

### Immutable Settlement Records

**FORBIDDEN:**
```typescript
// ❌ WRONG - Settlement can be modified
async function updateSettlementEntry(entryId: UUID, newAmount: Decimal) {
  await db.query(
    'UPDATE settlement_entries SET amount = $1 WHERE id = $2',
    [newAmount, entryId]
  );
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Append-only, reversals only
async function reverseSettlementEntry(
  entryId: UUID,
  reason: string
): Promise<void> {
  // Get original entry
  const original = await getSettlementEntry(entryId);
  
  // Create reversal entry (opposite direction)
  await insertSettlementEntry({
    id: generateUUID(),
    batch_id: original.batch_id,
    account_id: original.account_id,
    entry_type: original.entry_type === 'CREDIT' ? 'DEBIT' : 'CREDIT',
    amount: original.amount,
    category: 'REVERSAL',
    created_at: now()
  });
  
  // Audit
  await auditLog(entryId, 'SETTLEMENT_ENTRY_REVERSED', { reason });
}
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Settlement Foundation (Weeks 1-2)
- [ ] Create settlement batch schema
- [ ] Implement settlement calculation
- [ ] Add settlement entry creation
- [ ] Create settlement execution

### Phase 2: Reconciliation (Weeks 3-4)
- [ ] Implement internal reconciliation
- [ ] Add PSP reconciliation
- [ ] Create bank reconciliation
- [ ] Add cross-validation

### Phase 3: Fund Flow (Weeks 5-6)
- [ ] Implement fund flow tracking
- [ ] Create fund flow reports
- [ ] Add flow visualization
- [ ] Implement flow analytics

### Phase 4: Failure Handling (Weeks 7-8)
- [ ] Implement failure detection
- [ ] Add retry logic
- [ ] Create reversal mechanism
- [ ] Add escalation workflow

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
