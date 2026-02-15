# Settlement Finality & Appeals Window Guide

## 🎯 **TASK 2 — Settlement Finality & Appeals Window (5.5)**

### **ABSOLUTE RULES**
- ✅ **Frontend has ZERO authority**
- ✅ **Settlement is decided ONLY by backend**
- ✅ **Settlement is IMMUTABLE once finalized**
- ✅ **Appeals NEVER reverse settlement automatically**
- ✅ **Appeals do NOT touch wallet, escrow, or payouts directly**

---

## 🏛️ **Settlement State Machine**

### **States**
```typescript
enum AuctionSettlementState {
  PENDING_SETTLEMENT = 'PENDING_SETTLEMENT',  // Initial state
  SETTLED = 'SETTLED',                    // Settlement created
  SETTLEMENT_FINAL = 'SETTLEMENT_FINAL'     // Immutable, no changes allowed
}
```

### **State Flow**
```
AUCTION ENDS
    ↓
PENDING_SETTLEMENT
    ↓ (createSettlement)
SETTLED
    ↓ (appeal window expires OR manual finalization)
SETTLEMENT_FINAL (IMMUTABLE)
```

---

## ⏰ **Appeals Window**

### **Configuration**
```typescript
// Environment variables
SETTLEMENT_APPEAL_WINDOW_HOURS=48        // 48 hours default
SETTLEMENT_AUTO_FINALIZE=true            // Auto-finalize after window
SETTLEMENT_REQUIRE_EVIDENCE=true         // Evidence required
SETTLEMENT_MAX_APPEAL_LENGTH=1000        // Max description length
SETTLEMENT_MAX_EVIDENCE_FILES=5          // Max evidence files
SETTLEMENT_ALLOWED_APPEAL_ROLES=BUYER,SELLER  // Who can appeal
```

### **Appeal Window Behavior**
```typescript
interface AppealWindow {
  settlementId: string;
  opensAt: Date;           // When settlement created
  expiresAt: Date;         // When appeal window closes
  isActive: boolean;        // Window currently active
  appealsAllowed: boolean;  // Appeals currently allowed
  totalAppeals: number;    // Total appeals submitted
  appealDeadline?: Date;    // Final appeal deadline
}
```

---

## 🚨 **Appeal System (READ ONLY)**

### **Appeal Properties**
```typescript
interface Appeal {
  id: string;
  settlementId: string;
  auctionId: string;
  appellantId: string;        // Who is appealing
  appellantRole: 'BUYER' | 'SELLER' | 'OBSERVER';
  reason: AppealReason;        // Why they are appealing
  description: string;         // Detailed explanation
  evidence?: string[];         // Supporting evidence
  status: AppealStatus;        // PENDING | UNDER_REVIEW | RESOLVED | REJECTED
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;          // When reviewed by admin
  reviewedBy?: string;         // Admin who reviewed
  reviewNotes?: string;        // Admin review notes
  resolution?: string;         // Final resolution
}
```

### **Appeal Reasons**
```typescript
enum AppealReason {
  WINNING_BID_INVALID = 'WINNING_BID_INVALID',
  SELLER_MISCONDUCT = 'SELLER_MISCONDUCT',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  OTHER = 'OTHER'
}
```

### **READ ONLY Guarantees**
- ✅ **No Automatic Reversal** - Appeals never auto-reverse settlements
- ✅ **No Direct Fund Impact** - Appeals don't touch wallet/escrow/payouts
- ✅ **Manual Review Required** - All appeals need Trust & Safety review
- ✅ **No State Changes** - Settlement state remains unchanged
- ✅ **Audit Trail Only** - Appeals create review cases, not modifications

---

## 📝 **Mandatory Event Logging**

### **Event Types**
```typescript
enum SettlementEventType {
  AUCTION_SETTLED = 'AUCTION_SETTLED',           // Settlement created
  APPEAL_OPENED = 'APPEAL_OPENED',             // Appeal submitted
  APPEAL_WINDOW_EXPIRED = 'APPEAL_WINDOW_EXPIRED', // Appeal window closed
  SETTLEMENT_FINALIZED = 'SETTLEMENT_FINALIZED'      // Settlement made immutable
}
```

### **Event Structure**
```typescript
interface SettlementEvent {
  id: string;
  category: 'AUCTION_SETTLEMENT';
  type: SettlementEventType;
  timestamp: Date;
  data: {
    settlementId: string;
    auctionId: string;
    sellerId: string;
    winnerId?: string;
    winningAmount?: number;
    appealId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
```

