# Sprint 8: Dispute & Claims Intelligence (NO AUTOMATION)

## Overview

This sprint implements advisory-only dispute and claims intelligence for the Crowdship platform. The system provides read-only claim classification, evidence checklist generation, and resolution guidance without any automatic resolution or outcome enforcement.

## Hard Rules (Non-Negotiable)

| Rule | Enforcement |
|------|-------------|
| ❌ No auto-resolution | System never automatically resolves disputes |
| ❌ No outcome enforcement | System never enforces outcomes |
| ✅ Human decides everything | All decisions made by human reviewers |
| ✅ Read-only classification | Classification is advisory only |
| ✅ Evidence checklist only | System generates checklists, does not collect evidence |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Dispute Intelligence API                    │
│                      (NO AUTOMATION)                         │
├─────────────────────────────────────────────────────────────┤
│  GET /api/disputes/advisory   → Full Dispute Advisory       │
│  GET /api/disputes/evidence   → Evidence Checklist          │
│  GET /api/disputes/classify   → Claim Classification        │
│  GET /api/disputes/health     → Service Health              │
│  GET /api/disputes/constraints→ Service Rules               │
├─────────────────────────────────────────────────────────────┤
│                    Feature Flag Gate                         │
│          FF_DISPUTE_INTEL_ENABLED (default: OFF)            │
│          FF_EMERGENCY_DISABLE_ALL (kill switch)             │
├─────────────────────────────────────────────────────────────┤
│                  DisputeIntelService                         │
│  - getDisputeAdvisory()    [READ-ONLY]                      │
│  - classifyClaim()         [READ-ONLY]                      │
│  - generateEvidenceChecklist() [READ-ONLY]                  │
│  - getHealth()                                               │
├─────────────────────────────────────────────────────────────┤
│                    Audit Logging                             │
│  - advisoryId, disputeId, action, timestamp                 │
│  - NO claim content storage                                  │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### GET /api/disputes/advisory

Returns full dispute advisory including classification, evidence checklist, and resolution guidance.

**Query Parameters:**
- `disputeId` (required): Dispute identifier
- `buyerId` (required): Buyer user ID
- `sellerId` (required): Seller user ID
- `amount` (required): Transaction amount
- `currency` (required): Currency code
- `itemDescription` (required): Item description
- `claimDescription` (required): Claim description
- `claimDate` (required): Date claim was filed
- `transactionId` (optional): Transaction ID
- `travelerId` (optional): Traveler user ID
- `transactionDate` (optional): Original transaction date
- `deliveryDate` (optional): Delivery date
- `existingEvidence` (optional): Comma-separated evidence list

**Response:**
```json
{
  "success": true,
  "data": {
    "advisoryId": "adv_abc123",
    "disputeId": "disp-123",
    "timestamp": "2025-12-19T10:00:00Z",
    "classification": {
      "category": "ITEM_NOT_RECEIVED",
      "severity": "MEDIUM",
      "complexity": "MODERATE",
      "confidence": 85,
      "reasoning": {...},
      "suggestedActions": [...]
    },
    "evidenceChecklist": {...},
    "resolutionGuidance": {
      "recommendedApproach": "...",
      "possibleOutcomes": [...],
      "humanDecisionRequired": true
    },
    "riskAssessment": {...},
    "disclaimer": {
      "isAdvisoryOnly": true,
      "noAutoResolution": true,
      "noOutcomeEnforcement": true,
      "humanDecidesEverything": true
    }
  },
  "advisory": true
}
```

### GET /api/disputes/evidence

Returns evidence checklist for a dispute category.

**Query Parameters:**
- `disputeId` (required): Dispute identifier
- `category` (optional): Dispute category
- `claimDescription` (optional): Claim description for auto-categorization

**Response:**
```json
{
  "success": true,
  "data": {
    "checklistId": "chk_xyz789",
    "disputeId": "disp-123",
    "category": "DAMAGED_ITEM",
    "requiredEvidence": [
      {
        "id": "ev_1",
        "type": "PHOTO",
        "description": "Photos showing damage",
        "importance": "REQUIRED",
        "fromParty": "BUYER",
        "examples": ["Damage close-ups", "Packaging condition"]
      }
    ],
    "optionalEvidence": [...],
    "partyResponsibilities": [...],
    "timelineGuidance": {...}
  },
  "advisory": true
}
```

### GET /api/disputes/classify

Returns read-only claim classification.

### GET /api/disputes/health

Returns service health status.

### GET /api/disputes/constraints

Returns service constraints and rules documentation.

## Supported Dispute Categories

