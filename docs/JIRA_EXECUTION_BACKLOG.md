# MNBARA Jira-Ready Execution Backlog

**Document Type:** Sprint-Ready Implementation Backlog  
**Status:** APPROVED FOR EXECUTION  
**Date:** December 2024

---

## Risk Register (Mandatory Tracking)

### R1 – Integrated Shipping Hub Complexity

| Attribute | Value |
|-----------|-------|
| **Owner** | Operations Lead |
| **Likelihood** | High |
| **Impact** | High |
| **Mitigation** | Phased regional rollout: USPS only → UPS → Crowdship. 90-day gates. |
| **Contingency** | Fallback to manual shipping with tracking links if API fails. |
| **Affected Stories** | SHP-*, Phase 2 |

### R2 – Buyer Protection Financial Exposure (MNBARA Shield)

| Attribute | Value |
|-----------|-------|
| **Owner** | Finance + Trust & Safety Lead |
| **Likelihood** | Medium |
| **Impact** | Critical |
| **Mitigation** | Tiered protection limits. Escrow partner absorbs risk. Fund caps. |
| **Contingency** | Pause new claims if fund utilization exceeds 5%. Manual review all claims >$500. |
| **Affected Stories** | PRO-*, SHD-*, Phase 1-2 |

### R3 – Seller Partnership Model Abuse

| Attribute | Value |
|-----------|-------|
| **Owner** | Trust & Safety Lead |
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Mitigation** | Gate benefits by Trust Score. Gaming detection. 48hr appeal process. |
| **Contingency** | Revoke benefits immediately on abuse detection. Manual review queue. |
| **Affected Stories** | TST-*, GOV-*, Phase 2 |

### R4 – Community Governance Decision Drift

| Attribute | Value |
|-----------|-------|
| **Owner** | Product Lead |
| **Likelihood** | Low |
| **Impact** | Medium |
| **Mitigation** | Advisory-only model. Platform retains final authority. Clear charter. |
| **Contingency** | Dissolve advisory board if decisions conflict with platform viability. |
| **Affected Stories** | GOV-*, Phase 2 |

### R5 – Fraud & Identity Weakness at Scale

| Attribute | Value |
|-----------|-------|
| **Owner** | Security Lead |
| **Likelihood** | High |
| **Impact** | Critical |
| **Mitigation** | 2FA mandatory for sellers. Phone verification. Device fingerprinting. |
| **Contingency** | Account lockout on suspicious activity. Manual verification queue. |
| **Affected Stories** | SEC-*, Phase 1 |

### R6 – Crowdship Network Scalability

| Attribute | Value |
|-----------|-------|
| **Owner** | Operations Lead |
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation** | Start with 2 pilot cities. Driver quality controls. Insurance coverage. |
| **Contingency** | Fallback to traditional carriers if crowdship SLA <90%. |
| **Affected Stories** | CRW-*, SHP-*, Phase 2-3 |

### R7 – Sustainability Feature Adoption Risk

| Attribute | Value |
|-----------|-------|
| **Owner** | Product Lead |
| **Likelihood** | Medium |
| **Impact** | Low |
| **Mitigation** | Position as cost savings (local-first = cheaper). Brand partnerships. |
| **Contingency** | Deprioritize if adoption <10% after 6 months. |
| **Affected Stories** | SUS-*, Phase 3 |

### R8 – Scope Creep Across Phases

| Attribute | Value |
|-----------|-------|
| **Owner** | Product Lead |
| **Likelihood** | High |
| **Impact** | Medium |
| **Mitigation** | Strict MVP/non-MVP separation. Phase gates. No new features without trade-off. |
| **Contingency** | Defer all non-MVP to next phase. Weekly scope review. |
| **Affected Stories** | All |

---

## Phase 1: Foundation & Trust (0-6 months)

### Epic 1.1: Security & Identity Baseline
**Risk Flag:** R5  
**Business Outcome:** -70% account takeovers, -$80K/year fraud losses

#### Story SEC-001: Twilio SMS Integration
**Type:** Story | **Priority:** Critical | **Points:** 3 | **MVP:** Yes

**As a** platform operator  
**I want** SMS OTP delivery via Twilio  
**So that** users can verify their identity securely

**Acceptance Criteria:**
- [ ] Twilio account configured with production credentials
- [ ] SMS delivery latency <5 seconds for 95% of messages
- [ ] Fallback to voice OTP if SMS fails 2x
- [ ] Rate limiting: max 5 OTPs per phone per hour
- [ ] OTP expires after 10 minutes
- [ ] Logging for all OTP requests (no PII in logs)

