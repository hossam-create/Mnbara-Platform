# AI Core Logic Specification: Cross-Border Traveler Marketplace

**Version:** 1.0.0  
**Status:** Engineering Specification  
**Constraints:** Deterministic | Explainable | Advisory-Only | No Execution

---

## 1. Intent Classification

### 1.1 Intent Types

```typescript
enum CrowdshipIntent {
  REQUEST = 'REQUEST',   // Buyer wants a product delivered
  TRAVEL = 'TRAVEL',     // Traveler offers delivery capacity
  MATCH = 'MATCH',       // System matching request to traveler
  BROWSE = 'BROWSE',     // User exploring without commitment
  UNKNOWN = 'UNKNOWN',   // Cannot determine intent
}
```

### 1.2 Intent Classification Rules

| Signal | Weight | REQUEST | TRAVEL | MATCH | BROWSE |
|--------|--------|---------|--------|-------|--------|
| `page_context=/request/create` | 0.40 | ✓ | | | |
| `page_context=/trip/create` | 0.40 | | ✓ | | |
| `page_context=/matches` | 0.40 | | | ✓ | |
| `action=submit_request` | 0.35 | ✓ | | | |
| `action=post_trip` | 0.35 | | ✓ | | |
| `action=accept_offer` | 0.35 | | | ✓ | |
| `user_role=buyer` | 0.15 | ✓ | | | |
| `user_role=traveler` | 0.15 | | ✓ | | |
| `item_interaction=view_only` | 0.20 | | | | ✓ |

### 1.3 Classification Algorithm

```
FUNCTION classifyIntent(signals: Signal[]): IntentResult
  scores = { REQUEST: 0, TRAVEL: 0, MATCH: 0, BROWSE: 0 }
  
  FOR EACH signal IN signals:
    IF signal.type IN SIGNAL_WEIGHTS:
      intent = SIGNAL_INTENT_MAP[signal.type][signal.value]
      scores[intent] += SIGNAL_WEIGHTS[signal.type]
  
  maxIntent = argmax(scores)
  confidence = scores[maxIntent] / sum(scores)
  
  IF confidence < 0.25:
    RETURN { intent: UNKNOWN, confidence, reasoning: "Insufficient signal strength" }
  
  RETURN {
    intent: maxIntent,
    confidence: confidence,
    reasoning: buildReasoningChain(signals, scores)
  }
```

### 1.4 Intent Output Schema

```typescript
interface IntentClassificationResult {
  intent: CrowdshipIntent;
  confidence: number;           // 0.0 - 1.0
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: {
    source: string;
    value: string;
    weight: number;
    contribution: number;
  }[];
  reasoning: string;            // Human-readable explanation
  timestamp: ISO8601;
}
```

---

## 2. Trust Scoring

### 2.1 Buyer Trust Factors

| Factor | Weight | Score Range | Calculation |
|--------|--------|-------------|-------------|
| `identity_verification` | 0.25 | 0-100 | email(30) + phone(40) + 2FA(30) |
| `payment_history` | 0.20 | 0-100 | successful_payments / total_payments × 100 |
| `request_completion` | 0.20 | 0-100 | completed_requests / total_requests × 100 |
| `account_age` | 0.10 | 0-100 | min(100, days_since_creation / 3.65) |
| `dispute_ratio` | 0.10 | 0-100 | 100 - (disputes_lost / total_transactions × 200) |
| `response_rate` | 0.10 | 0-100 | messages_responded / messages_received × 100 |
| `kyc_level` | 0.05 | 0-100 | none(0), basic(40), enhanced(70), full(100) |

### 2.2 Traveler Trust Factors

| Factor | Weight | Score Range | Calculation |
|--------|--------|-------------|-------------|
| `identity_verification` | 0.20 | 0-100 | email(20) + phone(30) + 2FA(20) + passport(30) |
| `delivery_success` | 0.25 | 0-100 | successful_deliveries / total_deliveries × 100 |
| `on_time_rate` | 0.15 | 0-100 | on_time_deliveries / total_deliveries × 100 |
| `account_age` | 0.10 | 0-100 | min(100, days_since_creation / 3.65) |
| `buyer_ratings` | 0.15 | 0-100 | (average_rating - 1) / 4 × 100 |
| `dispute_ratio` | 0.10 | 0-100 | 100 - (disputes_lost / total_deliveries × 200) |
| `kyc_level` | 0.05 | 0-100 | none(0), basic(40), enhanced(70), full(100) |

### 2.3 Trust Level Thresholds

