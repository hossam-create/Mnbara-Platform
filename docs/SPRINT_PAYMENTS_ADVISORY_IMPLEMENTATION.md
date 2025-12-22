# Payment Advisory Implementation

## Overview

Payment Advisory is a **READ-ONLY, intelligence-only** service that provides payment method comparison, FX advisory, and risk assessment without executing any actual payments.

## HARD RULES (STRICTLY ENFORCED)

| Rule | Status |
|------|--------|
| ❌ No calls to banks | ENFORCED |
| ❌ No PSP SDKs | ENFORCED |
| ❌ No payment APIs | ENFORCED |
| ❌ No side effects | ENFORCED |
| ✅ Read-only services only | ENFORCED |

## What This Service Does NOT Do

- ❌ Create payment tables
- ❌ Store balances
- ❌ Assume escrow exists
- ❌ Modify any transaction
- ❌ Call external payment providers
- ❌ Process any payments
- ❌ Charge any cards
- ❌ Initiate any transfers

## What This Service DOES Do

- ✅ Compare payment methods (static rules + config)
- ✅ Provide FX advisory (rates from external snapshot)
- ✅ Generate risk flags
- ✅ Build explanations
- ✅ Record audit snapshots

---

## 1. Types

### PaymentMethodComparison

```typescript
interface PaymentMethodComparison {
  requestId: string;
  timestamp: string;
  corridor: string;
  amountUSD: number;
  methods: PaymentMethodOption[];
  recommended: string | null;
  recommendationReason: string;
  disclaimer: AdvisoryDisclaimer;
}
```

### FXAdvisoryResult

```typescript
interface FXAdvisoryResult {
  requestId: string;
  timestamp: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rates: FXRateComparison[];
  bestRate: FXRateComparison | null;
  marketRate: number;
  spread: number;
  spreadPercent: number;
  warnings: string[];
  explanation: string;
  disclaimer: AdvisoryDisclaimer;
}
```

### PaymentRiskWarning

```typescript
interface PaymentRiskWarning {
  id: string;
  type: PaymentRiskType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  affectedMethods: string[];
}
```

### AdvisoryDisclaimer

```typescript
interface AdvisoryDisclaimer {
  type: 'PAYMENT_ADVISORY';
  text: string;
  isAdvisoryOnly: true;
  noExecution: true;
  noGuarantee: true;
  timestamp: string;
}
```

---

## 2. APIs (READ-ONLY)

All endpoints are **GET only**. No mutations.

### GET /api/payments/advisory/health

Health check - always available.

```json
{
  "data": {
    "status": "healthy",
    "services": {
      "methodComparison": true,
      "fxAdvisory": true,
      "riskAssessment": true
    },
    "featureFlags": {
      "paymentAdvisoryEnabled": true,
      "emergencyDisabled": false
    }
  }
}
```

### GET /api/payments/advisory/options

Compare payment methods for a corridor.

**Parameters:**
- `corridor` (required): e.g., "US_EG"
- `amount` (required): Amount in USD
- `buyerTrust` (optional): Buyer trust level
- `travelerTrust` (optional): Traveler trust level

**Response:**
```json
{
  "data": {
    "requestId": "pa-123",
    "corridor": "US_EG",
    "amountUSD": 250,
    "methods": [
      {
        "methodId": "CARD_VISA_MC",
        "methodName": "Credit/Debit Card",
        "available": true,
        "estimatedFeeUSD": 7.55,
        "estimatedTotal": 257.55,
        "processingTime": "Instant to 24 hours",
        "riskLevel": "LOW",
        "pros": ["Fast processing", "Low risk"],
        "cons": [],
        "score": 85
      }
    ],
    "recommended": "CARD_VISA_MC",
    "recommendationReason": "...",
    "disclaimer": { "isAdvisoryOnly": true, "noExecution": true }
  },
  "meta": {
    "readOnly": true,
    "noExecution": true,
    "advisoryOnly": true
  }
}
```

### GET /api/payments/advisory/fx

Get FX advisory (static snapshot, NOT live rates).

