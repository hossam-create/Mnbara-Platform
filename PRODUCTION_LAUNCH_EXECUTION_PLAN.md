# MNBARA PLATFORM - PRODUCTION LAUNCH EXECUTION

## Current Status: 95% Complete → Target: 100% Production Ready

### Immediate Action Items (Next 48 Hours)

## PHASE 1: CRITICAL TESTING (Days 1-3)

### Day 1: Integration Testing Checklist

#### 1. User Registration & Authentication Flow
```bash
# Test commands to run:
cd backend/services/auth-service
npm test -- --testPathPattern=auth.service.test

# Manual testing checklist:
□ Register new buyer account
□ Email verification works
□ JWT token generation
□ Login with credentials
□ Profile completion
□ Session management
```

#### 2. Seller Subscription Flow
```bash
# Test Stripe integration:
cd backend/services/payment-service
npm test -- --testPathPattern=stripe

# Manual testing:
□ Seller registration
□ Subscribe to $19.99 plan
□ Test card: 4242 4242 4242 4242
□ Webhook handling
□ Access control verification
```

#### 3. Product Listing Flow
```bash
cd backend/services/product-service
npm test

# Verify:
□ Product creation
□ Country selection (195+ countries)
□ Image upload
□ Price validation
□ Publish/unpublish
```

#### 4. Order & Matching Flow
```bash
cd backend/services/matching-service
npm test

cd backend/services/orders-service
npm test

# Test:
□ Browse products by country
□ Create order request
□ Traveler matching
□ Order acceptance
□ $2.99 service fee
```

#### 5. Payment & Escrow Flow
```bash
cd backend/services/escrow-service
npm test

cd backend/services/wallet-service
npm test

# Verify:
□ Payment processing
□ Escrow hold
□ Delivery confirmation
□ Settlement to seller
□ Payout to traveler
```

### Day 2: End-to-End Testing

#### Error Scenarios to Test
```javascript
// Create test file: tests/e2e/error-scenarios.test.js

describe('Error Handling', () => {
  test('Payment failure recovery', async () => {
    // Use Stripe test card: 4000 0000 0000 0002 (decline)
  });
  
  test('Network timeout handling', async () => {
    // Simulate network errors
  });
  
  test('Invalid input validation', async () => {
    // Test XSS, SQL injection attempts
  });
  
  test('Expired token handling', async () => {
    // Test JWT expiration
  });
  
  test('Concurrent order conflicts', async () => {
    // Test race conditions
  });
});
```

#### Security Testing
```bash
# Run security audit
npm audit --production

# Check for vulnerabilities
cd frontend/web-app
npm audit

# Test rate limiting
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  --repeat 100

# Verify CORS
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/users
```

### Day 3: Performance Testing

#### Load Testing Script
```bash
# Install Apache Bench
# Windows: Download from Apache website
# Or use: npm install -g artillery

# Create artillery config:
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
scenarios:
  - name: "User journey"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
      - get:
          url: "/api/products"
      - get:
          url: "/api/orders"
EOF

# Run load test
artillery run load-test.yml
```

#### Performance Benchmarks
```bash
# Frontend performance
cd frontend/web-app
npm run build
npm run preview

# Use Lighthouse CLI
npm install -g lighthouse
lighthouse http://localhost:4173 --output html --output-path ./lighthouse-report.html

# Target metrics:
# - First Contentful Paint: < 1.8s
# - Speed Index: < 3.4s
# - Time to Interactive: < 3.8s
# - Total Blocking Time: < 300ms
```

## PHASE 2: PRODUCTION DEPLOYMENT (Days 4-5)

### Day 4: Infrastructure Setup

#### Step 1: Domain & DNS Configuration
```bash
# Purchase domain (recommended registrars):
# - Namecheap: ~$12/year
# - Google Domains: ~$12/year
# - Cloudflare: ~$10/year

# DNS Configuration (example for Cloudflare):
# A Record:
# mnbara.com → [Your Server IP]

# CNAME Records:
# www → mnbara.com
# api → mnbara.com
# admin → mnbara.com
```

