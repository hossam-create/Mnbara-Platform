# Marketplace Core Journey Guide

## 🎯 **TASK 4 — Buyer / Traveler Core Journey Binding (Marketplace Backbone)**

### **ABSOLUTE RULES**
- ✅ **Frontend has ZERO authority**
- ✅ **All matching, state changes, and eligibility are BACKEND ONLY**
- ✅ **Frontend only submits intent and displays backend state**
- ✅ **No wallet, escrow, or settlement mutation here**
- ✅ **No silent automation — everything logged**

---

## 🛒️ **PART 1 — BUYER JOURNEY (Request → Wait → Match)**

### **Buyer Flow**
```typescript
// Buyer submits a PRODUCT REQUEST
const buyerRequest = {
  productLink: 'https://example.com/product/123',
  productDescription: 'iPhone 13 Pro Max 256GB - Blue',
  category: 'electronics',
  preferredDeliveryDate: new Date('2025-02-01'),
  maxBudget: 1200,
  currency: 'USD',
  destinationCountry: 'USA',
  destinationCity: 'New York',
  specialInstructions: 'Handle with care, fragile item',
  requirements: {
    travelerTrustScore: 75,
    minimumRating: 4.5,
    preferredLanguages: ['English', 'Arabic'],
    specialRequirements: ['Insurance required']
  }
};

// Request enters PENDING_TRAVELER state
const result = marketplaceService.createBuyerRequest(buyerRequest, 'buyer-123');
// result.request.state === BuyerRequestState.PENDING_TRAVELER

// Buyer CANNOT choose a traveler directly
// Buyer waits for traveler offers
```

### **Backend Responsibilities**
- ✅ **Validate request** - All required fields and data integrity
- ✅ **Store request with immutable ID** - Unique identifier, never changes
- ✅ **Expose READ ONLY status to buyer** - Buyer can view but not modify
- ✅ **Handle expiration (configurable TTL)** - Auto-expire after 7 days default

### **State Flow**
```
PRODUCT REQUEST
    ↓
PENDING_TRAVELER (Waiting for offers)
    ↓ (offers received)
OFFERED (Has received offers)
    ↓ (offer accepted)
MATCHED (Matched with traveler)
    ↓ (match confirmed)
LOCKED (Match locked, no new offers)
```

---

## 🧳️ **PART 2 — TRAVELER JOURNEY (Availability → Offers)**

### **Traveler Flow**
```typescript
// Traveler registers AVAILABILITY
const travelerAvailability = {
  route: {
    from: { country: 'UK', city: 'London', airport: 'LHR' },
    to: { country: 'USA', city: 'New York', airport: 'JFK' }
  },
  dates: {
    availableFrom: new Date('2025-01-25'),
    availableTo: new Date('2025-02-05'),
    flexibleDates: true
  },
  capacity: {
    maxWeight: 10,
    maxDimensions: { length: 50, width: 30, height: 20 },
    maxItems: 5
  },
  services: {
    canShop: true,
    canDeliver: true,
    canCustomsClear: true,
    canInsurance: true,
    additionalServices: ['Gift wrapping', 'Express delivery']
  },
  pricing: {
    baseRate: 50,
    currency: 'USD',
    perKgRate: 5,
    perItemRate: 2,
    customsFee: 25,
    insuranceRate: 0.02
  }
};

// Traveler sees PENDING BUYER REQUESTS
const pendingRequests = marketplaceService.getPendingRequests();

// Traveler can SUBMIT OFFER to fulfill request
const travelerOffer = {
  requestId: 'buyer_request_123',
  proposedPrice: 75,
  currency: 'USD',
  deliveryDate: new Date('2025-02-01'),
  deliveryMethod: 'Express',
  terms: {
    canShop: true,
    canDeliver: true,
    canCustomsClear: true,
    canInsurance: true,
    insuranceIncluded: true,
    trackingIncluded: true,
    estimatedDeliveryTime: 3
  }
};
```

### **Backend Responsibilities**
- ✅ **Match traveler availability to requests** - Intelligent routing matching
- ✅ **Prevent duplicate or conflicting offers** - One offer per request per traveler
- ✅ **Enforce rate limits and trust rules** - Maximum 5 active requests, 10 active offers
- ✅ **No traveler auto-acceptance** - All decisions manual