**Dependencies:** None  
**Risk:** Low

#### Story SEC-002: SMS 2FA Flow
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** user  
**I want** to enable SMS-based 2FA on my account  
**So that** my account is protected from unauthorized access

**Acceptance Criteria:**
- [ ] 2FA enrollment flow in auth service
- [ ] OTP verification on login when 2FA enabled
- [ ] Remember device option (30 days)
- [ ] Session invalidation on 2FA disable
- [ ] Audit log entry for all 2FA events

**Dependencies:** SEC-001  
**Risk:** Low

#### Story SEC-003: Authenticator App Support (TOTP)
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** security-conscious user  
**I want** to use an authenticator app for 2FA  
**So that** I have a more secure option than SMS

**Acceptance Criteria:**
- [ ] TOTP secret generation (RFC 6238 compliant)
- [ ] QR code display for app scanning
- [ ] Manual secret entry option
- [ ] Verification of first code before enabling
- [ ] Support for Google Authenticator, Authy, 1Password

**Dependencies:** SEC-002  
**Risk:** Low

#### Story SEC-004: 2FA Enrollment UI (Web)
**Type:** Story | **Priority:** High | **Points:** 3 | **MVP:** Yes

**As a** web user  
**I want** a clear UI to enable and manage 2FA  
**So that** I can easily secure my account

**Acceptance Criteria:**
- [ ] 2FA settings section in account security page
- [ ] Toggle between SMS and Authenticator
- [ ] QR code display with copy-able secret
- [ ] Success confirmation with backup codes display
- [ ] Accessible (WCAG 2.1 AA)

**Dependencies:** SEC-002, SEC-003  
**Risk:** Low

#### Story SEC-005: 2FA Enrollment UI (Mobile)
**Type:** Story | **Priority:** High | **Points:** 3 | **MVP:** Yes

**As a** mobile user  
**I want** to enable 2FA from the app  
**So that** I can secure my account on mobile

**Acceptance Criteria:**
- [ ] Native 2FA settings screen
- [ ] Deep link to authenticator apps
- [ ] Biometric confirmation before changes
- [ ] Consistent UX with web

**Dependencies:** SEC-002, SEC-003  
**Risk:** Low

#### Story SEC-006: Phone Verification for Sellers
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** platform operator  
**I want** all sellers to verify their phone number  
**So that** we reduce fake seller accounts and fraud

**Acceptance Criteria:**
- [ ] Phone verification required before first listing
- [ ] One phone per seller account (no duplicates)
- [ ] Verification badge displayed on seller profile
- [ ] Re-verification required if phone changes
- [ ] Admin override for edge cases

**Dependencies:** SEC-001  
**Risk:** Low

#### Story SEC-007: Device Fingerprinting
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** No

**As a** platform operator  
**I want** to fingerprint user devices  
**So that** we can detect multi-account abuse and suspicious logins

**Acceptance Criteria:**
- [ ] Browser fingerprint collection (canvas, fonts, etc.)
- [ ] Device ID storage per user
- [ ] Alert on new device login
- [ ] Block if >3 accounts from same device
- [ ] Privacy-compliant (no cross-site tracking)

**Dependencies:** SEC-002  
**Risk:** Medium

---

### Epic 1.2: Transparent Fees & Conversion
**Risk Flag:** R8 (scope creep)  
**Business Outcome:** -15% seller churn, -30% fee-related support tickets

#### Story TRN-001: Fee Calculator API
**Type:** Story | **Priority:** Critical | **Points:** 3 | **MVP:** Yes

**As a** seller  
**I want** an API that calculates exact fees before listing  
**So that** I know my costs upfront with no surprises

**Acceptance Criteria:**
- [ ] Endpoint: POST /api/v1/fees/calculate
- [ ] Input: category, price, duration, features
- [ ] Output: itemized fee breakdown (listing, final value, features)
- [ ] Response time <100ms
- [ ] Cached category fee rules

**Dependencies:** None  
**Risk:** Low

#### Story TRN-002: Real-Time Fee Calculator UI
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to see fees update in real-time as I create a listing  
**So that** I can make informed pricing decisions

**Acceptance Criteria:**
- [ ] Fee calculator component in listing flow
- [ ] Updates on price/category/duration change
- [ ] Shows: listing fee, estimated final value fee, total
- [ ] "No hidden fees" messaging
- [ ] Mobile responsive

**Dependencies:** TRN-001  
**Risk:** Low

