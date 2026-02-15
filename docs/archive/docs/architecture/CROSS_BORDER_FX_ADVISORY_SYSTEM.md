# Cross-Border FX - Advisory-First System Architecture

## 1. FX CAPABILITIES BY PHASE

### Phase 1: Rate Display

**Rate Data Schema:**
```sql
CREATE TABLE fx_rates (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(19,8) NOT NULL,
  rate_provider VARCHAR(50) NOT NULL, -- 'OANDA', 'XE', 'FIXER', 'BANK'
  timestamp TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT rate_positive CHECK (rate > 0)
);

CREATE INDEX idx_rate_pair ON fx_rates(source_currency, target_currency);
CREATE INDEX idx_rate_expires ON fx_rates(expires_at);
CREATE INDEX idx_rate_provider ON fx_rates(rate_provider);
```

**Rate Display Service:**
```typescript
interface RateDisplayService {
  // Get current rate for pair
  getRate(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<FXRate>;
  
  // Get rates from multiple providers
  getMultiProviderRates(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<FXRate[]>;
  
  // Get historical rates
  getHistoricalRates(
    sourceCurrency: string,
    targetCurrency: string,
    days: number
  ): Promise<FXRate[]>;
  
  // Get rate with metadata
  getRateWithMetadata(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<RateWithMetadata>;
}
```

**Rate Display Response:**
```typescript
interface RateWithMetadata {
  rate: Decimal;
  sourceCurrency: string;
  targetCurrency: string;
  provider: string;
  timestamp: Date;
  expiresAt: Date;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  spread: Decimal; // Bid-ask spread
  confidence: number; // 0-100
  lastUpdated: Date;
}
```

---

### Phase 2: Fee Breakdown

**Fee Structure Schema:**
```sql
CREATE TABLE fx_fees (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  
  -- Fee components
  base_fee_percent DECIMAL(5,4), -- e.g., 0.0150 = 1.5%
  fixed_fee DECIMAL(19,8),
  markup_percent DECIMAL(5,4),
  
  -- Minimums/Maximums
  min_fee DECIMAL(19,8),
  max_fee DECIMAL(19,8),
  
  -- Effective date range
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fee_positive CHECK (base_fee_percent >= 0 AND fixed_fee >= 0)
);

CREATE INDEX idx_fee_pair ON fx_fees(source_currency, target_currency);
CREATE INDEX idx_fee_effective ON fx_fees(effective_from, effective_to);
```

**Fee Breakdown Service:**
```typescript
interface FeeBreakdownService {
  // Calculate all fees for transaction
  calculateFees(
    sourceCurrency: string,
    targetCurrency: string,
    amount: Decimal,
    provider: string
  ): Promise<FeeBreakdown>;
  
  // Compare fees across providers
  compareFees(
    sourceCurrency: string,
    targetCurrency: string,
    amount: Decimal
  ): Promise<FeeComparison[]>;
  
  // Get fee components
  getFeeComponents(
    sourceCurrency: string,
    targetCurrency: string,
    provider: string
  ): Promise<FeeComponent[]>;
}
```

**Fee Breakdown Response:**
```typescript
interface FeeBreakdown {
  amount: Decimal;
  sourceCurrency: string;
  targetCurrency: string;
  
  // Fee components
  baseFee: Decimal;
  fixedFee: Decimal;
  markup: Decimal;
  totalFee: Decimal;
  feePercent: Decimal;
  
  // Net amounts
  amountAfterFee: Decimal;
  receivedAmount: Decimal;
  
  // Breakdown
  components: FeeComponent[];
  
  // Effective rate
  effectiveRate: Decimal;
  
  provider: string;
  timestamp: Date;
}

interface FeeComponent {
  name: string; // 'Base Fee', 'Markup', 'Fixed Fee'
  amount: Decimal;
  percent: Decimal;
  description: string;
}
```

---

### Phase 3: Timing Recommendation

