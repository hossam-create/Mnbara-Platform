# Customer ID System - API Reference Guide

**Service:** Customer ID Service  
**Base URL:** `/api/customer-id`  
**Port:** 3010  
**Language:** TypeScript  
**Database:** PostgreSQL with Prisma ORM

---

## 🔐 Authentication

All endpoints require authentication headers (to be implemented):
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📚 API Documentation

### 1. Loyalty APIs

#### Get Loyalty Info
```
GET /loyalty/:customerId
Response: {
  customerId: string
  points: number
  tier: string (bronze|silver|gold|platinum)
  joinDate: Date
  totalSpent: number
}
```

#### Get Loyalty Tiers
```
GET /loyalty/tiers/all
Response: Array<{
  name: string
  icon: string
  minPoints: number
  maxPoints: number
  benefits: string[]
  discount: number
}>
```

#### Add Points
```
POST /loyalty/:customerId/points
Body: {
  points: number
  reason: string
}
Response: { points: number, tier: string }
```

#### Redeem Points
```
POST /loyalty/:customerId/redeem
Body: {
  points: number
  rewardId: string
}
Response: { points: number, rewardId: string }
```

#### Get Tier Benefits
```
GET /loyalty/tier/:tier/benefits
Response: string[]
```

#### Get How to Earn
```
GET /loyalty/earn/methods
Response: Array<{
  icon: string
  title: string
  description: string
  points: number
}>
```

---

### 2. Referral APIs

#### Generate Referral Link
```
POST /referral/:customerId/generate-link
Response: {
  referralCode: string
  referralLink: string
  expiresAt: Date
}
```

#### Get Referral History
```
GET /referral/:customerId/history
Response: Array<{
  id: string
  referredCustomerId: string
  status: string
  rewardAmount: number
  createdAt: Date
}>
```

#### Get Referral Rewards
```
GET /referral/:customerId/rewards
Response: {
  totalRewards: number
  pendingRewards: number
  claimedRewards: number
}
```

#### Track Referral
```
POST /referral/:customerId/track
Body: {
  referralCode: string
  referredCustomerId: string
}
Response: { success: boolean, message: string }
```

#### Get Referral Stats
```
GET /referral/:customerId/stats
Response: {
  totalReferrals: number
  successfulReferrals: number
  totalRewards: number
  conversionRate: number
}
```

---

### 3. Segmentation APIs

#### Get Customer Segment
```
GET /segmentation/:customerId
Response: {
  segment: string (vip|regular|new|inactive|at-risk)
  segmentScore: number
  benefits: string[]
}
```

#### Get All Segments
```
GET /segmentation/all/segments
Response: Array<{
  id: string
  name: string
  description: string
  criteria: string[]
  benefits: string[]
}>
```

#### Get Segment Benefits
```
GET /segmentation/:segment/benefits
Response: string[]
```

#### Get Segment Stats
```
GET /segmentation/:segment/stats
Response: {
  totalCustomers: number
  averageSpent: number
  engagementRate: number
}
```

#### Update Customer Segment
```
PUT /segmentation/:customerId/update
Body: { segment: string }
Response: { segment: string, updatedAt: Date }
```

---

### 4. Offers APIs

#### Get Personalized Offers
```
GET /offers/:customerId
Response: Array<{
  id: string
  title: string
  description: string
  discountPercent: number
  validUntil: Date
}>
```

#### Apply Offer
```
POST /offers/:customerId/apply
Body: { offerId: string }
Response: { success: boolean, discount: number }
```

#### Get Offer History
```
GET /offers/:customerId/history
Response: Array<{
  id: string
  title: string
  appliedAt: Date
  discount: number
}>
```

#### Get Offer Details
```
GET /offers/:offerId/details
Response: {
  id: string
  title: string
  description: string
  discountPercent: number
  discountAmount: number
  validFrom: Date
  validUntil: Date
  terms: string[]
}
```

---

### 5. Analytics APIs

#### Get Customer Analytics
```
GET /analytics/:customerId
Response: {
  totalPurchases: number
  totalSpent: number
  averageOrderValue: number
  lastPurchaseDate: Date
  engagementScore: number
}
```

#### Get Purchase History
```
GET /analytics/:customerId/purchase-history
Response: Array<{
  id: string
  date: Date
  amount: number
  items: number
  category: string
}>
```

#### Get Spending Trends
```
GET /analytics/:customerId/spending-trends
Response: Array<{
  month: string
  amount: number
  itemCount: number
}>
```

#### Get Category Breakdown
```
GET /analytics/:customerId/category-breakdown
Response: Array<{
  category: string
  amount: number
  percentage: number
  itemCount: number
}>
```

#### Get Engagement Metrics
```
GET /analytics/:customerId/engagement
Response: {
  visitCount: number
  lastVisitDate: Date
  averageSessionDuration: number
  clickThroughRate: number
}
```

---

### 6. Notifications APIs

#### Get Notification Preferences
```
GET /notifications/:customerId/preferences
Response: {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  promotionalEmails: boolean
  orderUpdates: boolean
  loyaltyUpdates: boolean
}
```

#### Update Notification Preferences
```
PUT /notifications/:customerId/preferences
Body: {
  emailNotifications?: boolean
  smsNotifications?: boolean
  pushNotifications?: boolean
  promotionalEmails?: boolean
  orderUpdates?: boolean
  loyaltyUpdates?: boolean
}
Response: { success: boolean }
```

#### Get Notification History
```
GET /notifications/:customerId/history
Response: Array<{
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: Date
}>
```

#### Send Notification
```
POST /notifications/:customerId/send
Body: {
  title: string
  message: string
  type: string
}
Response: { success: boolean, notificationId: string }
```

---