---

## 🔄 **PART 3 — MATCHING & STATE RULES**

### **Matching Process**
```typescript
// Buyer can ACCEPT or REJECT traveler offers
const acceptResult = marketplaceService.acceptOffer(
  'buyer_request_123',    // Request ID
  'traveler_offer_456',  // Offer ID
  'buyer-123'            // Buyer ID
);

// Acceptance creates a MATCHED state
// Rejection does not penalize traveler
```

### **State Transitions (Backend Only)**
```typescript
enum BuyerRequestState {
  PENDING_TRAVELER = 'PENDING_TRAVELER',    // Initial state
  OFFERED = 'OFFERED',                      // Has received offers
  MATCHED = 'MATCHED',                        // Matched with traveler
  LOCKED = 'LOCKED'                          // Match locked, no new offers allowed
}

enum OfferState {
  PENDING = 'PENDING',                        // Offer submitted, awaiting response
  ACCEPTED = 'ACCEPTED',                      // Offer accepted by buyer
  REJECTED = 'REJECTED',                      // Offer rejected by buyer
  WITHDRAWN = 'WITHDRAWN',                    // Withdrawn by traveler
  EXPIRED = 'EXPIRED'                        // Offer expired
}

enum MatchState {
  PENDING = 'PENDING',                        // Match created, awaiting confirmation
  CONFIRMED = 'CONFIRMED',                    // Match confirmed by both parties
  LOCKED = 'LOCKED',                          // Match locked, no changes allowed
  CANCELLED = 'CANCELLED',                    // Match cancelled
  COMPLETED = 'COMPLETED'                      // Match completed successfully
}
```

### **State Rules**
- ✅ **PENDING → OFFERED** - When first offer submitted
- ✅ **OFFERED → MATCHED** - When offer accepted
- ✅ **MATCHED → LOCKED** - When both parties confirm
- ✅ **Once LOCKED, no new offers allowed** - Final state

---

## 👁️ **PART 4 — ADMIN VISIBILITY (READ ONLY)**

### **Admin Endpoints**
```typescript
// View buyer requests
GET /api/v1/auction/marketplace/admin/buyer-requests
GET /api/v1/auction/marketplace/admin/buyer-requests/:requestId

// View traveler availability
GET /api/v1/auction/marketplace/admin/traveler-availabilities
GET /api/v1/auction/marketplace/admin/traveler-availabilities/:availabilityId

// View offers and matches
GET /api/v1/auction/marketplace/admin/offers
GET /api/v1/auction/marketplace/admin/offers/:offerId
GET /api/v1/auction/marketplace/admin/matches
GET /api/v1/auction/marketplace/admin/matches/:matchId

// View statistics and events
GET /api/v1/auction/marketplace/admin/statistics
GET /api/v1/auction/marketplace/admin/events
```

### **READ ONLY Guarantees**
- ✅ **View buyer requests** - Complete visibility without modification
- ✅ **View traveler availability** - Full access to availability data
- ✅ **View offers and matches** - Complete matching history
- ✅ **NO ability to force match** - No manual matching capabilities
- ✅ **NO ability to edit requests or offers** - Read-only interface

---

## 📝 **MANDATORY EVENT LOGGING**

### **Four Event Types**
```typescript
enum MarketplaceEventType {
  // Buyer events
  BUYER_REQUEST_CREATED = 'BUYER_REQUEST_CREATED',           // Request created
  BUYER_REQUEST_EXPIRED = 'BUYER_REQUEST_EXPIRED',         // Request expired
  BUYER_REQUEST_MATCHED = 'BUYER_REQUEST_MATCHED',           // Request matched
  
  // Traveler events
  TRAVELER_AVAILABILITY_CREATED = 'TRAVELER_AVAILABILITY_CREATED', // Availability created
  TRAVELER_OFFER_SUBMITTED = 'TRAVELER_OFFER_SUBMITTED',     // Offer submitted
  TRAVELER_OFFER_WITHDRAWN = 'TRAVELER_OFFER_WITHDRAWN',       // Offer withdrawn
  
  // Matching events
  MATCH_LOCKED = 'MATCH_LOCKED',                           // Match locked
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',                       // Offer accepted
  OFFER_REJECTED = 'OFFER_REJECTED'                        // Offer rejected
}
```

