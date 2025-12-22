# Sprint 2: Trust-First Market Activation

## Executive Summary

Sprint 2 activates AI-assisted marketplace behavior for the **first external market corridor (US → MENA)** without changing any financial or legal flows. All features are advisory-only, deterministic, and feature-flagged.

## Scope Delivered

### 1. Market Corridor Configuration ✅

**Location:** `backend/services/crowdship-service/src/config/market-corridors.ts`

Configured corridors:
- **US → EG** (Egypt): Customs multiplier 1.3x, high-value threshold $200
- **US → AE** (UAE): Customs multiplier 1.1x, high-value threshold $200  
- **US → SA** (Saudi Arabia): Customs multiplier 1.4x, high-value threshold $200

Risk multipliers per corridor:
- Customs complexity factor
- Value bands (Low/Standard/Elevated/High/Very High)
- Delivery window (Express/Standard/Economy)

```typescript
// Example corridor config
{
  id: 'US_EG',
  name: 'United States → Egypt',
  riskMultipliers: {
    customs: 1.3,
    valueBands: [
      { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
      { minValue: 200, maxValue: 500, multiplier: 1.3, label: 'Elevated' },
      // ...
    ]
  },
  trustRequirements: {
    highValueThreshold: 200,
    minBuyerTrust: 'TRUSTED',
    minTravelerTrust: 'TRUSTED',
  },
  escrowPolicy: 'ALWAYS_RECOMMENDED',
}
```

### 2. Intent → Market Flow ✅

**Location:** `backend/services/crowdship-service/src/services/corridor-advisory.service.ts`

Extended intent classification:
- `BUY_FROM_ABROAD` - Purchase from international seller
- `TRAVEL_MATCH` - Match with traveler for delivery
- `PRICE_VERIFY` - Verify pricing before purchase

**UI Component:** `frontend/web/src/components/crowdship/IntentChip.tsx`
- Editable intent chip (read-only advisory)
- Confidence indicator
- Signal breakdown display

### 3. Trust Gating Ruleset (NON-BYPASSABLE) ✅

**Location:** `backend/services/crowdship-service/src/services/corridor-advisory.service.ts`

Rules implemented:
- **High-value items (> $200):** Require TRUSTED buyer + TRUSTED traveler
- **Trust not met:** Recommendation downgraded (never blocked)
- **Cross-border default:** Escrow recommended (never enforced)

```typescript
// Trust gating evaluation
evaluateTrustGating(corridor, buyerTrust, travelerTrust, isHighValue) {
  // High-value items require TRUSTED level for both parties
  const requiredBuyerLevel = isHighValue ? TrustLevel.TRUSTED : corridor.minBuyerTrust;
  const requiredTravelerLevel = isHighValue ? TrustLevel.TRUSTED : corridor.minTravelerTrust;
  
  // Returns passed: boolean, downgradeReason if not passed
}
```

### 4. AI Recommendation Visibility ✅

**Location:** `frontend/web/src/components/crowdship/RecommendationLanes.tsx`

Three recommendation lanes:
1. **"Why this is recommended"** - Explanation panel with reasoning
2. **"Safer alternatives"** - Lower risk options (e.g., use escrow)
3. **"Higher risk – allowed if you choose"** - User can proceed with awareness

```typescript
interface RecommendationLanes {
  recommended: LaneOption[];
  saferAlternatives: LaneOption[];
  higherRiskAllowed: LaneOption[];
  whyRecommended: string[];  // Explanation reasons
}
```

### 5. Human Confirmation Checkpoints ✅

**Location:** `frontend/web/src/components/crowdship/ConfirmationCheckpoint.tsx`

Explicit user confirmation required before:
- **Contacting traveler** - Share request details
- **Selecting payment method** - Payment terms review
- **Proceeding cross-border** - International transaction acknowledgment

**NO background actions** - All actions require explicit confirmation.