**Timing Analysis Schema:**
```sql
CREATE TABLE fx_timing_signals (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  
  -- Signal data
  signal_type ENUM('BUY_NOW', 'WAIT', 'SELL_NOW', 'NEUTRAL'),
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Analysis
  volatility_score DECIMAL(5,4),
  trend_direction ENUM('UP', 'DOWN', 'SIDEWAYS'),
  trend_strength DECIMAL(3,2),
  
  -- Reasoning
  reasoning VARCHAR(500),
  factors JSONB, -- Array of contributing factors
  
  -- Timing
  recommended_action_window_start TIMESTAMP,
  recommended_action_window_end TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_timing_pair ON fx_timing_signals(source_currency, target_currency);
CREATE INDEX idx_timing_expires ON fx_timing_signals(expires_at);
```

**Timing Recommendation Service:**
```typescript
interface TimingRecommendationService {
  // Get timing recommendation
  getTimingRecommendation(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<TimingRecommendation>;
  
  // Get optimal window
  getOptimalWindow(
    sourceCurrency: string,
    targetCurrency: string,
    timeframe: 'HOUR' | 'DAY' | 'WEEK'
  ): Promise<TimeWindow>;
  
  // Get historical timing accuracy
  getTimingAccuracy(
    sourceCurrency: string,
    targetCurrency: string,
    days: number
  ): Promise<TimingAccuracy>;
}
```

**Timing Recommendation Response:**
```typescript
interface TimingRecommendation {
  signal: 'BUY_NOW' | 'WAIT' | 'SELL_NOW' | 'NEUTRAL';
  confidence: number; // 0-100
  
  // Analysis
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  trendStrength: number; // 0-100
  
  // Recommendation
  recommendation: string;
  reasoning: string[];
  factors: TimingFactor[];
  
  // Timing window
  optimalWindow: {
    start: Date;
    end: Date;
    duration: number; // minutes
  };
  
  // Risk assessment
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  
  timestamp: Date;
  expiresAt: Date;
}

interface TimingFactor {
  name: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  strength: number; // 0-100
  description: string;
}
```

---

### Phase 4: Provider Comparison

**Provider Comparison Schema:**
```sql
CREATE TABLE fx_provider_comparison (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  amount DECIMAL(19,8) NOT NULL,
  
  -- Provider data
  providers JSONB, -- Array of provider quotes
  
  -- Comparison results
  best_rate_provider VARCHAR(50),
  best_fee_provider VARCHAR(50),
  best_overall_provider VARCHAR(50),
  
  -- Metrics
  rate_spread DECIMAL(19,8),
  fee_range JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_comparison_pair ON fx_provider_comparison(source_currency, target_currency);
```

**Provider Comparison Service:**
```typescript
interface ProviderComparisonService {
  // Compare providers for transaction
  compareProviders(
    sourceCurrency: string,
    targetCurrency: string,
    amount: Decimal
  ): Promise<ProviderComparison>;
  
  // Get provider ratings
  getProviderRatings(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<ProviderRating[]>;
  
  // Get provider availability
  getProviderAvailability(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<ProviderAvailability[]>;
}
```

**Provider Comparison Response:**
```typescript
interface ProviderComparison {
  sourceCurrency: string;
  targetCurrency: string;
  amount: Decimal;
  
  // Provider quotes
  quotes: ProviderQuote[];
  
  // Rankings
  bestRate: ProviderQuote;
  bestFee: ProviderQuote;
  bestOverall: ProviderQuote;
  
  // Comparison metrics
  rateSpread: Decimal;
  feeRange: {
    min: Decimal;
    max: Decimal;
    average: Decimal;
  };
  
  // Recommendations
  recommendation: string;
  
  timestamp: Date;
  expiresAt: Date;
}

interface ProviderQuote {
  provider: string;
  rate: Decimal;
  fee: Decimal;
  totalFee: Decimal;
  receivedAmount: Decimal;
  effectiveRate: Decimal;
  speed: 'INSTANT' | 'SAME_DAY' | '1-2_DAYS';
  availability: boolean;
  rating: number; // 0-5
}
```

---

## 2. FX DATA FLOW

