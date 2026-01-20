# PHASE 4.4.3 — Mismatch Classification

## Status: ✅ COMPLETE

---

## Overview

Phase 4.4.3 extends the reconciliation system with **intelligent mismatch classification** and **severity-based prioritization**. This enables admins to quickly identify and respond to critical discrepancies while safely ignoring minor variances.

---

## Deliverables

### 1. Schema Updates (`schema-v2.prisma`)
**Added Fields to `ReconciliationItem`:**
- `classification` (MismatchClassification?) - Detailed mismatch type
- `severity` (MismatchSeverity?) - Risk level (LOW/MEDIUM/HIGH)

**New Enums:**
- `MismatchClassification` - 6 classification types
- `MismatchSeverity` - 3 severity levels

### 2. Mismatch Classifier Service (`mismatch-classifier.service.ts`)
**Core Functions:**
- ✅ `classify()` - Main classification logic
- ✅ `isDelayedPayment()` - Detect pending vs missing
- ✅ `calculateAmountMismatchSeverity()` - Variance-based severity
- ✅ `getClassificationDescription()` - Human-readable explanations
- ✅ `getRecommendedAction()` - Actionable guidance
- ✅ Utility functions for UI (colors, priorities)

### 3. Enhanced Reconciliation Service
**New Operations:**
- ✅ `getHighSeverityItems()` - Critical mismatches only
- ✅ `getItemsByClassification()` - Filter by type
- ✅ `getItemsBySeverity()` - Filter by severity
- ✅ `getRunClassificationStats()` - Statistical breakdown

### 4. Test Suite (`mismatch-classifier.test.ts`)
**Coverage:**
- ✅ Classification logic (6 scenarios)
- ✅ Severity calculation (threshold testing)
- ✅ Delayed payment detection
- ✅ Recommended actions
- ✅ Statistics calculation
- ✅ Edge cases

**Total: 40+ comprehensive tests**

---

## Classification Types

### 1. MISSING_PAYMENT
**Description:** Escrow exists, but no corresponding payment found at gateway.

**Severity:** `HIGH`

**Possible Causes:**
- Webhook delivery failure
- Payment never initiated by customer
- Gateway API issue during payment creation

**Recommended Action:**
```
URGENT: Contact customer to verify payment. 
Check gateway dashboard manually. 
May need to refund escrow if payment truly missing.
```

---

### 2. DELAYED_PAYMENT
**Description:** Payment is still pending at gateway.

**Severity:** `LOW`

**Possible Causes:**
- Payment processing in progress
- 3DS authentication pending
- Bank authorization delay

**Recommended Action:**
```
Monitor payment status. 
Re-reconcile in 24 hours. 
No immediate action required.
```

**Gateway Statuses Detected:**
- `pending`
- `processing`
- `requires_action`
- `requires_payment_method`
- `requires_confirmation`
- `requires_capture`

---

### 3. AMOUNT_MISMATCH
**Description:** Payment amount at gateway does not match escrow amount.

**Severity:** `LOW` / `MEDIUM` / `HIGH` (based on variance)

**Severity Thresholds:**
| Variance | Severity | Example |
|----------|----------|---------|
| ≤ 1% | LOW | 10000 vs 10050 (likely rounding) |
| 1-10% | MEDIUM | 10000 vs 10500 (needs review) |
| > 10% | HIGH | 10000 vs 15000 (critical) |

**Possible Causes:**
- Currency conversion rounding
- Incorrect payment amount entered
- Fee calculation discrepancy

**Recommended Actions:**
- **LOW:** Can be ignored if within acceptable threshold
- **MEDIUM:** Review amount discrepancy, check for currency conversion issues
- **HIGH:** Contact customer, investigate immediately

---

### 4. DUPLICATE_GATEWAY_PAYMENT
**Description:** Multiple gateway payments detected for single escrow.

**Severity:** `HIGH`

**Possible Causes:**
- Customer double-clicked payment button
- Webhook delivered multiple times (but idempotency failed)
- Gateway retry logic created duplicate

**Recommended Action:**
```
URGENT: Freeze escrow. 
Verify which payment is legitimate. 
Refund duplicate payment at gateway.
```

---

### 5. GATEWAY_SUCCESS_ESCROW_MISSING
**Description:** Gateway shows successful payment but no escrow record exists.

**Severity:** `HIGH`

**Possible Causes:**
- Escrow deleted or never created
- Webhook processed before escrow creation
- Data integrity issue

**Recommended Action:**
```
URGENT: Investigate data integrity. 
Check if escrow was deleted or never created. 
May need to create escrow retroactively.
```

---

### 6. GATEWAY_QUERY_FAILED
**Description:** Unable to query gateway API.

**Severity:** `HIGH`

**Possible Causes:**
- Network error
- Invalid API credentials
- Gateway downtime
- Rate limiting