```typescript
interface HumanConfirmationCheckpoint {
  checkpointId: string;
  type: 'CONTACT_TRAVELER' | 'SELECT_PAYMENT' | 'PROCEED_CROSS_BORDER';
  title: string;
  description: string;
  requiredConfirmation: boolean;
  confirmationText: string;
  warnings: string[];
}
```

### 6. Feature Flags ✅

**Location:** `backend/services/crowdship-service/src/config/feature-flags.ts`

All flags default **OFF**:
```typescript
CORRIDOR_AI_ADVISORY: false,    // FF_CORRIDOR_AI_ADVISORY
TRUST_GATING: false,            // FF_TRUST_GATING
INTENT_CHIP_UI: false,          // FF_INTENT_CHIP_UI
HUMAN_CONFIRMATION_CHECKPOINTS: false,  // FF_HUMAN_CONFIRMATION_CHECKPOINTS
```

Toggle per environment via environment variables.

### 7. Audit & Trace ✅

**Location:** `backend/services/crowdship-service/src/services/corridor-advisory.service.ts`

Logged snapshots:
- `intent_snapshot` - Intent classification result
- `trust_snapshot` - Buyer and traveler trust scores
- `risk_snapshot` - Risk assessment result
- `recommendation_snapshot` - Recommendation lanes

All correlated by `requestId` and `correlationId`.

```typescript
interface CorridorSnapshot {
  requestId: string;
  correlationId: string;
  timestamp: string;
  intentSnapshot: MarketIntentResult | null;
  trustSnapshot: { buyer: TrustScoreResult | null; traveler: TrustScoreResult | null };
  riskSnapshot: RiskAssessmentResult | null;
  recommendationSnapshot: RecommendationLanes | null;
  corridorAssessment: CorridorAssessment | null;
}
```

---

## API Endpoints

### Corridor Advisory
```
POST /api/crowdship/corridor/advisory
Body: { origin, destination, itemValueUSD, deliveryDays, buyerId, travelerId }
Response: { data: CorridorAssessment, meta: { advisory: true, correlationId } }
```

### Intent Classification
```
POST /api/crowdship/intent/classify
Body: { pageContext, action, userRole, productUrl, hasPrice, isCrossBorder }
Response: { data: MarketIntentResult, meta: { advisory: true } }
```

### Confirmation Checkpoints
```
POST /api/crowdship/checkpoints
Body: { isCrossBorder, isContactingTraveler, isSelectingPayment }
Response: { data: HumanConfirmationCheckpoint[] }
```

### Record Confirmation
```
POST /api/crowdship/checkpoints/:checkpointId/confirm
Body: { confirmed: boolean }
Response: { success: true, checkpointId, timestamp }
```

### Audit Snapshots
```
GET /api/crowdship/corridor/snapshot/:requestId
GET /api/crowdship/corridor/snapshots?limit=100
GET /api/crowdship/corridor/confirmations?limit=100
```

---

## Sample API Output

### Corridor Advisory Response
```json
{
  "data": {
    "corridorId": "US_EG",
    "corridorName": "United States → Egypt",
    "origin": "US",
    "destination": "EG",
    "isSupported": true,
    "riskMultiplier": 1.43,
    "valueBand": { "label": "Elevated", "multiplier": 1.3 },
    "trustGating": {
      "passed": true,
      "buyerMeetsRequirement": true,
      "travelerMeetsRequirement": true,
      "requiredBuyerTrust": "TRUSTED",
      "requiredTravelerTrust": "TRUSTED",
      "actualBuyerTrust": "TRUSTED",
      "actualTravelerTrust": "VERIFIED",
      "isHighValue": true
    },
    "escrowRecommendation": {
      "recommended": true,
      "required": false,
      "reason": "Cross-border transactions benefit from escrow protection",
      "policy": "ALWAYS_RECOMMENDED"
    },
    "restrictions": ["electronics_batteries", "liquids_over_100ml"],
    "warnings": ["High-value item (>200 USD) - enhanced trust required"],
    "timestamp": "2024-12-18T10:30:00.000Z"
  },
  "meta": {
    "advisory": true,
    "disclaimer": "This is an advisory assessment only. No actions have been executed.",
    "correlationId": "corridor-1734520200000-abc123def"
  }
}
```