#### Story TRN-003: Fee Breakdown on Listing Confirmation
**Type:** Story | **Priority:** High | **Points:** 2 | **MVP:** Yes

**As a** seller  
**I want** to see a complete fee breakdown before submitting my listing  
**So that** I confirm I understand all costs

**Acceptance Criteria:**
- [ ] Fee summary on listing preview page
- [ ] Expandable detailed breakdown
- [ ] Comparison to competitor fees (optional)
- [ ] "I understand the fees" checkbox

**Dependencies:** TRN-002  
**Risk:** Low

---

### Epic 1.3: Guest Checkout
**Risk Flag:** None  
**Business Outcome:** +15% conversion, -40% cart abandonment

#### Story CNV-001: Guest Checkout Backend
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to complete a purchase without creating an account  
**So that** I can buy quickly without friction

**Acceptance Criteria:**
- [ ] Guest order creation without user account
- [ ] Email required for order confirmation
- [ ] Guest order linked to email for tracking
- [ ] 30-day guest data retention
- [ ] GDPR compliant (consent for marketing)

**Dependencies:** None  
**Risk:** Low

#### Story CNV-002: Guest Checkout UI
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** a streamlined guest checkout flow  
**So that** I can complete my purchase in minimal steps

**Acceptance Criteria:**
- [ ] "Continue as Guest" option on checkout
- [ ] Single-page checkout (shipping + payment)
- [ ] Email validation with typo detection
- [ ] Order confirmation with tracking link
- [ ] "Create account" prompt post-purchase

**Dependencies:** CNV-001  
**Risk:** Low

#### Story CNV-003: Guest-to-Account Conversion
**Type:** Story | **Priority:** High | **Points:** 3 | **MVP:** Yes

**As a** guest buyer  
**I want** to easily create an account after purchase  
**So that** I can track my order and buy again faster

**Acceptance Criteria:**
- [ ] Post-purchase account creation prompt
- [ ] Pre-filled email from guest order
- [ ] Order history linked to new account
- [ ] One-click conversion (just add password)

**Dependencies:** CNV-001  
**Risk:** Low

#### Story CNV-004: Apple Pay Integration
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to pay with Apple Pay  
**So that** I can checkout quickly on my Apple device

**Acceptance Criteria:**
- [ ] Apple Pay button on checkout (Safari/iOS)
- [ ] Payment sheet with order summary
- [ ] Shipping address from Apple Pay
- [ ] Transaction completion <3 seconds
- [ ] Fallback to card entry if unavailable

**Dependencies:** None  
**Risk:** Low

#### Story CNV-005: Google Pay Integration
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to pay with Google Pay  
**So that** I can checkout quickly on Android/Chrome

**Acceptance Criteria:**
- [ ] Google Pay button on checkout
- [ ] Payment sheet with order summary
- [ ] Shipping address from Google Pay
- [ ] Transaction completion <3 seconds

**Dependencies:** None  
**Risk:** Low

---

### Epic 1.4: Basic Seller Analytics
**Risk Flag:** R8 (scope creep)  
**Business Outcome:** 80% dashboard adoption, +25% seller satisfaction

#### Story ANA-001: Analytics Data Pipeline
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**As a** platform operator  
**I want** a data pipeline capturing seller metrics  
**So that** we can provide analytics to sellers

**Acceptance Criteria:**
- [ ] Event tracking: listing views, clicks, purchases
- [ ] Daily aggregation job
- [ ] 90-day data retention
- [ ] Query latency <500ms for dashboard
- [ ] Data warehouse schema documented

**Dependencies:** None  
**Risk:** Medium

#### Story ANA-002: Traffic Analytics API
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to see how many people view my listings  
**So that** I can understand my reach

**Acceptance Criteria:**
- [ ] Endpoint: GET /api/v1/seller/analytics/traffic
- [ ] Metrics: views, unique visitors, sources
- [ ] Date range filter (7d, 30d, 90d)
- [ ] Per-listing breakdown
- [ ] Response time <300ms

**Dependencies:** ANA-001  
**Risk:** Low

#### Story ANA-003: Conversion Metrics API
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to see my conversion rates  
**So that** I can optimize my listings

**Acceptance Criteria:**
- [ ] Endpoint: GET /api/v1/seller/analytics/conversion
- [ ] Metrics: view-to-click, click-to-purchase, overall conversion
- [ ] Funnel visualization data
- [ ] Comparison to category average (anonymized)

**Dependencies:** ANA-001  
**Risk:** Low