| Category | Description |
|----------|-------------|
| `ITEM_NOT_RECEIVED` | Item never arrived |
| `ITEM_NOT_AS_DESCRIBED` | Item differs from listing |
| `DAMAGED_ITEM` | Item arrived damaged |
| `WRONG_ITEM` | Received incorrect item |
| `PARTIAL_DELIVERY` | Not all items received |
| `DELIVERY_DELAY` | Delivery took too long |
| `PAYMENT_ISSUE` | Payment-related dispute |
| `COMMUNICATION_ISSUE` | Seller unresponsive |
| `CANCELLATION_DISPUTE` | Cancellation disagreement |
| `REFUND_REQUEST` | Refund requested |
| `OTHER` | Uncategorized |

## Evidence Types

| Type | Description |
|------|-------------|
| `PHOTO` | Photographic evidence |
| `VIDEO` | Video evidence |
| `RECEIPT` | Purchase receipts |
| `TRACKING_INFO` | Shipping tracking |
| `COMMUNICATION_LOG` | Message history |
| `SCREENSHOT` | Screen captures |
| `DOCUMENT` | Supporting documents |
| `TIMESTAMP_PROOF` | Date/time proof |
| `DELIVERY_CONFIRMATION` | Delivery proof |
| `CONDITION_REPORT` | Item condition report |

## Feature Flags

```bash
# Enable dispute intelligence advisory
FF_DISPUTE_INTEL_ENABLED=false  # Default OFF

# Emergency kill switch (disables all AI features)
FF_EMERGENCY_DISABLE_ALL=false
```

## Files Created/Modified

### Created
- `backend/services/crowdship-service/src/types/dispute-intel.types.ts`
- `backend/services/crowdship-service/src/services/dispute-intel.service.ts`
- `backend/services/crowdship-service/src/routes/dispute-intel.routes.ts`
- `backend/services/crowdship-service/src/services/__tests__/dispute-intel.test.ts`
- `docs/SPRINT8_DISPUTE_INTEL_IMPLEMENTATION.md`

### Modified
- `backend/services/crowdship-service/src/config/feature-flags.ts` - Added `DISPUTE_INTEL_ENABLED`
- `.env.example` - Added `FF_DISPUTE_INTEL_ENABLED`

## Testing

```bash
# Run tests
npm test -- --testPathPattern=dispute-intel

# Test coverage
npm test -- --coverage --testPathPattern=dispute-intel
```

### Test Categories

1. **NO AUTOMATION Constraints**
   - Disclaimer presence
   - Human approval required
   - No execution results

2. **Deterministic Outputs**
   - Same input = same output
   - Consistent classification
   - Consistent checklists

3. **Feature Flag Enforcement**
   - Disabled when flag off
   - Emergency disable works

4. **Claim Classification**
   - Category detection
   - Severity calculation
   - Complexity assessment

5. **Evidence Checklist**
   - Required evidence items
   - Party responsibilities
   - Timeline guidance

6. **Audit Logging**
   - Request logging
   - No sensitive content

## What This Service Does NOT Do

| Action | Status |
|--------|--------|
| Automatically resolve disputes | ❌ Never |
| Enforce outcomes | ❌ Never |
| Collect evidence | ❌ Never |
| Contact parties | ❌ Never |
| Process refunds | ❌ Never |
| Make decisions | ❌ Never |
| Modify dispute status | ❌ Never |

## Integration

To integrate with the main application:

```typescript
import disputeIntelRoutes from './routes/dispute-intel.routes';

// Mount routes
app.use('/api/disputes', disputeIntelRoutes);
```

## Audit Logging

Every request is logged with:
- `advisoryId` - Unique identifier
- `disputeId` - Dispute being analyzed
- `action` - Type of operation
- `timestamp` - When it occurred

**NOT logged:**
- Claim content
- Personal information
- Evidence files

## Security Considerations

1. **Read-Only Access** - No mutations possible
2. **Feature Gated** - Disabled by default
3. **Emergency Kill Switch** - Instant disable capability
4. **Audit Trail** - All access logged
5. **No PII in Logs** - Only IDs and timestamps
6. **No Evidence Storage** - Checklist only, no collection

## Resolution Workflow (Human-Driven)

```
1. Dispute Filed
       ↓
2. System Generates Advisory (READ-ONLY)
   - Classification
   - Evidence Checklist
   - Resolution Guidance
       ↓
3. Human Reviewer Reviews Advisory
       ↓
4. Human Requests Evidence from Parties
       ↓
5. Human Analyzes Evidence
       ↓
6. Human Makes Decision
       ↓
7. Human Enforces Outcome
```

The system only assists with steps 2 (advisory generation). All other steps are performed by human reviewers.
