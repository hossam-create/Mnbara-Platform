# MNBARA PLATFORM - DEPLOYMENT CHECKLIST

## Pre-Deployment (Complete Before Day 4)

### Accounts & Services Setup
- [ ] Purchase domain name (mnbara.com or similar)
- [ ] Create DigitalOcean account
- [ ] Create Stripe account (activate live mode)
- [ ] Create SendGrid account
- [ ] Create Twilio account
- [ ] Create Sentry account
- [ ] Create UptimeRobot account
- [ ] Apple Developer Account ($99/year) - for iOS
- [ ] Google Play Developer Account ($25 one-time) - for Android

### Code Preparation
- [ ] All tests passing locally
- [ ] No console.log statements in production code
- [ ] Environment variables documented
- [ ] API documentation up to date
- [ ] Database migrations tested
- [ ] Seed data prepared
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] CORS settings verified

## Day 4: Infrastructure Setup

### Domain & DNS
- [ ] Domain purchased and verified
- [ ] DNS configured:
  - [ ] A record: mnbara.com → Server IP
  - [ ] CNAME: www → mnbara.com
  - [ ] CNAME: api → mnbara.com
  - [ ] CNAME: admin → mnbara.com
- [ ] DNS propagation verified (24-48 hours)

### DigitalOcean Setup
- [ ] App Platform project created
- [ ] GitHub repository connected
- [ ] PostgreSQL database created
  - [ ] Connection string saved
  - [ ] Automatic backups enabled
  - [ ] Firewall rules configured
- [ ] Redis instance created
  - [ ] Connection string saved
- [ ] Spaces (storage) created
  - [ ] CDN enabled
  - [ ] Access keys generated
  - [ ] CORS configured

### SSL/TLS
- [ ] SSL certificates provisioned
- [ ] HTTPS enforced
- [ ] Certificate auto-renewal enabled
- [ ] Mixed content warnings resolved

### Environment Variables
- [ ] Production .env files created
- [ ] JWT_SECRET generated (64-byte random)
- [ ] Stripe live keys configured
- [ ] Database URLs set
- [ ] Redis URLs set
- [ ] Email service configured
- [ ] SMS service configured
- [ ] Storage credentials set
- [ ] Sentry DSN configured
- [ ] All secrets stored securely

## Day 5: Deployment

### Database Migration
- [ ] Local database backed up
- [ ] Production database created
- [ ] Schema migrations run:
  - [ ] auth-service migrations
  - [ ] user-service migrations
  - [ ] product-service migrations
  - [ ] payment-service migrations
  - [ ] wallet-service migrations
  - [ ] escrow-service migrations
  - [ ] orders-service migrations
  - [ ] matching-service migrations
  - [ ] notification-service migrations
- [ ] Seed data loaded:
  - [ ] Countries (195+)
  - [ ] Currencies
  - [ ] Subscription plans
  - [ ] Categories
- [ ] Database indexes created
- [ ] Database backup verified

### Backend Deployment
- [ ] Code pushed to main branch
- [ ] Build successful
- [ ] All services deployed:
  - [ ] API Gateway
  - [ ] Auth Service
  - [ ] User Service
  - [ ] Product Service
  - [ ] Payment Service
  - [ ] Wallet Service
  - [ ] Escrow Service
  - [ ] Orders Service
  - [ ] Matching Service
  - [ ] Notification Service
  - [ ] Cart Service
  - [ ] Trips Service
  - [ ] Settlement Service
  - [ ] Feature Management Service
  - [ ] Admin Service
  - [ ] Country Layer Service
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Error tracking active

### Frontend Deployment
- [ ] Production build created
- [ ] Build optimized (minified, tree-shaken)
- [ ] Environment variables set
- [ ] Deployed to hosting:
  - [ ] Main app (mnbara.com)
  - [ ] Admin dashboard (admin.mnbara.com)
- [ ] Static assets on CDN
- [ ] Service worker configured
- [ ] PWA manifest configured
- [ ] Favicon and meta tags set
- [ ] Analytics tracking added

### Mobile App Deployment
- [ ] iOS build created
  - [ ] App signed
  - [ ] Uploaded to App Store Connect
  - [ ] Screenshots prepared
  - [ ] App description written
  - [ ] Submitted for review
- [ ] Android build created
  - [ ] App signed
  - [ ] Uploaded to Google Play Console
  - [ ] Screenshots prepared
  - [ ] App description written
  - [ ] Submitted for review

### Stripe Configuration
- [ ] Live mode activated
- [ ] Business verification completed
- [ ] Bank account connected
- [ ] Webhook endpoints configured:
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] customer.subscription.created
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] charge.refunded
- [ ] Webhook secrets saved
- [ ] Test payment processed (then refunded)
- [ ] Subscription plans created:
  - [ ] Seller Plan: $19.99/month
- [ ] Service fee configured: $2.99

### Email Configuration
- [ ] SendGrid domain verified
- [ ] SPF record added
- [ ] DKIM configured
- [ ] Email templates uploaded:
  - [ ] Welcome email
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Order confirmation
  - [ ] Payment receipt
  - [ ] Delivery notification
- [ ] Test emails sent
- [ ] Unsubscribe link working

### SMS Configuration
- [ ] Twilio phone number purchased
- [ ] SMS templates created:
  - [ ] OTP verification
  - [ ] Order updates
  - [ ] Delivery notifications