#### Story ANA-004: Seller Dashboard UI
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**As a** seller  
**I want** a dashboard showing my performance  
**So that** I can track and improve my sales

**Acceptance Criteria:**
- [ ] Dashboard layout with key metrics cards
- [ ] Traffic chart (line graph, 30 days)
- [ ] Conversion funnel visualization
- [ ] Top performing listings table
- [ ] Mobile responsive
- [ ] Loading states and error handling

**Dependencies:** ANA-002, ANA-003  
**Risk:** Low

---

### Epic 1.5: Basic Buyer Protection
**Risk Flag:** R2  
**Business Outcome:** 95% claim resolution, <2% fund utilization

#### Story PRO-001: Escrow Partner Integration
**Type:** Story | **Priority:** Critical | **Points:** 13 | **MVP:** Yes

**As a** platform operator  
**I want** to integrate with a licensed escrow provider  
**So that** buyer payments are protected

**Acceptance Criteria:**
- [ ] Escrow partner contract signed
- [ ] API integration for payment holding
- [ ] Automatic release on delivery confirmation
- [ ] Hold period: 7 days after delivery
- [ ] Refund API for disputes
- [ ] Sandbox testing complete

**Dependencies:** Legal approval  
**Risk:** High (R2)

#### Story PRO-002: Claim Submission Workflow
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to file a protection claim if something goes wrong  
**So that** I can get my money back

**Acceptance Criteria:**
- [ ] Claim submission form (reason, evidence upload)
- [ ] Claim types: not received, not as described, damaged
- [ ] Photo/video evidence upload (max 10MB)
- [ ] Claim confirmation email
- [ ] 30-day window from delivery

**Dependencies:** PRO-001  
**Risk:** Medium

#### Story PRO-003: Claim Review Admin Panel
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** support agent  
**I want** to review and resolve protection claims  
**So that** buyers and sellers get fair outcomes

**Acceptance Criteria:**
- [ ] Claim queue with filters (status, age, amount)
- [ ] Claim detail view with evidence
- [ ] Seller response section
- [ ] Resolution actions: approve, deny, partial
- [ ] Resolution notes (internal)
- [ ] SLA tracking (48hr response target)

**Dependencies:** PRO-002  
**Risk:** Low

#### Story PRO-004: Automated Refund Processing
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** platform operator  
**I want** approved claims to trigger automatic refunds  
**So that** buyers get their money quickly

**Acceptance Criteria:**
- [ ] Refund initiated within 1 hour of approval
- [ ] Refund to original payment method
- [ ] Partial refund support
- [ ] Refund confirmation email to buyer
- [ ] Seller notification of claim outcome

**Dependencies:** PRO-001, PRO-003  
**Risk:** Medium (R2)

#### Story PRO-005: Protection Badge Display
**Type:** Story | **Priority:** High | **Points:** 2 | **MVP:** Yes

**As a** buyer  
**I want** to see that my purchase is protected  
**So that** I feel confident buying

**Acceptance Criteria:**
- [ ] "MNBARA Protected" badge on eligible listings
- [ ] Badge on checkout page
- [ ] Tooltip explaining protection terms
- [ ] Link to full protection policy

**Dependencies:** PRO-001  
**Risk:** Low

---

## Phase 1 Summary

| Epic | Stories | MVP Stories | Total Points | Risk Level |
|------|---------|-------------|--------------|------------|
| Security & Identity | 7 | 6 | 29 | Medium (R5) |
| Transparent Fees | 3 | 3 | 10 | Low |
| Guest Checkout | 5 | 5 | 23 | Low |
| Seller Analytics | 4 | 4 | 26 | Low |
| Buyer Protection | 5 | 5 | 30 | High (R2) |
| **Total** | **24** | **23** | **118** | **Medium** |

**Sprint Allocation (2-week sprints):**
- Sprint 1-2: Security (SEC-001 to SEC-006)
- Sprint 3-4: Fees + Checkout (TRN-*, CNV-*)
- Sprint 5-6: Analytics (ANA-*)
- Sprint 7-8: Protection (PRO-*)
- Sprint 9-10: Integration testing + hardening

---

## Phase 2: Competitive Moat (6-18 months)

### Epic 2.1: MNBARA Shield (Tiered Protection)
**Risk Flag:** R2  
**Business Outcome:** 95% claim resolution, buyer trust index +30%

#### Story SHD-001: Tiered Protection Limits
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** platform operator  
**I want** protection limits based on transaction value  
**So that** we manage financial exposure

