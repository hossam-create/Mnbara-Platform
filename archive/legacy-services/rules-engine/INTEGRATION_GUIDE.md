# Rules Engine Integration Guide

## 🎯 **TASK 4 — Integration Points (READ ONLY)**

### **ABSOLUTE REQUIREMENTS**
- ✅ **Logging is append-only**
- ✅ **Logging failure must NOT break flow**
- ✅ **READ ONLY operations only**
- ✅ **Rules Engine does NOT decide business logic**
- ✅ **It only advises — enforcement happens elsewhere**

---

## 🔗 **Integration Points**

### **1. Bid Placement Integration**
```typescript
import { rulesIntegration } from '@mnbara/rules-engine';

// Pre-check before placing bid
const result = await rulesIntegration.checkBidPlacement(
  'user-123',           // userId
  'auction-456',         // auctionId
  500,                  // bidAmount
  { ['activeBids']: 8 }  // userMetadata
);

// Enforcement Logic (NOT in Rules Engine)
if (result.shouldBlock) {
  throw new Error('Bid blocked: ' + result.reason);
}

if (result.shouldReview) {
  // Allow but flag for admin review
  await flagForReview('bid', result.summary);
}

// Continue with bid placement...
```

### **2. Traveler Request Acceptance**
```typescript
// Pre-check before accepting traveler request
const result = await rulesIntegration.checkTravelerRequest(
  'traveler-789',       // travelerId
  'request-123',         // requestId
  'ACCOMMODATION',       // requestType
  { ['pendingRequests']: 3 }  // travelerMetadata
);

// Enforcement Logic (NOT in Rules Engine)
if (result.shouldBlock) {
  throw new Error('Request blocked: ' + result.reason);
}

if (result.shouldReview) {
  await flagForReview('traveler-request', result.summary);
}

// Continue with request acceptance...
```

### **3. Seller Listing Creation**
```typescript
// Pre-check before creating seller listing
const result = await rulesIntegration.checkSellerListing(
  'seller-456',         // sellerId
  {                      // listingData
    id: 'listing-789',
    category: 'electronics',
    price: 1000,
    title: 'Smartphone'
  },
  {                      // sellerMetadata
    ['listingsLastHour']: 2,
    ['listingsLastDay']: 15
  }
);

// Enforcement Logic (NOT in Rules Engine)
if (result.shouldBlock) {
  throw new Error('Listing blocked: ' + result.reason);
}

if (result.shouldReview) {
  await flagForReview('listing', result.summary);
}

// Continue with listing creation...
```

### **4. Payment Retry Attempt**
```typescript
// Pre-check before payment retry
const result = await rulesIntegration.checkPaymentRetry(
  'user-123',           // userId
  'payment-456',        // paymentId
  2,                     // retryCount
  '2025-01-17T10:00:00Z', // firstAttemptTime
  {                      // paymentMetadata
    amount: 500,
    currency: 'USD'
  }
);

// Enforcement Logic (NOT in Rules Engine)
if (result.shouldBlock) {
  throw new Error('Payment retry blocked: ' + result.reason);
}

if (result.shouldReview) {
  await flagForReview('payment-retry', result.summary);
}

// Continue with payment retry...
```

---

## 🚦 **Decision Logic**

### **Rule Results → Actions**

| Rule Result | Decision | shouldBlock | shouldReview | Action |
|-------------|----------|-------------|--------------|---------|
| **ALLOW** | ALLOW | false | false | Continue normally |
| **FLAG** | FLAG | false | true | Allow but mark for review |
| **DENY** | DENY | true | false | Block action |

### **Implementation Pattern**
```typescript
// Standard integration pattern for all endpoints
async function integrateWithRules(
  integrationPoint: string,
  contextData: any,
  businessLogic: () => Promise<any>
) {
  // 1. Pre-check with Rules Engine (READ ONLY)
  const result = await rulesIntegration.performPreCheck(integrationPoint, contextData);
  
  // 2. Enforcement Logic (NOT in Rules Engine)
  if (result.shouldBlock) {
    throw new Error(`${integrationPoint} blocked: ${result.reason}`);
  }
  
  if (result.shouldReview) {
    await flagForReview(integrationPoint, result.summary);
  }
  
  // 3. Execute business logic
  return await businessLogic();
}
```

---

## 📝 **Logging System**

### **Append-Only Guarantee**
- All logs use `appendFileSync` - NO overwrites
- Log rotation creates new files, never modifies existing
- Logging failures fall back to console, never break flow

