# Phase 1: Items to IGNORE Safely

**Date**: January 31, 2026  
**Purpose**: What to skip for Phase 1 without breaking anything

---

## CRITICAL: DO NOT START THESE SERVICES

### Payment & Money Services (7 services)
❌ **payment-service** - No real payments  
❌ **wallet-service** - No money custody  
❌ **internal-ledger-service** - No financial tracking  
❌ **escrow-service** - No escrow needed  
❌ **paypal-service** - No PayPal integration  
❌ **card-service** - No card processing  
❌ **bnpl-service** - No buy-now-pay-later  

**Why**: Phase 1 has NO real money. These services are for financial transactions only.

**Safe to Ignore**: YES - Not needed for matching workflow

---

### Marketplace Features (4 services)
❌ **auction-service** - No auctions in Phase 1  
❌ **cart-service** - No shopping cart needed  
❌ **p2p-exchange-service** - No currency exchange  
❌ **wholesale-service** - No wholesale features  

**Why**: Phase 1 is simple traveler-buyer matching only. No complex marketplace features.

**Safe to Ignore**: YES - Not part of Phase 1 scope

---

### Advanced Infrastructure (6 services)
❌ **elasticsearch** - No search needed yet  
❌ **rabbitmq** - No message queue needed  
❌ **prometheus** - No metrics collection  
❌ **grafana** - No monitoring dashboards  
❌ **sentry** - No error tracking  
❌ **cdn** - No content delivery  

**Why**: Phase 1 is local/staging only. Production infrastructure not needed.

**Safe to Ignore**: YES - Only needed for production

---

### Blockchain & Crypto (7 services)
❌ **blockchain-service** - No blockchain  
❌ **crypto-service** - No cryptocurrency  
❌ **MNBToken.sol** - No token  
❌ **MNBWallet.sol** - No crypto wallet  
❌ **MNBGovernance.sol** - No governance  
❌ **MNBStaking.sol** - No staking  
❌ **MNBExchange.sol** - No crypto exchange  

**Why**: Blockchain features are future roadmap items. Not needed for MVP.

**Safe to Ignore**: YES - Future features only

---

### AI Services (8 services)
❌ **ai-core** - No AI features  
❌ **ai-assistant-service** - No AI assistant  
❌ **ai-chatbot-service** - No chatbot  
❌ **ai-business-service** - No AI business logic  
❌ **ai-recommendations-v2** - No recommendations  
❌ **mnbarh-ai-engine** - No AI engine  
❌ **recommendation-service** - No recommendations  
❌ **demand-forecasting-service** - No forecasting  

**Why**: AI features are advanced capabilities. Not needed for basic matching.

**Safe to Ignore**: YES - Advanced features only

---

### Logistics & Delivery (4 services)
❌ **crowdship-service** - No crowdshipping  
❌ **trips-service** - No trip management  
❌ **smart-delivery-service** - No smart delivery  
❌ **matching-service** - Use simple matching instead  

**Why**: Phase 1 uses simple matching logic. No complex logistics needed.

**Safe to Ignore**: YES - Simple matching is enough

---

### Compliance & Regulatory (5 services)
❌ **compliance-service** - No compliance checks  
❌ **fraud-detection-service** - No fraud detection  
❌ **kyc-service** - No KYC verification  
❌ **customer-id-service** - No customer ID  
❌ **rules-engine** - No rules engine  

**Why**: Phase 1 has no real money, so no regulatory requirements.

**Safe to Ignore**: YES - Only needed when handling money

---

### Advanced Features (15+ services)
❌ **social-commerce-service** - No social features  
❌ **sustainability-service** - No sustainability tracking  
❌ **voice-commerce-service** - No voice commerce  
❌ **vr-showroom-service** - No VR features  
❌ **ar-preview-service** - No AR features  
❌ **seo-service** - No SEO optimization  
❌ **ad-service** - No advertising  
❌ **rewards-service** - No rewards program  
❌ **feature-management-service** - No feature flags  
❌ **ui-config-service** - No UI configuration  
❌ **category-service** - Use static categories  
❌ **order-service** - Use orders-service instead  
❌ **seller-service** - No seller management  
❌ **admin-service** - Use admin dashboard  
❌ **signal-aggregation-service** - No signal aggregation  

