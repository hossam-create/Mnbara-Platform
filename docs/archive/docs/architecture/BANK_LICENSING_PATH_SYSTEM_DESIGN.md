# Bank Licensing Path - System Architecture Design

## 1. LICENSING OPTIONS MATRIX

### Option A: PSP Partnership (Payment Service Provider)
**What Changes in Backend:**
- Add PSP integration layer (Stripe/Paymob wrapper)
- Implement webhook handlers for PSP events
- Add transaction routing to PSP
- Implement settlement reconciliation with PSP
- Add PSP account mapping per merchant

**What Remains Frozen:**
- Core platform business logic
- User authentication & KYC
- Auction/matching engines
- Marketplace logic
- All non-financial operations

**Time & Complexity:** LOW (2-4 weeks)
- Minimal architectural changes
- PSP handles regulatory compliance
- Platform remains non-regulated

---

### Option B: EMI License (Electronic Money Institution)
**What Changes in Backend:**
- Implement double-entry ledger system
- Add wallet/account management service
- Implement fund segregation (trust accounts)
- Add reconciliation service
- Implement regulatory reporting
- Add transaction limits & controls
- Implement AML/KYC enhanced checks

**What Remains Frozen:**
- Marketplace core logic
- Auction/matching engines
- User matching algorithms
- Platform business rules

**Time & Complexity:** MEDIUM (8-12 weeks)
- Significant database schema changes
- New regulatory reporting pipelines
- Enhanced compliance infrastructure
- Fund custody requirements

---

### Option C: Bank-as-a-Service (BaaS)
**What Changes in Backend:**
- Partner with BaaS provider (Synapse, Solarisbank)
- Implement BaaS API integration layer
- Map platform accounts to BaaS accounts
- Implement BaaS transaction routing
- Add BaaS settlement reconciliation
- Implement BaaS compliance reporting

**What Remains Frozen:**
- All platform business logic
- User experience layer
- Marketplace operations
- Auction/matching systems

**Time & Complexity:** MEDIUM (6-10 weeks)
- Moderate integration complexity
- BaaS provider handles regulation
- Faster time-to-market than EMI
- Ongoing BaaS provider dependency

---

### Option D: Full Bank Charter
**What Changes in Backend:**
- Complete financial infrastructure rebuild
- Implement core banking system
- Add deposit/lending operations
- Implement full regulatory reporting
- Add capital adequacy tracking
- Implement comprehensive AML/CFT
- Add stress testing infrastructure

**What Remains Frozen:**
- Marketplace matching logic only
- User matching algorithms

**Time & Complexity:** HIGH (18-24 months)
- Complete system redesign
- Massive regulatory burden
- Significant capital requirements
- Extensive compliance infrastructure

---

## 2. REGULATED ARCHITECTURE SPLIT

### Layer 1: Platform Core (Non-Regulated)
```
┌─────────────────────────────────────────┐
│  PLATFORM CORE (Non-Regulated)          │
├─────────────────────────────────────────┤
│ • User Management & Auth                │
│ • Marketplace Logic                     │
│ • Auction/Matching Engines              │
│ • Recommendation Systems                │
│ • Dispute Resolution (non-financial)    │
│ • Notifications & Communications        │
│ • Analytics & Reporting (non-financial) │
└─────────────────────────────────────────┘
```

**Characteristics:**
- No direct fund handling
- No financial data processing
- Standard compliance (privacy, security)
- Can scale independently
- Standard deployment practices

---

### Layer 2: Regulated Financial Layer
```
┌─────────────────────────────────────────┐
│  REGULATED FINANCIAL LAYER              │
├─────────────────────────────────────────┤
│ • Transaction Ledger (Double-Entry)     │
│ • Account Management                    │
│ • Fund Custody & Segregation            │
│ • Settlement & Reconciliation           │
│ • Regulatory Reporting                  │
│ • Compliance Controls                   │
│ • Audit Logging                         │
│ • Transaction Limits & Monitoring       │
└─────────────────────────────────────────┘
```