#### Step 2: Server Provisioning (DigitalOcean)
```bash
# Option 1: DigitalOcean App Platform (Recommended for MVP)

# 1. Create account at digitalocean.com
# 2. Create new App
# 3. Connect GitHub repository
# 4. Configure services:

# Frontend (web-app):
# - Build Command: cd frontend/web-app && npm install && npm run build
# - Run Command: npm run preview
# - HTTP Port: 4173
# - Instance Size: Basic ($12/month)

# Backend (API Gateway):
# - Build Command: cd services/api-gateway && npm install && npm run build
# - Run Command: npm start
# - HTTP Port: 3000
# - Instance Size: Basic ($12/month)

# Backend Services (each):
# - Instance Size: Basic ($12/month)
# - Environment: Node.js

# Database:
# - Create Managed PostgreSQL
# - Plan: Basic (1GB RAM, 10GB storage) - $15/month
# - Version: 14
# - Enable automatic backups

# Redis:
# - Create Managed Redis
# - Plan: Basic (256MB) - $10/month

# Spaces (S3-compatible storage):
# - Create Space for file uploads
# - Enable CDN
# - Cost: $5/month
```

#### Step 3: SSL/TLS Setup
```bash
# DigitalOcean App Platform includes free SSL
# Or use Cloudflare (recommended):

# 1. Add domain to Cloudflare
# 2. Update nameservers at registrar
# 3. Enable "Full (strict)" SSL mode
# 4. Enable "Always Use HTTPS"
# 5. Enable "Automatic HTTPS Rewrites"
```

#### Step 4: Environment Variables
```bash
# Create production .env files

# Backend services .env:
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@db-host:25060/mnbara?sslmode=require
REDIS_URL=redis://default:password@redis-host:25061

# JWT
JWT_SECRET=[GENERATE_SECURE_KEY]
JWT_EXPIRES_IN=7d

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_[YOUR_KEY]
STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_KEY]

# URLs
API_URL=https://api.mnbara.com
FRONTEND_URL=https://mnbara.com
ADMIN_URL=https://admin.mnbara.com

# Email (SendGrid)
SENDGRID_API_KEY=[YOUR_KEY]
FROM_EMAIL=noreply@mnbara.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=[YOUR_SID]
TWILIO_AUTH_TOKEN=[YOUR_TOKEN]
TWILIO_PHONE_NUMBER=[YOUR_NUMBER]

# Storage (DigitalOcean Spaces)
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_BUCKET=mnbara-uploads
SPACES_KEY=[YOUR_KEY]
SPACES_SECRET=[YOUR_SECRET]

# Monitoring
SENTRY_DSN=https://[YOUR_KEY]@sentry.io/[PROJECT_ID]
EOF

# Generate secure JWT secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Day 5: Deployment

#### Database Migration
```bash
# 1. Backup local database
pg_dump -h localhost -U postgres mnbara > mnbara_backup_$(date +%Y%m%d).sql

# 2. Connect to production database
# Get connection string from DigitalOcean

# 3. Run migrations
cd backend/services/auth-service
npx prisma migrate deploy

cd ../user-service
npx prisma migrate deploy

cd ../product-service
npx prisma migrate deploy

# Continue for all services...

# 4. Seed initial data
cd infrastructure/database-migrations
npm run seed:production
```

#### Backend Deployment
```bash
# Using DigitalOcean App Platform:
# 1. Push code to GitHub
git add .
git commit -m "Production deployment"
git push origin main

# 2. App Platform will auto-deploy
# 3. Monitor deployment logs in dashboard

# Or manual deployment with Docker:
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verify services:
curl https://api.mnbara.com/health
```

#### Frontend Deployment
```bash
# Option 1: Vercel (Recommended)
npm install -g vercel
cd frontend/web-app
vercel --prod

# Option 2: DigitalOcean App Platform
# Already configured in Step 2

# Option 3: Netlify
npm install -g netlify-cli
cd frontend/web-app
npm run build
netlify deploy --prod --dir=dist
```

#### Mobile App Deployment
```bash
# iOS (requires Mac + Apple Developer Account $99/year)
cd mobile-app-flutter
flutter build ios --release

# Upload to App Store Connect:
# 1. Open Xcode
# 2. Archive app
# 3. Upload to App Store
# 4. Submit for review (7-14 days)