**Why**: These are advanced features for future phases.

**Safe to Ignore**: YES - Not needed for MVP

---

## FRONTEND FEATURES TO SKIP

### Payment UI
❌ Payment forms  
❌ Wallet pages  
❌ Payout dashboard  
❌ Financial dashboard  
❌ Transaction history  

**Why**: No real money in Phase 1

**Safe to Ignore**: YES

---

### Marketplace UI
❌ Auction pages  
❌ Cart pages  
❌ Checkout pages  
❌ P2P exchange pages  
❌ Wholesale pages  

**Why**: Not part of Phase 1 scope

**Safe to Ignore**: YES

---

### Advanced UI
❌ Trust & safety pages  
❌ Dispute pages  
❌ Refund pages  
❌ KYC pages  
❌ Fraud detection pages  

**Why**: No real money = no disputes/refunds needed

**Safe to Ignore**: YES

---

## INTEGRATIONS TO SKIP

### Payment Gateways
❌ Stripe integration  
❌ PayPal integration  
❌ Paymob integration  
❌ Bank transfers  

**Why**: No real payments in Phase 1

**Safe to Ignore**: YES

---

### External Services
❌ Custodii integration (use MOCK mode)  
❌ OpenExchangeRates (no FX needed)  
❌ Tatum escrow (no escrow needed)  
❌ Email service (use in-app notifications)  
❌ SMS service (not needed)  
❌ Push notifications (not needed)  

**Why**: Phase 1 uses mock/local services only

**Safe to Ignore**: YES

---

### File Storage
❌ S3 storage (use local storage)  
❌ CDN (not needed)  
❌ Image optimization (not needed)  

**Why**: Local storage is sufficient for Phase 1

**Safe to Ignore**: YES

---

## DATABASE TABLES TO SKIP

### Payment Tables
❌ payments  
❌ transactions  
❌ wallets  
❌ escrows  
❌ payouts  
❌ refunds  

**Why**: No real money = no payment tables needed

**Safe to Ignore**: YES - Won't be queried

---

### Advanced Tables
❌ auctions  
❌ bids  
❌ disputes  
❌ evidence  
❌ trust_scores  
❌ trust_actions  
❌ appeals  

**Why**: Not part of Phase 1 scope

**Safe to Ignore**: YES - Won't be queried

---

## CONFIGURATION TO SKIP

### Environment Variables
❌ STRIPE_SECRET_KEY  
❌ PAYPAL_CLIENT_ID  
❌ CUSTODII_API_KEY (use MOCK mode)  
❌ OPENEXCHANGERATES_API_KEY  
❌ AWS_S3_BUCKET  
❌ SENDGRID_API_KEY  
❌ TWILIO_API_KEY  
❌ SENTRY_DSN  

**Why**: External integrations not needed

**Safe to Ignore**: YES - Use defaults/mocks

---

### OAuth Configuration
❌ GOOGLE_CLIENT_ID  
❌ FACEBOOK_APP_ID  
❌ APPLE_CLIENT_ID  

**Why**: Email/password login is sufficient

**Safe to Ignore**: YES - Basic auth works

---

## TESTING TO SKIP

### Integration Tests
❌ Payment flow tests  
❌ Escrow flow tests  
❌ Dispute flow tests  
❌ Refund flow tests  
❌ External API tests  

**Why**: Features not implemented in Phase 1

**Safe to Ignore**: YES - Tests won't run

---

### Performance Tests
❌ Load testing  
❌ Stress testing  
❌ Scalability testing  

**Why**: Phase 1 is proof-of-concept only

**Safe to Ignore**: YES - Not production

---

## DOCUMENTATION TO SKIP

### Technical Docs
❌ Payment integration guide  
❌ Escrow integration guide  
❌ Blockchain deployment guide  
❌ Production deployment guide  
❌ Scaling guide  

**Why**: Not relevant for Phase 1

**Safe to Ignore**: YES

---

### Compliance Docs
❌ AML/KYC procedures  
❌ Regulatory reports  
❌ Terms of service  
❌ Privacy policy  

**Why**: No real money = no compliance needed

**Safe to Ignore**: YES

---

## DEPLOYMENT TO SKIP