### Rate Providers

**Provider Integration:**
```
┌─────────────────────────────────────────────────────┐
│           Rate Provider Sources                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │   OANDA      │  │   XE.com     │  │  FIXER   │  │
│  │  (Real-time) │  │  (Delayed)   │  │ (Delayed)│  │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │
│         │                 │               │        │
│         └─────────────────┼───────────────┘        │
│                           │                        │
│         ┌─────────────────▼──────────────┐         │
│         │  Rate Aggregation Service      │         │
│         │  (Weighted Average)            │         │
│         └─────────────────┬──────────────┘         │
│                           │                        │
│         ┌─────────────────▼──────────────┐         │
│         │  Rate Cache (Redis)            │         │
│         │  TTL: 30 seconds               │         │
│         └─────────────────┬──────────────┘         │
│                           │                        │
│         ┌─────────────────▼──────────────┐         │
│         │  Rate Database (PostgreSQL)    │         │
│         │  (Historical + Current)        │         │
│         └────────────────────────────────┘         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Provider Configuration:**
```typescript
interface RateProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  updateFrequency: number; // seconds
  weight: number; // 0-100 for averaging
  timeout: number; // milliseconds
  retryPolicy: RetryPolicy;
  fallbackProvider?: string;
}

const PROVIDERS: RateProvider[] = [
  {
    name: 'OANDA',
    endpoint: 'https://api-fxpractice.oanda.com/v3/instruments',
    weight: 50, // Primary
    updateFrequency: 5
  },
  {
    name: 'XE',
    endpoint: 'https://api.xe.com/v1/historic.json',
    weight: 30, // Secondary
    updateFrequency: 60
  },
  {
    name: 'FIXER',
    endpoint: 'https://api.fixer.io/latest',
    weight: 20, // Tertiary
    updateFrequency: 3600
  }
];
```

---

### Caching Strategy

**Cache Layers:**
```sql
-- Layer 1: Redis (Hot Cache)
-- Key: fx:rate:{source}:{target}
-- TTL: 30 seconds
-- Hit rate target: 95%

-- Layer 2: Database (Warm Cache)
-- Query: SELECT * FROM fx_rates WHERE expires_at > NOW()
-- TTL: 24 hours
-- Fallback when Redis misses

-- Layer 3: Historical Database
-- Query: SELECT * FROM fx_rates_historical
-- TTL: Permanent
-- For analysis and backtesting
```

**Cache Invalidation:**
```typescript
interface CacheStrategy {
  // Invalidate on new rate
  invalidateOnNewRate(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<void>;
  
  // Batch invalidation
  invalidateBatch(pairs: CurrencyPair[]): Promise<void>;
  
  // Time-based invalidation
  invalidateExpired(): Promise<void>;
  
  // Manual invalidation
  invalidateAll(): Promise<void>;
}
```

**Cache Expiry Handling:**
```typescript
interface CacheExpiryHandler {
  // Check if rate is stale
  isStale(rate: FXRate): boolean;
  
  // Get staleness percentage
  getStalenessPercent(rate: FXRate): number;
  