**Acceptance Criteria:**
- [ ] Tier 1: $0-100 (auto-approve if evidence sufficient)
- [ ] Tier 2: $100-500 (manual review required)
- [ ] Tier 3: $500+ (senior review + seller response)
- [ ] Configurable tier thresholds
- [ ] Fund utilization dashboard

**Dependencies:** PRO-001  
**Risk:** High (R2)

#### Story SHD-002: Evidence Upload & Review
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to upload evidence for my claim  
**So that** my case is properly documented

**Acceptance Criteria:**
- [ ] Photo upload (up to 10 images)
- [ ] Video upload (up to 2 min)
- [ ] Document upload (PDF, max 5MB)
- [ ] Evidence preview in admin panel
- [ ] Secure storage (encrypted at rest)

**Dependencies:** PRO-002  
**Risk:** Low

#### Story SHD-003: Seller Response Workflow
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to respond to claims against me  
**So that** I can provide my side of the story

**Acceptance Criteria:**
- [ ] Seller notification of claim (email + in-app)
- [ ] 48-hour response window
- [ ] Counter-evidence upload
- [ ] Response visible to reviewer
- [ ] Auto-escalate if no response

**Dependencies:** SHD-002  
**Risk:** Low

#### Story SHD-004: Protection Fund Dashboard
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to see the protection fund status  
**So that** I trust the platform can pay claims

**Acceptance Criteria:**
- [ ] Public fund balance display
- [ ] Claims paid this month
- [ ] Average resolution time
- [ ] Updated daily
- [ ] Transparency messaging

**Dependencies:** PRO-001  
**Risk:** Low

---

### Epic 2.2: Seller Trust Score System
**Risk Flag:** R3  
**Business Outcome:** -25% dispute rate, quality differentiation

#### Story TST-001: Trust Score Algorithm Design
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**As a** platform operator  
**I want** a multi-factor trust score algorithm  
**So that** we can differentiate seller quality

**Acceptance Criteria:**
- [ ] Factors: transaction history, response time, dispute rate, verification level
- [ ] Weights documented and configurable
- [ ] Score range: 0-100
- [ ] Explainable factor breakdown
- [ ] Gaming detection rules defined

**Dependencies:** ANA-001  
**Risk:** Medium (R3)

#### Story TST-002: Trust Score Calculation Service
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**As a** platform operator  
**I want** automated trust score calculation  
**So that** scores update based on seller behavior

**Acceptance Criteria:**
- [ ] Daily score recalculation
- [ ] Real-time updates for major events (dispute, sale)
- [ ] Score history tracking
- [ ] API: GET /api/v1/seller/{id}/trust-score
- [ ] Batch processing for all sellers

**Dependencies:** TST-001  
**Risk:** Medium

#### Story TST-003: Trust Score Display on Listings
**Type:** Story | **Priority:** Critical | **Points:** 3 | **MVP:** Yes

**As a** buyer  
**I want** to see seller trust scores on listings  
**So that** I can assess seller reliability

**Acceptance Criteria:**
- [ ] Score badge on listing cards
- [ ] Score breakdown on seller profile
- [ ] Color coding: green (80+), yellow (50-79), red (<50)
- [ ] Tooltip with factor summary

**Dependencies:** TST-002  
**Risk:** Low

#### Story TST-004: Score-Based Benefit Tiers
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** high-trust seller  
**I want** benefits based on my trust score  
**So that** I'm rewarded for good behavior

**Acceptance Criteria:**
- [ ] Tier 1 (80+): Featured placement, lower fees
- [ ] Tier 2 (60-79): Standard benefits
- [ ] Tier 3 (<60): Restricted features, higher review
- [ ] Benefits clearly communicated
- [ ] Gated by Trust Score (R3 mitigation)

**Dependencies:** TST-002  
**Risk:** Medium (R3)

#### Story TST-005: Gaming Detection
**Type:** Story | **Priority:** High | **Points:** 8 | **MVP:** Yes

**As a** platform operator  
**I want** to detect trust score manipulation  
**So that** the system remains fair

**Acceptance Criteria:**
- [ ] Detect: fake transactions, review bombing, collusion
- [ ] Alert on suspicious patterns
- [ ] Manual review queue for flagged sellers
- [ ] Score freeze during investigation
- [ ] Appeal process (48hr response)

**Dependencies:** TST-002  
**Risk:** High (R3)

---

### Epic 2.3: Integrated Shipping Hub (Phased)
**Risk Flag:** R1, R6  
**Business Outcome:** 50% label adoption, -25% shipping complaints