### **Event Examples**
```json
// Settlement created
{
  "id": "settlement_event_1642412345678_abc123",
  "category": "AUCTION_SETTLEMENT",
  "type": "AUCTION_SETTLED",
  "timestamp": "2025-01-17T16:30:00.000Z",
  "data": {
    "settlementId": "settlement_123",
    "auctionId": "auction_456",
    "sellerId": "seller_789",
    "winnerId": "buyer_101",
    "winningAmount": 1000
  },
  "severity": "LOW"
}

// Appeal opened
{
  "id": "settlement_event_1642412345679_def456",
  "category": "AUCTION_SETTLEMENT", 
  "type": "APPEAL_OPENED",
  "timestamp": "2025-01-17T17:15:00.000Z",
  "data": {
    "settlementId": "settlement_123",
    "auctionId": "auction_456",
    "appealId": "appeal_789",
    "reason": "WINNING_BID_INVALID"
  },
  "severity": "MEDIUM"
}
```

---

## 👁️ **Admin Visibility**

### **Settlement Viewing**
```typescript
// Get settlement by ID
GET /api/v1/auction/settlement/:settlementId

// Get settlement by auction ID
GET /api/v1/auction/settlement/auction/:auctionId

// Get settlement statistics
GET /api/v1/auction/settlement/statistics
```

### **Appeal Viewing**
```typescript
// Get appeals for settlement
GET /api/v1/auction/settlement/:settlementId/appeals

// Get appeal window status
GET /api/v1/auction/settlement/:settlementId/appeal-window

// Check appeal eligibility
GET /api/v1/auction/settlement/:settlementId/appeal-eligibility/:userId?role=BUYER
```

### **READ ONLY Guarantees**
- ✅ **No Modification Endpoints** - No PUT/POST for changing settlements
- ✅ **View Only Access** - All endpoints are GET requests
- ✅ **Audit Trail Only** - Admin can view but not modify
- ✅ **Immutable Data** - Settlement data cannot be changed via API

---

## 🚀 **Integration Examples**

### **1. Create Settlement**
```typescript
import { settlementService } from '@mnbara/auction';

// After auction ends
const settlementRequest = {
  auctionId: 'auction-123',
  sellerId: 'seller-456',
  winnerId: 'buyer-789',
  winningBidId: 'bid-101',
  winningAmount: 1000,
  settlementMethod: 'ESCROW'
};

const result = settlementService.createSettlement(settlementRequest);

if (result.success) {
  console.log('Settlement created:', result.settlement);
  console.log('Appeal window:', result.appealWindow);
  
  // Process payment/payout logic here
  // Settlement is now in SETTLED state
}
```

### **2. Handle Appeal**
```typescript
// User submits appeal
const appealRequest = {
  settlementId: 'settlement-123',
  appellantId: 'buyer-789',
  appellantRole: 'BUYER',
  reason: 'WINNING_BID_INVALID',
  description: 'The winning bid was placed after auction ended',
  evidence: ['screenshot.png', 'auction_log.txt']
};

const appealResult = settlementService.createAppeal(appealRequest);

if (appealResult.success) {
  console.log('Appeal created:', appealResult.appeal);
  // Appeal is now PENDING and requires manual review
  // Settlement state remains SETTLED (no changes)
} else {
  console.log('Appeal rejected:', appealResult.error);
}
```

### **3. Check Appeal Eligibility**
```typescript
// Check if user can appeal
const eligibility = settlementService.checkAppealEligibility(
  'settlement-123',
  'buyer-789',
  'BUYER'
);

if (eligibility.canAppeal) {
  console.log('User can appeal until:', eligibility.deadline);
} else {
  console.log('Cannot appeal:', eligibility.reason);
}
```

### **4. Finalize Settlement**
```typescript
// Manual finalization (after appeal window expires)
const finalizeResult = settlementService.finalizeSettlement('settlement-123');

if (finalizeResult.success) {
  console.log('Settlement finalized - now immutable');
  // Settlement state is now SETTLEMENT_FINAL
  // No further changes or appeals allowed
}
```

---

## 🔧 **API Endpoints**

### **Settlement Management**
```typescript
POST   /api/v1/auction/settlement                    // Create settlement
GET    /api/v1/auction/settlement/:id                // Get settlement
GET    /api/v1/auction/settlement/auction/:auctionId  // Get by auction
POST   /api/v1/auction/settlement/:id/finalize      // Finalize settlement
GET    /api/v1/auction/settlement/statistics         // Get statistics
```

### **Appeal Management**
```typescript
POST   /api/v1/auction/settlement/:id/appeal          // Create appeal
GET    /api/v1/auction/settlement/:id/appeals         // Get appeals
GET    /api/v1/auction/settlement/:id/appeal-window   // Get appeal window
GET    /api/v1/auction/settlement/:id/appeal-eligibility/:userId  // Check eligibility
```

### **System Management**
```typescript
GET    /api/v1/auction/settlement/events              // Get event log
POST   /api/v1/auction/settlement/process-expired-windows  // Process expired windows
GET    /api/v1/auction/settlement/health              // Health check
```

---