# Android
flutter build appbundle --release

# Upload to Google Play Console:
# 1. Create app in console
# 2. Upload AAB file
# 3. Complete store listing
# 4. Submit for review (1-3 days)
```

## PHASE 3: MONITORING SETUP

### Sentry Configuration
```bash
# Install Sentry
npm install @sentry/node @sentry/react

# Backend integration:
# Add to each service's index.ts:
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

# Frontend integration:
# Add to frontend/web-app/src/main.tsx:
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Uptime Monitoring
```bash
# UptimeRobot (Free):
# 1. Sign up at uptimerobot.com
# 2. Add monitors:
#    - https://mnbara.com (HTTP)
#    - https://api.mnbara.com/health (HTTP)
#    - https://admin.mnbara.com (HTTP)
# 3. Set alert contacts (email, SMS)
# 4. Check interval: 5 minutes
```

## PHASE 4: LAUNCH CHECKLIST

### Pre-Launch Verification
```bash
# Run comprehensive check:
./scripts/pre-launch-validation.sh

# Manual checklist:
□ All services responding (200 OK)
□ SSL certificates valid
□ Database connections working
□ Redis cache operational
□ Stripe webhooks configured
□ Email sending works
□ SMS notifications work
□ File uploads functional
□ Admin dashboard accessible
□ Mobile API endpoints working
□ Error tracking active
□ Monitoring dashboards live
□ Backup strategy tested
□ DNS fully propagated
□ CDN serving assets
□ Rate limiting active
□ CORS configured correctly
□ Security headers set
□ Robots.txt in place
□ Sitemap.xml generated
□ Analytics tracking active
□ Legal pages published
□ Support email configured
```

### Soft Launch Strategy

#### Week 1: Beta (10-20 users)
```bash
# Create beta user accounts
# Send invitation emails
# Monitor closely:
# - Check Sentry for errors
# - Review server logs
# - Monitor database performance
# - Track API response times
# - Gather user feedback
```

#### Week 2: Controlled Rollout (100 users)
```bash
# Open registration with invite codes
# Social media announcement (small scale)
# Monitor:
# - Server load
# - Database queries
# - Payment processing
# - User behavior
# - Conversion rates
```

#### Week 3: Public Launch
```bash
# Full marketing campaign
# Remove invite-only restriction
# Press release
# Product Hunt launch
# Scale infrastructure as needed
```

## COST SUMMARY

### Monthly Recurring Costs
```
Infrastructure:
- DigitalOcean App Platform (3 apps): $36/month
- Managed PostgreSQL (1GB): $15/month
- Managed Redis (256MB): $10/month
- Spaces + CDN: $5/month
Subtotal: $66/month

Services:
- Sentry (Team plan): $29/month
- SendGrid (Essentials): $20/month (40k emails)
- Twilio SMS: ~$10/month (pay-as-you-go)
- UptimeRobot: $0 (free tier)
Subtotal: $59/month

One-time/Annual:
- Domain: $12/year = $1/month
- Apple Developer: $99/year = $8.25/month
- Google Play: $25 (one-time)

TOTAL: ~$134/month
```

## SUCCESS METRICS (First 30 Days)

### Technical KPIs
- Uptime: > 99.5%
- API Response Time: < 500ms (p95)
- Page Load Time: < 3s
- Error Rate: < 1%
- Zero critical security incidents

### Business KPIs
- 50+ Active Users
- 10+ Seller Subscriptions ($199.90 revenue)
- 25+ Completed Orders ($74.75 service fees)
- Target Revenue: $274.65

### User Experience KPIs
- Session Duration: > 5 minutes
- Bounce Rate: < 40%
- Sign-up Conversion: > 5%
- Seller Conversion: > 20%

## NEXT STEPS

1. **TODAY**: Review this plan, set up accounts (DigitalOcean, Stripe Live, SendGrid)
2. **TOMORROW**: Begin Day 1 testing scenarios
3. **THIS WEEK**: Complete testing phases, fix critical bugs
4. **NEXT WEEK**: Deploy to production, soft launch

---

**Status**: Ready for execution
**Timeline**: 10-14 days to public launch
**Confidence Level**: HIGH ✅