| Level | Score Range | Description | Capabilities |
|-------|-------------|-------------|--------------|
| `VERIFIED` | 80-100 | Fully verified, excellent history | All features, priority matching |
| `TRUSTED` | 60-79 | Good standing, reliable | Standard features |
| `STANDARD` | 40-59 | Normal user, some history | Basic features |
| `NEW` | 20-39 | New user, limited history | Limited features, lower limits |
| `RESTRICTED` | 0-19 | Flagged or problematic | Restricted, manual review |

### 2.4 Trust Score Algorithm

```
FUNCTION computeTrustScore(user: User, role: 'BUYER' | 'TRAVELER'): TrustScore
  factors = role == 'BUYER' ? BUYER_FACTORS : TRAVELER_FACTORS
  contributions = []
  
  FOR EACH factor IN factors:
    rawValue = computeFactorValue(user, factor.name)
    normalizedValue = clamp(rawValue, 0, 100)
    contribution = normalizedValue × factor.weight
    contributions.push({
      name: factor.name,
      weight: factor.weight,
      value: normalizedValue,
      contribution: contribution
    })
  
  totalScore = sum(contributions.map(c => c.contribution))
  level = getTrustLevel(totalScore)
  
  RETURN {
    userId: user.id,
    role: role,
    score: round(totalScore),
    level: level,
    factors: contributions,
    computedAt: now()
  }
```

### 2.5 Trust Score Output Schema

```typescript
interface TrustScore {
  userId: string;
  role: 'BUYER' | 'TRAVELER';
  score: number;                // 0-100
  level: TrustLevel;
  factors: TrustFactor[];
  computedAt: ISO8601;
}

interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  explanation: string;
}
```

---

## 3. Risk Assessment Rules

### 3.1 Risk Categories

```typescript
enum RiskLevel {
  CRITICAL = 'CRITICAL',   // Score 80-100, block recommended
  HIGH = 'HIGH',           // Score 60-79, manual review
  MEDIUM = 'MEDIUM',       // Score 40-59, proceed with caution
  LOW = 'LOW',             // Score 20-39, standard flow
  MINIMAL = 'MINIMAL',     // Score 0-19, fast track
}
```

### 3.2 High-Value Item Risk Rules

| Condition | Risk Score | Flag Code | Recommendation |
|-----------|------------|-----------|----------------|
| `item_value >= $5000` | +40 | `VERY_HIGH_VALUE` | Require escrow + enhanced verification |
| `item_value >= $2000` | +30 | `HIGH_VALUE` | Require escrow |
| `item_value >= $500` | +20 | `ELEVATED_VALUE` | Recommend escrow |
| `item_value >= $100` | +10 | `STANDARD_VALUE` | Standard flow |
| `item_value < $100` | +5 | `LOW_VALUE` | Fast track eligible |

### 3.3 New User Risk Rules

| Condition | Risk Score | Flag Code | Recommendation |
|-----------|------------|-----------|----------------|
| `account_age < 7 days` | +35 | `VERY_NEW_ACCOUNT` | Require phone verification |
| `account_age < 30 days` | +25 | `NEW_ACCOUNT` | Limit transaction value |
| `total_transactions == 0` | +30 | `NO_HISTORY` | Start with low-value items |
| `trust_score < 20` | +40 | `RESTRICTED_USER` | Manual review required |
| `trust_score < 40` | +20 | `LOW_TRUST` | Additional verification |

### 3.4 Cross-Border Delivery Risk Rules

| Condition | Risk Score | Flag Code | Recommendation |
|-----------|------------|-----------|----------------|
| `origin_country != destination_country` | +15 | `CROSS_BORDER` | Standard cross-border flow |
| `high_risk_origin_country` | +35 | `HIGH_RISK_ORIGIN` | Enhanced due diligence |
| `high_risk_destination_country` | +35 | `HIGH_RISK_DESTINATION` | Enhanced due diligence |
| `restricted_item_category` | +50 | `RESTRICTED_CATEGORY` | Manual review, may decline |
| `customs_complexity == HIGH` | +25 | `COMPLEX_CUSTOMS` | Require customs documentation |
| `delivery_distance > 5000km` | +15 | `LONG_DISTANCE` | Extended timeline expected |
| `no_tracking_available` | +30 | `NO_TRACKING` | Require tracking method |

### 3.5 Combined Risk Assessment Algorithm

