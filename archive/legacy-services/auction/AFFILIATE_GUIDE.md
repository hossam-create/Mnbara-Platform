# Affiliate & Referral Guide

## 🎯 **TASK 6 — Affiliate & Referral Core Flow**

### **ABSOLUTE RULES**
- ✅ **Frontend has ZERO authority**
- ✅ **Affiliate logic is BACKEND ONLY**
- ✅ **NO commission payout logic**
- ✅ **NO wallet mutations**
- ✅ **NO balance calculations**
- ✅ **Tracking + attribution ONLY**
- ✅ **Every action MUST be event-logged**
- ✅ **Read-only visibility for users and admin**

---

## 👤️ **PART 1 — AFFILIATE IDENTITY**

### **Any USER can become an AFFILIATE**
```typescript
// User requests to become affiliate
const affiliateRequest = {
  userId: 'user-123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const result = affiliateService.createAffiliateProfile(affiliateRequest);
```

### **Backend creates AFFILIATE_PROFILE**
- ✅ **affiliateId** - Unique identifier for affiliate
- ✅ **linked userId** - Links to existing user account
- ✅ **status: ACTIVE / SUSPENDED** - Backend-controlled activation only
- ✅ **trust flags** - From Trust & Safety integration

### **No approval UI**
- ✅ **Backend-controlled activation only** - No frontend approval interface
- ✅ **Auto-activation configurable** - Via environment variables

### **Events (MANDATORY)**
- ✅ **AFFILIATE_PROFILE_CREATED** - When user becomes affiliate
- ✅ **AFFILIATE_SUSPENDED** - When affiliate is suspended

---

## 🔗 **PART 2 — REFERRAL LINKS**

### **Affiliate can generate referral links for**
```typescript
// Generate referral link for product
const referralLinkRequest = {
  targetType: ReferralTargetType.PRODUCT,
  targetId: 'product-123',
  targetMetadata: {
    targetTitle: 'iPhone 13 Pro Max',
    targetUrl: 'https://example.com/product/iphone-13-pro-max',
    targetImageUrl: 'https://example.com/images/iphone-13.jpg',
    targetDescription: 'Latest iPhone with advanced features'
  },
  expiresAt: new Date('2025-12-31') // Optional expiration
};

const result = affiliateService.createReferralLink(referralLinkRequest, 'affiliate-123');
```

### **Backend generates**
- ✅ **referralCode (immutable)** - 8-character alphanumeric code
- ✅ **targetType** - PRODUCT, AUCTION, STORE, CATEGORY
- ✅ **targetId** - Reference to target entity

### **Referral links are READ ONLY once created**
- ✅ **No modification allowed** - Links cannot be edited after creation
- ✅ **Immutable referralCode** - Code never changes
- ✅ **Status management only** - ACTIVE/INACTIVE/EXPIRED

### **Events (MANDATORY)**
- ✅ **REFERRAL_LINK_CREATED** - When referral link is generated

---

## 📊 **PART 3 — ATTRIBUTION TRACKING (NO MONEY)**

### **Track events**
```typescript
// Track click event
const attributionRequest = {
  referralCode: 'ABC12345',
  actionType: ReferralActionType.CLICK,
  user: {
    id: 'user-456',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    sessionId: 'session-789'
  }
};

const result = affiliateService.trackAttribution(attributionRequest);
```

### **Attribution Rules**
- ✅ **Last-click attribution** - Most recent click gets credit
- ✅ **Attribution window configurable** - Default 30 days
- ✅ **No override from frontend** - Backend-only attribution logic

### **Store attribution records**
```typescript
const attribution = {
  affiliateId: 'affiliate-123',
  target: {
    type: ReferralTargetType.PRODUCT,
    id: 'product-123',
    title: 'iPhone 13 Pro Max'
  },
  action: {
    type: ReferralActionType.CLICK,
    timestamp: new Date(),
    metadata: { /* additional data */ }
  },
  user: {
    id: 'user-456',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session-789'
  },
  attribution: {
    attributed: false,
    attributionWindow: 30,
    lastClickAt: new Date(),
    clickCount: 1
  }
};
```

### **Events (MANDATORY)**
- ✅ **REFERRAL_CLICKED** - When referral link is clicked
- ✅ **REFERRAL_ATTRIBUTED** - When attribution is recorded

---

## 💰 **PART 4 — COMMISSION SIGNALS (NO PAYOUT)**

### **Backend emits COMMISSION_ELIGIBLE signal**
```typescript
// Commission signal generated automatically for eligible actions
const commissionSignal = {
  affiliateId: 'affiliate-123',
  referralCode: 'ABC12345',
  target: {
    type: ReferralTargetType.PRODUCT,
    id: 'product-123',
    title: 'iPhone 13 Pro Max'
  },
  action: {
    type: ReferralActionType.PURCHASE_COMPLETED,
    timestamp: new Date(),
    amount: 999.99, // Reference only, no calculation
    currency: 'USD'
  },
  commission: {
    percentage: 5.0, // Percentage only, no amount calculation
    eligible: true,
    reason: 'Commission eligible for purchase completed'
  }
};
```

