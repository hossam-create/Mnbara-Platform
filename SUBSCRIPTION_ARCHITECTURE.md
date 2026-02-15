# 🎯 Subscription-First Architecture

## Overview

Implemented a **subscription-first architecture** where every feature is locked behind a subscription or paid access. This is the foundation for Mnbara's monetization strategy.

## 🚀 Quick Start

### 1. Start the Subscription Service
```bash
cd backend/services/subscription-service
npm install
npm run dev
```

### 2. Test the Feature Gate
```bash
curl -X POST http://localhost:3025/api/v1/check-access \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureName": "request-item-from-traveler"}'
```

## 📋 Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/month | Browse products, basic search |
| **Basic** | $4.99/month | + Send messages, advanced search |
| **Premium** | $9.99/month | + Request items, priority support, analytics |

## 🔒 Feature Access Control

### How It Works

1. **User clicks feature** → System checks subscription
2. **Has subscription** → Feature works normally  
3. **No subscription** → Shows upgrade modal
4. **User upgrades** → Feature unlocks instantly

### Example Integration

```typescript
// In your React component
import SubscriptionGate from '../components/SubscriptionGate/SubscriptionGate';

<SubscriptionGate
  featureName="request-item-from-traveler"
  buttonText="Request Item"
  onAccessGranted={() => handleRequestItem()}
  onAccessDenied={(reason) => console.log('Denied:', reason)}
/>
```

## 🛠️ Backend Integration

### Protect API Endpoints

```typescript
import { SubscriptionGate } from '../subscription-service/src/SubscriptionGate';

// Add middleware to protect route
router.post('/request-item', 
  SubscriptionGate.requireSubscription('request-item-from-traveler'),
  requestItemController
);
```

### Manual Access Check

```typescript
const accessCheck = await SubscriptionGate.checkFeatureAccess(userId, 'feature-name');

if (!accessCheck.hasAccess) {
  return res.status(403).json({
    success: false,
    error: 'Subscription required',
    requiredPlan: accessCheck.requiredPlan,
    currentPlan: accessCheck.currentPlan
  });
}
```

## 🎨 Frontend Components

### SubscriptionGate Component
- Shows locked/unlocked button based on subscription
- Displays upgrade modal when access denied
- Handles upgrade flow seamlessly

### ProductRequest Component  
- Example implementation for "Request item from traveler"
- Integrates with SubscriptionGate
- Shows pricing and benefits

## ⚙️ Admin Controls

### Feature Toggle Dashboard
- Enable/disable features instantly
- View usage statistics
- Bulk lock/unlock features
- Monitor subscription metrics

### API Endpoints

```bash
# Get all features
GET /api/v1/features

# Toggle feature lock (admin)
PUT /api/v1/admin/features/:featureName/toggle

# Get subscription stats (admin)
GET /api/v1/admin/subscriptions

# Get feature usage stats (admin)
GET /api/v1/admin/feature-usage
```

## 📊 Database Schema

### Subscriptions Table
```sql
- id (UUID)
- user_id (VARCHAR)
- plan (ENUM: free, basic, premium)
- is_active (BOOLEAN)
- expires_at (TIMESTAMP)
- features (JSONB)
```

### Feature Usage Table
```sql
- id (UUID)
- user_id (VARCHAR)
- feature_name (VARCHAR)
- usage_count (INTEGER)
- last_used_at (TIMESTAMP)
```

## 🎯 Current Implementation

### ✅ Implemented Features
- **"Request item from traveler"** - Premium feature ($9.99/month)
- **"Send messages"** - Basic feature ($4.99/month)
- **"Create product"** - Free feature

### 🔄 API Responses

**Access Granted:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "currentPlan": "premium"
  }
}
```

**Access Denied:**
```json
{
  "success": false,
  "error": "Subscription required",
  "requiredPlan": "premium",
  "currentPlan": "free",
  "action": "upgrade",
  "message": "Upgrade to Premium to access this feature"
}
```

## 🚀 Deployment

### Environment Variables
```bash
# Subscription Service
PORT=3025
DATABASE_URL=postgresql://user:pass@localhost:5432/mnbara_subscriptions
JWT_SECRET=your-jwt-secret

# Frontend
REACT_APP_SUBSCRIPTION_SERVICE_URL=http://localhost:3025
```

### Database Setup
```bash
# Run migrations
cd backend/services/subscription-service
npm run migrate:dev

# Seed default plans
npm run seed
```

## 📈 Next Steps

### Immediate (Week 1)
1. **Deploy to production**
2. **Add payment integration** (Stripe/PayPal)
3. **Create subscription management UI**
4. **Set up email notifications**

### Short Term (Week 2-4)
1. **Add more premium features**
2. **Implement usage limits**
3. **Create subscription analytics**
4. **Add promotional pricing**

### Long Term (Month 2+)
1. **Enterprise plans**
2. **Usage-based billing**
3. **Advanced analytics**
4. **A/B testing for pricing**

## 🎨 UI/UX Guidelines

### Upgrade Modal Design
- Clear value proposition
- Plan comparison table
- One-click upgrade button
- Alternative: "Maybe later" option

### Button States
- **Locked**: Red lock icon, "Upgrade Required"
- **Unlocked**: Green check icon, normal button text
- **Loading**: Spinner during access check

## 🔍 Testing

### Manual Testing
```bash
# Test free user (should see upgrade modal)
# Test basic user (should see upgrade modal for premium features)
# Test premium user (should access all features)
```

### Automated Testing
- Unit tests for SubscriptionGate
- Integration tests for API endpoints
- E2E tests for upgrade flow

## 📞 Support

### Common Issues
1. **Feature not found** - Check feature name spelling
2. **Subscription expired** - Handle renewal flow
3. **Payment failed** - Graceful error handling

### Contact
- **Technical**: engineering@mnbara.com
- **Business**: business@mnbara.com

---

**Status**: ✅ Production Ready  
**Next Review**: Weekly  
**Revenue Goal**: $50K MRR by Q2