#### Story SHP-001: USPS API Integration (Phase 2a)
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**As a** seller  
**I want** to generate USPS shipping labels  
**So that** I can ship items easily

**Acceptance Criteria:**
- [ ] USPS Web Tools API integration
- [ ] Rate calculation for all USPS services
- [ ] Label generation (PDF)
- [ ] Tracking number retrieval
- [ ] Sandbox testing complete

**Dependencies:** USPS API contract  
**Risk:** Medium (R1)

#### Story SHP-002: Label Printing UI
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to print shipping labels from my dashboard  
**So that** I can fulfill orders quickly

**Acceptance Criteria:**
- [ ] Label generation from order detail
- [ ] Service selection (Priority, First Class, etc.)
- [ ] Package dimensions input
- [ ] Print preview
- [ ] Download PDF option

**Dependencies:** SHP-001  
**Risk:** Low

#### Story SHP-003: Tracking Integration
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to track my shipment  
**So that** I know when it will arrive

**Acceptance Criteria:**
- [ ] Tracking webhook from USPS
- [ ] Status updates in order detail
- [ ] Email notifications on status change
- [ ] Estimated delivery date display
- [ ] Tracking link to carrier site

**Dependencies:** SHP-001  
**Risk:** Low

#### Story SHP-004: UPS Integration (Phase 2b)
**Type:** Story | **Priority:** High | **Points:** 8 | **MVP:** No

**As a** seller  
**I want** UPS as a shipping option  
**So that** I have carrier choice

**Acceptance Criteria:**
- [ ] UPS API integration
- [ ] Rate comparison with USPS
- [ ] Label generation
- [ ] Tracking integration
- [ ] Go/No-Go: Only after 90-day USPS pilot success

**Dependencies:** SHP-001 success (90 days)  
**Risk:** Medium (R1)

#### Story SHP-005: Crowdship Integration (Phase 2c)
**Type:** Story | **Priority:** High | **Points:** 13 | **MVP:** No

**As a** seller  
**I want** crowdship for local deliveries  
**So that** I can offer faster, cheaper local shipping

**Acceptance Criteria:**
- [ ] Crowdship service API integration
- [ ] Local delivery option (<25 miles)
- [ ] Real-time driver tracking
- [ ] Delivery confirmation with photo
- [ ] Pilot: 2 cities only (R6 mitigation)

**Dependencies:** SHP-001, Crowdship service ready  
**Risk:** High (R1, R6)

---

### Epic 2.4: Smart Negotiation Tools
**Risk Flag:** None  
**Business Outcome:** 40% negotiation success, +15% transaction value

#### Story NEG-001: Offer/Counter-Offer API
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** to make offers on listings  
**So that** I can negotiate a better price

**Acceptance Criteria:**
- [ ] POST /api/v1/listings/{id}/offers
- [ ] Offer states: pending, accepted, rejected, countered, expired
- [ ] Counter-offer support
- [ ] 24-hour offer expiration
- [ ] Notification on offer events

**Dependencies:** None  
**Risk:** Low

#### Story NEG-002: Negotiation UI
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**As a** buyer  
**I want** a clear UI to make and track offers  
**So that** I can negotiate easily

**Acceptance Criteria:**
- [ ] "Make Offer" button on listings
- [ ] Offer modal with price input
- [ ] Offer history view
- [ ] Counter-offer display
- [ ] Accept/Reject buttons for sellers

**Dependencies:** NEG-001  
**Risk:** Low

#### Story NEG-003: Auto-Accept Rules
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to set auto-accept rules for offers  
**So that** I don't miss good offers

**Acceptance Criteria:**
- [ ] Auto-accept threshold (e.g., >90% of asking)
- [ ] Auto-reject threshold (e.g., <50% of asking)
- [ ] Per-listing or account-wide settings
- [ ] Notification when auto-action taken

**Dependencies:** NEG-001  
**Risk:** Low

#### Story NEG-004: Negotiation History
**Type:** Story | **Priority:** High | **Points:** 3 | **MVP:** Yes

**As a** seller  
**I want** to see negotiation history  
**So that** I can track all offers on my listings

**Acceptance Criteria:**
- [ ] Negotiation history in seller dashboard
- [ ] Filter by listing, status, date
- [ ] Export to CSV
- [ ] Analytics: avg offer %, acceptance rate

**Dependencies:** NEG-001  
**Risk:** Low

---

