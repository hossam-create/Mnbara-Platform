# Role Expansion Guide

## 🎯 **TASK 5 — Buyer → Seller → Storefront Transition (Role Expansion)**

### **ABSOLUTE RULES**
- ✅ **Frontend has ZERO authority**
- ✅ **Role transitions are BACKEND ONLY**
- ✅ **No wallet, escrow, or payout mutations here**
- ✅ **Seller identity is SEPARATE from buyer activity**
- ✅ **Every transition is logged**
- ✅ **No silent role upgrades**

---

## 🛒️ **PART 1 — BUYER → SELLER ACTIVATION**

### **Buyer Action**
```typescript
// Buyer requests to become Seller
const sellerApplication = {
  displayName: 'John Doe Store',
  businessName: 'John Doe Enterprises',
  country: 'USA',
  city: 'New York',
  fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
  description: 'Professional seller with 5 years experience',
  contactEmail: 'john@example.com',
  phone: '+1234567890',
  website: 'https://johndoe.com',
  socialLinks: {
    facebook: 'https://facebook.com/johndoe',
    instagram: 'https://instagram.com/johndoe'
  }
};

// Submits basic seller profile info
const result = roleExpansionService.createSellerApplication(sellerApplication, 'buyer-123');
```

### **Backend Responsibilities**
- ✅ **Create SELLER_PROFILE entity** - Independent from user entity
- ✅ **Link seller profile to existing USER** - Maintains buyer role
- ✅ **Seller profile has independent trust metrics** - Separate from buyer trust score
- ✅ **Buyer role remains intact** - User can be both buyer and seller

### **States**
```typescript
enum SellerProfileState {
  SELLER_PENDING = 'SELLER_PENDING',    // Application submitted, awaiting approval
  SELLER_ACTIVE = 'SELLER_ACTIVE',      // Approved and active
  SELLER_SUSPENDED = 'SELLER_SUSPENDED' // Suspended due to violations
}
```

### **Events (MANDATORY)**
- ✅ **SELLER_APPLICATION_CREATED** - When buyer submits seller application
- ✅ **SELLER_ACTIVATED** - When admin approves seller profile
- ✅ **SELLER_SUSPENDED** - When seller is suspended

---

## 📊 **PART 2 — SELLER DASHBOARD (READ ONLY FINANCIAL)**

### **Seller Capabilities**
```typescript
const sellerDashboard = roleExpansionService.getSellerDashboard('seller-123');

// Seller can:
- Create auctions
- View listings
- View sales status
- View settlements (READ ONLY)

// Seller CANNOT:
- Access wallet mutations
- Control payouts
- Release escrow
```

### **Backend Enforcement**
- ✅ **No direct access to wallet mutation** - Financial safety maintained
- ✅ **No payout control** - Payouts handled by separate system
- ✅ **No escrow release** - Escrow managed by settlement system

### **Events (MANDATORY)**
- ✅ **SELLER_DASHBOARD_VIEWED** - When seller accesses dashboard
- ✅ **SELLER_LISTING_CREATED** - When seller creates new listing

---

## 🏪 **PART 3 — EXTERNAL SELLER / STORE MODE**

### **External Seller**
```typescript
// External Seller can register as SELLER without buyer history
const storeCreation = {
  ownerId: 'external-seller-123',
  name: 'Tech Gadgets Store',
  slug: 'tech-gadgets',
  description: 'Premium electronics and gadgets',
  country: 'USA',
  contactEmail: 'store@techgadgets.com',
  fulfillmentType: FulfillmentMethod.BOTH
};

const result = roleExpansionService.createStore(storeCreation);
```

### **Store Rules**
- ✅ **Store ≠ User** - Store is separate entity from user
- ✅ **Store has its own trust score** - Independent from user trust scores
- ✅ **Listings belong to Store, not directly to User** - Store owns listings

### **Events (MANDATORY)**
- ✅ **STORE_CREATED** - When external seller creates store
- ✅ **STORE_ACTIVATED** - When store is approved and activated
- ✅ **STORE_LISTING_CREATED** - When store creates new listing

---

## 📦 **PART 4 — SHIPPING & FULFILLMENT SIGNALS (NO LOGIC)**

### **Seller Defines Fulfillment Method**
```typescript
const fulfillmentMethod = {
  sellerId: 'seller-123',
  listingId: 'listing-456',
  method: FulfillmentMethod.DIRECT_SHIPPING, // or TRAVELER_DELIVERY or BOTH
  configuration: {
    directShipping: {
      supportedCountries: ['USA', 'Canada'],
      shippingZones: [
        {
          zone: 'North America',
          countries: ['USA', 'Canada'],
          cost: 10,
          estimatedDays: 5
        }
      ],
      freeShippingThreshold: 100
    },
    travelerDelivery: {
      maxDistance: 100,
      supportedCountries: ['USA'],
      deliveryTime: 3
    }
  },
  restrictions: {
    prohibitedItems: ['weapons', 'hazardous materials'],
    restrictedCategories: ['adult'],
    maxWeight: 50,
    maxDimensions: {
      length: 100,
      width: 80,
      height: 60
    }
  }
};

const result = roleExpansionService.createFulfillmentMethodSignal(fulfillmentMethod);
```