### Production Infrastructure
❌ Cloud provider setup  
❌ Load balancer  
❌ CDN  
❌ SSL certificates  
❌ Domain configuration  
❌ Backup strategy  
❌ Disaster recovery  

**Why**: Phase 1 runs locally/staging only

**Safe to Ignore**: YES

---

### CI/CD
❌ Automated testing pipeline  
❌ Automated deployment  
❌ Blue-green deployment  
❌ Canary deployment  

**Why**: Manual deployment is sufficient

**Safe to Ignore**: YES

---

## MONITORING TO SKIP

### Metrics
❌ Prometheus metrics  
❌ Grafana dashboards  
❌ Custom alerts  
❌ Performance monitoring  

**Why**: Phase 1 is proof-of-concept

**Safe to Ignore**: YES - Use logs instead

---

### Error Tracking
❌ Sentry integration  
❌ Error dashboards  
❌ Error alerting  

**Why**: Console logs are sufficient

**Safe to Ignore**: YES

---

## MOBILE APP TO SKIP

### Flutter App
❌ Mobile app development  
❌ App store submission  
❌ Mobile testing  
❌ Mobile deployment  

**Why**: Web app is sufficient for Phase 1

**Safe to Ignore**: YES - Focus on web

---

## WHAT TO ACTUALLY USE

### Required Services (8 only)
✅ postgres  
✅ redis  
✅ api-gateway  
✅ auth-service  
✅ listing-service  
✅ orders-service  
✅ decision-authority-service (MOCK mode)  
✅ notification-service  

### Required Frontend (5 pages)
✅ Registration page  
✅ Login page  
✅ Trip creation page  
✅ Request creation page  
✅ Matching dashboard  
✅ Admin dashboard  

### Required Configuration
✅ DATABASE_URL (PostgreSQL)  
✅ REDIS_URL  
✅ JWT_SECRET  
✅ DECISION_SOURCE=MOCK  

---

## SAFETY CHECKLIST

### Before Ignoring a Service
- [ ] Verify it's not in the "Required Services" list
- [ ] Confirm it's not called by required services
- [ ] Check it's not in the Phase 1 user journey
- [ ] Ensure no database dependencies

### If Unsure
**Rule**: If it's related to money, payments, or external integrations → IGNORE IT

**Exception**: If it's in the "Required Services" list → USE IT

---

## COMMON QUESTIONS

### Q: Can I skip elasticsearch?
**A**: YES - Not needed for Phase 1. Use simple database queries.

### Q: Can I skip rabbitmq?
**A**: YES - Not needed for Phase 1. Use direct service calls.

### Q: Can I skip Custodii integration?
**A**: YES - Use MOCK mode in decision-authority-service.

### Q: Can I skip email notifications?
**A**: YES - Use in-app notifications only.

### Q: Can I skip the mobile app?
**A**: YES - Focus on web app only.

### Q: Can I skip payment-service?
**A**: YES - No real payments in Phase 1.

### Q: Can I skip wallet-service?
**A**: YES - No money custody in Phase 1.

### Q: Can I skip escrow-service?
**A**: YES - No escrow needed in Phase 1.

---

## RISK ASSESSMENT

### Ignoring These Services
**Risk Level**: ZERO  
**Reason**: Not part of Phase 1 scope  
**Impact**: None - Phase 1 doesn't use them  

### Using MOCK Mode
**Risk Level**: ZERO  
**Reason**: Phase 1 is proof-of-concept  
**Impact**: None - No real money involved  

### Skipping External Integrations
**Risk Level**: ZERO  
**Reason**: Phase 1 is local/staging only  
**Impact**: None - Not needed for matching workflow  

---

## FINAL SUMMARY

### Total Services in Codebase: 50+
### Services to Use in Phase 1: 8
### Services to Ignore: 42+

### Ignore Rate: 84%

**This is SAFE because**:
- Phase 1 has no real money
- Phase 1 is proof-of-concept only
- Phase 1 uses simple matching logic
- Phase 1 runs locally/staging only

**You can safely ignore 84% of the codebase for Phase 1**

---

**END OF IGNORE LIST**

**Status**: SAFE TO IGNORE  
**Risk**: ZERO  
**Impact**: NONE