### Epic 2.5: Community Verification Framework
**Risk Flag:** R3, R4  
**Business Outcome:** 10% sellers community-verified, trust differentiation

#### Story GOV-001: Advisory Board Charter
**Type:** Story | **Priority:** Critical | **Points:** 3 | **MVP:** Yes

**As a** platform operator  
**I want** a clear advisory board charter  
**So that** governance roles are defined

**Acceptance Criteria:**
- [ ] Charter document: purpose, scope, authority
- [ ] Advisory-only (platform retains final decision)
- [ ] Member selection criteria
- [ ] Term limits (1 year)
- [ ] Meeting cadence (monthly)

**Dependencies:** None  
**Risk:** Low (R4 mitigation)

#### Story GOV-002: Seller Advisory Nomination
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** seller  
**I want** to nominate myself for the advisory board  
**So that** I can represent seller interests

**Acceptance Criteria:**
- [ ] Nomination form (experience, goals)
- [ ] Eligibility: Trust Score 70+, 6+ months active
- [ ] Nomination review by platform
- [ ] Selection notification
- [ ] Public advisory member list

**Dependencies:** GOV-001, TST-002  
**Risk:** Low

#### Story GOV-003: Policy Feedback Collection
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**As a** platform operator  
**I want** to collect seller feedback on policy changes  
**So that** we make informed decisions

**Acceptance Criteria:**
- [ ] Feedback form for proposed policies
- [ ] Structured questions + open comments
- [ ] Feedback summary for advisory review
- [ ] Response rate tracking
- [ ] Feedback incorporated into decision docs

**Dependencies:** GOV-001  
**Risk:** Low

#### Story GOV-004: Feature Voting System
**Type:** Story | **Priority:** Medium | **Points:** 5 | **MVP:** No

**As a** seller  
**I want** to vote on feature priorities  
**So that** my voice influences the roadmap

**Acceptance Criteria:**
- [ ] Feature voting portal
- [ ] One vote per seller per feature
- [ ] Vote weight by Trust Score (optional)
- [ ] Results visible to community
- [ ] Non-binding (platform decides)

**Dependencies:** GOV-001  
**Risk:** Low (R4 mitigation)

---

## Phase 2 Summary

| Epic | Stories | MVP Stories | Total Points | Risk Level |
|------|---------|-------------|--------------|------------|
| MNBARA Shield | 4 | 4 | 20 | High (R2) |
| Trust Score | 5 | 5 | 32 | Medium (R3) |
| Shipping Hub | 5 | 3 | 39 | High (R1, R6) |
| Negotiation | 4 | 4 | 18 | Low |
| Community Verification | 4 | 3 | 18 | Low (R4) |
| **Total** | **22** | **19** | **127** | **Medium-High** |

---

## Phase 3: Strategic Differentiation (18+ months)

### Epic 3.1: Crowdship Network Expansion
**Risk Flag:** R6  
**Business Outcome:** 20% deliveries via crowdship, -40% shipping costs

#### Story CRW-001: Driver Incentive Program
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Per-delivery payment structure
- [ ] Bonus for high ratings
- [ ] Surge pricing for high demand
- [ ] Weekly payout schedule

**Dependencies:** SHP-005  
**Risk:** Medium (R6)

#### Story CRW-002: Driver Recruitment Portal
**Type:** Story | **Priority:** Critical | **Points:** 8 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Driver application form
- [ ] Background check integration
- [ ] Vehicle verification
- [ ] Onboarding flow
- [ ] Driver dashboard

**Dependencies:** CRW-001  
**Risk:** Medium

#### Story CRW-003: Route Optimization
**Type:** Story | **Priority:** High | **Points:** 13 | **MVP:** No

**Acceptance Criteria:**
- [ ] Multi-stop route optimization
- [ ] Real-time traffic integration
- [ ] Batch delivery grouping
- [ ] ETA accuracy >90%

**Dependencies:** CRW-002  
**Risk:** High (R6)

---

### Epic 3.2: Sustainability Marketplace
**Risk Flag:** R7  
**Business Outcome:** 50% carbon-tracked transactions, brand differentiation

#### Story SUS-001: Carbon Calculation API
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Carbon API integration (e.g., Climatiq)
- [ ] Per-transaction footprint calculation
- [ ] Factors: distance, weight, carrier
- [ ] Display on order confirmation

**Dependencies:** SHP-003  
**Risk:** Low

#### Story SUS-002: Local-First Recommendations
**Type:** Story | **Priority:** High | **Points:** 8 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Prioritize local sellers in search
- [ ] "Local" badge on listings
- [ ] Distance-based sorting option
- [ ] Carbon savings display