### 7. Support Tickets APIs

#### Create Support Ticket
```
POST /support/:customerId/ticket
Body: {
  subject: string
  description: string
  category: string
  priority?: string
}
Response: {
  ticketId: string
  status: string
  createdAt: Date
}
```

#### Get Customer Tickets
```
GET /support/:customerId/tickets
Response: Array<{
  id: string
  subject: string
  status: string
  priority: string
  createdAt: Date
  updatedAt: Date
}>
```

#### Get Ticket Details
```
GET /support/ticket/:ticketId
Response: {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  comments: Array<{
    id: string
    comment: string
    author: string
    createdAt: Date
  }>
}
```

#### Add Comment to Ticket
```
POST /support/ticket/:ticketId/comment
Body: { comment: string }
Response: { success: boolean, commentId: string }
```

#### Update Ticket Status
```
PUT /support/ticket/:ticketId/status
Body: { status: string }
Response: { success: boolean, status: string }
```

---

### 8. Rewards APIs

#### Get Special Date Rewards
```
GET /rewards/:customerId/special-dates
Response: Array<{
  id: string
  type: string (birthday|anniversary|holiday|milestone)
  title: string
  points: number
  discount: number
  eventDate: Date
  claimed: boolean
}>
```

#### Get Upcoming Rewards
```
GET /rewards/:customerId/upcoming
Response: Array<{
  id: string
  type: string
  title: string
  daysUntil: number
  points: number
  discount: number
}>
```

#### Claim Reward
```
POST /rewards/:customerId/claim
Body: { rewardId: string }
Response: {
  success: boolean
  message: string
  points: number
  discount: number
}
```

#### Get Reward History
```
GET /rewards/:customerId/history
Response: Array<{
  id: string
  type: string
  title: string
  points: number
  discount: number
  claimedAt: Date
}>
```

#### Get Reward Details
```
GET /rewards/:rewardId/details
Response: {
  id: string
  type: string
  title: string
  description: string
  points: number
  discount: number
  terms: string[]
}
```

#### Get All Rewards
```
GET /rewards/all
Response: Array<{
  id: string
  type: string
  title: string
  icon: string
  description: string
  points: number
  discount: number
  frequency: string
}>
```

---

### 9. Security APIs

#### Get Security Status
```
GET /security/:customerId/status
Response: {
  overallRisk: string (low|medium|high)
  twoFactorEnabled: boolean
  lastLogin: Date
  suspiciousActivities: number
  recentAlerts: Array<{
    id: string
    type: string
    severity: string
    description: string
  }>
}
```

#### Get Fraud Alerts
```
GET /security/:customerId/alerts
Response: Array<{
  id: string
  type: string
  severity: string (low|medium|high|critical)
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  action: string
}>
```

#### Report Suspicious Activity
```
POST /security/:customerId/report
Body: {
  activityType: string
  description: string
  evidence?: string
}
Response: {
  success: boolean
  reportId: string
  status: string
}
```

#### Get Security Recommendations
```
GET /security/:customerId/recommendations
Response: Array<{
  priority: string (low|medium|high|critical)
  title: string
  description: string
  action: string
  icon: string
}>
```

#### Enable Two-Factor Authentication
```
POST /security/:customerId/2fa/enable
Response: {
  success: boolean
  message: string
  twoFactorEnabled: boolean
}
```

#### Get Security History
```
GET /security/:customerId/history
Response: Array<{
  id: string
  type: string
  title: string
  description: string
  ipAddress: string
  deviceInfo: string
  timestamp: Date
  status: string
}>
```

---

### 10. Customer Support APIs

#### Get Live Chat Sessions
```
GET /support-chat/:customerId/sessions
Response: Array<{
  id: string
  topic: string
  status: string
  agentName: string
  rating: number
  createdAt: Date
}>
```

#### Start Live Chat
```
POST /support-chat/:customerId/start
Body: {
  topic: string
  message: string
}
Response: {
  sessionId: string
  topic: string
  status: string
  message: string
  estimatedWaitTime: string
}
```

#### Send Chat Message
```
POST /support-chat/:sessionId/message
Body: {
  customerId: string
  message: string
}
Response: {
  messageId: string
  timestamp: Date
  status: string
}
```

#### Get Chat History
```
GET /support-chat/:sessionId/history
Response: Array<{
  id: string
  message: string
  senderType: string (customer|agent)
  senderName: string
  timestamp: Date
}>
```

#### Get FAQ
```
GET /support-chat/faq?category=account
Response: Array<{
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  views: number
}>
```

#### Search FAQ
```
GET /support-chat/faq/search?query=password
Response: Array<{
  id: string
  question: string
  answer: string
  category: string
  relevance: number
}>
```

#### Get Support Categories
```
GET /support-chat/categories
Response: Array<{
  id: string
  name: string
  icon: string
  description: string
  topics: string[]
}>
```

#### Close Chat Session
```
POST /support-chat/:sessionId/close
Response: {
  success: boolean
  message: string
  sessionId: string
  duration: string
}
```

---

## 🔄 Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

---

## 🧪 Testing

Run integration tests:
```bash
npm test -- test/integration/customer-id-apis.test.ts
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All monetary values are in the base currency (e.g., SAR)
- Pagination can be added to list endpoints using `?page=1&limit=20`
- Filtering can be added to list endpoints using query parameters
- All endpoints support both Arabic and English responses based on `Accept-Language` header

---

## 🚀 Deployment

To deploy the Customer ID Service:

```bash
# Build
npm run build

# Start
npm start

# Or with Docker
docker build -t customer-id-service .
docker run -p 3010:3010 customer-id-service
```

---

## 📞 Support

For API issues or questions, contact the development team or check the integration tests for usage examples.
