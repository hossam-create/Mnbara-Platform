# Dispute Resolution - System Architecture Design

## 1. DISPUTE LIFECYCLE

### State Machine

```
┌─────────────────────────────────────────────────────────┐
│                  DISPUTE STATES                         │
└─────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   CREATED    │
    └──────┬───────┘
           │ submit_evidence()
           ▼
    ┌──────────────┐
    │ EVIDENCE_DUE │
    └──────┬───────┘
           │ evidence_submitted()
           ▼
    ┌──────────────┐
    │ ARBITRATION  │◄──────────────────┐
    └──┬───────┬───┘                   │
       │       │                       │
       │       │ request_appeal()      │ appeal_denied()
       │       ▼                       │
       │   ┌──────────────┐            │
       │   │   APPEAL     │────────────┘
       │   └──────────────┘
       │
       │ resolve()
       ▼
    ┌──────────────┐
    │  RESOLVED    │
    └──────────────┘
```

---

## 2. DISPUTE DATA MODEL

### Core Schema

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL UNIQUE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  
  -- Dispute details
  reason ENUM(
    'ITEM_NOT_RECEIVED',
    'ITEM_NOT_AS_DESCRIBED',
    'QUALITY_ISSUE',
    'DAMAGED_IN_TRANSIT',
    'UNAUTHORIZED_TRANSACTION',
    'DUPLICATE_CHARGE',
    'OTHER'
  ) NOT NULL,
  
  -- Amount in dispute
  dispute_amount DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Status tracking
  status ENUM(
    'CREATED',
    'EVIDENCE_DUE',
    'ARBITRATION',
    'APPEAL',
    'RESOLVED',
    'CLOSED'
  ) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  evidence_due_at TIMESTAMP NOT NULL,
  arbitration_started_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Immutability
  CONSTRAINT dispute_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_dispute_transaction ON disputes(transaction_id);
CREATE INDEX idx_dispute_buyer ON disputes(buyer_id);
CREATE INDEX idx_dispute_seller ON disputes(seller_id);
CREATE INDEX idx_dispute_status ON disputes(status);
CREATE INDEX idx_dispute_created ON disputes(created_at);
```

---

### Evidence Schema

```sql
CREATE TABLE dispute_evidence (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES disputes(id),
  submitted_by UUID NOT NULL, -- buyer_id or seller_id
  
  -- Evidence details
  evidence_type ENUM(
    'MESSAGE',
    'PHOTO',
    'VIDEO',
    'RECEIPT',
    'TRACKING',
    'COMMUNICATION',
    'OTHER'
  ) NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(2048),
  file_hash VARCHAR(64), -- SHA-256
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT evidence_immutable CHECK (created_at = submitted_at)
);

CREATE INDEX idx_evidence_dispute ON dispute_evidence(dispute_id);
CREATE INDEX idx_evidence_submitted_by ON dispute_evidence(submitted_by);
CREATE INDEX idx_evidence_type ON dispute_evidence(evidence_type);
```

---

### Resolution Schema

```sql
CREATE TABLE dispute_resolutions (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL UNIQUE REFERENCES disputes(id),
  
  -- Resolution details
  resolution_type ENUM(
    'BUYER_WIN',
    'SELLER_WIN',
    'PARTIAL_REFUND',
    'MUTUAL_AGREEMENT',
    'SYSTEM_DECISION'
  ) NOT NULL,
  
  -- Outcome
  buyer_refund DECIMAL(19,8) NOT NULL,
  seller_payout DECIMAL(19,8) NOT NULL,
  platform_fee DECIMAL(19,8) NOT NULL,
  
  -- Decision
  decided_by UUID NOT NULL, -- arbitrator_id or system
  decision_reason TEXT NOT NULL,
  
  -- Timestamps
  decided_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT resolution_immutable CHECK (created_at = decided_at)
);

CREATE INDEX idx_resolution_dispute ON dispute_resolutions(dispute_id);
CREATE INDEX idx_resolution_decided_by ON dispute_resolutions(decided_by);
```

---

## 3. DISPUTE OPERATIONS

### Dispute Creation

```typescript
interface DisputeService {
  // Create dispute
  createDispute(
    transactionId: UUID,
    buyerId: UUID,
    sellerId: UUID,
    reason: DisputeReason,
    description: string,
    amount: Decimal
  ): Promise<Dispute>;
  