**Characteristics:**
- Handles all funds
- Immutable audit trail
- Regulatory compliance built-in
- Restricted deployment (secure infrastructure)
- Enhanced monitoring & controls

---

### Trust Boundaries

```
┌──────────────────────────────────────────────────────┐
│                  API Gateway                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────┐    ┌──────────────────────┐ │
│  │  Platform Core     │    │  Financial Layer     │ │
│  │  (Non-Regulated)   │    │  (Regulated)         │ │
│  │                    │    │                      │ │
│  │ • Auth Service     │    │ • Ledger Service     │ │
│  │ • Auction Service  │    │ • Account Service    │ │
│  │ • Matching Service │    │ • Settlement Service │ │
│  │ • User Service     │    │ • Compliance Service │ │
│  │                    │    │ • Audit Service      │ │
│  └────────────────────┘    └──────────────────────┘ │
│         │                           │                │
│         └───────────┬───────────────┘                │
│                     │                                │
│         ┌───────────▼──────────────┐                │
│         │  Regulated Event Bus     │                │
│         │  (Immutable Events)      │                │
│         └────────────────────────┘                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Trust Boundary Rules:**
- Platform Core → Financial Layer: One-way calls only
- Financial Layer → Platform Core: Event-driven only
- All fund operations: Financial Layer exclusive
- All compliance: Financial Layer authoritative
- Audit trail: Immutable, Financial Layer owned

---

## 3. REQUIRED SYSTEM ADDITIONS

### 3.1 Transaction Ledger (Double-Entry)

**Schema:**
```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  account_id UUID NOT NULL,
  entry_type ENUM('DEBIT', 'CREDIT'),
  amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  account_type ENUM('PLATFORM', 'USER', 'MERCHANT', 'RESERVE'),
  entry_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT ledger_immutable CHECK (created_at = entry_timestamp)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  transaction_type ENUM('PAYMENT', 'REFUND', 'SETTLEMENT', 'ADJUSTMENT'),
  status ENUM('PENDING', 'POSTED', 'FAILED', 'REVERSED'),
  total_amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  initiated_by UUID NOT NULL,
  initiated_at TIMESTAMP NOT NULL,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT immutable_transaction CHECK (created_at = initiated_at)
);

CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_transaction_status ON transactions(status);
```

**Invariants:**
- Every debit has matching credit (balanced)
- No negative balances (per account)
- All entries immutable (append-only)
- Transaction atomicity (all-or-nothing)

---

### 3.2 Reconciliation Service

**Responsibilities:**
```typescript
interface ReconciliationService {
  // Daily reconciliation
  reconcileDailySettlement(date: Date): Promise<ReconciliationReport>;
  
  // Account balance verification
  verifyAccountBalance(accountId: UUID): Promise<BalanceVerification>;
  
  // External source reconciliation (PSP/Bank)
  reconcileExternalSource(sourceId: string): Promise<ExternalReconciliation>;
  
  // Discrepancy detection
  detectDiscrepancies(): Promise<Discrepancy[]>;
  
  // Audit trail generation
  generateAuditTrail(period: DateRange): Promise<AuditTrail>;
}
```

**Reconciliation Workflow:**
1. Fetch all transactions for period
2. Calculate expected balances per account
3. Verify against actual ledger balances
4. Compare with external sources (PSP/Bank)
5. Flag discrepancies for investigation
6. Generate immutable reconciliation report

---

### 3.3 Regulatory Reporting Service

**Required Reports:**
```typescript
interface RegulatoryReporting {
  // Transaction reporting
  generateTransactionReport(period: DateRange): Promise<TransactionReport>;
  
  // Customer reporting (KYC/AML)
  generateCustomerReport(period: DateRange): Promise<CustomerReport>;
  
  // Fund flow reporting
  generateFundFlowReport(period: DateRange): Promise<FundFlowReport>;
  
  // Suspicious activity reporting (SAR)
  generateSuspiciousActivityReport(): Promise<SARReport>;
  
