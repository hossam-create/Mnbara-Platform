# Phase 1C: Conversion Optimization & Seller Analytics

**Status:** Ready for Implementation  
**Target Completion:** December 24, 2025  
**Estimated Effort:** 90 hours

---

## Epic 1.3: Conversion Optimization (CNV-001 through CNV-007)

### CNV-001: Guest Checkout Flow

**Objective:** Allow buyers to purchase without creating an account

**Backend Requirements:**
- Create `guest_checkout` table to track guest orders
- Implement guest order creation endpoint: `POST /api/checkout/guest`
- Generate temporary guest session tokens (valid for 24 hours)
- Email verification endpoint: `POST /api/checkout/guest/verify-email`
- Option to convert guest to account: `POST /api/checkout/guest/convert-account`

**Frontend Requirements:**
- Add "Continue as Guest" button on checkout page
- Create guest checkout form with minimal fields:
  - Email (required)
  - Full name (required)
  - Shipping address (required)
  - Phone (optional)
- Email verification step with OTP
- Post-purchase account creation offer

**Database Schema:**
```sql
CREATE TABLE guest_checkouts (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  shipping_address JSONB NOT NULL,
  order_id UUID REFERENCES orders(id),
  session_token VARCHAR(255) UNIQUE,
  token_expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `POST /api/checkout/guest` - Create guest checkout
- `POST /api/checkout/guest/verify-email` - Verify email with OTP
- `POST /api/checkout/guest/convert-account` - Convert to account

**Testing:**
- Unit: Guest checkout creation, email verification
- Integration: Guest to account conversion
- E2E: Complete guest checkout flow

---

### CNV-002: Express Checkout

**Objective:** One-click checkout for returning customers

**Backend Requirements:**
- Create `saved_payment_methods` table
- Create `saved_addresses` table
- Implement express checkout endpoint: `POST /api/checkout/express`
- Auto-fill logic based on user history

**Frontend Requirements:**
- Display saved payment methods on checkout
- Display saved addresses on checkout
- One-click checkout button for returning customers
- Option to use different payment/address

**Database Schema:**
```sql
CREATE TABLE saved_payment_methods (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  payment_type VARCHAR(50), -- 'card', 'paypal', 'wallet'
  last_four VARCHAR(4),
  expiry_month INT,
  expiry_year INT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saved_addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  address_type VARCHAR(50), -- 'shipping', 'billing'
  full_name VARCHAR(255),
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `POST /api/checkout/express` - One-click checkout
- `GET /api/user/payment-methods` - List saved payment methods
- `GET /api/user/addresses` - List saved addresses
- `POST /api/user/payment-methods` - Save payment method
- `POST /api/user/addresses` - Save address

**Testing:**
- Unit: Express checkout logic
- Integration: Payment method retrieval
- E2E: One-click checkout flow

---

### CNV-003: Mobile Wallet Integration

**Objective:** Support Apple Pay, Google Pay, Samsung Pay

**Backend Requirements:**
- Implement wallet payment verification endpoints
- Create `wallet_payments` table for tracking
- Validate wallet tokens with payment providers

**Frontend Requirements (Web):**
- Add Apple Pay button (for Safari)
- Add Google Pay button (for Chrome/Android)
- Integrate with Stripe for wallet processing

**Frontend Requirements (Mobile):**
- Implement Apple Pay integration (iOS)
- Implement Google Pay integration (Android)
- Handle wallet payment callbacks

**Database Schema:**
```sql
CREATE TABLE wallet_payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  wallet_type VARCHAR(50), -- 'apple_pay', 'google_pay', 'samsung_pay'
  token_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `POST /api/payments/wallet/verify` - Verify wallet token
- `POST /api/payments/wallet/process` - Process wallet payment

**Testing:**
- Unit: Wallet token validation
- Integration: Payment processing
- E2E: Wallet payment flow (sandbox)

---

### CNV-004: Streamlined Checkout UI

**Objective:** Optimize multi-step checkout form

**Frontend Requirements:**
- Create multi-step checkout component:
  - Step 1: Shipping address
  - Step 2: Shipping method
  - Step 3: Payment method
  - Step 4: Review & confirm
- Add progress indicator
- Implement auto-save of form state to localStorage
- Add error prevention (validation before proceeding)
- Show order summary on each step

**Features:**
- Real-time validation with helpful error messages
- Auto-save draft every 30 seconds
- Ability to go back and edit previous steps
- Mobile-responsive design
- Accessibility compliance (WCAG 2.1 AA)

**Testing:**
- Unit: Form validation logic
- Component: Multi-step form behavior
- E2E: Complete checkout flow with validation

---

### CNV-005: Payment Method Flexibility

**Objective:** Support multiple payment options

**Backend Requirements:**
- Implement split payment logic
- Create `split_payments` table
- Implement installment plan endpoints
- Integrate with BNPL provider (Affirm/Klarna)

**Frontend Requirements:**
- Add payment method selector with multiple options
- Implement split payment UI (e.g., 50/50 split)
- Display installment plan options
- Show BNPL options if available

**Database Schema:**
```sql
CREATE TABLE split_payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  payment_method_1 VARCHAR(50),
  amount_1 DECIMAL(10, 2),
  payment_method_2 VARCHAR(50),
  amount_2 DECIMAL(10, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE installment_plans (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  total_amount DECIMAL(10, 2),
  installment_count INT,
  installment_amount DECIMAL(10, 2),
  frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly'
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `POST /api/payments/split` - Create split payment
- `POST /api/payments/installment` - Create installment plan
- `GET /api/payments/bnpl-options` - Get BNPL options

**Testing:**
- Unit: Split payment calculation
- Integration: Installment plan creation
- E2E: Multiple payment method flow

---

### CNV-006: Checkout Analytics

**Objective:** Track conversion funnel and identify drop-off points

**Backend Requirements:**
- Create `checkout_events` table
- Implement event tracking endpoints
- Create analytics aggregation queries
- Implement A/B testing framework

**Frontend Requirements:**
- Track page views in checkout flow
- Track form field interactions
- Track payment method selections
- Track error occurrences
- Send events to analytics service

**Database Schema:**
```sql
CREATE TABLE checkout_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id VARCHAR(255),
  event_type VARCHAR(50), -- 'page_view', 'form_interaction', 'error', 'completion'
  step VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE checkout_funnel (
  id UUID PRIMARY KEY,
  date DATE,
  step VARCHAR(50),
  user_count INT,
  completion_rate DECIMAL(5, 2),
  avg_time_seconds INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `POST /api/analytics/checkout-event` - Track checkout event
- `GET /api/analytics/checkout-funnel` - Get funnel metrics
- `GET /api/analytics/drop-off-points` - Get drop-off analysis

**Testing:**
- Unit: Event tracking logic
- Integration: Analytics aggregation
- E2E: Complete funnel tracking

---

### CNV-007: Abandoned Cart Recovery

**Objective:** Recover lost sales through reminders

**Backend Requirements:**
- Create `abandoned_carts` table
- Implement cart persistence logic
- Create email/SMS notification service
- Implement discount code generation for recovery

**Frontend Requirements:**
- Persist cart to localStorage and backend
- Display "Your cart is waiting" banner on return
- Show recovery email/SMS in user settings

**Database Schema:**
```sql
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  cart_items JSONB,
  total_amount DECIMAL(10, 2),
  abandoned_at TIMESTAMP,
  recovery_email_sent_at TIMESTAMP,
  recovery_sms_sent_at TIMESTAMP,
  recovered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recovery_codes (
  id UUID PRIMARY KEY,
  abandoned_cart_id UUID REFERENCES abandoned_carts(id),
  code VARCHAR(50) UNIQUE,
  discount_percent INT,
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `POST /api/carts/abandon` - Mark cart as abandoned
- `POST /api/carts/recover` - Recover abandoned cart
- `POST /api/recovery/send-email` - Send recovery email
- `POST /api/recovery/send-sms` - Send recovery SMS

**Testing:**
- Unit: Cart persistence logic
- Integration: Recovery notification sending
- E2E: Complete recovery flow

---

## Epic 1.4: Seller Analytics (ANA-001 through ANA-008)

### ANA-001: Data Model Design

**Objective:** Design analytics data structure

**Requirements:**
- Define event schema for all trackable events
- Define metrics definitions (GMV, conversion rate, etc.)
- Define aggregation strategy (hourly, daily, weekly, monthly)
- Define data retention policy

**Event Schema:**
```typescript
interface AnalyticsEvent {
  id: string;
  user_id: string;
  seller_id: string;
  event_type: 'page_view' | 'product_view' | 'search' | 'add_to_cart' | 'checkout' | 'purchase';
  product_id?: string;
  category?: string;
  amount?: number;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

**Metrics Definitions:**
- GMV: Total Gross Merchandise Value
- Conversion Rate: Orders / Visitors
- AOV: Average Order Value
- CTR: Click-Through Rate
- Traffic: Unique visitors
- Revenue: Total revenue

**Aggregation Strategy:**
- Real-time: Last 24 hours
- Hourly: Last 30 days
- Daily: Last 90 days
- Monthly: Last 2 years

**Data Retention:**
- Raw events: 90 days
- Hourly aggregates: 1 year
- Daily aggregates: 2 years
- Monthly aggregates: 5 years

---

### ANA-002: Event Collection

**Objective:** Collect analytics events from platform

**Backend Requirements:**
- Create `analytics_events` table
- Implement event collection endpoint
- Implement event batching for performance
- Create event validation logic

**Frontend Requirements:**
- Implement analytics tracking library
- Track page views
- Track product views
- Track search queries
- Track add to cart
- Track checkout events

**Database Schema:**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  seller_id UUID,
  event_type VARCHAR(50),
  product_id UUID,
  category VARCHAR(100),
  amount DECIMAL(10, 2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_seller_date ON analytics_events(seller_id, created_at);
CREATE INDEX idx_analytics_events_user_date ON analytics_events(user_id, created_at);
```

**API Contracts:**
- `POST /api/analytics/events` - Track event
- `POST /api/analytics/events/batch` - Batch track events

**Testing:**
- Unit: Event validation
- Integration: Event storage
- E2E: Event tracking flow

---

### ANA-003: Analytics Dashboard

**Objective:** Provide seller dashboard with key metrics

**Frontend Requirements:**
- Create SellerAnalyticsDashboard component
- Display traffic overview (visitors, page views)
- Display conversion funnel
- Display revenue metrics
- Display top products
- Display customer insights

**Features:**
- Date range selector
- Metric comparison (vs. previous period)
- Export functionality
- Real-time updates

**Testing:**
- Component: Dashboard rendering
- Integration: Data fetching
- E2E: Dashboard interaction

---

### ANA-004: Sales Reports

**Objective:** Provide detailed sales reporting

**Backend Requirements:**
- Create sales report generation endpoint
- Implement report caching for performance
- Create scheduled report generation

**Frontend Requirements:**
- Create SalesReportsPage
- Display daily/weekly/monthly sales
- Display revenue breakdown by product
- Display order details
- Display customer lifetime value

**API Contracts:**
- `GET /api/analytics/sales-report` - Get sales report
- `POST /api/analytics/sales-report/export` - Export sales report

**Testing:**
- Unit: Report generation logic
- Integration: Report data accuracy
- E2E: Report export flow

---

### ANA-005: Traffic Analytics

**Objective:** Analyze traffic sources and patterns

**Backend Requirements:**
- Track traffic source (organic, paid, direct, referral)
- Track device type (desktop, mobile, tablet)
- Track geographic location
- Create traffic aggregation queries

**Frontend Requirements:**
- Create TrafficAnalyticsPage
- Display visitor count trends
- Display traffic source breakdown
- Display device breakdown
- Display geographic distribution

**Database Schema:**
```sql
CREATE TABLE traffic_analytics (
  id UUID PRIMARY KEY,
  seller_id UUID,
  date DATE,
  traffic_source VARCHAR(50),
  device_type VARCHAR(50),
  country VARCHAR(100),
  visitor_count INT,
  page_views INT,
  avg_session_duration INT,
  bounce_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `GET /api/analytics/traffic` - Get traffic analytics
- `GET /api/analytics/traffic/sources` - Get traffic by source
- `GET /api/analytics/traffic/devices` - Get traffic by device

**Testing:**
- Unit: Traffic aggregation logic
- Integration: Traffic data accuracy
- E2E: Traffic analytics page

---

### ANA-006: Product Performance

**Objective:** Analyze individual product performance

**Backend Requirements:**
- Create product performance aggregation queries
- Track view count, CTR, conversion rate, revenue per product

**Frontend Requirements:**
- Create ProductPerformancePage
- Display product list with metrics
- Display view count trends
- Display conversion rate trends
- Display revenue trends

**Database Schema:**
```sql
CREATE TABLE product_performance (
  id UUID PRIMARY KEY,
  seller_id UUID,
  product_id UUID,
  date DATE,
  view_count INT,
  click_count INT,
  add_to_cart_count INT,
  purchase_count INT,
  revenue DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `GET /api/analytics/products` - Get product performance
- `GET /api/analytics/products/:id` - Get specific product performance

**Testing:**
- Unit: Product performance calculation
- Integration: Product data accuracy
- E2E: Product performance page

---

### ANA-007: Customer Insights

**Objective:** Analyze customer behavior and segments

**Backend Requirements:**
- Calculate repeat customer rate
- Calculate average order value
- Create customer segmentation logic
- Calculate churn rate

**Frontend Requirements:**
- Create CustomerInsightsPage
- Display repeat customer rate
- Display AOV trends
- Display customer segments
- Display churn analysis

**Database Schema:**
```sql
CREATE TABLE customer_insights (
  id UUID PRIMARY KEY,
  seller_id UUID,
  date DATE,
  repeat_customer_rate DECIMAL(5, 2),
  avg_order_value DECIMAL(10, 2),
  customer_count INT,
  new_customer_count INT,
  returning_customer_count INT,
  churn_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Contracts:**
- `GET /api/analytics/customers` - Get customer insights
- `GET /api/analytics/customers/segments` - Get customer segments

**Testing:**
- Unit: Customer insight calculation
- Integration: Customer data accuracy
- E2E: Customer insights page

---

### ANA-008: Export & Reporting

**Objective:** Enable data export and scheduled reports

**Backend Requirements:**
- Implement CSV export functionality
- Implement PDF report generation
- Implement scheduled report generation
- Create report delivery via email

**Frontend Requirements:**
- Add export buttons (CSV, PDF)
- Create report scheduling interface
- Display scheduled reports list

**API Contracts:**
- `POST /api/analytics/export/csv` - Export as CSV
- `POST /api/analytics/export/pdf` - Export as PDF
- `POST /api/analytics/reports/schedule` - Schedule report
- `GET /api/analytics/reports/scheduled` - Get scheduled reports

**Testing:**
- Unit: Export generation logic
- Integration: Report delivery
- E2E: Export and scheduling flow

---

## Implementation Order

1. **Week 1:** CNV-001, CNV-002, CNV-004 (Core checkout optimization)
2. **Week 2:** CNV-003, CNV-005, CNV-006, CNV-007 (Payment flexibility & analytics)
3. **Week 3:** ANA-001, ANA-002, ANA-003 (Analytics foundation & dashboard)
4. **Week 4:** ANA-004, ANA-005, ANA-006, ANA-007, ANA-008 (Advanced analytics)

---

## Success Criteria

- All 15 tasks completed with 80%+ test coverage
- Checkout conversion rate increased by 20%
- Guest checkout adoption reaches 40%+
- Mobile conversion increased by 35%
- Seller dashboard adoption reaches 80%+
- Report generation time < 5 seconds
- Analytics data accuracy 99.9%+

---

**Document Owner:** Engineering Team  
**Last Updated:** December 20, 2025  
**Next Review:** December 22, 2025