  // Submit evidence
  submitEvidence(
    disputeId: UUID,
    submittedBy: UUID,
    evidenceType: EvidenceType,
    title: string,
    description: string,
    fileUrl?: string
  ): Promise<DisputeEvidence>;
  
  // Get dispute details
  getDispute(disputeId: UUID): Promise<DisputeDetail>;
  
  // Get evidence
  getEvidence(disputeId: UUID): Promise<DisputeEvidence[]>;
}
```

---

### Escrow Release Logic

```sql
CREATE TABLE escrow_release_rules (
  id UUID PRIMARY KEY,
  reason ENUM(
    'BUYER_CONFIRMED',
    'DISPUTE_RESOLVED',
    'TIMEOUT_EXPIRED',
    'MUTUAL_AGREEMENT',
    'SYSTEM_DECISION'
  ) NOT NULL,
  
  -- Release amounts
  buyer_refund_percent DECIMAL(5,2),
  seller_payout_percent DECIMAL(5,2),
  platform_fee_percent DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Release Workflow:**

```typescript
async function releaseEscrow(
  escrowId: UUID,
  reason: ReleaseReason,
  buyerRefund: Decimal,
  sellerPayout: Decimal
): Promise<void> {
  // 1. Get escrow bucket
  const escrow = await getEscrowBucket(escrowId);
  
  // 2. Verify amounts balance
  if (buyerRefund.add(sellerPayout) !== escrow.amount) {
    throw new Error('Amounts do not balance');
  }
  
  // 3. Create ledger entries
  await ledgerService.createTransaction({
    transactionId: escrow.transaction_id,
    entries: [
      // Refund to buyer
      {
        walletId: getBuyerWallet(escrow.buyer_id),
        entryType: 'CREDIT',
        amount: buyerRefund,
        category: 'DISPUTE_REFUND'
      },
      // Payout to seller
      {
        walletId: getSellerWallet(escrow.seller_id),
        entryType: 'CREDIT',
        amount: sellerPayout,
        category: 'DISPUTE_PAYOUT'
      },
      // Debit from escrow
      {
        walletId: getEscrowWallet(),
        entryType: 'DEBIT',
        amount: escrow.amount,
        category: 'ESCROW_RELEASE'
      }
    ]
  });
  
  // 4. Update escrow status
  await updateEscrowStatus(escrowId, 'RELEASED', reason);
  
  // 5. Audit log
  await auditLog(escrowId, 'ESCROW_RELEASED', {
    reason,
    buyerRefund,
    sellerPayout
  });
}
```

---

## 4. ARBITRATION ENGINE

### Arbitrator Assignment

```sql
CREATE TABLE arbitrators (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Credentials
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  certification_level ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3'),
  
  -- Performance metrics
  total_cases INT DEFAULT 0,
  resolved_cases INT DEFAULT 0,
  appeal_rate DECIMAL(5,2),
  average_resolution_time INT, -- hours
  
  -- Availability
  max_concurrent_cases INT,
  current_cases INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_arbitrator_status ON arbitrators(status);
CREATE INDEX idx_arbitrator_certification ON arbitrators(certification_level);
```

---

### Arbitration Decision

```typescript
interface ArbitrationService {
  // Assign arbitrator
  assignArbitrator(
    disputeId: UUID,
    reason: DisputeReason
  ): Promise<Arbitrator>;
  
  // Submit decision
  submitDecision(
    disputeId: UUID,
    arbitratorId: UUID,
    resolutionType: ResolutionType,
    buyerRefund: Decimal,
    sellerPayout: Decimal,
    reasoning: string
  ): Promise<DisputeResolution>;
  
  // Get arbitration details
  getArbitration(disputeId: UUID): Promise<ArbitrationDetail>;
}
```

---

### Decision Logic

```typescript
interface DecisionCriteria {
  // Evidence quality
  buyerEvidenceQuality: number; // 0-100
  sellerEvidenceQuality: number;
  
  // Communication history
  buyerResponsiveness: number;
  sellerResponsiveness: number;
  
  // Historical patterns
  buyerDisputeHistory: number; // count
  sellerDisputeHistory: number;
  
  // Transaction details
  transactionAmount: Decimal;
  transactionAge: number; // days
  
  // Marketplace rules
  categorySpecificRules: Record<string, any>;
}

async function makeArbitrationDecision(
  disputeId: UUID,
  criteria: DecisionCriteria
): Promise<DisputeResolution> {
  // 1. Analyze evidence
  const buyerScore = analyzeEvidence(criteria.buyerEvidenceQuality);
  const sellerScore = analyzeEvidence(criteria.sellerEvidenceQuality);
  
  // 2. Apply marketplace rules
  const categoryRules = await getCategoryRules(dispute.category);
  
  // 3. Calculate resolution
  let resolution: DisputeResolution;
  
  if (buyerScore > sellerScore + 20) {
    resolution = {
      type: 'BUYER_WIN',
      buyerRefund: dispute.amount,
      sellerPayout: 0
    };
  } else if (sellerScore > buyerScore + 20) {
    resolution = {
      type: 'SELLER_WIN',
      buyerRefund: 0,
      sellerPayout: dispute.amount
    };
  } else {
    // Partial refund
    const refundPercent = calculateRefundPercent(buyerScore, sellerScore);
    resolution = {
      type: 'PARTIAL_REFUND',
      buyerRefund: dispute.amount.multiply(refundPercent),
      sellerPayout: dispute.amount.multiply(1 - refundPercent)
    };
  }
  
  return resolution;
}
```

---

## 5. APPEAL PROCESS

### Appeal Schema

```sql
CREATE TABLE dispute_appeals (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES disputes(id),
  resolution_id UUID NOT NULL REFERENCES dispute_resolutions(id),
  
  -- Appeal details
  appealed_by UUID NOT NULL, -- buyer_id or seller_id
  appeal_reason TEXT NOT NULL,
  
  -- Status
  status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'RESOLVED'),
  
  -- Review
  reviewed_by UUID, -- senior_arbitrator_id
  review_decision TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  
  CONSTRAINT appeal_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_appeal_dispute ON dispute_appeals(dispute_id);
CREATE INDEX idx_appeal_appealed_by ON dispute_appeals(appealed_by);
CREATE INDEX idx_appeal_status ON dispute_appeals(status);
```

---

### Appeal Workflow

```typescript
interface AppealService {
  // Request appeal
  requestAppeal(
    disputeId: UUID,
    appealedBy: UUID,
    reason: string
  ): Promise<DisputeAppeal>;
  
  // Review appeal
  reviewAppeal(
    appealId: UUID,
    reviewedBy: UUID,
    decision: 'ACCEPT' | 'REJECT',
    reasoning: string
  ): Promise<void>;
  
  // Get appeal details
  getAppeal(appealId: UUID): Promise<DisputeAppeal>;
}
```

---

## 6. DISPUTE METRICS & MONITORING

### Metrics Schema

```sql
CREATE TABLE dispute_metrics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  
  -- Volume
  total_disputes INT,
  disputes_by_reason JSONB,
  
  -- Resolution
  avg_resolution_time INT, -- hours
  resolution_distribution JSONB, -- {BUYER_WIN, SELLER_WIN, PARTIAL}
  
  -- Appeals
  total_appeals INT,
  appeal_rate DECIMAL(5,2),
  appeal_overturn_rate DECIMAL(5,2),
  
  -- Arbitrator performance
  arbitrator_stats JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_date ON dispute_metrics(date);
```

---

### Monitoring Service

```typescript
interface DisputeMonitoring {
  // Get metrics
  getMetrics(startDate: Date, endDate: Date): Promise<DisputeMetrics>;
  
  // Get arbitrator performance
  getArbitratorPerformance(arbitratorId: UUID): Promise<ArbitratorStats>;
  
  // Detect anomalies
  detectAnomalies(): Promise<Anomaly[]>;
  
  // Get dispute trends
  getDisputeTrends(days: number): Promise<TrendData>;
}
```

---

## 7. NON-NEGOTIABLES

### No Unilateral Decisions

**FORBIDDEN:**
```typescript
// ❌ WRONG - Seller can unilaterally release escrow
async function releaseEscrowToSeller(escrowId: UUID, sellerId: UUID) {
  const escrow = await getEscrowBucket(escrowId);
  if (escrow.seller_id === sellerId) {
    // Seller releases to themselves
    await updateEscrowStatus(escrowId, 'RELEASED');
  }
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Only arbitration or buyer confirmation
async function releaseEscrow(
  escrowId: UUID,
  reason: 'BUYER_CONFIRMED' | 'DISPUTE_RESOLVED' | 'TIMEOUT'
) {
  if (reason === 'BUYER_CONFIRMED') {
    // Buyer must explicitly confirm
    const confirmation = await getBuyerConfirmation(escrowId);
    if (!confirmation) throw new Error('No buyer confirmation');
  }
  
  if (reason === 'DISPUTE_RESOLVED') {
    // Must have arbitration decision
    const resolution = await getDisputeResolution(escrowId);
    if (!resolution) throw new Error('No resolution');
  }
  
  // Release via ledger
  await releaseEscrowViaLedger(escrowId, reason);
}
```

---

### Full Evidence Immutability

**FORBIDDEN:**
```typescript
// ❌ WRONG - Evidence can be deleted
async function deleteEvidence(evidenceId: UUID) {
  await db.query('DELETE FROM dispute_evidence WHERE id = $1', [evidenceId]);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Evidence is append-only
async function submitEvidence(
  disputeId: UUID,
  submittedBy: UUID,
  evidence: EvidenceData
): Promise<DisputeEvidence> {
  // Only insert, never update/delete
  const entry = await insertEvidence({
    id: generateUUID(),
    dispute_id: disputeId,
    submitted_by: submittedBy,
    ...evidence,
    submitted_at: now(),
    created_at: now()
  });
  
  return entry;
}
```

---

### Arbitrator Conflict of Interest

**FORBIDDEN:**
```typescript
// ❌ WRONG - Arbitrator with conflict decides
async function assignArbitrator(disputeId: UUID) {
  const dispute = await getDispute(disputeId);
  const arbitrator = await getRandomArbitrator();
  
  // No conflict check
  await assignArbitratorToDispute(arbitrator.id, disputeId);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Conflict detection
async function assignArbitrator(disputeId: UUID): Promise<Arbitrator> {
  const dispute = await getDispute(disputeId);
  
  // Get available arbitrators
  const candidates = await getAvailableArbitrators();
  
  // Filter out conflicts
  const qualified = candidates.filter(arb => {
    // No prior disputes with either party
    if (arb.user_id === dispute.buyer_id) return false;
    if (arb.user_id === dispute.seller_id) return false;
    
    // No recent disputes with either party
    const recentDisputes = getRecentDisputes(arb.user_id, 90);
    if (recentDisputes.includes(dispute.buyer_id)) return false;
    if (recentDisputes.includes(dispute.seller_id)) return false;
    
    return true;
  });
  
  if (qualified.length === 0) {
    throw new Error('No qualified arbitrators available');
  }
  
  // Select by performance
  return selectBestArbitrator(qualified);
}
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Core Dispute (Weeks 1-2)
- [ ] Create dispute schema
- [ ] Implement dispute creation
- [ ] Add evidence submission
- [ ] Create dispute state machine

### Phase 2: Arbitration (Weeks 3-4)
- [ ] Implement arbitrator assignment
- [ ] Create decision engine
- [ ] Add arbitration workflow
- [ ] Implement escrow release

### Phase 3: Appeals (Weeks 5-6)
- [ ] Create appeal schema
- [ ] Implement appeal workflow
- [ ] Add senior arbitrator review
- [ ] Create appeal metrics

### Phase 4: Monitoring (Weeks 7-8)
- [ ] Implement metrics collection
- [ ] Add arbitrator performance tracking
- [ ] Create anomaly detection
- [ ] Add dispute trends analysis

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