**Recommended Action:**
```
URGENT: Check gateway API status. 
Verify credentials. 
Retry reconciliation once gateway is accessible.
```

---

## Severity Levels

### LOW (Green 🟢)
- **Priority:** 1
- **Color:** `#10B981`
- **Requires Immediate Attention:** No
- **Examples:**
  - Delayed payments (pending)
  - Minor amount variance (≤1%)

**Admin Action:** Monitor, no immediate action required

---

### MEDIUM (Orange 🟠)
- **Priority:** 2
- **Color:** `#F59E0B`
- **Requires Immediate Attention:** No
- **Examples:**
  - Amount mismatch (1-10% variance)

**Admin Action:** Review and investigate within 24-48 hours

---

### HIGH (Red 🔴)
- **Priority:** 3
- **Color:** `#EF4444`
- **Requires Immediate Attention:** **YES**
- **Examples:**
  - Missing payments
  - Duplicate payments
  - Gateway success but no escrow
  - Gateway query failures
  - Large amount mismatches (>10%)

**Admin Action:** Immediate investigation and resolution required

---

## Usage Examples

### Automatic Classification During Reconciliation

```typescript
// Reconciliation service automatically classifies mismatches
const result = await reconciliationService.executeReconciliationRun({
  gateway: 'STRIPE',
  triggeredBy: 'system',
});

// Each item now has classification and severity
console.log(result.items[0].classification); // MISSING_PAYMENT
console.log(result.items[0].severity); // HIGH
```

### Get High-Priority Items for Admin Dashboard

```typescript
// Get all high-severity mismatches requiring immediate attention
const criticalItems = await reconciliationService.getHighSeverityItems();

for (const item of criticalItems) {
  console.log(`URGENT: ${item.classification}`);
  console.log(`Escrow: ${item.escrowId}`);
  console.log(`Action: ${mismatchClassifier.getRecommendedAction(
    item.classification,
    item.severity
  )}`);
}
```

### Filter by Classification Type

```typescript
// Get all missing payment cases
const missingPayments = await reconciliationService.getItemsByClassification(
  MismatchClassification.MISSING_PAYMENT
);

// Get all amount mismatches
const amountMismatches = await reconciliationService.getItemsByClassification(
  MismatchClassification.AMOUNT_MISMATCH
);
```

### Get Classification Statistics

```typescript
// Get breakdown of mismatches for a reconciliation run
const stats = await reconciliationService.getRunClassificationStats(runId);

console.log(`Total: ${stats.total}`);
console.log(`High Severity: ${stats.highSeverityCount}`);
console.log(`Missing Payments: ${stats.byClassification.MISSING_PAYMENT}`);
console.log(`Amount Mismatches: ${stats.byClassification.AMOUNT_MISMATCH}`);
```

### Manual Classification

```typescript
// Classify a specific scenario
const { classification, severity } = mismatchClassifier.classify(
  ReconciliationItemStatus.OVERPAID,
  'succeeded',
  10000n,
  15000n,
  'pi_123',
  null
);

console.log(classification); // AMOUNT_MISMATCH
console.log(severity); // HIGH (50% overpaid)

// Get recommended action
const action = mismatchClassifier.getRecommendedAction(
  classification,
  severity
);
console.log(action); // URGENT: Contact customer...
```

---

## Classification Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│ Reconciliation Item Status                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─ MATCH
                            │  └─ No classification needed ✓
                            │
                            ├─ ERROR
                            │  └─ GATEWAY_QUERY_FAILED (HIGH)
                            │
                            ├─ MISSING
                            │  ├─ Gateway status = pending?
                            │  │  └─ DELAYED_PAYMENT (LOW)
                            │  └─ No gateway record
                            │     └─ MISSING_PAYMENT (HIGH)
                            │
                            ├─ OVERPAID / UNDERPAID
                            │  └─ AMOUNT_MISMATCH
                            │     ├─ ≤1% variance → LOW
                            │     ├─ 1-10% variance → MEDIUM
                            │     └─ >10% variance → HIGH
                            │
                            └─ Special Cases
                               ├─ Multiple gateway payments
                               │  └─ DUPLICATE_GATEWAY_PAYMENT (HIGH)
                               └─ Gateway success, no escrow
                                  └─ GATEWAY_SUCCESS_ESCROW_MISSING (HIGH)
```

---

## Admin Dashboard Integration

### Priority Queue

```typescript
// Display items sorted by severity (highest first)
const items = await reconciliationService.getItemsBySeverity(
  MismatchSeverity.HIGH
);

// Sort by priority
items.sort((a, b) => {
  const priorityA = mismatchClassifier.getSeverityPriority(a.severity);
  const priorityB = mismatchClassifier.getSeverityPriority(b.severity);
  return priorityB - priorityA;
});
```

### Color-Coded UI

```typescript
// Get severity color for badge/indicator
const color = mismatchClassifier.getSeverityColor(item.severity);