```
FUNCTION assessRisk(request: Request, traveler: Traveler, context: Context): RiskAssessment
  factors = []
  flags = []
  
  // High-value item assessment
  valueRisk = assessValueRisk(request.itemValue)
  factors.push(valueRisk.factor)
  IF valueRisk.flag: flags.push(valueRisk.flag)
  
  // New user assessment (both parties)
  buyerRisk = assessNewUserRisk(request.buyer)
  factors.push(buyerRisk.factor)
  IF buyerRisk.flag: flags.push(buyerRisk.flag)
  
  travelerRisk = assessNewUserRisk(traveler)
  factors.push(travelerRisk.factor)
  IF travelerRisk.flag: flags.push(travelerRisk.flag)
  
  // Cross-border assessment
  crossBorderRisk = assessCrossBorderRisk(request.origin, request.destination, request.item)
  factors.push(crossBorderRisk.factor)
  IF crossBorderRisk.flag: flags.push(crossBorderRisk.flag)
  
  // Trust differential
  trustRisk = assessTrustDifferential(request.buyer.trustScore, traveler.trustScore)
  factors.push(trustRisk.factor)
  IF trustRisk.flag: flags.push(trustRisk.flag)
  
  // Calculate weighted score
  totalScore = 0
  FOR EACH factor IN factors:
    totalScore += factor.score × factor.weight
  
  overallRisk = getRiskLevel(totalScore)
  
  RETURN {
    requestId: request.id,
    overallRisk: overallRisk,
    riskScore: round(totalScore),
    factors: factors,
    flags: flags,
    recommendations: generateRecommendations(flags),
    assessedAt: now()
  }
```

### 3.6 Risk Assessment Output Schema

```typescript
interface RiskAssessment {
  requestId: string;
  overallRisk: RiskLevel;
  riskScore: number;            // 0-100
  factors: RiskFactor[];
  flags: RiskFlag[];
  recommendations: string[];
  assessedAt: ISO8601;
}

interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  description: string;
}

interface RiskFlag {
  code: string;
  severity: RiskLevel;
  message: string;
  recommendation: string;
}
```

---

## 4. Matching Logic

### 4.1 Match Eligibility Criteria

```
FUNCTION isEligibleForMatch(request: Request, traveler: Traveler): EligibilityResult
  reasons = []
  
  // Geographic eligibility
  IF NOT traveler.route.includes(request.origin):
    reasons.push("Traveler route does not include pickup location")
  
  IF NOT traveler.route.includes(request.destination):
    reasons.push("Traveler route does not include delivery location")
  
  // Timing eligibility
  IF traveler.departureDate > request.neededByDate:
    reasons.push("Traveler departure is after buyer's deadline")
  
  IF traveler.arrivalDate > request.neededByDate:
    reasons.push("Traveler arrival is after buyer's deadline")
  
  // Capacity eligibility
  IF request.itemWeight > traveler.availableCapacity.weight:
    reasons.push("Item exceeds traveler's weight capacity")
  
  IF request.itemDimensions > traveler.availableCapacity.dimensions:
    reasons.push("Item exceeds traveler's size capacity")
  
  // Category eligibility
  IF request.itemCategory IN traveler.excludedCategories:
    reasons.push("Traveler does not accept this item category")
  
  // Trust eligibility
  IF traveler.trustScore < request.minTravelerTrust:
    reasons.push("Traveler trust score below buyer's requirement")
  
  IF request.buyer.trustScore < traveler.minBuyerTrust:
    reasons.push("Buyer trust score below traveler's requirement")
  
  RETURN {
    eligible: reasons.length == 0,
    reasons: reasons
  }
```

### 4.2 Match Scoring Factors

| Factor | Weight | Calculation |
|--------|--------|-------------|
| `route_alignment` | 0.25 | How well traveler route matches request origin/destination |
| `timing_fit` | 0.20 | Days of buffer between arrival and deadline |
| `trust_compatibility` | 0.20 | Combined trust score of both parties |
| `price_alignment` | 0.15 | How close offer is to request budget |
| `traveler_rating` | 0.10 | Traveler's historical rating |
| `response_likelihood` | 0.10 | Based on traveler's response rate |

### 4.3 Match Score Algorithm