### **Commission settlement happens later**
- ✅ **Percentage only** - No amount calculation in this phase
- ✅ **No wallet impact** - Settlement handled in Phase 7+
- ✅ **Signal-only approach** - Emits eligibility signals for later processing

### **Events (MANDATORY)**
- ✅ **COMMISSION_ELIGIBLE** - When commission eligibility is determined

---

## 👁️ **PART 5 — USER & ADMIN VISIBILITY (READ ONLY)**

### **User Visibility**
```typescript
// User can view own dashboard
const dashboard = affiliateService.getAffiliateDashboard('affiliate-123');

// User can see:
- View own referral links
- View clicks & attribution counts
- NO earnings shown (read-only)
```

### **Admin Visibility**
```typescript
// Admin can view all data (read-only)
GET /api/v1/auction/affiliate/admin/profiles
GET /api/v1/auction/affiliate/admin/referral-links
GET /api/v1/auction/affiliate/admin/attributions
GET /api/v1/auction/affiliate/admin/commission-signals
GET /api/v1/auction/affiliate/admin/statistics
GET /api/v1/auction/affiliate/admin/events

// Admin can see:
- View affiliates
- View attribution stats
- View flagged affiliates
- NO editing
- NO payout actions
```

---

## 🔧 **CONFIGURATION**

### **Environment Variables**
```bash
# Attribution settings
AFFILIATE_ATTRIBUTION_WINDOW_DAYS=30
AFFILIATE_MAX_ACTIVE_REFERRAL_LINKS=50

# Target types
AFFILIATE_SUPPORTED_TARGET_TYPES=PRODUCT,AUCTION,STORE,CATEGORY

# Affiliate activation
AFFILIATE_AUTO_ACTIVATE=true
AFFILIATE_REQUIRE_TRUST_SCORE=true
AFFILIATE_MINIMUM_TRUST_SCORE=50

# Commission eligibility rules
AFFILIATE_COMMISSION_PURCHASE_COMPLETED=true
AFFILIATE_COMMISSION_BID_PLACED=true
AFFILIATE_COMMISSION_VIEW=false
AFFILIATE_COMMISSION_CLICK=false

# Commission rates (percentages)
AFFILIATE_COMMISSION_PRODUCT_PURCHASE=5.0
AFFILIATE_COMMISSION_AUCTION_PURCHASE=6.0
AFFILIATE_COMMISSION_STORE_PURCHASE=4.0
AFFILIATE_COMMISSION_CATEGORY_PURCHASE=3.0
```

### **Runtime Updates**
```typescript
import { reloadAffiliateConfig } from '@mnbara/auction';

// Update configuration without restart
reloadAffiliateConfig();

// New values take effect immediately
```

---

## 🚀 **INTEGRATION EXAMPLES**

### **1. Create Affiliate Profile**
```typescript
import { affiliateService } from '@mnbara/auction';

const affiliateRequest = {
  userId: 'user-123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
};

const result = affiliateService.createAffiliateProfile(affiliateRequest);

if (result.success) {
  console.log('Affiliate profile created:', result.affiliateProfile.affiliateId);
  console.log('Status:', result.affiliateProfile.status);
}
```

### **2. Generate Referral Link**
```typescript
const referralLinkRequest = {
  targetType: ReferralTargetType.PRODUCT,
  targetId: 'product-123',
  targetMetadata: {
    targetTitle: 'Premium Headphones',
    targetUrl: 'https://example.com/product/headphones'
  }
};

const result = affiliateService.createReferralLink(referralLinkRequest, 'affiliate-123');

if (result.success) {
  console.log('Referral code:', result.referralLink.referralCode);
  console.log('Referral URL:', `https://example.com/ref/${result.referralLink.referralCode}`);
}
```

### **3. Track Attribution**
```typescript
const attributionRequest = {
  referralCode: 'ABC12345',
  actionType: ReferralActionType.PURCHASE_COMPLETED,
  user: {
    id: 'user-456',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  },
  metadata: {
    purchaseAmount: 299.99,
    currency: 'USD',
    orderId: 'order-789'
  }
};

const result = affiliateService.trackAttribution(attributionRequest);

if (result.success) {
  console.log('Attribution tracked:', result.attribution.id);
  if (result.commissionSignal) {
    console.log('Commission eligible:', result.commissionSignal.commission.eligible);
    console.log('Commission rate:', result.commissionSignal.commission.percentage + '%');
  }
}
```

### **4. Get Affiliate Dashboard**
```typescript
const dashboard = affiliateService.getAffiliateDashboard('affiliate-123');

if (dashboard) {
  console.log('Total referral links:', dashboard.overview.totalReferralLinks);
  console.log('Total clicks:', dashboard.overview.totalClicks);
  console.log('Total attributions:', dashboard.overview.totalAttributions);
  console.log('Commission signals:', dashboard.overview.totalCommissionSignals);
  console.log('Click-through rate:', dashboard.performance.clickThroughRate + '%');
}
```

---

## 🛡️ **TRUST & SAFETY INTEGRATION**

### **Safety Features**
```typescript
import { affiliateTrustSafetyService } from '@mnbara/auction';