  // Capital adequacy (if bank)
  generateCapitalAdequacyReport(): Promise<CapitalReport>;
}
```

**Report Formats:**
- CSV/XML for regulatory submission
- Immutable storage (append-only)
- Audit trail of all report generations
- Digital signatures for authenticity

---

### 3.4 Account Limits & Controls

**Limit Types:**
```typescript
interface AccountLimits {
  // Daily transaction limits
  dailyTransactionLimit: Decimal;
  dailyTransactionCount: number;
  
  // Monthly limits
  monthlyTransactionLimit: Decimal;
  
  // Per-transaction limits
  maxTransactionAmount: Decimal;
  minTransactionAmount: Decimal;
  
  // Velocity controls
  maxTransactionsPerHour: number;
  maxTransactionsPerDay: number;
  
  // Risk-based limits
  riskTier: ENUM('LOW', 'MEDIUM', 'HIGH');
  limitMultiplier: Decimal; // 0.5x to 2.0x
}
```

**Control Enforcement:**
```typescript
interface TransactionControl {
  validateAgainstLimits(
    accountId: UUID,
    amount: Decimal,
    transactionType: string
  ): Promise<ValidationResult>;
  
  checkVelocity(accountId: UUID): Promise<VelocityStatus>;
  
  applyRiskAdjustment(
    accountId: UUID,
    riskScore: number
  ): Promise<AdjustedLimits>;
}
```

---

## 4. NON-NEGOTIABLES

### 4.1 No Mixing Business Logic with Funds

**FORBIDDEN:**
```typescript
// ❌ WRONG - Business logic in financial transaction
async function completeAuction(auctionId: UUID) {
  const winner = await getWinner(auctionId);
  const amount = await calculateFinalPrice(auctionId);
  
  // Business logic mixed with fund handling
  await ledger.debit(winner.accountId, amount);
  await updateAuctionStatus(auctionId, 'COMPLETED');
  await notifyWinner(winner);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Separation of concerns
async function completeAuction(auctionId: UUID) {
  // Step 1: Business logic only
  const winner = await getWinner(auctionId);
  const amount = await calculateFinalPrice(auctionId);
  await updateAuctionStatus(auctionId, 'COMPLETED');
  
  // Step 2: Emit event for financial layer
  await eventBus.publish('auction.completed', {
    auctionId,
    winnerId: winner.id,
    amount,
    timestamp: now()
  });
  
  // Step 3: Financial layer handles independently
  // (Ledger service subscribes to event)
}
```

**Enforcement:**
- Financial operations in separate service
- Event-driven communication only
- No direct database access across layers
- Separate deployment pipelines

---

### 4.2 Funds Isolated from Platform Accounts

**Account Segregation:**
```sql
-- Platform operational accounts (non-regulated)
CREATE TABLE platform_accounts (
  id UUID PRIMARY KEY,
  account_type ENUM('OPERATIONAL', 'RESERVE'),
  balance DECIMAL(19,8),
  currency VARCHAR(3),
  purpose VARCHAR(255)
);

-- User/Merchant financial accounts (regulated)
CREATE TABLE financial_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  account_type ENUM('USER_WALLET', 'MERCHANT_SETTLEMENT'),
  balance DECIMAL(19,8),
  currency VARCHAR(3),
  status ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
  created_at TIMESTAMP,
  CONSTRAINT financial_immutable CHECK (created_at = created_at)
);