```
FUNCTION calculateMatchScore(request: Request, traveler: Traveler): MatchScore
  
  // Route alignment (0-100)
  routeScore = calculateRouteScore(request, traveler)
  // 100 = exact match, 80 = same city, 60 = same region, 40 = same country, 0 = no overlap
  
  // Timing fit (0-100)
  daysBuffer = request.neededByDate - traveler.arrivalDate
  IF daysBuffer < 0: timingScore = 0
  ELSE IF daysBuffer >= 7: timingScore = 100
  ELSE: timingScore = (daysBuffer / 7) × 100
  
  // Trust compatibility (0-100)
  minTrust = min(request.buyer.trustScore, traveler.trustScore)
  trustScore = minTrust
  
  // Price alignment (0-100)
  IF traveler.askingPrice <= request.maxBudget:
    priceScore = 100 - ((request.maxBudget - traveler.askingPrice) / request.maxBudget × 50)
  ELSE:
    priceScore = max(0, 100 - ((traveler.askingPrice - request.maxBudget) / request.maxBudget × 100))
  
  // Traveler rating (0-100)
  ratingScore = (traveler.averageRating - 1) / 4 × 100
  
  // Response likelihood (0-100)
  responseScore = traveler.responseRate × 100
  
  // Weighted total
  totalScore = 
    routeScore × 0.25 +
    timingScore × 0.20 +
    trustScore × 0.20 +
    priceScore × 0.15 +
    ratingScore × 0.10 +
    responseScore × 0.10
  
  RETURN {
    score: round(totalScore),
    factors: {
      route: { score: routeScore, weight: 0.25 },
      timing: { score: timingScore, weight: 0.20 },
      trust: { score: trustScore, weight: 0.20 },
      price: { score: priceScore, weight: 0.15 },
      rating: { score: ratingScore, weight: 0.10 },
      response: { score: responseScore, weight: 0.10 }
    }
  }
```

### 4.4 Match Recommendation Levels

| Score Range | Recommendation | Description |
|-------------|----------------|-------------|
| 85-100 | `HIGHLY_RECOMMENDED` | Excellent match, prioritize |
| 70-84 | `RECOMMENDED` | Good match, suggest |
| 50-69 | `ACCEPTABLE` | Viable match, show |
| 30-49 | `CAUTION` | Marginal match, warn |
| 0-29 | `NOT_RECOMMENDED` | Poor match, deprioritize |

### 4.5 Match Output Schema

```typescript
interface MatchResult {
  requestId: string;
  travelerId: string;
  matchScore: number;           // 0-100
  recommendation: MatchRecommendation;
  eligible: boolean;
  eligibilityReasons: string[];
  factors: {
    route: MatchFactor;
    timing: MatchFactor;
    trust: MatchFactor;
    price: MatchFactor;
    rating: MatchFactor;
    response: MatchFactor;
  };
  riskAssessment: RiskAssessment;
  reasoning: string[];          // Human-readable explanation
  generatedAt: ISO8601;
}

interface MatchFactor {
  score: number;
  weight: number;
  contribution: number;
  explanation: string;
}
```

---

## 5. Decision Recommendation Matrix

### 5.1 Recommendation Actions

```typescript
enum RecommendedAction {
  PROCEED = 'PROCEED',                           // Safe to match
  PROCEED_WITH_ESCROW = 'PROCEED_WITH_ESCROW',   // Match with escrow required
  REQUIRE_VERIFICATION = 'REQUIRE_VERIFICATION', // Need additional verification
  MANUAL_REVIEW = 'MANUAL_REVIEW',               // Human review needed
  DECLINE = 'DECLINE',                           // Do not match
}
```

### 5.2 Decision Matrix

| Risk Level | Trust Level | Match Score | Recommendation |
|------------|-------------|-------------|----------------|
| MINIMAL | VERIFIED | ≥70 | PROCEED |
| MINIMAL | TRUSTED | ≥70 | PROCEED |
| MINIMAL | STANDARD | ≥70 | PROCEED_WITH_ESCROW |
| MINIMAL | NEW | ≥70 | PROCEED_WITH_ESCROW |
| LOW | VERIFIED | ≥70 | PROCEED |
| LOW | TRUSTED | ≥70 | PROCEED_WITH_ESCROW |
| LOW | STANDARD | ≥70 | PROCEED_WITH_ESCROW |
| LOW | NEW | ≥70 | REQUIRE_VERIFICATION |
| MEDIUM | VERIFIED | ≥70 | PROCEED_WITH_ESCROW |
| MEDIUM | TRUSTED | ≥70 | PROCEED_WITH_ESCROW |
| MEDIUM | STANDARD | ≥70 | REQUIRE_VERIFICATION |
| MEDIUM | NEW | ≥70 | REQUIRE_VERIFICATION |
| HIGH | VERIFIED | ≥70 | REQUIRE_VERIFICATION |
| HIGH | TRUSTED | ≥70 | REQUIRE_VERIFICATION |
| HIGH | STANDARD | ≥70 | MANUAL_REVIEW |
| HIGH | NEW | ≥70 | MANUAL_REVIEW |
| CRITICAL | ANY | ANY | MANUAL_REVIEW or DECLINE |
| ANY | RESTRICTED | ANY | MANUAL_REVIEW or DECLINE |
| ANY | ANY | <50 | NOT_RECOMMENDED |