// Check if user can become affiliate
const eligibility = affiliateTrustSafetyService.canUserBecomeAffiliate('user-123');

// Handle affiliate flagged event
affiliateTrustSafetyService.handleAffiliateFlagged({
  affiliateId: 'affiliate-123',
  userId: 'user-123',
  eventType: 'AFFILIATE_FLAGGED',
  reason: 'Suspicious activity detected',
  severity: 'HIGH',
  timestamp: new Date()
});

// Update trust score
affiliateTrustSafetyService.handleAffiliateTrustScoreUpdate(
  'affiliate-123',
  'user-123',
  85, // New score
  'Successful referrals and positive feedback'
);
```

### **Trust Rules**
- ✅ **Minimum trust score enforcement** - Users below threshold restricted
- ✅ **Maximum active referral links** - Prevent spam and abuse
- ✅ **Suspicious activity detection** - Automated safety actions
- ✅ **Manual review triggers** - Complex cases flagged for human review

---

## 📊 **MONITORING & STATISTICS**

### **Real-Time Tracking**
```typescript
const statistics = affiliateService.getStatistics();
// Returns:
{
  totalAffiliates: 100,
  activeAffiliates: 85,
  suspendedAffiliates: 15,
  totalReferralLinks: 500,
  activeReferralLinks: 450,
  totalAttributions: 2500,
  totalClicks: 10000,
  totalViews: 50000,
  totalCommissionSignals: 250,
  eligibleCommissions: 200,
  topAffiliates: [
    {
      affiliateId: 'affiliate-1',
      userId: 'user-1',
      totalClicks: 1000,
      totalAttributions: 50,
      totalCommissionSignals: 25
    }
  ],
  topTargetTypes: [
    { targetType: 'PRODUCT', count: 300 },
    { targetType: 'AUCTION', count: 150 },
    { targetType: 'STORE', count: 40 },
    { targetType: 'CATEGORY', count: 10 }
  ],
  attributionBreakdown: {
    clicks: 10000,
    views: 50000,
    bidPlaced: 1000,
    purchaseCompleted: 250
  }
}
```

### **Health Monitoring**
```typescript
// Health check returns system status
GET /api/v1/auction/affiliate/health
// Returns:
{
  status: 'healthy',
  timestamp: '2025-01-17T16:30:00.000Z',
  statistics: {
    totalAffiliates: 100,
    activeAffiliates: 85,
    totalReferralLinks: 500,
    activeReferralLinks: 450,
    totalAttributions: 2500,
    totalCommissionSignals: 250
  }
}
```

---

## 🧪 **TESTING COVERAGE**

### **Comprehensive Test Suite**
- ✅ **Affiliate Identity** - Profile creation, validation, suspension, activation
- ✅ **Referral Links** - Link generation, uniqueness, expiration, status management
- ✅ **Attribution Tracking** - Click, view, bid, purchase tracking with proper attribution
- ✅ **Commission Signals** - Eligibility determination, percentage calculation, signal generation
- ✅ **User Visibility** - Dashboard access, performance metrics, read-only guarantees
- ✅ **Admin Visibility** - Complete data access without modification capabilities
- ✅ **Event Logging** - All mandatory events logged correctly
- ✅ **Trust & Safety Integration** - User restrictions, safety rules, score updates
- ✅ **Statistics Tracking** - Accurate metrics and reporting
- ✅ **Configuration** - Runtime updates and validation
- ✅ **Error Handling** - Graceful failure handling and edge cases
- ✅ **Data Retrieval** - All getter methods tested
- ✅ **Multiple Users** - Independent handling of multiple affiliates

### **Test Execution**
```bash
cd backend/services/auction
npm test -- Affiliate.test.ts
```

---

## 📋 **SUMMARY**

The Affiliate & Referral system provides:

✅ **Affiliate Identity** - Complete user-to-affiliate transition with backend control  
✅ **Referral Links** - Immutable code generation for multiple target types  
✅ **Attribution Tracking** - Last-click attribution with configurable windows  
✅ **Commission Signals** - Percentage-only eligibility signals for later settlement  
✅ **User Visibility** - Read-only dashboard with performance metrics  
✅ **Admin Visibility** - Complete read-only access without modification capabilities  
✅ **Mandatory Event Logging** - All actions logged with append-only guarantee  
✅ **Trust & Safety Integration** - Comprehensive user protection and safety enforcement  
✅ **Configuration Management** - Environment-based configuration for flexibility  
✅ **Security First** - Multiple layers of protection and validation  
✅ **Production Ready** - Comprehensive testing and monitoring  

**Perfect for**: Marketplaces requiring affiliate and referral systems with tracking and attribution capabilities while maintaining security and trust.

**Status**: ✅ **COMPLETE** - Ready for production integration with Mnbara Platform auction service.