### Intent Classification Response
```json
{
  "data": {
    "intent": "BUY_FROM_ABROAD",
    "confidence": 0.75,
    "confidenceLevel": "HIGH",
    "signals": [
      { "source": "cross_border", "value": "true", "weight": 0.3 },
      { "source": "product_url", "value": "present", "weight": 0.25 },
      { "source": "user_role", "value": "buyer", "weight": 0.2 }
    ],
    "reasoning": "Classified as BUY_FROM_ABROAD based on 3 signals",
    "editable": true,
    "timestamp": "2024-12-18T10:30:00.000Z"
  },
  "meta": { "advisory": true }
}
```

---

## UI Components

### IntentChip
- Displays classified intent with confidence
- Editable dropdown when `INTENT_CHIP_UI` flag enabled
- Shows signal breakdown

### RecommendationLanes
- "Why This is Recommended" panel
- "Safer Alternatives" lane
- "Higher Risk – Allowed if You Choose" lane
- User selection tracking

### ConfirmationCheckpoint
- Modal for explicit user confirmation
- Checkbox acknowledgment required
- Audit logging on confirm/decline

### CorridorAdvisoryPanel
- Complete advisory display combining all components
- Trust scores, risk assessment, corridor details
- Feature-flag aware rendering

---

## Non-Goals (Strictly Enforced)

- ❌ No payments
- ❌ No escrow execution
- ❌ No auto-matching
- ❌ No ranking suppression without explanation
- ❌ No background actions

---

## Definition of Done ✅

| Requirement | Status |
|-------------|--------|
| External corridor flow works end-to-end (advisory only) | ✅ |
| Users see intent, trust, risk, and reasons | ✅ |
| Same input = same output (deterministic) | ✅ |
| Feature flags fully control exposure | ✅ |
| Zero impact on money movement | ✅ |

---

## Files Changed/Added

### Backend
- `backend/services/crowdship-service/src/config/market-corridors.ts` - Corridor config
- `backend/services/crowdship-service/src/config/feature-flags.ts` - Sprint 2 flags
- `backend/services/crowdship-service/src/services/corridor-advisory.service.ts` - Extended service
- `backend/services/crowdship-service/src/routes/corridor.routes.ts` - New API routes

### Frontend
- `frontend/web/src/services/crowdship-ai.service.ts` - Extended service
- `frontend/web/src/components/crowdship/IntentChip.tsx` - New component
- `frontend/web/src/components/crowdship/RecommendationLanes.tsx` - New component
- `frontend/web/src/components/crowdship/ConfirmationCheckpoint.tsx` - New component
- `frontend/web/src/components/crowdship/CorridorAdvisoryPanel.tsx` - New component

---

## Environment Variables

```bash
# Sprint 2 Feature Flags (all default OFF)
FF_CORRIDOR_AI_ADVISORY=false
FF_TRUST_GATING=false
FF_INTENT_CHIP_UI=false
FF_HUMAN_CONFIRMATION_CHECKPOINTS=false

# Frontend Feature Flags
REACT_APP_FF_CORRIDOR_AI_ADVISORY=false
REACT_APP_FF_TRUST_GATING=false
REACT_APP_FF_INTENT_CHIP_UI=false
REACT_APP_FF_HUMAN_CONFIRMATION_CHECKPOINTS=false
```

---

## Next Steps (Sprint 3)

1. Expand to additional corridors (EU → MENA, MENA → MENA)
2. Add real-time trust score updates
3. Implement A/B testing for recommendation effectiveness
4. Add user feedback collection on recommendations