**Dependencies:** SUS-001  
**Risk:** Low

#### Story SUS-003: Green Seller Badge
**Type:** Story | **Priority:** High | **Points:** 5 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Badge criteria: local shipping, sustainable packaging
- [ ] Badge display on listings
- [ ] Seller application process
- [ ] Annual re-verification

**Dependencies:** SUS-001, TST-002  
**Risk:** Low

---

### Epic 3.3: Social Shopping
**Risk Flag:** R8  
**Business Outcome:** 15% social engagement, community-driven discovery

#### Story SOC-001: Wishlist Sharing
**Type:** Story | **Priority:** Critical | **Points:** 5 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Public/private wishlist toggle
- [ ] Shareable wishlist link
- [ ] Social media share buttons
- [ ] Wishlist notifications

**Dependencies:** None  
**Risk:** Low

#### Story SOC-002: Follow Seller
**Type:** Story | **Priority:** High | **Points:** 3 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Follow button on seller profile
- [ ] New listing notifications
- [ ] Following feed
- [ ] Unfollow option

**Dependencies:** None  
**Risk:** Low

#### Story SOC-003: Group Buying
**Type:** Story | **Priority:** Medium | **Points:** 13 | **MVP:** No

**Acceptance Criteria:**
- [ ] Group purchase creation
- [ ] Invite friends to join
- [ ] Discount at threshold
- [ ] Payment coordination

**Dependencies:** SOC-001  
**Risk:** High (R8)

---

### Epic 3.4: Regional Expansion Framework
**Risk Flag:** R8  
**Business Outcome:** 2+ regional launches, 30% international GMV

#### Story REG-001: Multi-Region Architecture
**Type:** Story | **Priority:** Critical | **Points:** 13 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Region configuration service
- [ ] Database sharding strategy
- [ ] CDN for regional content
- [ ] Latency <200ms per region

**Dependencies:** None  
**Risk:** High

#### Story REG-002: Regional Payment Gateways
**Type:** Story | **Priority:** Critical | **Points:** 13 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] Payment gateway abstraction layer
- [ ] Region-specific gateway config
- [ ] Local currency support
- [ ] Compliance per region

**Dependencies:** REG-001  
**Risk:** High

#### Story REG-003: Multi-Language Support
**Type:** Story | **Priority:** High | **Points:** 8 | **MVP:** Yes

**Acceptance Criteria:**
- [ ] i18n framework implementation
- [ ] Translation management system
- [ ] RTL support
- [ ] Language detection

**Dependencies:** REG-001  
**Risk:** Medium

---

## Phase 3 Summary

| Epic | Stories | MVP Stories | Total Points | Risk Level |
|------|---------|-------------|--------------|------------|
| Crowdship Expansion | 3 | 2 | 29 | High (R6) |
| Sustainability | 3 | 3 | 18 | Low (R7) |
| Social Shopping | 3 | 2 | 21 | Medium (R8) |
| Regional Expansion | 3 | 3 | 34 | High |
| **Total** | **12** | **10** | **102** | **High** |

---

## Execution Order Summary

### Phase 1 Sprint Plan (10 sprints)
1. SEC-001, SEC-002, TRN-001
2. SEC-003, SEC-004, TRN-002
3. SEC-005, SEC-006, TRN-003
4. CNV-001, CNV-002, CNV-003
5. CNV-004, CNV-005
6. ANA-001, ANA-002
7. ANA-003, ANA-004
8. PRO-001 (long-running)
9. PRO-002, PRO-003
10. PRO-004, PRO-005, Integration

### Phase 2 Sprint Plan (12 sprints)
1-2. SHD-001, SHD-002, SHD-003
3-4. TST-001, TST-002
5-6. TST-003, TST-004, TST-005
7-8. SHP-001, SHP-002
9-10. SHP-003, NEG-001, NEG-002
11-12. NEG-003, NEG-004, GOV-001, GOV-002, GOV-003

### Phase 3 Sprint Plan (10 sprints)
1-2. CRW-001, CRW-002
3-4. SUS-001, SUS-002, SUS-003
5-6. SOC-001, SOC-002
7-8. REG-001
9-10. REG-002, REG-003

---

## Document Control

| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | Dec 2024 | Execution Team | APPROVED |

**Import Instructions:**
- Copy stories to Jira/Linear/ClickUp
- Set epic links
- Assign to sprints per plan above
- Add risk labels (R1-R8) to affected stories