### **Event Structure**
```json
{
  "id": "marketplace_event_1642412345678_abc123",
  "category": "BUYER_REQUEST",
  "type": "BUYER_REQUEST_CREATED",
  "timestamp": "2025-01-17T16:30:00.000Z",
  "data": {
    "requestId": "buyer_request_123",
    "buyerId": "buyer-123",
    "metadata": {
      "category": "electronics",
      "destinationCountry": "USA"
    }
  },
  "severity": "LOW"
}
```

---

## 🔧 **CONFIGURATION**

### **Environment Variables**
```bash
# Request and offer timing
MARKETPLACE_BUYER_REQUEST_TTL_HOURS=168        # 7 days default
MARKETPLACE_OFFER_TTL_HOURS=72                # 3 days default

# Limits and constraints
MARKETPLACE_MAX_OFFERS_PER_REQUEST=10          # Maximum offers per request
MARKETPLACE_MAX_ACTIVE_REQUESTS_PER_BUYER=5     # Max active requests per buyer
MARKETPLACE_MAX_ACTIVE_AVAILABILITIES_PER_TRAVELER=3 # Max active availabilities per traveler

# Trust and matching
MARKETPLACE_MIN_TRUST_SCORE_FOR_MATCHING=50    # Minimum trust score for matching
MARKETPLACE_ALLOW_AUTO_MATCHING=false           # No automatic matching

# Features
MARKETPLACE_ENABLE_NOTIFICATIONS=true             # Enable notifications
MARKETPLACE_DEFAULT_CURRENCY=USD               # Default currency
```

### **Runtime Updates**
```typescript
import { reloadMarketplaceConfig } from '@mnbara/auction';

// Update configuration without restart
reloadMarketplaceConfig();

// New values take effect immediately
```

---

## 🚀 **INTEGRATION EXAMPLES**

### **1. Create Buyer Request**
```typescript
import { marketplaceService } from '@mnbara/auction';

const buyerRequest = {
  productDescription: 'MacBook Pro 16" M3 Pro',
  category: 'electronics',
  destinationCountry: 'UAE',
  currency: 'AED',
  maxBudget: 15000
};

const result = marketplaceService.createBuyerRequest(buyerRequest, 'buyer-456');

if (result.success) {
  console.log('Request created:', result.request.id);
  console.log('Expires at:', result.expiresAt);
}
```

### **2. Create Traveler Availability**
```typescript
const travelerAvailability = {
  route: {
    from: { country: 'UAE', city: 'Dubai' },
    to: { country: 'USA', city: 'New York' }
  },
  dates: {
    availableFrom: new Date('2025-02-01'),
    availableTo: new Date('2025-02-15'),
    flexibleDates: true
  },
  capacity: {
    maxWeight: 5,
    maxDimensions: { length: 40, width: 30, height: 20 },
    maxItems: 3
  },
  services: {
    canShop: true,
    canDeliver: true,
    canCustomsClear: true,
    canInsurance: true
  },
  pricing: {
    baseRate: 200,
    currency: 'AED'
  }
};

const result = marketplaceService.createTravelerAvailability(travelerAvailability, 'traveler-789');
```

### **3. Submit Traveler Offer**
```typescript
const travelerOffer = {
  requestId: 'buyer_request_123',
  proposedPrice: 800,
  currency: 'AED',
  deliveryDate: new Date('2025-02-05'),
  deliveryMethod: 'Express',
  terms: {
    canShop: true,
    canDeliver: true,
    canCustomsClear: true,
    canInsurance: true,
    insuranceIncluded: true,
    trackingIncluded: true,
    estimatedDeliveryTime: 5
  }
};

const result = marketplaceService.submitTravelerOffer(travelerOffer, 'traveler-789');
```

### **4. Accept Offer**
```typescript
const acceptResult = marketplaceService.acceptOffer(
  'buyer_request_123',    // Request ID
  'traveler_offer_456',  // Offer ID
  'buyer-456'            // Buyer ID
);

if (acceptResult.success) {
  console.log('Match created:', acceptResult.match.id);
  console.log('Final price:', acceptResult.match.finalPrice);
}
```