## 🛡️ **Security Features**

### **Immutable Settlements**
```typescript
// Once finalized, settlement cannot be changed
if (settlement.state === AuctionSettlementState.SETTLEMENT_FINAL) {
  // All modification attempts fail
  // Appeals are rejected
  // State is permanently locked
}
```

### **Appeal Restrictions**
```typescript
// Appeals only allowed during window
if (new Date() > appealWindow.expiresAt) {
  // Appeal rejected: "Appeal window has expired"
}

// Appeals only from allowed roles
if (!allowedRoles.includes(userRole)) {
  // Appeal rejected: "User role not allowed to appeal"
}

// Only one appeal per user per settlement
if (existingAppeal) {
  // Appeal rejected: "User has already appealed this settlement"
}
```

### **Event Logging**
```typescript
// All operations logged with append-only guarantee
// Events cannot be modified or deleted
// Complete audit trail for compliance
```

---

## 📊 **Monitoring & Statistics**

### **Settlement Statistics**
```typescript
const stats = settlementService.getStatistics();
// Returns:
{
  totalSettlements: 150,
  pendingSettlements: 5,
  settledSettlements: 120,
  finalizedSettlements: 25,
  totalAppeals: 12,
  pendingAppeals: 3,
  resolvedAppeals: 8,
  rejectedAppeals: 1,
  averageAppealResolutionTime: 48.5,
  topAppealReasons: [
    { reason: 'WINNING_BID_INVALID', count: 6 },
    { reason: 'SELLER_MISCONDUCT', count: 3 }
  ]
}
```

### **Health Monitoring**
```typescript
// Health check returns system status
GET /api/v1/auction/settlement/health
// Returns:
{
  status: 'healthy',
  timestamp: '2025-01-17T16:30:00.000Z',
  statistics: {
    totalSettlements: 150,
    totalAppeals: 12,
    pendingAppeals: 3
  }
}
```

---

## 🔄 **Configuration Management**

### **Runtime Updates**
```typescript
import { reloadSettlementConfig } from '@mnbara/auction';

// Update configuration without restart
reloadSettlementConfig();

// New values take effect immediately
```

### **Environment Variables**
```bash
# Appeal window configuration
SETTLEMENT_APPEAL_WINDOW_HOURS=48
SETTLEMENT_AUTO_FINALIZE=true

# Appeal requirements
SETTLEMENT_REQUIRE_EVIDENCE=true
SETTLEMENT_MAX_APPEAL_LENGTH=1000
SETTLEMENT_MAX_EVIDENCE_FILES=5
SETTLEMENT_ALLOWED_APPEAL_ROLES=BUYER,SELLER
```

---

## 🧪 **Testing Coverage**

### **Comprehensive Test Suite**
- ✅ **Settlement Creation** - Valid and invalid requests
- ✅ **Appeal Creation** - Eligibility, validation, restrictions
- ✅ **State Transitions** - Proper state machine flow
- ✅ **Finalization** - Manual and automatic finalization
- ✅ **Appeal Window** - Expiration, eligibility checks
- ✅ **Event Logging** - All events logged correctly
- ✅ **Statistics** - Accurate tracking and reporting
- ✅ **Error Handling** - Graceful failure handling
- ✅ **Security** - Immutable settlements, appeal restrictions

### **Test Execution**
```bash
cd backend/services/auction
npm test -- Settlement.test.ts
```

---

## 📋 **Production Deployment**

### **Pre-Deployment Checklist**
- [ ] Configure appeal window duration
- [ ] Set up auto-finalization
- [ ] Configure appeal requirements
- [ ] Set up monitoring alerts
- [ ] Test all settlement flows
- [ ] Verify event logging
- [ ] Test appeal restrictions
- [ ] Validate admin visibility

### **Monitoring Setup**
```typescript
// Monitor settlement finalization rate
// Track appeal volume and patterns
// Alert on high appeal rates
// Monitor event log volume
// Track settlement processing time
```

---

## 📝 **Summary**

The Settlement Finality & Appeals Window system provides:

✅ **Immutable Settlements** - Once finalized, settlements cannot be changed  
✅ **Time-Bound Appeals** - Limited appeal window with clear deadlines  
✅ **READ ONLY Appeals** - Appeals create review cases, don't modify settlements  
✅ **Complete Audit Trail** - Every action logged with append-only guarantee  
✅ **Admin Visibility** - Full visibility without modification capabilities  
✅ **Configurable Rules** - Environment-based configuration for flexibility  
✅ **Security First** - Multiple layers of protection and validation  
✅ **Production Ready** - Comprehensive testing and monitoring  

**Perfect for**: Real-money auction systems requiring finality with limited, controlled appeals while maintaining complete audit trails and regulatory compliance.

**Status**: ✅ **COMPLETE** - Ready for production integration with Mnbara Platform auction service.