### 5.3 Recommendation Algorithm

```
FUNCTION generateRecommendation(
  request: Request,
  traveler: Traveler,
  matchResult: MatchResult,
  riskAssessment: RiskAssessment
): DecisionRecommendation

  reasoning = []
  warnings = []
  
  // Evaluate match quality
  IF matchResult.matchScore < 50:
    RETURN {
      action: DECLINE,
      confidence: 0.9,
      reasoning: ["Match score too low for viable delivery"],
      warnings: ["Consider alternative travelers"]
    }
  
  // Get minimum trust level
  minTrust = min(request.buyer.trustLevel, traveler.trustLevel)
  
  // Apply decision matrix
  action = DECISION_MATRIX[riskAssessment.overallRisk][minTrust]
  
  // Build reasoning chain
  reasoning.push(f"Risk level: {riskAssessment.overallRisk}")
  reasoning.push(f"Minimum trust: {minTrust}")
  reasoning.push(f"Match score: {matchResult.matchScore}")
  
  // Add warnings from risk flags
  FOR EACH flag IN riskAssessment.flags:
    warnings.push(flag.message)
  
  // Calculate confidence
  confidence = calculateConfidence(matchResult, riskAssessment)
  
  // Generate alternatives
  alternatives = generateAlternatives(action, riskAssessment)
  
  RETURN {
    requestId: request.id,
    travelerId: traveler.id,
    action: action,
    confidence: confidence,
    reasoning: reasoning,
    warnings: warnings,
    alternatives: alternatives,
    generatedAt: now()
  }
```

### 5.4 Recommendation Output Schema

```typescript
interface DecisionRecommendation {
  requestId: string;
  travelerId: string;
  action: RecommendedAction;
  confidence: number;           // 0.0 - 1.0
  reasoning: ReasoningStep[];
  warnings: string[];
  alternatives: AlternativeAction[];
  disclaimer: string;           // "Advisory only - no action executed"
  generatedAt: ISO8601;
}

interface ReasoningStep {
  step: number;
  factor: string;
  evaluation: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

interface AlternativeAction {
  action: RecommendedAction;
  conditions: string[];
  tradeoffs: string[];
}
```

---

## 6. Audit Trail Requirements

### 6.1 Logged Operations

| Operation | Input Logged | Output Logged |
|-----------|--------------|---------------|
| `CLASSIFY_INTENT` | userId, signals | intent, confidence |
| `COMPUTE_TRUST` | userId, role | score, level |
| `ASSESS_RISK` | requestId, travelerId | riskLevel, flags |
| `CALCULATE_MATCH` | requestId, travelerId | matchScore, eligible |
| `GENERATE_RECOMMENDATION` | requestId, travelerId | action, confidence |

### 6.2 Audit Entry Schema

```typescript
interface AuditEntry {
  id: UUID;
  timestamp: ISO8601;
  operation: string;
  input: Record<string, unknown>;   // Sanitized
  output: Record<string, unknown>;
  processingTimeMs: number;
  version: string;
  correlationId: string;
}
```

---

## 7. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/intent/classify` | POST | Classify user intent |
| `/api/ai/trust/compute` | POST | Compute trust score |
| `/api/ai/risk/assess` | POST | Assess transaction risk |
| `/api/ai/match/calculate` | POST | Calculate match score |
| `/api/ai/recommend` | POST | Generate recommendation |
| `/api/ai/audit` | GET | Retrieve audit logs |
| `/api/ai/health` | GET | Health check |

---

## 8. Implementation Constraints

| Constraint | Enforcement |
|------------|-------------|
| **Deterministic** | Same inputs always produce same outputs |
| **No Randomness** | No random number generation in scoring |
| **No ML Training** | Use fixed weights, no model updates |
| **No External Calls** | No third-party API dependencies |
| **No Side Effects** | Read-only operations only |
| **No Execution** | Never trigger payments or actions |
| **Explainable** | Every output includes reasoning |
| **Auditable** | Every operation logged |

---

## 9. Testing Requirements

### 9.1 Determinism Tests
- Same input → same output (100 iterations)
- Order independence (shuffled inputs)
- Timestamp independence (different times)

### 9.2 Boundary Tests
- Score boundaries (0, 20, 40, 60, 80, 100)
- Trust level transitions
- Risk level transitions
- Match recommendation transitions

### 9.3 Edge Cases
- New user with no history
- Perfect trust score
- Zero trust score
- Cross-border with restricted items
- High-value + new user combination

---

*Document Owner: AI Core Team*  
*Last Updated: December 18, 2025*