### **NO Logic Implementation**
- ✅ **NO shipping cost calculation** - Only signals, no calculations
- ✅ **NO label generation** - No shipping labels created
- ✅ **NO logistics automation** - No automated shipping processes
- ✅ **Signals only** - Used later by payments/fulfillment systems

### **Events**
- ✅ **FULFILLMENT_METHOD_SELECTED** - When seller defines fulfillment method

---

## 👁️ **PART 5 — ADMIN VISIBILITY (READ ONLY)**

### **Admin Capabilities**
```typescript
// View seller profiles
GET /api/v1/auction/role-expansion/admin/seller-profiles
GET /api/v1/auction/role-expansion/admin/seller-profiles/:sellerId

// View stores
GET /api/v1/auction/role-expansion/admin/stores
GET /api/v1/auction/role-expansion/admin/stores/:storeId

// View listings
GET /api/v1/auction/role-expansion/admin/listings

// View seller status
GET /api/v1/auction/role-expansion/admin/statistics
GET /api/v1/auction/role-expansion/admin/events
```

### **READ ONLY Guarantees**
- ✅ **View seller profiles** - Complete visibility without modification
- ✅ **View stores** - Full store data access
- ✅ **View listings** - Complete listing visibility
- ✅ **View seller status** - Status and trust metrics
- ✅ **NO editing** - Cannot modify seller profiles or stores
- ✅ **NO role forcing** - Cannot force role transitions
- ✅ **NO financial actions** - Cannot access wallet, escrow, or payouts

---

## 🔧 **CONFIGURATION**

### **Environment Variables**
```bash
# Approval requirements
ROLE_EXPANSION_SELLER_APPROVAL_REQUIRED=true
ROLE_EXPANSION_STORE_APPROVAL_REQUIRED=true

# Trust score requirements
ROLE_EXPANSION_MIN_BUYER_TRUST_SCORE=50

# Default capabilities
ROLE_EXPANSION_SELLER_CAN_CREATE_AUCTIONS=true
ROLE_EXPANSION_SELLER_CAN_CREATE_LISTINGS=true
ROLE_EXPANSION_SELLER_MAX_ACTIVE_LISTINGS=50

ROLE_EXPANSION_STORE_CAN_CREATE_AUCTIONS=true
ROLE_EXPANSION_STORE_CAN_CREATE_LISTINGS=true
ROLE_EXPANSION_STORE_MAX_ACTIVE_LISTINGS=100

# Auto-activation
ROLE_EXPANSION_AUTO_ACTIVATE_SELLERS=false
ROLE_EXPANSION_AUTO_ACTIVATE_STORES=false

# Verification requirements
ROLE_EXPANSION_REQUIRE_SELLER_VERIFICATION=true
ROLE_EXPANSION_REQUIRE_STORE_VERIFICATION=true

# Supported fulfillment methods
ROLE_EXPANSION_SUPPORTED_FULFILLMENT_METHODS=TRAVELER_DELIVERY,DIRECT_SHIPPING,BOTH
```

### **Runtime Updates**
```typescript
import { reloadRoleExpansionConfig } from '@mnbara/auction';

// Update configuration without restart
reloadRoleExpansionConfig();

// New values take effect immediately
```

---

## 🚀 **INTEGRATION EXAMPLES**

### **1. Create Seller Application**
```typescript
import { roleExpansionService } from '@mnbara/auction';

const sellerApplication = {
  displayName: 'Professional Seller',
  businessName: 'Professional Business',
  country: 'USA',
  fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
  contactEmail: 'seller@example.com'
};

const result = roleExpansionService.createSellerApplication(sellerApplication, 'buyer-123');

if (result.success) {
  console.log('Seller application created:', result.sellerProfile.id);
  console.log('Requires verification:', result.requiresVerification);
}
```

### **2. Create Store**
```typescript
const storeCreation = {
  ownerId: 'external-seller-123',
  name: 'Premium Store',
  slug: 'premium-store',
  description: 'Premium products and services',
  country: 'USA',
  contactEmail: 'store@premium.com',
  fulfillmentType: FulfillmentMethod.BOTH
};

const result = roleExpansionService.createStore(storeCreation);

if (result.success) {
  console.log('Store created:', result.store.id);
  console.log('Requires verification:', result.requiresVerification);
}
```

### **3. Get Seller Dashboard**
```typescript
const dashboard = roleExpansionService.getSellerDashboard('seller-123');

if (dashboard) {
  console.log('Total listings:', dashboard.overview.totalListings);
  console.log('Active listings:', dashboard.overview.activeListings);
  console.log('Total sales:', dashboard.overview.totalSales);
  console.log('Total revenue:', dashboard.overview.totalRevenue);
  console.log('Average order value:', dashboard.overview.averageOrderValue);
}
```