// Render in UI
<Badge style={{ backgroundColor: color }}>
  {item.severity}
</Badge>
```

### Actionable Alerts

```typescript
// Show recommended action to admin
const description = mismatchClassifier.getClassificationDescription(
  item.classification
);

const action = mismatchClassifier.getRecommendedAction(
  item.classification,
  item.severity
);

// Render alert
if (mismatchClassifier.requiresImmediateAttention(item.severity)) {
  <Alert type="error">
    <h3>{item.classification}</h3>
    <p>{description}</p>
    <strong>{action}</strong>
  </Alert>
}
```

---

## Database Schema

### ReconciliationItem (Updated)

```prisma
model ReconciliationItem {
  id                  String                    @id @default(uuid())
  runId               String
  
  // Existing fields...
  status              ReconciliationItemStatus
  resolution          ReconciliationResolution  @default(NONE)
  
  // NEW: Phase 4.4.3
  classification      MismatchClassification?   // Detailed type
  severity            MismatchSeverity?         // Risk level
  
  // Indexes for fast filtering
  @@index([classification])
  @@index([severity])
}
```

### Enums

```prisma
enum MismatchClassification {
  MISSING_PAYMENT
  DELAYED_PAYMENT
  AMOUNT_MISMATCH
  DUPLICATE_GATEWAY_PAYMENT
  GATEWAY_SUCCESS_ESCROW_MISSING
  GATEWAY_QUERY_FAILED
}

enum MismatchSeverity {
  LOW     // Monitor
  MEDIUM  // Review within 24-48h
  HIGH    // Immediate action required
}
```

---

## Testing

Run classification tests:
```bash
npm test -- mismatch-classifier.test.ts
```

Expected output:
```
✓ should return null classification for MATCH status
✓ should classify ERROR as GATEWAY_QUERY_FAILED with HIGH severity
✓ should classify MISSING with pending status as DELAYED_PAYMENT
✓ should classify MISSING without gateway record as MISSING_PAYMENT
✓ should classify OVERPAID as AMOUNT_MISMATCH with appropriate severity
✓ should detect pending status
✓ should return LOW severity for <=1% variance
✓ should return MEDIUM severity for 1-10% variance
✓ should return HIGH severity for >10% variance
... (40+ tests total)
```

---

## Migration Required

After implementing Phase 4.4.3, run:

```bash
npx prisma migrate dev --name add_mismatch_classification
```

This will:
1. Add `classification` and `severity` columns to `reconciliation_item`
2. Create `mismatch_classification` and `mismatch_severity` enums
3. Add indexes for efficient filtering

---

## Monitoring & Alerts

### High-Severity Alert Example

```typescript
// Cron job to check for high-severity mismatches
cron.schedule('*/15 * * * *', async () => {
  const criticalItems = await reconciliationService.getHighSeverityItems();
  
  if (criticalItems.length > 0) {
    // Send alert to admin team
    await notificationService.sendAlert({
      type: 'CRITICAL_RECONCILIATION_MISMATCH',
      count: criticalItems.length,
      items: criticalItems.map(item => ({
        escrowId: item.escrowId,
        classification: item.classification,
        severity: item.severity,
        action: mismatchClassifier.getRecommendedAction(
          item.classification,
          item.severity
        ),
      })),
    });
  }
});
```

---

## Next Steps: Phase 4.4.4

### Scheduled Reconciliation Jobs
- [ ] Implement cron scheduler
- [ ] Configure reconciliation frequency (e.g., every 15 minutes)
- [ ] Add job monitoring and health checks

### Admin API Endpoints
- [ ] `POST /admin/reconciliation/run` - Trigger manual run
- [ ] `GET /admin/reconciliation/runs` - List runs with stats
- [ ] `GET /admin/reconciliation/high-severity` - Critical items
- [ ] `GET /admin/reconciliation/by-classification/:type` - Filter by type
- [ ] `PATCH /admin/reconciliation/items/:id/resolve` - Mark resolved

### Alerting & Notifications
- [ ] Slack integration for high-severity mismatches
- [ ] Email alerts for critical discrepancies
- [ ] Dashboard widget showing reconciliation health

---

## Compliance Checklist

- [x] Classification logic is deterministic
- [x] Severity thresholds are documented
- [x] No automatic money movement
- [x] All classifications have recommended actions
- [x] Comprehensive test coverage
- [x] Admin can filter by severity
- [x] High-severity items are flagged automatically

---

**Phase 4.4.3 Status: ✅ COMPLETE**

All mismatch types classified. Severity-based prioritization enabled. Ready for Phase 4.4.4 (Scheduled Jobs & Admin API).