  // Refresh if needed
  refreshIfStale(
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<FXRate>;
  
  // Batch refresh
  refreshBatch(pairs: CurrencyPair[]): Promise<FXRate[]>;
}
```

---

## 3. EXECUTION BOUNDARY

### Advisory vs Execution

**Advisory Layer (System):**
```
┌─────────────────────────────────────────────────────┐
│         FX ADVISORY SERVICE (System)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  • Display rates                                     │
│  • Calculate fees                                    │
│  • Recommend timing                                  │
│  • Compare providers                                 │
│  • Show risk warnings                                │
│  • Display historical data                           │
│  • Provide analysis                                  │
│                                                      │
│  NO FUND MOVEMENT                                    │
│  NO BALANCE CHANGES                                  │
│  NO EXECUTION                                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Execution Layer (Partner):**
```
┌─────────────────────────────────────────────────────┐
│    FX EXECUTION SERVICE (Bank/PSP Partner)          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  • Lock rate (time-limited)                         │
│  • Execute conversion                               │
│  • Move funds                                        │
│  • Update balances                                   │
│  • Settle transaction                                │
│  • Confirm completion                                │
│                                                      │
│  ONLY AFTER USER CONFIRMATION                       │
│  ONLY VIA PARTNER API                               │
│  ONLY WITH LOCKED RATE                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### Handoff to Bank/PSP

**Handoff Flow:**
```
1. User Reviews Advisory
   ├─ Rate: 1.2345
   ├─ Fee: $5.00
   ├─ Received: $1,234.50
   └─ Timing: WAIT (high volatility)

2. User Confirms Intent
   └─ "I want to proceed"

3. System Locks Rate
   ├─ Rate lock: 1.2345 (valid 60 seconds)
   ├─ Fee lock: $5.00
   ├─ Received lock: $1,234.50
   └─ Lock ID: uuid-xxx

4. System Requests Execution
   ├─ POST /partner/fx/execute
   ├─ Body: { lockId, amount, currencies }
   └─ Signature: HMAC-SHA256

5. Partner Executes
   ├─ Verify lock
   ├─ Verify rate
   ├─ Execute conversion
   ├─ Move funds
   └─ Return confirmation

6. System Confirms
   ├─ Update ledger
   ├─ Update balances
   ├─ Send notification
   └─ Archive transaction
```

**Rate Lock Schema:**
```sql
CREATE TABLE fx_rate_locks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  amount DECIMAL(19,8) NOT NULL,
  
  -- Locked values
  locked_rate DECIMAL(19,8) NOT NULL,
  locked_fee DECIMAL(19,8) NOT NULL,
  locked_received DECIMAL(19,8) NOT NULL,
  
  -- Lock validity
  locked_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('ACTIVE', 'EXECUTED', 'EXPIRED', 'CANCELLED'),
  