### **4. Create Fulfillment Method Signal**
```typescript
const fulfillmentMethod = {
  sellerId: 'seller-123',
  listingId: 'listing-456',
  method: FulfillmentMethod.DIRECT_SHIPPING,
  configuration: {
    directShipping: {
      supportedCountries: ['USA', 'Canada'],
      shippingZones: [
        {
          zone: 'Domestic',
          countries: ['USA'],
          cost: 5,
          estimatedDays: 3
        }
      ]
    }
  }
};

const result = roleExpansionService.createFulfillmentMethodSignal(fulfillmentMethod);

if (result.success) {
  console.log('Fulfillment method signal created:', result.fulfillmentMethod.id);
}
```

---

## 🛡️ **TRUST & SAFETY INTEGRATION**

### **Safety Features**
```typescript
import { roleExpansionTrustSafetyService } from '@mnbara/auction';

// Check if user can create seller profile
const eligibility = roleExpansionTrustSafetyService.canUserCreateSellerProfile('user-123');

// Handle user flagged event
roleExpansionTrustSafetyService.handleSellerFlagged({
  userId: 'user-123',
  userType: 'SELLER',
  eventType: 'SELLER_FLAGGED',
  reason: 'Suspicious activity detected',
  severity: 'HIGH',
  timestamp: new Date(),
  relatedSellerId: 'seller-123'
});

// Update trust score
roleExpansionTrustSafetyService.handleSellerTrustScoreUpdate(
  'seller-123',
  'user-123',
  85, // New score
  'Successful deliveries and positive feedback'
);
```

### **Trust Rules**
- ✅ **Minimum trust score enforcement** - Users below threshold restricted
- ✅ **Maximum active listings** - Prevent spam and abuse
- ✅ **User flagging and suspension** - Automatic safety actions
- ✅ **Manual review triggers** - Suspicious activities flagged for review

---

## 📊 **MONITORING & STATISTICS**

### **Real-Time Tracking**
```typescript
const statistics = roleExpansionService.getStatistics();
// Returns:
{
  totalUsers: 1000,
  totalBuyers: 800,
  totalSellers: 200,
  totalExternalSellers: 50,
  totalStores: 50,
  activeSellers: 150,
  activeStores: 40,
  pendingSellerApplications: 10,
  pendingStoreApplications: 5,
  suspendedSellers: 5,
  suspendedStores: 2,
  averageSellerTrustScore: 75,
  averageStoreTrustScore: 80,
  topCountries: [
    { country: 'USA', sellerCount: 120, storeCount: 30 },
    { country: 'UK', sellerCount: 50, storeCount: 15 }
  ],
  fulfillmentMethods: {
    travelerDelivery: 80,
    directShipping: 150,
    both: 20
  }
}
```

### **Health Monitoring**
```typescript
// Health check returns system status
GET /api/v1/auction/role-expansion/health
// Returns:
{
  status: 'healthy',
  timestamp: '2025-01-17T16:30:00.000Z',
  statistics: {
    totalSellers: 200,
    activeSellers: 150,
    totalStores: 50,
    activeStores: 40,
    pendingSellerApplications: 10,
    pendingStoreApplications: 5
  }
}
```

---

## 🧪 **TESTING COVERAGE**

### **Comprehensive Test Suite**
- ✅ **Buyer → Seller Activation** - Application creation, validation, approval, suspension
- ✅ **Seller Dashboard** - READ ONLY financial access, dashboard functionality
- ✅ **External Seller / Store Mode** - Store creation, slug uniqueness, ownership
- ✅ **Shipping & Fulfillment Signals** - Signal creation, validation, no logic enforcement
- ✅ **Admin Visibility** - READ ONLY access, complete visibility without control
- ✅ **Event Logging** - All mandatory events logged correctly
- ✅ **Trust & Safety Integration** - User restrictions, safety rules, score updates
- ✅ **Statistics Tracking** - Accurate metrics and reporting
- ✅ **Configuration** - Runtime updates and validation
- ✅ **Error Handling** - Graceful failure handling and edge cases
- ✅ **Data Retrieval** - All getter methods tested
- ✅ **Multiple Users** - Independent handling of multiple sellers and stores

### **Test Execution**
```bash
cd backend/services/auction
npm test -- RoleExpansion.test.ts
```

---

## 📋 **SUMMARY**

The Role Expansion system provides:

✅ **Buyer → Seller Activation** - Complete application workflow with independent seller profiles  
✅ **Seller Dashboard** - READ ONLY financial access with full seller capabilities  
✅ **External Seller / Store Mode** - Store creation with independent trust metrics  
✅ **Shipping & Fulfillment Signals** - Signal-only system with no logic implementation  
✅ **Admin Visibility** - Complete READ ONLY access without modification capabilities  
✅ **Mandatory Event Logging** - All transitions logged with append-only guarantee  
✅ **Trust & Safety Integration** - Comprehensive user protection and safety enforcement  
✅ **Configuration Management** - Environment-based configuration for flexibility  
✅ **Security First** - Multiple layers of protection and validation  
✅ **Production Ready** - Comprehensive testing and monitoring  

**Perfect for**: Marketplaces requiring role expansion from buyer to seller with store capabilities while maintaining security and trust.

**Status**: ✅ **COMPLETE** - Ready for production integration with Mnbara Platform auction service.