-- Trust/Segregated accounts (regulated, highest security)
CREATE TABLE trust_accounts (
  id UUID PRIMARY KEY,
  trust_type ENUM('USER_FUNDS', 'MERCHANT_FUNDS', 'RESERVE'),
  balance DECIMAL(19,8),
  currency VARCHAR(3),
  custodian_id UUID,
  last_reconciled TIMESTAMP,
  CONSTRAINT trust_immutable CHECK (last_reconciled IS NOT NULL)
);
```

**Isolation Rules:**
- Platform accounts: Operational use only
- Financial accounts: User/merchant funds only
- Trust accounts: Segregated, never commingled
- No transfers between account types
- Separate reconciliation processes

---

### 4.3 Full Auditability

**Audit Trail Requirements:**
```typescript
interface AuditEntry {
  id: UUID;
  timestamp: Timestamp;
  actor: UUID; // User/Service performing action
  action: string; // What was done
  resource: string; // What was affected
  resourceId: UUID;
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  reason: string; // Why it was done
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  
  // Immutability
  createdAt: Timestamp;
  hash: string; // SHA-256 of entry
  previousHash: string; // Chain integrity
}
```

**Audit Coverage:**
- All financial transactions
- All account changes
- All limit modifications
- All compliance actions
- All system configuration changes
- All user access to sensitive data

**Immutability Enforcement:**
```typescript
// Append-only storage
async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  // 1. Calculate hash
  entry.hash = calculateHash(entry);
  
  // 2. Verify chain integrity
  const lastEntry = await getLastAuditEntry();
  entry.previousHash = lastEntry.hash;
  
  // 3. Append only (no updates/deletes)
  await auditLog.insert(entry);
  
  // 4. Verify insertion
  const inserted = await auditLog.getById(entry.id);
  if (!inserted) throw new Error('Audit entry not persisted');
}
```

---

## 5. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-4)
- [ ] Implement double-entry ledger schema
- [ ] Create ledger service with immutability
- [ ] Implement audit logging infrastructure
- [ ] Set up event bus for layer communication
- [ ] Create account segregation schema

### Phase 2: Controls (Weeks 5-8)
- [ ] Implement transaction limits service
- [ ] Add velocity checking
- [ ] Create reconciliation service
- [ ] Implement compliance controls
- [ ] Add regulatory reporting framework

### Phase 3: Integration (Weeks 9-12)
- [ ] Integrate with payment service
- [ ] Connect marketplace to financial layer
- [ ] Implement settlement workflows
- [ ] Add monitoring & alerting
- [ ] Create operational dashboards

### Phase 4: Licensing (Weeks 13+)
- [ ] Choose licensing path (PSP/EMI/BaaS/Bank)
- [ ] Implement path-specific integrations
- [ ] Regulatory submission & approval
- [ ] Production deployment
- [ ] Ongoing compliance monitoring

---

## 6. DEPLOYMENT ARCHITECTURE

### Regulated Financial Layer Deployment
```yaml
# Separate, secure infrastructure
financial-layer:
  namespace: financial-regulated
  security:
    - network-policies: STRICT
    - pod-security: RESTRICTED
    - rbac: MINIMAL
    - encryption: TLS 1.3 + mTLS
  storage:
    - encryption-at-rest: AES-256
    - backup: IMMUTABLE
    - retention: PERMANENT
  monitoring:
    - audit-logging: COMPREHENSIVE
    - transaction-logging: DETAILED
    - compliance-monitoring: CONTINUOUS
```

### Platform Core Deployment
```yaml
# Standard deployment
platform-core:
  namespace: platform
  security:
    - network-policies: STANDARD
    - pod-security: BASELINE
    - rbac: STANDARD
  storage:
    - encryption-at-rest: STANDARD
    - backup: STANDARD
    - retention: STANDARD
  monitoring:
    - audit-logging: STANDARD
    - transaction-logging: STANDARD
```

---

## 7. SUMMARY TABLE

| Aspect | PSP | EMI | BaaS | Bank |
|--------|-----|-----|------|------|
| **Time to Market** | 2-4 weeks | 8-12 weeks | 6-10 weeks | 18-24 months |
| **Complexity** | LOW | MEDIUM | MEDIUM | HIGH |
| **Regulatory Burden** | PSP handles | Full | BaaS handles | Full |
| **Capital Required** | Minimal | Significant | Minimal | Massive |
| **Control Level** | Limited | Full | Limited | Full |
| **Scalability** | PSP limited | Full | BaaS limited | Full |
| **Cost** | Per-transaction | Fixed + variable | Per-transaction | Fixed + variable |
| **Compliance Effort** | Minimal | Extensive | Minimal | Extensive |
| **Fund Custody** | PSP | Own | BaaS | Own |
| **Recommended For** | MVP/Growth | Scale/Control | Growth/Speed | Mature/Regulated |

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation Planning)