  -- Execution
  executed_at TIMESTAMP,
  execution_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lock_user ON fx_rate_locks(user_id);
CREATE INDEX idx_lock_expires ON fx_rate_locks(expires_at);
CREATE INDEX idx_lock_status ON fx_rate_locks(status);
```

---

## 4. FX RISK FLAGS

### Volatility Monitoring

**Volatility Calculation:**
```sql
CREATE TABLE fx_volatility (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  
  -- Volatility metrics
  volatility_1h DECIMAL(5,4),
  volatility_24h DECIMAL(5,4),
  volatility_7d DECIMAL(5,4),
  
  -- Thresholds
  volatility_level ENUM('LOW', 'MEDIUM', 'HIGH', 'EXTREME'),
  
  -- Historical context
  percentile_rank DECIMAL(5,2), -- 0-100
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_volatility_pair ON fx_volatility(source_currency, target_currency);
```

**Volatility Risk Flags:**
```typescript
interface VolatilityFlag {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  volatility1h: number;
  volatility24h: number;
  volatility7d: number;
  percentileRank: number; // 0-100
  
  // Recommendations
  recommendation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Timing
  expectedStabilization: Date;
  
  // Historical context
  isAboveNormal: boolean;
  normalRange: { min: number; max: number };
}
```

---

### Spread Anomalies

**Spread Monitoring:**
```sql
CREATE TABLE fx_spread_anomalies (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  
  -- Spread data
  current_spread DECIMAL(19,8) NOT NULL,
  normal_spread DECIMAL(19,8) NOT NULL,
  spread_deviation DECIMAL(5,2), -- percentage
  
  -- Anomaly detection
  is_anomaly BOOLEAN,
  anomaly_type ENUM('WIDE_SPREAD', 'NARROW_SPREAD', 'NORMAL'),
  anomaly_severity ENUM('LOW', 'MEDIUM', 'HIGH'),
  
  -- Cause analysis
  likely_cause VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_anomaly_pair ON fx_spread_anomalies(source_currency, target_currency);
```

**Spread Anomaly Detection:**
```typescript
interface SpreadAnomaly {
  currentSpread: Decimal;
  normalSpread: Decimal;
  deviation: number; // percentage
  
  // Anomaly classification
  isAnomaly: boolean;
  type: 'WIDE_SPREAD' | 'NARROW_SPREAD' | 'NORMAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Analysis
  likelyCause: string;
  recommendation: string;
  
  // Timing
  expectedNormalization: Date;
  
  // Impact
  impactOnFees: Decimal;
  impactOnRate: Decimal;
}
```

---

### Corridor Risk

**Corridor Risk Schema:**
```sql
CREATE TABLE fx_corridor_risk (
  id UUID PRIMARY KEY,
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  
  -- Risk factors
  liquidity_score DECIMAL(3,2), -- 0-1
  volatility_score DECIMAL(3,2),
  geopolitical_risk DECIMAL(3,2),
  economic_risk DECIMAL(3,2),
  
  -- Overall risk
  corridor_risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'EXTREME'),
  risk_score DECIMAL(5,2), -- 0-100
  
  -- Recommendations
  recommended_max_amount DECIMAL(19,8),
  recommended_max_frequency VARCHAR(50), -- 'DAILY', 'WEEKLY'
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_corridor_pair ON fx_corridor_risk(source_currency, target_currency);
```

**Corridor Risk Assessment:**
```typescript
interface CorridorRisk {
  sourceCurrency: string;
  targetCurrency: string;
  
  // Risk components
  liquidity: number; // 0-100
  volatility: number;
  geopolitical: number;
  economic: number;
  
  // Overall assessment
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  riskScore: number; // 0-100
  
  // Recommendations
  recommendedMaxAmount: Decimal;
  recommendedMaxFrequency: string;
  
  // Risk factors
  factors: RiskFactor[];
  
  // Warnings
  warnings: string[];
  
  timestamp: Date;
}

interface RiskFactor {
  name: string;
  impact: number; // 0-100
  description: string;
  mitigation: string;
}
```

---

## 5. NON-NEGOTIABLES

### No Auto-Conversion

**FORBIDDEN:**
```typescript
// ❌ WRONG - Automatic conversion
async function autoConvertOnThreshold(
  userId: UUID,
  sourceCurrency: string,
  targetCurrency: string,
  threshold: Decimal
) {
  const balance = await getBalance(userId, sourceCurrency);
  if (balance > threshold) {
    // Auto-convert without user confirmation
    await executeConversion(userId, balance, sourceCurrency, targetCurrency);
  }
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Advisory only, user-initiated
async function recommendConversion(
  userId: UUID,
  sourceCurrency: string,
  targetCurrency: string
): Promise<ConversionRecommendation> {
  const balance = await getBalance(userId, sourceCurrency);
  const rate = await getRate(sourceCurrency, targetCurrency);
  const fees = await calculateFees(sourceCurrency, targetCurrency, balance);
  const timing = await getTimingRecommendation(sourceCurrency, targetCurrency);
  
  return {
    recommendation: 'CONSIDER_CONVERTING',
    reasoning: 'Rate is favorable, timing is good',
    estimatedReceived: balance.multiply(rate).subtract(fees),
    requiresUserConfirmation: true
  };
}
```

**Enforcement:**
- No scheduled conversions
- No threshold-based auto-execution
- No background conversions
- All conversions require explicit user action

---

### No Balance Mutation

**FORBIDDEN:**
```typescript
// ❌ WRONG - Direct balance update
async function convertCurrency(
  userId: UUID,
  amount: Decimal,
  fromCurrency: string,
  toCurrency: string
) {
  // Direct balance mutation
  await db.query(`
    UPDATE user_balances 
    SET balance = balance - $1 
    WHERE user_id = $2 AND currency = $3
  `, [amount, userId, fromCurrency]);
  
  await db.query(`
    UPDATE user_balances 
    SET balance = balance + $2 
    WHERE user_id = $2 AND currency = $3
  `, [receivedAmount, userId, toCurrency]);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Ledger-based balance update
async function convertCurrency(
  userId: UUID,
  amount: Decimal,
  fromCurrency: string,
  toCurrency: string,
  lockId: UUID
) {
  // 1. Verify lock
  const lock = await verifyRateLock(lockId, userId);
  
  // 2. Create ledger entries
  await ledgerService.createTransaction({
    transactionId: generateUUID(),
    entries: [
      {
        walletId: getUserWallet(userId, fromCurrency),
        entryType: 'DEBIT',
        amount,
        category: 'FX_CONVERSION'
      },
      {
        walletId: getUserWallet(userId, toCurrency),
        entryType: 'CREDIT',
        amount: lock.lockedReceived,
        category: 'FX_CONVERSION'
      }
    ]
  });
  
  // 3. Balance calculated from ledger
  const newBalance = await calculateBalance(userId, toCurrency);
  return newBalance;
}
```

**Enforcement:**
- No direct balance column updates
- All changes via ledger entries
- Balance is calculated/derived
- Immutable transaction history

---

### User Confirmation Always Required

**Confirmation Flow:**
```
1. Display Advisory
   ├─ Current rate
   ├─ Fee breakdown
   ├─ Received amount
   ├─ Timing recommendation
   ├─ Risk assessment
   └─ Provider comparison

2. User Reviews
   └─ Can see all details

3. User Confirms
   ├─ "I understand the risks"
   ├─ "I confirm this conversion"
   └─ Explicit action required

4. System Locks Rate
   └─ 60-second window

5. User Executes
   ├─ Final confirmation
   └─ "Execute now"

6. System Executes
   └─ Via partner API only
```

**Confirmation Schema:**
```sql
CREATE TABLE fx_confirmations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  lock_id UUID NOT NULL REFERENCES fx_rate_locks(id),
  
  -- Confirmation data
  confirmed_at TIMESTAMP NOT NULL,
  confirmed_by UUID NOT NULL, -- user_id
  
  -- What was confirmed
  confirmed_rate DECIMAL(19,8) NOT NULL,
  confirmed_fee DECIMAL(19,8) NOT NULL,
  confirmed_received DECIMAL(19,8) NOT NULL,
  
  -- Acknowledgments
  acknowledged_risks BOOLEAN NOT NULL,
  acknowledged_fees BOOLEAN NOT NULL,
  acknowledged_timing BOOLEAN NOT NULL,
  
  -- Execution
  executed_at TIMESTAMP,
  execution_status ENUM('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED'),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_confirmation_user ON fx_confirmations(user_id);
CREATE INDEX idx_confirmation_lock ON fx_confirmations(lock_id);
```

**Confirmation Enforcement:**
```typescript
interface ConfirmationRequirement {
  // Must have explicit confirmation
  requiresExplicitConfirmation: boolean;
  
  // Must acknowledge risks
  mustAcknowledgeRisks: boolean;
  
  // Must acknowledge fees
  mustAcknowledgeFees: boolean;
  
  // Must acknowledge timing
  mustAcknowledgeTiming: boolean;
  
  // Confirmation timeout
  confirmationTimeout: number; // seconds
  
  // No auto-proceed
  autoProceeds: false;
}
```

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Advisory Foundation (Weeks 1-2)
- [ ] Set up rate providers
- [ ] Implement rate caching
- [ ] Create rate display service
- [ ] Build fee calculation
- [ ] Add timing analysis

### Phase 2: Risk & Comparison (Weeks 3-4)
- [ ] Implement volatility monitoring
- [ ] Add spread anomaly detection
- [ ] Create corridor risk assessment
- [ ] Build provider comparison
- [ ] Add risk flagging

### Phase 3: Execution Boundary (Weeks 5-6)
- [ ] Implement rate locking
- [ ] Create confirmation flow
- [ ] Build partner handoff
- [ ] Add execution tracking
- [ ] Implement rollback

### Phase 4: Production Hardening (Weeks 7-8)
- [ ] Add monitoring & alerting
- [ ] Implement rate failover
- [ ] Create audit logging
- [ ] Add compliance reporting
- [ ] Production deployment

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
