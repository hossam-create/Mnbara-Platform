# Analytics Service - PostHog & Plausible Integration

**Port**: 3028  
**Database**: PostgreSQL  
**External Services**: PostHog, Plausible

## Overview

Comprehensive analytics service integrating PostHog and Plausible for event tracking, page views, funnels, cohorts, and user behavior analysis. Provides dual tracking to both platforms plus local database storage.

## Features

### Event Tracking
- Custom event tracking
- Page view tracking
- User identification
- Session tracking
- Property attachments

### Analytics
- Event analytics with aggregations
- Page view analytics
- Dashboard statistics
- Time-range filtering
- Unique user/session counts

### Funnels
- Multi-step funnel creation
- Conversion rate analysis
- Step-by-step breakdown
- Time-based analysis

### Cohorts
- User cohort creation
- Filter-based segmentation
- Cohort analytics

### Integrations
- **PostHog**: Full-featured product analytics
- **Plausible**: Privacy-friendly web analytics
- **Local DB**: Custom analytics and reporting

## API Endpoints

### Tracking (3 endpoints)
```
POST   /api/analytics/events          - Track custom event
POST   /api/analytics/pageviews       - Track page view
POST   /api/analytics/identify        - Identify user
```

### Analytics (3 endpoints)
```
GET    /api/analytics/events/:eventName - Get event analytics
GET    /api/analytics/pageviews        - Get page view analytics
GET    /api/analytics/dashboard        - Get dashboard stats
```

### Funnels (2 endpoints)
```
POST   /api/analytics/funnels          - Create funnel
GET    /api/analytics/funnels/:id/analyze - Analyze funnel
```

### Cohorts (1 endpoint)
```
POST   /api/analytics/cohorts          - Create cohort
```

**Total**: 9 API endpoints

## Setup

### 1. Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/analytics_db
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_HOST=https://app.posthog.com
PLAUSIBLE_API_KEY=your_plausible_api_key
PLAUSIBLE_API_URL=https://plausible.io/api
PLAUSIBLE_DOMAIN=mnbara.com
PORT=3028
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npm run migrate
```

### 4. Start Service
```bash
npm run dev
```

## Usage Examples

### Track Event
```typescript
POST /api/analytics/events
{
  "userId": "user123",
  "sessionId": "sess456",
  "eventName": "product_purchased",
  "properties": {
    "productId": "prod789",
    "amount": 99.99,
    "currency": "USD"
  },
  "url": "https://mnbara.com/checkout/success",
  "referrer": "https://mnbara.com/cart"
}
```

### Track Page View
```typescript
POST /api/analytics/pageviews
{
  "userId": "user123",
  "sessionId": "sess456",
  "url": "https://mnbara.com/products/123",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "country": "SA",
  "device": "mobile",
  "browser": "Chrome",
  "os": "Android"
}
```

### Identify User
```typescript
POST /api/analytics/identify
{
  "userId": "user123",
  "properties": {
    "email": "user@example.com",
    "name": "Ahmed Ali",
    "plan": "premium",
    "signupDate": "2026-01-01"
  }
}
```

### Get Event Analytics
```typescript
GET /api/analytics/events/product_purchased?startDate=2026-01-01&endDate=2026-02-04

Response:
{
  "success": true,
  "data": {
    "eventName": "product_purchased",
    "totalCount": 1250,
    "uniqueUsers": 890,
    "uniqueSessions": 920,
    "events": [...]
  }
}
```

### Create Funnel
```typescript
POST /api/analytics/funnels
{
  "name": "Purchase Funnel",
  "description": "Track user journey from view to purchase",
  "steps": [
    { "name": "Product Viewed", "eventName": "product_viewed" },
    { "name": "Added to Cart", "eventName": "add_to_cart" },
    { "name": "Checkout Started", "eventName": "checkout_started" },
    { "name": "Purchase Completed", "eventName": "product_purchased" }
  ]
}
```

### Analyze Funnel
```typescript
GET /api/analytics/funnels/funnel123/analyze?startDate=2026-01-01&endDate=2026-02-04

Response:
{
  "success": true,
  "data": {
    "funnel": "Purchase Funnel",
    "steps": [
      { "step": 1, "name": "Product Viewed", "count": 10000, "conversionRate": 100 },
      { "step": 2, "name": "Added to Cart", "count": 3500, "conversionRate": 35 },
      { "step": 3, "name": "Checkout Started", "count": 2100, "conversionRate": 60 },
      { "step": 4, "name": "Purchase Completed", "count": 1250, "conversionRate": 59.52 }
    ],
    "overallConversion": 12.5
  }
}
```

## Database Schema

### Event
- Event tracking with properties
- User and session association
- Source tracking (posthog/plausible/custom)
- Timestamp indexing

### PageView
- URL tracking
- Referrer tracking
- Device/browser/OS detection
- Duration tracking
- Geographic data

### Funnel
- Multi-step definitions
- Active/inactive status
- JSON step configuration

### Cohort
- User segmentation
- Filter-based definitions
- User count tracking

## PostHog Integration

### Features
- Event capture
- User identification
- Feature flags
- Group analytics
- Session recording
- Heatmaps

### Usage
```typescript
// Automatic via AnalyticsService
await analyticsService.trackEvent({
  userId: 'user123',
  eventName: 'button_clicked',
  properties: { button: 'signup' }
});
```

## Plausible Integration

### Features
- Privacy-friendly tracking
- Page view analytics
- Custom events
- Goal tracking
- No cookies required

### Usage
```typescript
// Automatic via AnalyticsService
await analyticsService.trackPageView({
  sessionId: 'sess456',
  url: 'https://mnbara.com/products',
  referrer: 'https://google.com'
});
```

## Common Use Cases

### E-commerce Tracking
```typescript
// Product view
await trackEvent({
  eventName: 'product_viewed',
  properties: { productId, category, price }
});

// Add to cart
await trackEvent({
  eventName: 'add_to_cart',
  properties: { productId, quantity, price }
});

// Purchase
await trackEvent({
  eventName: 'product_purchased',
  properties: { orderId, total, items }
});
```

### User Engagement
```typescript
// Feature usage
await trackEvent({
  eventName: 'feature_used',
  properties: { feature: 'search', query: 'laptops' }
});

// Content interaction
await trackEvent({
  eventName: 'content_viewed',
  properties: { type: 'article', id: 'art123', duration: 120 }
});
```

### Marketing Attribution
```typescript
// Campaign tracking
await trackEvent({
  eventName: 'campaign_visit',
  properties: {
    campaign: 'summer_sale',
    source: 'facebook',
    medium: 'cpc'
  }
});
```

## Best Practices

### Event Naming
- Use snake_case: `product_purchased`
- Be descriptive: `checkout_completed` not `done`
- Use past tense: `button_clicked` not `button_click`

### Properties
- Keep properties flat when possible
- Use consistent data types
- Include relevant context
- Avoid PII in properties

### Performance
- Batch events when possible
- Use async tracking
- Index frequently queried fields
- Archive old data

## Monitoring

### Key Metrics
- Event volume
- Tracking latency
- API response times
- Error rates
- Data completeness

### Health Checks
- PostHog connectivity
- Plausible connectivity
- Database connection
- Queue processing

## Dependencies

- `posthog-node`: PostHog Node.js SDK
- `axios`: HTTP client for Plausible API
- `@prisma/client`: Database ORM
- `express`: Web framework
- `winston`: Logging

## Port

Service runs on port **3028**

## License

MIT
