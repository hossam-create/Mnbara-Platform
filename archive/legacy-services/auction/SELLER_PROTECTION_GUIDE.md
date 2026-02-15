# Seller Protections & Auto-Relist Guide

## 🎯 **TASK 3 — Seller Protections & Auto-Relist (5.6)**

### **ABSOLUTE RULES**
- ✅ **Frontend has ZERO authority**
- ✅ **Seller protection logic is BACKEND ONLY**
- ✅ **No automatic wallet or escrow mutations**
- ✅ **Auto-relist NEVER happens from frontend**
- ✅ **Auto-relist NEVER reuses previous bids**

---

## 🛡️ **Seller Protection Triggers**

### **Four Protection Triggers**
```typescript
enum SellerProtectionTrigger {
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',           // Winner fails to complete payment
  SETTLEMENT_EXPIRED = 'SETTLEMENT_EXPIRED',     // Settlement expires without completion
  BUYER_BLOCKED = 'BUYER_BLOCKED',             // Buyer blocked/flagged during settlement
  APPEAL_AGAINST_BUYER = 'APPEAL_AGAINST_BUYER' // Appeal resolves against buyer
}
```

### **Trigger Conditions**
- **Payment Failure**: Winner's payment method declined or fails
- **Settlement Expiry**: Settlement remains incomplete for 72+ hours
- **Buyer Blocked**: Trust & Safety blocks buyer during settlement window
- **Appeal Resolution**: Appeal process finds buyer at fault

---

## 🛡️ **Seller Protection Outcomes**

### **Protection Status**
```typescript
enum SellerProtectionStatus {
  NONE = 'NONE',                    // No protection
  PROTECTED = 'PROTECTED',            // Seller protected
  AUTO_RELIST_ELIGIBLE = 'AUTO_RELIST_ELIGIBLE', // Eligible for auto-relist
  AUTO_RELISTED = 'AUTO_RELISTED'      // Auction auto-relisted
}
```

### **Protection Benefits**
- ✅ **Seller marked as PROTECTED** - No trust score penalty
- ✅ **No seller penalties** - Protected from buyer failures
- ✅ **Auto-relist eligibility** - Can relist auction automatically
- ✅ **Escrow remains intact** - No automatic wallet/escrow mutations

---

## 🔄 **Auto-Relist Rules**

### **New Auction Creation**
```typescript
// Creates NEW auction ID
const newAuctionId = `auction_auto_relist_${Date.now()}_${randomString()}`;

// Copies ONLY metadata (NO bids, watchers, or history)
const newAuction = {
  id: newAuctionId,
  sellerId: originalAuction.sellerId,
  title: originalAuction.title,           // ✅ Copied
  description: originalAuction.description,   // ✅ Copied
  images: originalAuction.images,           // ✅ Copied
  category: originalAuction.category,       // ✅ Copied
  condition: originalAuction.condition,     // ✅ Copied
  reservePrice: originalAuction.reservePrice, // ✅ Optional copy
  shippingInfo: originalAuction.shippingInfo, // ✅ Optional copy
  
  // ❌ NEVER copied:
  bidHistory: [],                          // Fresh start
  currentBid: 0,                           // Fresh start
  bidCount: 0,                            // Fresh start
  watcherCount: 0,                         // Fresh start
  watchers: []                              // Fresh start
  
  // Auto-relist metadata
  metadata: {
    autoRelistedFrom: originalAuctionId,
    sellerProtectionId: protectionId,
    originalTrigger: trigger,
    autoRelistedAt: new Date()
  }
};
```

### **Start Status Options**
```typescript
// Configurable start status
enum AutoRelistStartStatus {
  DRAFT = 'DRAFT',                    // Requires seller review
  PENDING_REVIEW = 'PENDING_REVIEW', // Requires admin review
  ACTIVE = 'ACTIVE'                     // Goes live immediately
}
```

---

## 📝 **Mandatory Event Logging**

### **Four Event Types**
```typescript
enum SellerProtectionEventType {
  SELLER_PROTECTED = 'SELLER_PROTECTED',           // Protection created
  AUTO_RELIST_ELIGIBLE = 'AUTO_RELIST_ELIGIBLE', // Auto-relist eligible
  AUCTION_AUTO_RELISTED = 'AUCTION_AUTO_RELISTED',   // Auction auto-relisted
  AUTO_RELIST_CANCELLED = 'AUTO_RELIST_CANCELLED'  // Auto-relist cancelled
}
```

