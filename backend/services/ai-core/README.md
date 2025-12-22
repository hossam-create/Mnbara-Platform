# AI Core Nucleus

Deterministic, read-only AI advisory service for the MNBARA commerce platform.

## Overview

The AI Core Nucleus provides intelligent advisory capabilities without executing any actions. It evaluates intent, assesses trust and risk, matches users safely, and produces explainable recommendations.

## Constraints

| Constraint | Description |
|------------|-------------|
| **NO Execution** | Never executes transactions or actions |
| **NO Payments** | Never processes or initiates payments |
| **NO Auto-actions** | Never triggers automated workflows |
| **Deterministic** | Same inputs always produce same outputs |
| **Explainable** | All decisions include reasoning |
| **Auditable** | Full logging of all operations |

## Capabilities

### 1. Intent Classification
Classifies user intent from behavioral signals:
- Action keywords (buy, sell, exchange, transfer)
- Page context
- User history
- Item interactions

### 2. Trust Scoring
Computes trust scores from multiple factors:
- Verification status (email, phone, 2FA)
- Transaction history
- Account age
- Rating score
- Dispute ratio
- Response rate
- KYC level

### 3. Risk Assessment
Evaluates transaction risk:
- Trust differential between parties
- Transaction amount
- Item category risk
- Transaction velocity
- Geographic factors
- Time patterns
- Device fingerprinting

### 4. User Matching
Finds compatible users based on:
- Trust scores
- Location proximity
- Transaction history
- Preference alignment
- Availability

### 5. Decision Recommendations
Produces explainable recommendations:
- PROCEED
- PROCEED_WITH_CAUTION
- REQUIRE_VERIFICATION
- MANUAL_REVIEW
- DECLINE

## API Endpoints

### Health Checks
```
GET /api/ai-core/health        # Full health check
GET /api/ai-core/health/ready  # Kubernetes readiness probe
GET /api/ai-core/health/live   # Kubernetes liveness probe
```

### Intent Classification
```
POST /api/ai-core/intent/classify
{
  "userId": "user-123",
  "context": { "itemId": "item-456" },
  "signals": {
    "action_keyword": "buy",
    "page_context": "/checkout"
  }
}
```

### Trust Scoring
```
POST /api/ai-core/trust/compute
{
  "userId": "user-123",
  "isEmailVerified": true,
  "isPhoneVerified": true,
  "is2FAEnabled": true,
  "totalTransactions": 50,
  "successfulTransactions": 48,
  "accountCreatedAt": "2023-01-15T00:00:00Z",
  "averageRating": 4.8,
  "totalRatings": 30,
  "disputesRaised": 1,
  "disputesLost": 0,
  "responseRate": 0.95,
  "kycLevel": "enhanced"
}
```

### Risk Assessment
```
POST /api/ai-core/risk/assess
{
  "request": {
    "transactionId": "txn-123",
    "buyerId": "buyer-1",
    "sellerId": "seller-1",
    "amount": 500,
    "currency": "USD",
    "itemDetails": {
      "id": "item-1",
      "category": "electronics",
      "condition": "new",
      "price": 500,
      "description": "Smartphone"
    }
  },
  "context": {
    "buyerTrust": { "score": 75, "level": "TRUSTED" },
    "sellerTrust": { "score": 80, "level": "VERIFIED" },
    "buyerRecentTransactions": 3,
    "sellerRecentTransactions": 5,
    "transactionTime": "2024-01-15T14:30:00Z"
  }
}
```

### User Matching
```
POST /api/ai-core/match/users
{
  "request": {
    "requesterId": "user-123",
    "intent": "BUY",
    "criteria": {
      "location": { "latitude": 40.7128, "longitude": -74.0060, "radiusKm": 50 },
      "categories": ["electronics"],
      "minTrustScore": 60
    },
    "limit": 10
  },
  "requesterProfile": { ... },
  "candidateProfiles": [ ... ]
}
```

### Decision Recommendation
```
POST /api/ai-core/recommend
{
  "requestId": "req-123",
  "userId": "user-1",
  "intent": "BUY",
  "transactionContext": { ... },
  "trustScores": { "buyer": { ... }, "seller": { ... } },
  "riskAssessment": { ... }
}
```

### Audit Logs
```
GET /api/ai-core/audit?operation=CLASSIFY_INTENT&limit=50
```

## Response Format

All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "processingTimeMs": 12,
    "advisory": true,
    "disclaimer": "This is an advisory recommendation only. No actions have been executed."
  }
}
```

## Running the Service

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
npm run test:coverage
```

## Architecture

```
ai-core/
├── src/
│   ├── types/
│   │   └── ai-core.types.ts      # Type definitions
│   ├── services/
│   │   ├── intent-classifier.service.ts
│   │   ├── trust-scorer.service.ts
│   │   ├── risk-assessor.service.ts
│   │   ├── decision-recommender.service.ts
│   │   ├── user-matcher.service.ts
│   │   └── audit-logger.service.ts
│   ├── controllers/
│   │   ├── ai-core.controller.ts
│   │   └── health.controller.ts
│   ├── routes/
│   │   └── ai-core.routes.ts
│   ├── __tests__/
│   │   ├── intent-classifier.test.ts
│   │   ├── trust-scorer.test.ts
│   │   ├── risk-assessor.test.ts
│   │   └── decision-recommender.test.ts
│   └── index.ts
├── package.json
└── README.md
```

## Design Principles

1. **Determinism**: All algorithms use fixed weights and thresholds. No randomness.
2. **Explainability**: Every output includes reasoning steps.
3. **Auditability**: All operations are logged with inputs and outputs.
4. **Safety**: Read-only operations only. No side effects.
5. **Simplicity**: No ML training, no external API calls, no complex dependencies.

## Trust Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| VERIFIED | 80-100 | Fully verified, high trust |
| TRUSTED | 60-79 | Good standing, reliable |
| STANDARD | 40-59 | Normal user, some history |
| NEW | 20-39 | New user, limited history |
| RESTRICTED | 0-19 | Flagged or problematic |

## Risk Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| MINIMAL | 0-19 | Very low risk |
| LOW | 20-39 | Acceptable risk |
| MEDIUM | 40-59 | Moderate risk, caution advised |
| HIGH | 60-79 | Elevated risk, verification needed |
| CRITICAL | 80-100 | Very high risk, manual review |

## License

Proprietary - MNBARA Platform