### **Log Structure**
```json
{
  "timestamp": "2025-01-17T16:30:00.000Z",
  "level": "INFO|WARN|ERROR",
  "event": "RULE_EVALUATION|ENGINE_EVALUATION|INTEGRATION_CHECK",
  "data": { ... },
  "error": "Error message (if applicable)"
}
```

### **Log Files**
- **Location**: `./logs/rules-engine-YYYY-MM-DD.log`
- **Rotation**: Automatic when file exceeds 10MB
- **Fallback**: Console logging if file system unavailable

---

## 🛡️ **Error Handling**

### **Rules Engine Failures**
```typescript
// If Rules Engine fails, default to ALLOW
try {
  const result = await rulesIntegration.checkBidPlacement(...);
  // Process result...
} catch (error) {
  // Rules Engine failure = ALLOW by default
  // Log error but continue with business logic
  console.warn('Rules Engine unavailable, allowing by default:', error);
  // Continue with bid placement...
}
```

### **Logging Failures**
```typescript
// Logging failures NEVER break the flow
// RuleLogger.service.ts handles this automatically:
try {
  appendFileSync(logFilePath, logLine);
} catch (error) {
  // Fallback to console, never throw
  console.warn('Failed to write to log file:', error);
  console.log(`[RuleLogger] ${JSON.stringify(entry)}`);
}
```

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Rule thresholds (see .env.example)
RULE_USER_MAX_ACTIVE_BIDS=10
RULE_TRAVELER_MAX_PENDING_REQUESTS=5
RULE_SELLER_MAX_LISTINGS_PER_HOUR=5
RULE_SELLER_MAX_LISTINGS_PER_DAY=50
RULE_PAYMENT_MAX_RETRIES=3
RULE_PAYMENT_RETRY_WINDOW_MINUTES=60

# Logging
LOG_DIR=./logs
MAX_LOG_FILE_SIZE=10485760  # 10MB
```

### **Runtime Configuration**
```typescript
import { reloadRuleThresholds } from '@mnbara/rules-engine';

// Reload thresholds without restart
reloadRuleThresholds();
```

---

## 📊 **Monitoring**

### **Log Statistics**
```typescript
const stats = rulesIntegration.getLogStats();
console.log(stats);
// {
//   logFilePath: './logs/rules-engine-2025-01-17.log',
//   currentSize: 1048576,
//   maxSize: 10485760
// }
```

### **Integration Monitoring**
```typescript
// All integration checks are automatically logged
// Monitor logs for:
// - INTEGRATION_CHECK events
// - Decision patterns (ALLOW/FLAG/DENY ratios)
// - Error rates
// - Performance metrics
```

---

## 🚀 **Production Deployment**

### **Integration Checklist**
- [ ] Import `rulesIntegration` from `@mnbara/rules-engine`
- [ ] Implement pre-check before each business action
- [ ] Add enforcement logic (block/flag/allow)
- [ ] Configure environment variables
- [ ] Set up log monitoring
- [ ] Test error scenarios (Rules Engine unavailable)
- [ ] Verify logging append-only behavior
- [ ] Monitor decision patterns

### **Best Practices**
1. **ALWAYS** call Rules Engine before business logic
2. **NEVER** modify data in Rules Engine context
3. **ALWAYS** handle Rules Engine failures gracefully
4. **NEVER** let logging failures break business flow
5. **ALWAYS** log integration decisions
6. **NEVER** store Rules Engine state in business services

---

## 📋 **Integration Summary**

### **What Rules Engine Provides**
- ✅ **Deterministic decision making** based on configurable rules
- ✅ **Complete audit trail** with append-only logging
- ✅ **Pre-check validation** without side effects
- ✅ **Configurable thresholds** via environment variables
- ✅ **Error resilience** with graceful degradation

### **What Business Logic Provides**
- ✅ **Enforcement decisions** (block/flag/allow actions)
- ✅ **Business context** and data validation
- ✅ **Transaction management** and data persistence
- ✅ **User experience** and error handling
- ✅ **Integration workflows** and orchestration

### **Separation of Concerns**
- **Rules Engine**: READ ONLY evaluation and advice
- **Business Logic**: WRITE operations and enforcement
- **Clear boundary**: No side effects, no business decisions in rules

This architecture ensures **deterministic, auditable, and resilient** rule evaluation while maintaining **clear separation** between rule evaluation and business logic enforcement.