---

## 🛡️ **TRUST & SAFETY INTEGRATION**

### **Safety Features**
```typescript
import { marketplaceTrustSafetyService } from '@mnbara/auction';

// Check if user can create request
const eligibility = marketplaceTrustSafetyService.canUserCreateRequest('buyer-123', 'BUYER');

// Handle user flagged event
marketplaceTrustSafetyService.handleUserFlagged({
  userId: 'user-123',
  userType: 'BUYER',
  eventType: 'USER_FLAGGED',
  reason: 'Suspicious activity detected',
  severity: 'HIGH',
  timestamp: new Date(),
  relatedRequestId: 'buyer_request_456'
});

// Update trust score
marketplaceTrustSafetyService.handleTrustScoreUpdate(
  'user-123',
  'BUYER',
  85, // New score
  'Successful deliveries and positive feedback'
);
```

### **Trust Rules**
- ✅ **Minimum trust score enforcement** - Users below threshold restricted
- ✅ **Maximum active requests/offers** - Prevent spam and abuse
- ✅ **User flagging and suspension** - Automatic safety actions
- ✅ **Manual review triggers** - Suspicious activities flagged for review

---

## 📊 **MONITORING & STATISTICS**

### **Real-Time Tracking**
```typescript
const statistics = marketplaceService.getStatistics();
// Returns:
{
  totalBuyerRequests: 150,
  activeBuyerRequests: 25,
  totalTravelerAvailabilities: 80,
  activeTravelerAvailabilities: 15,
  totalOffers: 45,
  pendingOffers: 12,
  totalMatches: 20,
  activeMatches: 8,
  averageResponseTime: 2.5,
  successRate: 0.85,
  topDestinations: [
    { country: 'USA', count: 45 },
    { country: 'UAE', count: 32 }
  ],
  topCategories: [
    { category: 'electronics', count: 60 },
    { category: 'fashion', count: 25 }
  ]
}
```

### **Health Monitoring**
```typescript
// Health check returns system status
GET /api/v1/auction/marketplace/health
// Returns:
{
  status: 'healthy',
  timestamp: '2025-01-17T16:30:00.000Z',
  statistics: {
    totalBuyerRequests: 150,
    activeBuyerRequests: 25,
    totalTravelerAvailabilities: 80,
    totalMatches: 20
  }
}
```

---

## 🧪 **TESTING COVERAGE**

### **Comprehensive Test Suite**
- ✅ **Buyer Journey** - Request creation, validation, expiration, matching
- ✅ **Traveler Journey** - Availability creation, offer submission, state management
- ✅ **Matching & State Rules** - Offer acceptance, rejection, state transitions
- ✅ **Event Logging** - All mandatory events logged correctly
- ✅ **Trust & Safety** - User restrictions, safety rules, score updates
- ✅ **Statistics Tracking** - Accurate metrics and reporting
- ✅ **Error Handling** - Graceful failure handling and validation
- ✅ **Configuration** - Runtime updates and validation
- ✅ **Data Retrieval** - All getter methods tested
- ✅ **Multiple Users** - Independent handling of multiple buyers and travelers

### **Test Execution**
```bash
cd backend/services/auction
npm test -- Marketplace.test.ts
```

---

## 📋 **SUMMARY**

The Marketplace Core Journey system provides:

✅ **Buyer Journey** - Complete request → wait → match flow with state management  
✅ **Traveler Journey** - Availability → offers flow with intelligent matching  
✅ **Matching & State Rules** - Backend-only state transitions with proper validation  
✅ **Admin Visibility** - READ ONLY access with complete audit trail  
✅ **Mandatory Event Logging** - All actions logged with append-only guarantee  
✅ **Trust & Safety Integration** - Comprehensive safety rules and user protection  
✅ **Configuration Management** - Environment-based configuration for flexibility  
✅ **Security First** - Multiple layers of protection and validation  
✅ **Production Ready** - Comprehensive testing and monitoring  

**Perfect for**: Cross-border auction + delivery platforms requiring core marketplace functionality with buyer-traveler matching capabilities.

**Status**: ✅ **COMPLETE** - Ready for production integration with Mnbara Platform auction service.