### **Event Structure**
```json
{
  "id": "seller_protection_event_1642412345678_abc123",
  "category": "SELLER_PROTECTION",
  "type": "SELLER_PROTECTED",
  "timestamp": "2025-01-17T16:30:00.000Z",
  "data": {
    "sellerProtectionId": "protection_123",
    "originalAuctionId": "auction_456",
    "sellerId": "seller_789",
    "buyerId": "buyer_101",
    "trigger": "PAYMENT_FAILURE",
    "newAuctionId": "auction_auto_relist_789",
    "reason": "Payment method declined",
    "metadata": { ... }
  },
  "severity": "MEDIUM"
}
```

---

## 👁️ **Admin Visibility**

### **READ ONLY Access**
```typescript
// Get seller protection by ID
GET /api/v1/auction/seller-protection/:protectionId

// Get protections for seller
GET /api/v1/auction/seller-protection/seller/:sellerId

// Get protection for auction
GET /api/v1/auction/seller-protection/auction/:originalAuctionId

// Get statistics
GET /api/v1/auction/seller-protection/statistics

// Get event log
GET /api/v1/auction/seller-protection/events
```

### **NO Modification Capabilities**
- ✅ **No PUT/POST for changes** - All endpoints are GET only
- ✅ **No force relist** - Cannot manually trigger auto-relist
- ✅ **No auction modifications** - Cannot modify auction data
- ✅ **View only access** - Complete visibility without control

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Auto-relist settings
SELLER_PROTECTION_AUTO_RELIST_ENABLED=true
SELLER_PROTECTION_REQUIRE_CONFIRMATION=true
SELLER_PROTECTION_START_STATUS=PENDING_REVIEW

# Timing settings
SELLER_PROTECTION_CONFIRMATION_DEADLINE_HOURS=72
SELLER_PROTECTION_COOLDOWN_HOURS=24
SELLER_PROTECTION_MAX_AUTO_RELIST=5

# Trust score impact
SELLER_PROTECTION_TRUST_IMPACT=NONE

# Appeal settings
SELLER_PROTECTION_ALLOW_RELIST_AFTER_APPEAL=true

# Data copying settings
SELLER_PROTECTION_COPY_RESERVE_PRICE=true
SELLER_PROTECTION_COPY_SHIPPING_INFO=true
```

### **Runtime Updates**
```typescript
import { reloadSellerProtectionConfig } from '@mnbara/auction';

// Update configuration without restart
reloadSellerProtectionConfig();

// New values take effect immediately
```

---

## 🚀 **Integration Examples**

### **1. Payment Failure Trigger**
```typescript
import { settlementIntegrationService } from '@mnbara/auction';

// Payment failed for settlement
settlementIntegrationService.handlePaymentFailure(
  'settlement_123',
  'Credit card declined by payment processor'
);
```

### **2. Settlement Expiry Trigger**
```typescript
// Settlement expired without completion
settlementIntegrationService.handleSettlementFinalized('settlement_456');
```

### **3. Buyer Blocked Trigger**
```typescript
import { trustSafetyIntegrationService } from '@mnbara/auction';

// Buyer blocked by Trust & Safety
trustSafetyIntegrationService.handleUserBlocked({
  userId: 'buyer_789',
  eventType: 'USER_BLOCKED',
  reason: 'Fraudulent activity detected',
  severity: 'HIGH',
  timestamp: new Date(),
  relatedSettlementId: 'settlement_123'
});
```

### **4. Appeal Resolution Trigger**
```typescript
// Appeal resolved against buyer
settlementIntegrationService.handleAppealResolved(
  'appeal_456',
  'AGAINST_BUYER'
);
```

### **5. Auto-Relist Processing**
```typescript
import { sellerProtectionService } from '@mnbara/auction';

// Process auto-relist
const autoRelistResult = sellerProtectionService.processAutoRelist({
  sellerProtectionId: 'protection_123',
  requireConfirmation: false,
  startStatus: 'PENDING_REVIEW',
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
});