- [ ] Test SMS sent
- [ ] Opt-out handling configured

## Monitoring Setup

### Error Tracking (Sentry)
- [ ] Sentry project created
- [ ] DSN configured in all services
- [ ] Source maps uploaded
- [ ] Alert rules configured:
  - [ ] Critical errors → Immediate notification
  - [ ] High error rate → Alert
  - [ ] Performance degradation → Alert
- [ ] Team members invited
- [ ] Test error sent and received

### Uptime Monitoring (UptimeRobot)
- [ ] Monitors created:
  - [ ] https://mnbara.com
  - [ ] https://api.mnbara.com/health
  - [ ] https://admin.mnbara.com
- [ ] Check interval: 5 minutes
- [ ] Alert contacts configured:
  - [ ] Email alerts
  - [ ] SMS alerts (optional)
- [ ] Status page created (optional)

### Application Monitoring
- [ ] Logging configured
- [ ] Log aggregation setup
- [ ] Performance monitoring active
- [ ] Database query monitoring
- [ ] API response time tracking
- [ ] Custom dashboards created

## Security Checklist

### Application Security
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Rate limiting active
- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] Authentication required for protected routes
- [ ] Authorization checks in place
- [ ] Session management secure
- [ ] Password hashing (bcrypt)
- [ ] Secrets not in code
- [ ] Dependencies updated
- [ ] Security headers set:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security
  - [ ] Content-Security-Policy

### Infrastructure Security
- [ ] Firewall configured
- [ ] Database not publicly accessible
- [ ] Redis not publicly accessible
- [ ] SSH keys only (no password auth)
- [ ] Fail2ban configured
- [ ] Automatic security updates enabled
- [ ] Backup encryption enabled
- [ ] SSL/TLS enforced
- [ ] API keys rotated
- [ ] Access logs enabled

## Performance Checklist

### Frontend Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Code splitting configured
- [ ] Bundle size optimized
- [ ] Caching strategy implemented
- [ ] CDN for static assets
- [ ] Gzip/Brotli compression enabled

### Backend Performance
- [ ] Database indexes created
- [ ] Query optimization done
- [ ] N+1 queries eliminated
- [ ] Caching implemented (Redis)
- [ ] Connection pooling configured
- [ ] API response time < 500ms (p95)
- [ ] Rate limiting prevents abuse
- [ ] Background jobs for heavy tasks

## Legal & Compliance

### Legal Pages
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie Policy published
- [ ] Refund Policy published
- [ ] Acceptable Use Policy published
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if CA users)

### Business Setup
- [ ] Business entity registered
- [ ] Tax ID obtained
- [ ] Business bank account opened
- [ ] Payment processor agreement signed
- [ ] Insurance obtained (if required)
- [ ] Licenses obtained (if required)

## Launch Day Checklist

### Final Verification
- [ ] Run pre-launch validation script
- [ ] All services healthy
- [ ] Database accessible
- [ ] Redis accessible
- [ ] Payments processing
- [ ] Emails sending
- [ ] SMS sending
- [ ] File uploads working
- [ ] Mobile API working
- [ ] Admin dashboard accessible
- [ ] Monitoring active
- [ ] Backups running
- [ ] Support email monitored

### Soft Launch (Week 1)
- [ ] Beta user list prepared
- [ ] Invitation emails sent
- [ ] Welcome message prepared
- [ ] Feedback form created
- [ ] Support channels ready
- [ ] Monitor errors closely
- [ ] Daily check-ins with beta users
- [ ] Bug tracking system ready
- [ ] Hotfix deployment process tested

### Controlled Rollout (Week 2)
- [ ] Invite codes generated
- [ ] Social media posts scheduled
- [ ] Email campaign prepared
- [ ] Server capacity verified
- [ ] Scaling plan ready
- [ ] Support team briefed
- [ ] FAQ updated
- [ ] User onboarding flow tested

### Public Launch (Week 3)
- [ ] Marketing campaign ready
- [ ] Press release prepared
- [ ] Product Hunt submission ready
- [ ] Social media strategy planned
- [ ] Influencer outreach done
- [ ] Launch announcement drafted
- [ ] Customer support scaled
- [ ] Infrastructure auto-scaling enabled
- [ ] Celebration planned! 🎉

## Post-Launch Monitoring (First 48 Hours)

### Critical Metrics to Watch
- [ ] Server uptime
- [ ] Error rates
- [ ] API response times
- [ ] Database performance
- [ ] Payment success rate
- [ ] User registration rate
- [ ] Active users
- [ ] Support tickets
- [ ] Social media mentions
- [ ] Server load

### Daily Tasks (First Week)
- [ ] Review error logs
- [ ] Check monitoring dashboards
- [ ] Respond to support tickets
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Update documentation
- [ ] Post status updates
- [ ] Analyze user behavior
- [ ] Optimize performance
- [ ] Plan next iteration

---

## Emergency Contacts

**Technical Issues:**
- DevOps Lead: [Contact]
- Backend Lead: [Contact]
- Frontend Lead: [Contact]

**Business Issues:**
- CEO/Founder: [Contact]
- Customer Support: [Contact]

**Service Providers:**
- DigitalOcean Support: support.digitalocean.com
- Stripe Support: support.stripe.com
- SendGrid Support: support.sendgrid.com
- Twilio Support: support.twilio.com

---

**Last Updated:** [Date]
**Deployment Date:** [Target Date]
**Status:** Ready for Production ✅