**Parameters:**
- `from` (required): Source currency (e.g., "USD")
- `to` (required): Target currency (e.g., "EGP")
- `amount` (required): Amount to convert

**Response:**
```json
{
  "data": {
    "fromCurrency": "USD",
    "toCurrency": "EGP",
    "amount": 100,
    "marketRate": 30.9,
    "rates": [
      {
        "provider": "Bank Transfer",
        "rate": 29.97,
        "convertedAmount": 2997,
        "spreadPercent": 3.0,
        "isRecommended": false
      }
    ],
    "bestRate": { ... },
    "explanation": "...",
    "disclaimer": { "isAdvisoryOnly": true }
  },
  "meta": {
    "snapshotBased": true,
    "notLiveRates": true
  }
}
```

### GET /api/payments/advisory/risks

Assess payment risks.

**Parameters:**
- `corridor` (required): e.g., "US_EG"
- `amount` (required): Amount in USD
- `buyerTrust` (optional): Buyer trust level
- `travelerTrust` (optional): Traveler trust level

**Response:**
```json
{
  "data": {
    "overallRiskLevel": "MEDIUM",
    "riskScore": 35,
    "warnings": [
      {
        "type": "HIGH_VALUE_TRANSACTION",
        "severity": "WARNING",
        "title": "High Value Transaction",
        "description": "...",
        "recommendation": "..."
      }
    ],
    "mitigations": [
      "Use escrow protection for high-value transactions"
    ],
    "explanation": "...",
    "disclaimer": { "isAdvisoryOnly": true }
  }
}
```

---

## 3. Safeguards

### Feature Flags

```env
# Default: OFF
FF_PAYMENT_ADVISORY_ENABLED=false
```

### Kill Switch Integration

When `FF_EMERGENCY_DISABLE_ALL=true`:
- All advisory endpoints return empty results
- Health check shows "unhealthy" status
- No processing occurs

### Audit Snapshot

Every request generates an audit snapshot:
- Request ID
- Timestamp
- Input parameters
- Output results
- Feature flag state

### Deterministic Output Guarantee

Same input always produces same output:
- No random elements
- No external API calls
- Static configuration only
- Snapshot-based FX rates

---

## 4. Files

### Types
- `backend/services/crowdship-service/src/types/payment-advisory.types.ts`

### Configuration
- `backend/services/crowdship-service/src/config/payment-methods.config.ts`

### Service
- `backend/services/crowdship-service/src/services/payment-advisory.service.ts`

### Routes
- `backend/services/crowdship-service/src/routes/payment-advisory.routes.ts`

### Tests
- `backend/services/crowdship-service/src/services/__tests__/payment-advisory.test.ts`

---

## 5. Test Coverage

### Determinism Tests
- Same input = same output for method comparison
- Same input = same output for FX advisory
- Same input = same output for risk assessment

### No Execution Tests
- All results include advisory disclaimer
- No execute/process/charge methods exist
- Only read-only methods available

### Kill Switch Tests
- All services disabled when kill switch active
- Health shows unhealthy status
- Empty results returned

### Explanation Tests
- Recommendation reason present
- FX explanation present
- Risk explanation present
- Pros/cons for each method
- Mitigations for warnings

---

## 6. Constraints Verification

The `/api/payments/advisory/constraints` endpoint verifies:

```json
{
  "paymentAdvisory": {
    "readOnly": true,
    "noExecution": true,
    "noBankCalls": true,
    "noPSPSDKs": true,
    "noPaymentAPIs": true,
    "noSideEffects": true,
    "advisoryOnly": true,
    "deterministic": true
  },
  "verified": true
}
```

---

---

## 7. Sprint 6: Bank Integration Advisory (NEW)

### Additional Types