if (autoRelistResult.success) {
  console.log('New auction ID:', autoRelistResult.newAuctionId);
  console.log('Requires confirmation:', autoRelistResult.requiresConfirmation);
}
```

---

## 🛡️ **Safety Features**

### **Multi-Layer Protection**
- **Backend Only Logic** - No frontend authority
- **No Wallet/Escrow Impact** - Financial safety maintained
- **Immutable Protection Records** - Cannot be modified once created
- **Complete Audit Trail** - Every action logged with append-only guarantee

### **Auto-Relist Safeguards**
- **New Auction ID** - Never reuses previous auction IDs
- **Fresh Bid History** - No previous bids copied over
- **Configurable Limits** - Prevents abuse and spam
- **Confirmation Required** - Seller must approve auto-relist

### **Trust Score Protection**
- **No Penalties** - Protected sellers not penalized
- **Configurable Impact** - NONE/POSITIVE/NEGATIVE impact options
- **Fair Treatment** - Buyers at fault don't hurt seller reputation

---

## 📊 **Monitoring & Statistics**

### **Real-Time Tracking**
```typescript
const stats = sellerProtectionService.getStatistics();
// Returns:
{
  totalProtections: 150,
  activeProtections: 25,
  autoRelistEligible: 10,
  autoRelisted: 8,
  cancelled: 2,
  triggerBreakdown: {
    PAYMENT_FAILURE: 80,
    SETTLEMENT_EXPIRED: 30,
    BUYER_BLOCKED: 25,
    APPEAL_AGAINST_BUYER: 15
  },
  averageProcessingTime: 2.5,
  topProtectedSellers: [...],
  autoRelistSuccessRate: 0.85
}
```

### **Health Monitoring**
```typescript
// Health check returns system status
GET /api/v1/auction/seller-protection/health
// Returns:
{
  status: 'healthy',
  timestamp: '2025-01-17T16:30:00.000Z',
  statistics: {
    totalProtections: 150,
    autoRelisted: 8,
    autoRelistSuccessRate: 0.85
  }
}
```

---

## 🔄 **Configuration Management**

### **Runtime Updates**
```typescript
import { reloadSellerProtectionConfig } from '@mnbara/auction';

// Update configuration without restart
reloadSellerProtectionConfig();

// New values take effect immediately
```

### **Environment Variables**
```bash
# Auto-relist configuration
SELLER_PROTECTION_AUTO_RELIST_ENABLED=true
SELLER_PROTECTION_REQUIRE_CONFIRMATION=true
SELLER_PROTECTION_START_STATUS=PENDING_REVIEW

# Timing and limits
SELLER_PROTECTION_CONFIRMATION_DEADLINE_HOURS=72
SELLER_PROTECTION_COOLDOWN_HOURS=24
SELLER_PROTECTION_MAX_AUTO_RELIST=5

# Trust and safety
SELLER_PROTECTION_TRUST_IMPACT=NONE
SELLER_PROTECTION_ALLOW_RELIST_AFTER_APPEAL=true

# Data copying
SELLER_PROTECTION_COPY_RESERVE_PRICE=true
SELLER_PROTECTION_COPY_SHIPPING_INFO=true
```

---

## 🧪 **Testing Coverage**

### **Comprehensive Test Suite**
- ✅ **Protection Creation** - All trigger types and validation
- ✅ **Auto-Relist Processing** - With and without confirmation
- ✅ **Eligibility Checking** - Limits, cooldowns, and requirements
- ✅ **Event Logging** - All events logged correctly
- ✅ **Statistics Tracking** - Accurate metrics and reporting
- ✅ **Error Handling** - Graceful failure handling
- ✅ **Configuration** - Runtime updates and validation
- ✅ **Integration** - Settlement and Trust & Safety systems
- ✅ **Data Retrieval** - All getter methods tested
- ✅ **Multiple Sellers** - Independent handling of multiple sellers

### **Test Execution**
```bash
cd backend/services/auction
npm test -- SellerProtection.test.ts
```

---

## 📋 **Summary**

The Seller Protections & Auto-Relist system provides:

✅ **Four Protection Triggers** - Payment failure, settlement expiry, buyer blocked, appeal resolution  
✅ **Seller Protection Outcomes** - Protected status, no penalties, auto-relist eligibility  
✅ **Safe Auto-Relisting** - New auction ID, metadata-only copy, no bid history  
✅ **Complete Event Logging** - All actions logged with append-only guarantee  
✅ **Admin Visibility** - READ ONLY access with complete audit trail  
✅ **Configurable Rules** - Environment-based configuration for flexibility  
✅ **System Integration** - Settlement Finality and Trust & Safety integration  
✅ **Comprehensive Testing** - Full test coverage for all scenarios  

**Perfect for**: Real-money auction marketplaces requiring seller protection without compromising financial safety or auction integrity.

**Status**: ✅ **COMPLETE** - Ready for production integration with Mnbara Platform auction service.
