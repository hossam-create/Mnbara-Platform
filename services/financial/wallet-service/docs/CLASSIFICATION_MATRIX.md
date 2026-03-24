# Mismatch Classification Matrix — Quick Reference

## Classification Types & Severity Mapping

| Classification | Severity | Requires Immediate Attention | Color |
|----------------|----------|------------------------------|-------|
| **MISSING_PAYMENT** | HIGH 🔴 | ✅ YES | Red |
| **DELAYED_PAYMENT** | LOW 🟢 | ❌ No | Green |
| **AMOUNT_MISMATCH** | LOW/MED/HIGH 🟢🟠🔴 | Depends on variance | Variable |
| **DUPLICATE_GATEWAY_PAYMENT** | HIGH 🔴 | ✅ YES | Red |
| **GATEWAY_SUCCESS_ESCROW_MISSING** | HIGH 🔴 | ✅ YES | Red |
| **GATEWAY_QUERY_FAILED** | HIGH 🔴 | ✅ YES | Red |

---

## Amount Mismatch Severity Thresholds

| Variance | Severity | Example | Action |
|----------|----------|---------|--------|
| ≤ 1% | LOW 🟢 | 10000 vs 10050 | Monitor, likely rounding |
| 1-10% | MEDIUM 🟠 | 10000 vs 10500 | Review within 24-48h |
| > 10% | HIGH 🔴 | 10000 vs 15000 | Immediate investigation |

---

## Recommended Actions by Classification

### MISSING_PAYMENT (HIGH 🔴)
```
URGENT: Contact customer to verify payment.
Check gateway dashboard manually.
May need to refund escrow if payment truly missing.
```

### DELAYED_PAYMENT (LOW 🟢)
```
Monitor payment status.
Re-reconcile in 24 hours.
No immediate action required.
```

### AMOUNT_MISMATCH (Variable)
**LOW:**
```
Minor variance detected. Likely rounding or currency conversion.
Can be ignored if within acceptable threshold.
```

**MEDIUM:**
```
Review amount discrepancy.
Check for currency conversion issues.
Contact customer if variance is significant.
```

**HIGH:**
```
URGENT: Significant amount discrepancy detected.
Contact customer immediately.
Investigate payment details at gateway.
```

### DUPLICATE_GATEWAY_PAYMENT (HIGH 🔴)
```
URGENT: Freeze escrow.
Verify which payment is legitimate.
Refund duplicate payment at gateway.
```

### GATEWAY_SUCCESS_ESCROW_MISSING (HIGH 🔴)
```
URGENT: Investigate data integrity.
Check if escrow was deleted or never created.
May need to create escrow retroactively.
```

### GATEWAY_QUERY_FAILED (HIGH 🔴)
```
URGENT: Check gateway API status.
Verify credentials.
Retry reconciliation once gateway is accessible.
```

---

## Detection Logic

### DELAYED_PAYMENT Detection
Gateway statuses that indicate delayed (not missing):
- `pending`
- `processing`
- `requires_action`
- `requires_payment_method`
- `requires_confirmation`
- `requires_capture`

### AMOUNT_MISMATCH Severity Calculation
```typescript
variance = |expectedAmount - gatewayAmount| / expectedAmount * 100

if (variance <= 1%) → LOW
else if (variance <= 10%) → MEDIUM
else → HIGH
```

---

## Priority Levels

| Severity | Priority Number | Sort Order |
|----------|----------------|------------|
| HIGH 🔴 | 3 | First |
| MEDIUM 🟠 | 2 | Second |
| LOW 🟢 | 1 | Last |

---

## Color Codes (for UI)

| Severity | Hex Code | RGB |
|----------|----------|-----|
| LOW 🟢 | `#10B981` | rgb(16, 185, 129) |
| MEDIUM 🟠 | `#F59E0B` | rgb(245, 158, 11) |
| HIGH 🔴 | `#EF4444` | rgb(239, 68, 68) |

---

## Classification Statistics Example

```json
{
  "total": 100,
  "byClassification": {
    "MISSING_PAYMENT": 5,
    "DELAYED_PAYMENT": 20,
    "AMOUNT_MISMATCH": 10,
    "DUPLICATE_GATEWAY_PAYMENT": 1,
    "GATEWAY_SUCCESS_ESCROW_MISSING": 2,
    "GATEWAY_QUERY_FAILED": 3
  },
  "bySeverity": {
    "LOW": 25,
    "MEDIUM": 15,
    "HIGH": 11
  },
  "highSeverityCount": 11,
  "requiresImmediateAttention": 11
}
```

---

## Admin Dashboard Queries

### Get Critical Items (High Priority)
```typescript
const critical = await reconciliationService.getHighSeverityItems();
// Returns only HIGH severity + FLAGGED resolution
```

### Get Items by Type
```typescript
const missingPayments = await reconciliationService.getItemsByClassification(
  MismatchClassification.MISSING_PAYMENT
);
```

### Get Items by Severity
```typescript
const mediumSeverity = await reconciliationService.getItemsBySeverity(
  MismatchSeverity.MEDIUM
);
```

### Get Run Statistics
```typescript
const stats = await reconciliationService.getRunClassificationStats(runId);
```

---

## Classification Flow

```
Input: ReconciliationItemStatus + Context
  │
  ├─ MATCH → No classification needed
  │
  ├─ ERROR → GATEWAY_QUERY_FAILED (HIGH)
  │
  ├─ MISSING
  │  ├─ Gateway status = pending → DELAYED_PAYMENT (LOW)
  │  └─ No gateway record → MISSING_PAYMENT (HIGH)
  │
  └─ OVERPAID / UNDERPAID → AMOUNT_MISMATCH
     ├─ Calculate variance %
     ├─ ≤1% → LOW
     ├─ 1-10% → MEDIUM
     └─ >10% → HIGH
```

---

## Integration Example

```typescript
// During reconciliation
const { classification, severity } = mismatchClassifier.classify(
  status,
  gatewayStatus,
  expectedAmount,
  gatewayAmount,
  gatewayPaymentId,
  errorMessage
);

// Store in database
await prisma.reconciliationItem.create({
  data: {
    // ... other fields
    classification,
    severity,
  },
});

// Check if urgent
if (mismatchClassifier.requiresImmediateAttention(severity)) {
  await sendAlert({
    type: 'CRITICAL_MISMATCH',
    classification,
    action: mismatchClassifier.getRecommendedAction(classification, severity),
  });
}
```

---

**Quick Reference Guide — Phase 4.4.3**