```typescript
// Payment Method Types
type PaymentMethodType = 'ESCROW' | 'CARD' | 'WALLET' | 'BANK_TRANSFER';

// Fee Breakdown
interface FeeBreakdown {
  baseFee: number;
  percentageFee: number;
  fxSpread: number;
  networkFee: number;
  totalFee: number;
  currency: string;
  explanation: string;
}

// Compliance Boundary
interface ComplianceBoundary {
  id: string;
  type: ComplianceBoundaryType;
  jurisdiction: string;
  requirement: string;
  status: 'COMPLIANT' | 'PENDING' | 'NOT_APPLICABLE' | 'BLOCKED';
  explanation: string;
}

// Partner Readiness
interface PartnerReadinessCheck {
  partnerId: string;
  partnerName: string;
  partnerType: 'BANK' | 'PSP' | 'WALLET_PROVIDER' | 'FX_PROVIDER';
  status: 'READY' | 'INTEGRATION_PENDING' | 'TESTING' | 'NOT_AVAILABLE';
  corridors: string[];
  capabilities: string[];
  limitations: string[];
  advisory: string;
}
```

### Additional APIs

#### GET /api/payments/advisory/compliance

Get compliance advisory for a corridor.

**Parameters:**
- `corridor` (required): e.g., "US_EG"
- `amount` (required): Amount in USD

**Response:**
```json
{
  "data": {
    "corridor": "US_EG",
    "amountUSD": 2000,
    "boundaries": [
      {
        "type": "KYC_REQUIREMENT",
        "jurisdiction": "US",
        "requirement": "Enhanced KYC verification required",
        "status": "PENDING"
      }
    ],
    "overallStatus": "REVIEW_REQUIRED",
    "blockers": [],
    "recommendations": ["Complete KYC verification"]
  }
}
```

#### GET /api/payments/advisory/partners

Check partner/bank readiness for a corridor.

**Parameters:**
- `corridor` (required): e.g., "US_EG"

**Response:**
```json
{
  "data": {
    "corridor": "US_EG",
    "partners": [
      {
        "partnerId": "bank_swift",
        "partnerName": "SWIFT Network (Advisory)",
        "status": "READY",
        "advisory": "No actual connection - advisory only"
      }
    ],
    "recommendedPartner": "bank_swift"
  }
}
```

#### GET /api/payments/advisory/fees

Get detailed fee breakdown.

**Parameters:**
- `method` (required): Payment method ID
- `amount` (required): Amount in USD
- `corridor` (required): e.g., "US_EG"

---

## 8. Frontend Components

### PaymentComparisonPanel
Displays payment method comparison with advisory disclaimers.

### FXAdvisoryCard
Shows FX rate comparison with "indicative only" warnings.

### RiskWarningBanner
Displays risk warnings with severity levels.

### ComplianceDisclaimerBox
**NON-DISMISSIBLE** compliance information box showing:
- What we do NOT do
- Why advisory only
- Human confirmation required

---

## Definition of Done

- [x] Payment Advisory Service (READ-ONLY)
- [x] Types (PaymentMethodComparison, FXAdvisoryResult, PaymentRiskWarning, AdvisoryDisclaimer)
- [x] APIs (GET only: /options, /fx, /risks, /health)
- [x] Feature flag OFF by default
- [x] Kill switch integration
- [x] Audit snapshot per request
- [x] Deterministic output guarantee
- [x] Tests (determinism, no execution, kill switch, explanations)
- [x] Documentation

### Sprint 6 Additions
- [x] ComplianceBoundary types
- [x] PartnerReadinessCheck types
- [x] FeeBreakdown types
- [x] GET /api/payments/advisory/compliance
- [x] GET /api/payments/advisory/partners
- [x] GET /api/payments/advisory/fees
- [x] PaymentComparisonPanel component
- [x] FXAdvisoryCard component
- [x] RiskWarningBanner component
- [x] ComplianceDisclaimerBox component (non-dismissible)
- [x] Extended tests for bank integration

## Payment Advisory: COMPLETE ✅

**This is intelligence only. No payments are executed.**

### ❌ What We Do NOT Do
- Execute payments
- Deduct funds
- Convert currencies
- Create real wallets
- Auto-anything
- Connect to Stripe/PayPal/PSP SDKs
- Process webhooks
- Store payment secrets
- Initiate bank transfers

### ✅ What We DO
- Provide advisory JSON
- Show "Why" explanations
- Display "What we don't do"
- Require human confirmation
