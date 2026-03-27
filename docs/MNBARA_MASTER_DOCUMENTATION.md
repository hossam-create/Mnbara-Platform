# Mnbara Platform - Master Documentation

**Version:** 1.0  
**Date:** February 14, 2026  
**Status:** Active Development (40% Complete)  
**Purpose:** Single source of truth for all platform documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Microservices Catalog](#microservices-catalog)
4. [Dashboards & User Interfaces](#dashboards--user-interfaces)
5. [Core Flows](#core-flows)
6. [API Reference](#api-reference)
7. [Current Status & Gaps](#current-status--gaps)
8. [Deployment & Operations](#deployment--operations)
9. [Development Guide](#development-guide)
10. [Appendices](#appendices)

---

## Executive Summary

### Platform Overview

Mnbara is a dual-purpose platform combining:

1. **E-commerce Marketplace** - Buy/sell products with advanced auction system
2. **Crowdshipping Service** - Peer-to-peer package delivery via travelers

### Current State (February 2026)

- **Completion:** 40% of full vision
- **Microservices:** 87 services (35 active, 20 planned, 32 under review)
- **Timeline to MVP:** 6 weeks
- **Timeline to Full Vision:** 12-16 months

### Key Achievements

✅ Strong technical foundation (Microservices, Docker, PostgreSQL, Redis)  
✅ Core features working (Auth, Listings, Auctions, P2P Exchange)  
✅ Trust & Safety system (Decision Authority, KYC, Fraud Detection)  
✅ Admin dashboard and frontend  
✅ Comprehensive testing framework

### Critical Gaps

❌ Real money custody (currently mock)  
❌ Bank integration (currently mock)  
❌ AI features (90% missing)  
❌ Geolocation features (95% missing)  
❌ Mobile apps (80% missing - structure exists)

### MVP Strategy (6 Weeks)

**External Providers:**
- Stripe Connect (payment processing)
- Escrow Kenya (money custody - partner account ready)
- OpenExchangeRates (real-time FX rates)

**Budget:** $25K-$50K  
**Risk:** Low (proven providers)



---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>React/TypeScript]
        MOBILE[Mobile App<br/>Flutter]
        ADMIN[Admin Dashboard<br/>React]
    end
    
    subgraph "API Gateway Layer"
        GATEWAY[API Gateway<br/>Kong/Express]
    end
    
    subgraph "Core Services"
        AUTH[Auth Service<br/>JWT/OAuth]
        USER[User Service<br/>Profiles]
        PRODUCT[Product Service<br/>Catalog]
        AUCTION[Auction Service<br/>Bidding]
    end
    
    subgraph "Financial Services"
        PAYMENT[Payment Service<br/>Stripe]
        LEDGER[Internal Ledger<br/>Wallet]
        ESCROW[Escrow Service<br/>Custody]
        P2P[P2P Exchange<br/>Marketplace]
    end
    
    subgraph "Crowdshipping Services"
        REQUEST[Request Engine<br/>Delivery]
        TRIPS[Trips Service<br/>Travelers]
        LOCATION[Location Service<br/>GPS]
        MATCHING[Matching Service<br/>Algorithm]
    end
    
    subgraph "Trust & Safety"
        DECISION[Decision Authority<br/>Custodii]
        KYC[KYC Service<br/>Verification]
        FRAUD[Fraud Detection<br/>Risk]
    end
    
    subgraph "Communication"
        CHAT[Chat Service<br/>Messaging]
        NOTIF[Notification Service<br/>Multi-channel]
    end
    
    subgraph "AI Services"
        AI_AGENT[AI Agent Service<br/>Assistant]
        AI_REC[AI Recommendations<br/>ML]
        AI_PRICE[AI Pricing<br/>Dynamic]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary DB)]
        REDIS[(Redis<br/>Cache)]
        ELASTIC[(Elasticsearch<br/>Search)]
        RABBIT[(RabbitMQ<br/>Queue)]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    ADMIN --> GATEWAY
    
    GATEWAY --> AUTH
    GATEWAY --> USER
    GATEWAY --> PRODUCT
    GATEWAY --> AUCTION
    GATEWAY --> PAYMENT
    GATEWAY --> REQUEST
    
    AUTH --> POSTGRES
    USER --> POSTGRES
    PRODUCT --> POSTGRES
    AUCTION --> POSTGRES
    
    PAYMENT --> LEDGER
    LEDGER --> ESCROW
    PAYMENT --> P2P
    
    REQUEST --> TRIPS
    REQUEST --> MATCHING
    TRIPS --> LOCATION
    
    AUCTION --> DECISION
    USER --> KYC
    PAYMENT --> FRAUD
    
    PRODUCT --> AI_REC
    AUCTION --> AI_PRICE
    USER --> AI_AGENT
    
    GATEWAY --> REDIS
    PRODUCT --> ELASTIC
    AUCTION --> RABBIT
```

### Technology Stack

#### Frontend
- **Web:** React 18, TypeScript, Vite, TailwindCSS
- **Mobile:** Flutter (structure ready, 20% implemented)
- **State Management:** Redux Toolkit, React Query

#### Backend
- **Runtime:** Node.js 18+, TypeScript
- **Framework:** Express.js
- **API Gateway:** Kong/Express
- **Authentication:** JWT, OAuth2 (Google/Facebook/Apple ready)

#### Databases
- **Primary:** PostgreSQL 14+ with PostGIS
- **Cache:** Redis 7+
- **Search:** Elasticsearch 8+ (planned)
- **Queue:** RabbitMQ (planned)

#### Infrastructure
- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes (Helm charts ready)
- **CI/CD:** GitHub Actions (to be setup)
- **Cloud:** AWS (to be setup)
- **Monitoring:** Prometheus + Grafana

#### External Integrations
- **Payments:** Stripe Connect, PayPal (planned)
- **Escrow:** Escrow Kenya (to be integrated)
- **FX Rates:** OpenExchangeRates
- **Decision Engine:** Custodii (integrated)
- **Notifications:** OneSignal, FCM



---

## Microservices Catalog

### Service Status Legend

- ✅ **Active** - Fully implemented and in use
- 🔄 **Review** - Exists but needs review for duplication/consolidation
- 📋 **Planned** - Planned but not yet implemented
- ⚠️ **Duplicate** - Potential duplicate, needs consolidation
- 🔧 **Dev** - Development/testing only

### Core Services (Authentication & User Management)

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **auth-service** | User authentication, OAuth2, JWT, sessions | ✅ Active | 3001 | `backend/services/auth-service/` |
| **user-service** | User profiles, preferences, management | ✅ Active | 3002 | `backend/services/user-service/` |
| **kyc-service** | KYC verification, identity validation | ✅ Active | 3003 | `backend/services/kyc-service/` |
| **customer-id-service** | Customer identity management | 🔄 Review | 3004 | `backend/services/customer-id-service/` |

### Payment & Financial Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **payment-service** | Payment processing, Stripe integration | ✅ Active | 3010 | `backend/services/payment-service/` |
| **internal-ledger-service** | Internal wallet, ledger, payouts | ✅ Active | 3011 | `backend/services/internal-ledger-service/` |
| **wallet-service** | User wallet management | ✅ Active | 3012 | `backend/services/wallet-service/` |
| **unified-wallet-service** | Unified wallet interface | 🔄 Review | 3013 | `backend/services/unified-wallet-service/` |
| **escrow-service** | Escrow for transactions | ✅ Active | 3014 | `backend/services/escrow-service/` |
| **stripe-connect-service** | Stripe Connect for sellers | ✅ Active | 3015 | `backend/services/stripe-connect-service/` |
| **paypal-service** | PayPal integration | 📋 Planned | 3016 | `backend/services/paypal-service/` |
| **settlement-service** | Payment settlement | 🔄 Review | 3017 | `backend/services/settlement-service/` |
| **card-service** | Card management | 📋 Planned | 3018 | `backend/services/card-service/` |
| **crypto-service** | Cryptocurrency payments | 📋 Planned | 3019 | `backend/services/crypto-service/` |
| **bnpl-service** | Buy Now Pay Later | 📋 Planned | 3020 | `backend/services/bnpl-service/` |

### E-commerce Core Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **product-service** | Product catalog, listings | ✅ Active | 3030 | `backend/services/product-service/` |
| **listing-service** | Product listing management | ✅ Active | 3031 | `backend/services/listing-service/` |
| **auction-service** | Auction system, bidding | ✅ Active | 3032 | `backend/services/auction-service/` |
| **cart-service** | Shopping cart | 🔄 Review | 3033 | `backend/services/cart-service/` |
| **orders-service** | Order management | ✅ Active | 3034 | `backend/services/orders-service/` |
| **category-service** | Product categorization | 🔄 Review | 3035 | `backend/services/category-service/` |
| **seller-service** | Seller management | 🔄 Review | 3036 | `backend/services/seller-service/` |
| **wholesale-service** | Wholesale operations | 📋 Planned | 3037 | `backend/services/wholesale-service/` |

### Crowdshipping Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **request-engine** | Delivery requests, disputes, refunds | ✅ Active | 3040 | `backend/services/request-engine/` |
| **trips-service** | Traveler trip management | ✅ Active | 3041 | `backend/services/trips-service/` |
| **location-service** | GPS tracking, geolocation | ✅ Active | 3042 | `backend/services/location-service/` |
| **matching-service** | Match travelers with packages | ✅ Active | 3043 | `backend/services/matching-service/` |
| **crowdship-service** | Crowdshipping coordination | 🔄 Review | 3044 | `backend/services/crowdship-service/` |
| **smart-delivery-service** | Smart delivery routing | 📋 Planned | 3045 | `backend/services/smart-delivery-service/` |

### P2P Exchange & Marketplace

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **p2p-exchange-service** | P2P currency/goods exchange | ✅ Active | 3050 | `backend/services/p2p-exchange-service/` |

### Communication Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **chat-service** | Real-time messaging | ✅ Active | 3060 | `backend/services/chat-service/` |
| **notification-service** | Multi-channel notifications | ✅ Active | 3061 | `backend/services/notification-service/` |
| **push-notification-service** | Push notifications | ✅ Active | 3062 | `backend/services/push-notification-service/` |
| **novu-service** | Novu notification integration | ✅ Active | 3063 | `backend/services/novu-service/` |

### AI & Intelligence Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **ai-agent-service** | AI agents, shopping assistant | ✅ Active | 3070 | `backend/services/ai-agent-service/` |
| **ai-assistant-service** | AI assistant features | 🔄 Review | 3071 | `backend/services/ai-assistant-service/` |
| **ai-recommendations** | Product recommendations | ✅ Active | 3072 | `backend/services/ai-recommendations/` |
| **ai-pricing-service** | Dynamic pricing | ✅ Active | 3073 | `backend/services/ai-pricing-service/` |
| **ai-buyer-service** | AI buyer assistance | 🔄 Review | 3074 | `backend/services/ai-buyer-service/` |
| **ai-business-service** | AI business intelligence | 📋 Planned | 3075 | `backend/services/ai-business-service/` |
| **ai-chatbot-service** | Chatbot service | 📋 Planned | 3076 | `backend/services/ai-chatbot-service/` |
| **ai-core** | Core AI functionality | 🔄 Review | 3077 | `backend/services/ai-core/` |
| **mnbarh-ai-engine** | Main AI engine | 🔄 Review | 3078 | `backend/services/mnbarh-ai-engine/` |
| **recommendation-engine-service** | Recommendation engine | ✅ Active | 3079 | `backend/services/recommendation-engine-service/` |
| **recommendation-service** | Recommendation API | 🔄 Review | 3080 | `backend/services/recommendation-service/` |

### Search & Discovery

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **search-service** | Product search | ✅ Active | 3090 | `backend/services/search-service/` |
| **image-recognition-service** | Image recognition | ✅ Active | 3091 | `backend/services/image-recognition-service/` |
| **image-processing-service** | Image processing | ✅ Active | 3092 | `backend/services/image-processing-service/` |

### Trust & Safety Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **decision-authority-service** | Custodii decision integration | ✅ Active | 3100 | `backend/services/decision-authority-service/` |
| **fraud-detection-service** | Fraud detection | ✅ Active | 3101 | `backend/services/fraud-detection-service/` |
| **security-service** | Security features | ✅ Active | 3102 | `backend/services/security-service/` |
| **compliance-service** | Compliance management | 🔄 Review | 3103 | `backend/services/compliance-service/` |
| **geolock-service** | Geographic restrictions | ✅ Active | 3104 | `backend/services/geolock-service/` |

### Review & Rating Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **review-service** | Reviews and ratings | ✅ Active | 3110 | `backend/services/review-service/` |
| **rewards-service** | Loyalty and rewards | ✅ Active | 3111 | `backend/services/rewards-service/` |

### Infrastructure & Platform Services

| Service | Purpose | Status | Port | Location |
|---------|---------|--------|------|----------|
| **api-gateway** | API gateway, routing | ✅ Active | 3000 | `backend/services/api-gateway/` |
| **event-bus** | Event-driven messaging | 🔄 Review | 3120 | `backend/services/event-bus/` |
| **job-queue-service** | Background job processing | ✅ Active | 3121 | `backend/services/job-queue-service/` |
| **task-scheduler** | Scheduled tasks | ✅ Active | 3122 | `backend/services/task-scheduler/` |
| **file-storage-service** | File storage | ✅ Active | 3123 | `backend/services/file-storage-service/` |
| **analytics-service** | Analytics and tracking | ✅ Active | 3124 | `backend/services/analytics-service/` |
| **monitoring** | System monitoring | 🔄 Review | 3125 | `backend/services/monitoring/` |



---

## Dashboards & User Interfaces

### Control Center Dashboard (Main Hub)

**Purpose:** Central navigation and monitoring hub for all users

**Features:**
- Quick access to all major sections
- Real-time notifications
- Activity feed
- Wallet balance overview
- Quick actions (Create listing, Start trip, etc.)

**Access:** All authenticated users

### Admin Dashboard

**Purpose:** Platform management and oversight

**Sections:**

1. **Overview**
   - Platform statistics
   - Revenue metrics
   - Active users/listings/auctions
   - System health

2. **User Management**
   - User list and search
   - KYC verification queue
   - Trust score management
   - Ban/suspend users

3. **Listing Management**
   - Pending approvals
   - Flagged listings
   - Category management
   - Bulk operations

4. **Auction Management**
   - Active auctions
   - Dispute resolution
   - Trust enforcement
   - Rule results review

5. **Financial Management**
   - Payout approvals (Manual Payout System)
   - Transaction monitoring
   - Refund processing
   - Revenue reports

6. **Decision Authority**
   - Custodii integration status
   - Decision queue
   - Audit logs
   - Rule configuration

7. **P2P Exchange**
   - Exchange requests
   - Proof verification
   - Security deposit management
   - Arbitration cases

8. **System Management**
   - Service health
   - Configuration
   - Feature flags
   - Logs and monitoring

**Access:** Admin users only

### Buyer Dashboard

**Purpose:** Shopping and purchase management

**Sections:**

1. **Browse & Search**
   - Product catalog
   - Advanced filters
   - Saved searches
   - Recommendations

2. **My Purchases**
   - Order history
   - Active bids
   - Won auctions
   - Delivery tracking

3. **My Wallet**
   - Balance overview
   - Transaction history
   - Deposit funds
   - Withdraw funds

4. **Messages**
   - Chat with sellers
   - Chat with travelers
   - Support tickets

5. **Profile**
   - Personal information
   - KYC status
   - Trust score
   - Settings

**Access:** Buyer role

### Seller Dashboard

**Purpose:** Product and sales management

**Sections:**

1. **My Listings**
   - Active listings
   - Draft listings
   - Sold items
   - Performance metrics

2. **Create Listing**
   - Product details
   - Images upload
   - Pricing (Fixed/Auction/Make Offer)
   - Category selection

3. **Sales Management**
   - Pending orders
   - Completed sales
   - Returns/disputes
   - Revenue tracking

4. **My Wallet**
   - Balance overview
   - Pending payouts
   - Transaction history
   - Payout requests

5. **Analytics**
   - Views and engagement
   - Conversion rates
   - Best performing items
   - Customer insights

6. **Messages**
   - Chat with buyers
   - Support tickets

**Access:** Seller role

### Traveler Dashboard

**Purpose:** Trip and delivery management

**Sections:**

1. **My Trips**
   - Active trips
   - Past trips
   - Trip earnings
   - Create new trip

2. **Delivery Requests**
   - Available requests
   - Matched requests
   - In-progress deliveries
   - Completed deliveries

3. **Route Matching**
   - Smart matching algorithm
   - Distance calculations
   - Earnings estimates
   - Accept/decline requests

4. **My Wallet**
   - Balance overview
   - Delivery earnings
   - Transaction history
   - Payout requests

5. **Location Tracking**
   - Current location
   - Trip route
   - Delivery checkpoints
   - GPS history

6. **Messages**
   - Chat with shippers
   - Support tickets

**Access:** Traveler role

### Wallet Dashboard (All Users)

**Purpose:** Financial management and transactions

**Features:**

1. **Balance Overview**
   - Available balance
   - Pending balance
   - Escrow balance
   - Total balance

2. **Transaction History**
   - All transactions
   - Filters (date, type, status)
   - Export to CSV
   - Receipt download

3. **Deposit Funds**
   - Credit/debit card
   - Bank transfer
   - PayPal
   - Crypto (planned)

4. **Withdraw Funds**
   - Bank account
   - PayPal
   - Stripe payout
   - Manual payout request

5. **Financial Dashboard** (Internal Ledger)
   - Revenue metrics
   - Expense tracking
   - Profit/loss
   - Cash flow analysis

6. **Payout Management**
   - Request payout
   - Payout history
   - Approval status
   - 2FA verification

**Access:** All authenticated users



---

## Core Flows

### E-commerce Flow (Buy/Sell)

```mermaid
sequenceDiagram
    participant B as Buyer
    participant S as Seller
    participant P as Platform
    participant Pay as Payment Service
    participant E as Escrow Service
    participant D as Decision Authority
    
    Note over S,P: Listing Creation
    S->>P: Create listing (Fixed/Auction/Offer)
    P->>D: Request approval
    D-->>P: Approved/Rejected
    P-->>S: Listing published
    
    Note over B,P: Purchase Flow
    B->>P: Browse listings
    B->>P: Place bid/Buy now
    P->>Pay: Process payment
    Pay->>E: Hold in escrow
    E-->>P: Payment secured
    P-->>B: Purchase confirmed
    P-->>S: Order notification
    
    Note over S,B: Fulfillment
    S->>P: Mark as shipped
    P-->>B: Shipping notification
    B->>P: Confirm delivery
    
    Note over P,E: Settlement
    P->>D: Request release decision
    D-->>P: Approved
    P->>E: Release funds
    E->>S: Transfer to seller wallet
    P-->>S: Payment received
    
    Note over B,S: Optional Dispute
    B->>P: Open dispute (within 48h)
    P->>D: Review dispute
    D-->>P: Resolution decision
    alt Full Refund
        P->>E: Refund to buyer
        E->>B: Funds returned
    else Partial Refund
        P->>E: Split funds
        E->>B: Partial refund
        E->>S: Partial payment
    else Release to Seller
        P->>E: Release funds
        E->>S: Full payment
    end
```

### Crowdshipping Flow (Delivery)

```mermaid
sequenceDiagram
    participant Sh as Shipper
    participant T as Traveler
    participant P as Platform
    participant M as Matching Service
    participant L as Location Service
    participant Pay as Payment Service
    participant E as Escrow Service
    
    Note over Sh,P: Request Creation
    Sh->>P: Create delivery request
    Sh->>P: Provide details (origin, destination, item)
    P->>Pay: Process payment
    Pay->>E: Hold in escrow
    E-->>P: Payment secured
    P-->>Sh: Request created
    
    Note over T,P: Trip Creation
    T->>P: Create trip
    T->>L: Share route
    L-->>P: Route stored
    
    Note over P,M: Matching
    P->>M: Find matches
    M->>L: Calculate distances
    L-->>M: Distance data
    M-->>P: Matched requests
    P-->>T: Show available requests
    
    Note over T,Sh: Acceptance
    T->>P: Accept request
    P-->>Sh: Traveler matched
    P->>L: Start tracking
    
    Note over T,Sh: Communication
    T->>P: Chat with shipper
    Sh->>P: Chat with traveler
    
    Note over T,L: Pickup
    T->>L: Update location (at pickup)
    L-->>P: Location updated
    P-->>Sh: Pickup notification
    T->>P: Confirm pickup
    
    Note over T,L: In Transit
    L->>P: Track location (real-time)
    P-->>Sh: Location updates
    
    Note over T,Sh: Delivery
    T->>L: Update location (at destination)
    L-->>P: Location updated
    P-->>Sh: Delivery notification
    T->>P: Confirm delivery
    Sh->>P: Confirm receipt
    
    Note over P,E: Settlement
    P->>E: Release funds
    E->>T: Transfer to traveler wallet
    P-->>T: Payment received
    
    Note over Sh,T: Optional Dispute
    Sh->>P: Open dispute (within 48h)
    P->>E: Hold funds
    P-->>T: Dispute notification
    P->>P: Admin review
    alt Refund Shipper
        P->>E: Refund to shipper
        E->>Sh: Funds returned
    else Pay Traveler
        P->>E: Release funds
        E->>T: Full payment
    else Partial Settlement
        P->>E: Split funds
        E->>Sh: Partial refund
        E->>T: Partial payment
    end
```

### P2P Exchange Flow

```mermaid
sequenceDiagram
    participant S as Seller
    participant B as Buyer
    participant P as Platform
    participant M as Matching Engine
    participant Sec as Security Service
    participant E as External Escrow
    participant Pay as Payment Service
    
    Note over S,P: Create Exchange Request
    S->>P: Create request (currency, amount, rate)
    P->>Sec: Calculate security deposit
    Sec-->>P: Deposit amount
    S->>Pay: Pay security deposit
    Pay-->>P: Deposit confirmed
    P-->>S: Request published
    
    Note over B,M: Browse & Match
    B->>P: Browse marketplace
    P->>M: Filter by criteria
    M-->>P: Matched requests
    P-->>B: Show results
    
    Note over B,S: Initiate Exchange
    B->>P: Accept request
    P->>Sec: Verify trust levels
    Sec-->>P: Approved
    P->>E: Create escrow
    E-->>P: Escrow created
    P-->>S: Match notification
    P-->>B: Match notification
    
    Note over B,S: Communication
    B->>P: Chat with seller
    S->>P: Chat with buyer
    P->>P: Secure messaging
    
    Note over B,E: Payment Initiation
    B->>E: Deposit funds
    E-->>P: Funds received
    P-->>S: Payment notification
    
    Note over S,P: Proof of Payment
    S->>P: Upload receipt
    P->>Sec: Verify proof
    Sec-->>P: Verified
    P-->>B: Proof uploaded
    
    Note over B,P: Confirmation
    B->>P: Confirm receipt
    P->>E: Release funds
    E->>S: Transfer to seller
    P->>Pay: Return security deposit
    Pay->>S: Deposit returned
    P-->>B: Exchange complete
    P-->>S: Exchange complete
    
    Note over B,S: Optional Dispute
    B->>P: Dispute (timeout/fraud)
    P->>Sec: Freeze funds
    P-->>S: Dispute notification
    P->>P: Admin arbitration
    alt Refund Buyer
        P->>E: Refund to buyer
        E->>B: Funds returned
        P->>Pay: Forfeit deposit
        Pay->>B: Deposit to buyer
    else Pay Seller
        P->>E: Release funds
        E->>S: Full payment
        P->>Pay: Return deposit
        Pay->>S: Deposit returned
    end
```

### Auction Flow (with Decision Authority)

```mermaid
sequenceDiagram
    participant S as Seller
    participant B as Bidder
    participant A as Auction Service
    participant D as Decision Authority
    participant E as Escrow Service
    participant N as Notification Service
    
    Note over S,A: Create Auction
    S->>A: Create auction listing
    A->>D: Request approval
    D-->>A: Approved/Rejected
    A-->>S: Auction published
    
    Note over B,A: Bidding
    B->>A: Place bid
    A->>D: Verify bidder eligibility
    D-->>A: Approved
    A->>A: Update current bid
    A->>N: Notify outbid users
    N-->>B: Bid placed notification
    
    Note over A,N: Auction End
    A->>A: Timer expires
    A->>D: Request winner verification
    D-->>A: Winner approved
    A->>N: Notify winner
    N-->>B: You won!
    A->>N: Notify seller
    N-->>S: Auction ended
    
    Note over B,E: Payment
    B->>E: Pay winning bid
    E-->>A: Payment secured
    A-->>S: Payment received
    
    Note over S,B: Fulfillment
    S->>A: Ship item
    A-->>B: Shipped notification
    B->>A: Confirm delivery
    
    Note over A,E: Settlement
    A->>D: Request release
    D-->>A: Approved
    A->>E: Release funds
    E->>S: Transfer to seller
    A-->>S: Payment complete
```



---

## API Reference

### Authentication APIs

#### POST /api/auth/register
Register a new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/login
Authenticate user and get JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Product & Listing APIs

#### GET /api/listings
Get all listings with filters

**Query Parameters:**
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `status` - Listing status (active, sold, expired)
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### POST /api/listings
Create a new listing

**Request:**
```json
{
  "title": "iPhone 14 Pro",
  "description": "Brand new, sealed",
  "category": "electronics",
  "price": 999.99,
  "listingType": "fixed",
  "images": ["img1.jpg", "img2.jpg"],
  "condition": "new"
}
```

### Auction APIs

#### GET /api/auctions/:id
Get auction details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "auc_123",
    "listingId": "lst_456",
    "startPrice": 100.00,
    "currentBid": 250.00,
    "bidCount": 15,
    "startTime": "2026-02-14T10:00:00Z",
    "endTime": "2026-02-21T10:00:00Z",
    "status": "active",
    "highestBidder": "usr_789"
  }
}
```

#### POST /api/auctions/:id/bid
Place a bid on an auction

**Request:**
```json
{
  "amount": 260.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bidId": "bid_123",
    "amount": 260.00,
    "timestamp": "2026-02-14T15:30:00Z",
    "isHighest": true
  }
}
```

### Wallet & Payment APIs

#### GET /api/wallet/balance
Get user wallet balance

**Response:**
```json
{
  "success": true,
  "data": {
    "available": 1500.00,
    "pending": 250.00,
    "escrow": 100.00,
    "total": 1850.00,
    "currency": "USD"
  }
}
```

#### POST /api/wallet/deposit
Deposit funds to wallet

**Request:**
```json
{
  "amount": 500.00,
  "paymentMethod": "card",
  "paymentMethodId": "pm_123"
}
```

#### POST /api/wallet/withdraw
Request withdrawal

**Request:**
```json
{
  "amount": 300.00,
  "method": "bank_transfer",
  "accountId": "acc_123"
}
```

### P2P Exchange APIs

#### GET /api/p2p/marketplace
Browse P2P exchange marketplace

**Query Parameters:**
- `fromCurrency` - Source currency
- `toCurrency` - Target currency
- `minAmount` - Minimum amount
- `maxAmount` - Maximum amount
- `trustLevel` - Minimum trust level

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req_123",
        "sellerId": "usr_456",
        "fromCurrency": "USD",
        "toCurrency": "EUR",
        "amount": 1000.00,
        "rate": 0.92,
        "trustLevel": "high",
        "securityDeposit": 50.00
      }
    ]
  }
}
```

#### POST /api/p2p/requests
Create exchange request

**Request:**
```json
{
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "amount": 1000.00,
  "rate": 0.92,
  "expiresIn": 86400
}
```

### Crowdshipping APIs

#### POST /api/trips
Create a new trip

**Request:**
```json
{
  "origin": {
    "city": "New York",
    "country": "USA",
    "coordinates": [-74.006, 40.7128]
  },
  "destination": {
    "city": "London",
    "country": "UK",
    "coordinates": [-0.1276, 51.5074]
  },
  "departureDate": "2026-03-01",
  "arrivalDate": "2026-03-02",
  "capacity": 10.0,
  "capacityUnit": "kg"
}
```

#### GET /api/requests/available
Get available delivery requests for traveler

**Query Parameters:**
- `origin` - Origin city/country
- `destination` - Destination city/country
- `maxDistance` - Maximum distance from route (km)

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req_123",
        "shipperId": "usr_456",
        "item": "Electronics",
        "weight": 2.5,
        "reward": 50.00,
        "distance": 5.2,
        "matchScore": 0.95
      }
    ]
  }
}
```

### Decision Authority APIs

#### GET /api/decisions/:entityType/:entityId
Get decision status for an entity

**Response:**
```json
{
  "success": true,
  "data": {
    "decisionId": "dec_123",
    "entityType": "auction",
    "entityId": "auc_456",
    "status": "approved",
    "source": "custodii",
    "confidence": 0.95,
    "timestamp": "2026-02-14T10:00:00Z"
  }
}
```

### Admin APIs

#### GET /api/admin/payouts/pending
Get pending payout requests (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "id": "pyt_123",
        "userId": "usr_456",
        "amount": 500.00,
        "method": "bank_transfer",
        "status": "pending",
        "requestedAt": "2026-02-14T10:00:00Z"
      }
    ]
  }
}
```

#### POST /api/admin/payouts/:id/approve
Approve a payout request (Admin only, requires 2FA)

**Request:**
```json
{
  "twoFactorCode": "123456",
  "notes": "Verified and approved"
}
```

### Common Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "details": { ... }
  }
}
```

#### Pagination
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Rate Limiting

- **Anonymous:** 100 requests/hour
- **Authenticated:** 1000 requests/hour
- **Admin:** 5000 requests/hour

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `INVALID_INPUT` | Validation error |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |



---

## Current Status & Gaps

### Completion Overview

```
Infrastructure:     ████████░░ 80%
Core Features:      ███████░░░ 70%
Frontend:           ██████░░░░ 65%
Financial:          ████░░░░░░ 40%
AI Features:        █░░░░░░░░░ 10%
Mobile Apps:        ██░░░░░░░░ 20%
Overall:            ████░░░░░░ 40%
```

### What's Working (40% Complete)

#### ✅ Infrastructure (80%)
- Microservices architecture
- Docker containerization
- PostgreSQL with migrations
- Redis caching
- Event-driven architecture
- Basic monitoring

**Missing:**
- Kubernetes deployment
- Elasticsearch integration
- MongoDB for unstructured data
- Production-grade monitoring

#### ✅ Authentication & Users (70%)
- JWT authentication
- User registration/login
- Profile management
- KYC verification
- Session management

**Missing:**
- OAuth2 (Google/Facebook/Apple)
- Multi-factor authentication
- Advanced user roles
- Social login

#### ✅ E-commerce Core (70%)
- Product catalog
- Listing management
- Search and filters
- Category system
- Image upload

**Missing:**
- Advanced search (Elasticsearch)
- Product recommendations
- Wishlist
- Product comparison

#### ✅ Auction System (70%)
- Basic auction creation
- Bidding logic
- Timer management
- Trust & safety
- Event logging
- Rules engine
- Decision Authority integration

**Missing:**
- Auto-extend logic
- Make Offer system
- Comprehensive prohibited items list
- Advanced fraud detection

#### ✅ Financial Services (50%)
- Travel wallet (basic framework)
- Escrow system
- Stripe/PayPal integration
- Internal ledger
- Manual payout system

**Missing:**
- Local settlement matching
- Multi-currency support (full)
- Instant transfers
- Rewards and loyalty system
- Crypto payments

#### ✅ Crowdshipping (60%)
- Delivery request system
- Trip management
- Basic matching
- Location service (structure)

**Missing:**
- Real-time GPS tracking
- Advanced matching algorithm
- Route optimization
- Geofencing notifications

#### ✅ P2P Exchange (90%)
- Exchange marketplace
- Matching engine
- Security deposits
- Trust levels
- Proof of payment
- Communication
- Settlement
- External escrow integration

**Missing:**
- Production deployment
- Advanced fraud detection
- Multi-currency optimization

#### ✅ Trust & Safety (60%)
- KYC system
- Fraud detection
- Rate limiting
- Decision Authority (Custodii)
- Database encryption

**Missing:**
- Code watermarking
- Customs warnings
- Advanced security hardening
- Penetration testing

#### ✅ Communication (70%)
- Chat service
- Notifications (multi-channel)
- Push notifications
- Email/SMS

**Missing:**
- Video calls
- Voice messages
- File sharing in chat
- Translation

#### ✅ Admin Dashboard (65%)
- User management
- Listing approval
- Payout approval
- Decision monitoring
- Analytics overview

**Missing:**
- Advanced analytics
- Reporting tools
- Bulk operations
- Audit logs UI

### What's Missing (60% Incomplete)

#### ❌ AI Features (10% Complete)

**Hyper-Matching AI (0%)**
- PostGIS integration
- Geospatial queries
- Distance calculations
- Location-based matching
- ML matching algorithm

**Smart Buyer (0%)**
- Camera integration
- Microphone integration
- Image recognition (TensorFlow/PyTorch)
- Speech-to-text
- Tag extraction
- Product matching

**Recommendations (10%)**
- Collaborative filtering
- Content-based recommendations
- Predictive buying
- Dynamic pricing
- User behavior analysis

#### ❌ Geolocation Features (5% Complete)

**PostGIS Integration (5%)**
- Full PostGIS setup
- Geospatial indexes
- Distance calculations
- Route optimization

**GeoLock (0%)**
- GPS/IP detection
- Country whitelist
- Geofencing
- Location alerts
- Airport notifications

**Real-time Tracking (0%)**
- Live GPS tracking
- Route visualization
- Delivery checkpoints
- ETA calculations

#### ❌ Mobile Apps (20% Complete)

**Flutter App (20%)**
- Basic structure exists
- Core screens designed
- Navigation setup

**Missing:**
- Full implementation
- Camera/mic integration
- Push notifications
- Offline support
- Dark mode
- Arabic/English RTL
- Performance optimization

#### ❌ Advanced Financial (0% Complete)

**Local Settlement Matching (0%)**
- Internal settlement algorithm
- Balance ledger
- Matching logic
- Instant transfers
- Compliance (AML/KYC)

**Rewards & Loyalty (0%)**
- Points system
- Earn/redeem logic
- Gamification
- Partnerships
- Special offers

#### ❌ Search & Discovery (10% Complete)

**Elasticsearch (0%)**
- Full-text search
- Faceted search
- Autocomplete
- Search analytics

**Advanced Filters (10%)**
- Multi-criteria filters
- Saved searches
- Search history
- Price alerts

### Critical Gaps for MVP

#### 1. Real Money Integration (Priority: Critical)
**Current:** Mock implementations  
**Needed:**
- Stripe Connect integration (2 weeks)
- Escrow Kenya integration (2 weeks)
- OpenExchangeRates integration (1 week)

#### 2. Production Infrastructure (Priority: High)
**Current:** Local development only  
**Needed:**
- AWS setup (1 week)
- CI/CD pipeline (1 week)
- Monitoring & alerts (1 week)
- Backup & disaster recovery (1 week)

#### 3. Security Hardening (Priority: High)
**Current:** Basic security  
**Needed:**
- Penetration testing
- Security audit
- Compliance review
- Data encryption audit

#### 4. Performance Optimization (Priority: Medium)
**Current:** Not optimized  
**Needed:**
- Database query optimization
- Caching strategy
- CDN setup
- Load testing

### Timeline to Full Vision

#### Phase 1: MVP Launch (6 weeks)
- Real money integration
- Production deployment
- Security hardening
- Performance optimization

#### Phase 2: AI & Intelligence (4 months)
- Hyper-matching AI
- Smart buyer
- Recommendations
- Dynamic pricing

#### Phase 3: Advanced Financial (3 months)
- Local settlement matching
- Rewards & loyalty
- Multi-currency optimization

#### Phase 4: Geolocation (2 months)
- PostGIS full integration
- GeoLock system
- Real-time tracking
- Geofencing

#### Phase 5: Mobile Apps (3 months)
- Flutter app completion
- Camera/mic integration
- Push notifications
- App store deployment

**Total Timeline:** 12-16 months to full vision

### Resource Requirements

#### MVP (6 weeks)
- 2-3 backend developers
- 1 frontend developer
- 1 DevOps engineer
- 1 QA engineer
- Budget: $25K-$50K

#### Full Vision (12-16 months)
- 5-7 backend developers
- 2-3 frontend developers
- 2 mobile developers
- 2 DevOps engineers
- 2 QA engineers
- 1 ML engineer
- Budget: $500K-$800K



---

## Deployment & Operations

### Local Development Setup

#### Prerequisites
- Node.js 18+
- Docker Desktop
- Git
- PostgreSQL client (optional)
- Redis client (optional)

#### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd mnbara-platform

# Install dependencies
npm install

# Start databases
docker-compose up -d postgres redis

# Run migrations
npm run migrate:all

# Start all services
docker-compose up

# Frontend will be available at:
# http://localhost:5173
```

#### Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mnbara
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# External Services
CUSTODII_API_KEY=your-custodii-key
OPENEXCHANGERATES_API_KEY=your-fx-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# AWS (for production)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Production Deployment

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AWS Cloud                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Load Balancer (ALB)                 │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │           ECS/EKS Cluster                        │  │
│  │                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │
│  │  │ Service  │  │ Service  │  │ Service  │     │  │
│  │  │    1     │  │    2     │  │    3     │ ... │  │
│  │  └──────────┘  └──────────┘  └──────────┘     │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              RDS PostgreSQL                      │  │
│  │              ElastiCache Redis                   │  │
│  │              S3 Storage                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Deployment Steps

**Week 0: Infrastructure Setup**

1. **AWS Account Setup**
   ```bash
   # Install AWS CLI
   aws configure
   
   # Create VPC and subnets
   terraform init
   terraform plan
   terraform apply
   ```

2. **Database Setup**
   - Create RDS PostgreSQL instance
   - Create ElastiCache Redis cluster
   - Setup S3 buckets
   - Configure security groups

3. **CI/CD Pipeline**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Production
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Build and push Docker images
         - name: Deploy to ECS/EKS
         - name: Run migrations
         - name: Health check
   ```

**Week 6: Production Launch**

1. **Pre-launch Checklist**
   - [ ] All services deployed
   - [ ] Database migrations run
   - [ ] Environment variables set
   - [ ] SSL certificates configured
   - [ ] Monitoring enabled
   - [ ] Backups configured
   - [ ] Load testing completed
   - [ ] Security audit passed

2. **Launch**
   ```bash
   # Deploy to production
   git push origin main
   
   # Monitor deployment
   kubectl get pods -n production
   
   # Check health
   curl https://api.mnbara.com/health
   ```

3. **Post-launch**
   - Monitor error rates
   - Check performance metrics
   - Review user feedback
   - Fix critical issues

### Monitoring & Observability

#### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mnbara-services'
    static_configs:
      - targets:
        - 'auth-service:3001'
        - 'payment-service:3010'
        - 'auction-service:3032'
```

#### Grafana Dashboards

**System Overview Dashboard**
- Request rate
- Error rate
- Response time (p50, p95, p99)
- CPU/Memory usage
- Database connections

**Business Metrics Dashboard**
- Active users
- Listings created
- Auctions active
- Transactions completed
- Revenue

#### Alerts

```yaml
# alert-rules.yml
groups:
  - name: mnbara-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        annotations:
          summary: "Service is down"
```

### Backup & Disaster Recovery

#### Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump -h $DB_HOST -U $DB_USER mnbara > backup_$(date +\%Y\%m\%d).sql

# Backup to S3
aws s3 cp backup_$(date +\%Y\%m\%d).sql s3://mnbara-backups/
```

#### Disaster Recovery Plan

1. **RTO (Recovery Time Objective):** 4 hours
2. **RPO (Recovery Point Objective):** 1 hour

**Recovery Steps:**
1. Restore database from latest backup
2. Deploy services from last known good version
3. Verify data integrity
4. Resume operations

### Security

#### SSL/TLS
- All traffic encrypted with TLS 1.3
- Certificates from Let's Encrypt
- Auto-renewal configured

#### Secrets Management
- AWS Secrets Manager for production
- Environment variables for development
- No secrets in code or git

#### Access Control
- IAM roles for AWS resources
- RBAC for Kubernetes
- MFA for admin access
- Audit logs enabled

### Scaling Strategy

#### Horizontal Scaling

```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auction-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auction-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling
- Query optimization
- Caching strategy

### Cost Optimization

#### Current Estimates (Monthly)

**MVP (100 users)**
- AWS EC2/ECS: $50-$100
- RDS PostgreSQL: $50-$100
- ElastiCache Redis: $20-$40
- S3 Storage: $5-$10
- Data Transfer: $10-$20
- **Total: $135-$270/month**

**Scale (1,000 users)**
- AWS EC2/ECS: $200-$400
- RDS PostgreSQL: $150-$300
- ElastiCache Redis: $50-$100
- S3 Storage: $20-$40
- Data Transfer: $50-$100
- **Total: $470-$940/month**

**Scale (10,000 users)**
- AWS EC2/ECS: $800-$1,600
- RDS PostgreSQL: $500-$1,000
- ElastiCache Redis: $200-$400
- S3 Storage: $100-$200
- Data Transfer: $200-$400
- **Total: $1,800-$3,600/month**



---

## Development Guide

### Getting Started

#### First Day Checklist

1. **Read Documentation**
   - [ ] This master documentation
   - [ ] START_HERE.md
   - [ ] QUICK_START_GUIDE.md
   - [ ] Service-specific READMEs

2. **Setup Environment**
   - [ ] Install prerequisites
   - [ ] Clone repository
   - [ ] Install dependencies
   - [ ] Start databases
   - [ ] Run migrations
   - [ ] Start services

3. **Verify Setup**
   - [ ] All services running
   - [ ] Tests passing
   - [ ] Frontend accessible
   - [ ] No errors in logs

#### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature develop

# Make changes
# ... code ...

# Run tests
npm test

# Run linter
npm run lint

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

### Code Standards

#### TypeScript Style Guide

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Use async/await instead of promises
async function getUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

// Use descriptive variable names
const activeAuctions = await auctionService.getActiveAuctions();

// Add JSDoc comments for public APIs
/**
 * Creates a new auction listing
 * @param data - Auction creation data
 * @returns Created auction
 * @throws ValidationError if data is invalid
 */
async function createAuction(data: CreateAuctionDto): Promise<Auction> {
  // ...
}
```

#### Error Handling

```typescript
// Custom error classes
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Error handling in controllers
try {
  const auction = await auctionService.getById(id);
  res.json({ success: true, data: auction });
} catch (error) {
  if (error instanceof NotFoundError) {
    res.status(404).json({ 
      success: false, 
      error: { code: 'NOT_FOUND', message: error.message }
    });
  } else {
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred' }
    });
  }
}
```

#### Testing Standards

```typescript
// Unit test example
describe('AuctionService', () => {
  describe('createAuction', () => {
    it('should create auction with valid data', async () => {
      const data = {
        listingId: 'lst_123',
        startPrice: 100,
        duration: 7
      };
      
      const auction = await auctionService.createAuction(data);
      
      expect(auction).toBeDefined();
      expect(auction.startPrice).toBe(100);
    });
    
    it('should throw error with invalid data', async () => {
      const data = {
        listingId: 'lst_123',
        startPrice: -100, // Invalid
        duration: 7
      };
      
      await expect(auctionService.createAuction(data))
        .rejects.toThrow(ValidationError);
    });
  });
});

// Integration test example
describe('Auction API', () => {
  it('should create and retrieve auction', async () => {
    // Create auction
    const createRes = await request(app)
      .post('/api/auctions')
      .send({
        listingId: 'lst_123',
        startPrice: 100,
        duration: 7
      })
      .expect(201);
    
    const auctionId = createRes.body.data.id;
    
    // Retrieve auction
    const getRes = await request(app)
      .get(`/api/auctions/${auctionId}`)
      .expect(200);
    
    expect(getRes.body.data.startPrice).toBe(100);
  });
});
```

### Database Guidelines

#### Migrations

```typescript
// migrations/001_create_users.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
```

#### Query Optimization

```typescript
// Bad: N+1 query problem
const auctions = await Auction.findAll();
for (const auction of auctions) {
  auction.bids = await Bid.findAll({ where: { auctionId: auction.id } });
}

// Good: Use eager loading
const auctions = await Auction.findAll({
  include: [{ model: Bid }]
});

// Good: Use indexes
await knex.schema.table('auctions', (table) => {
  table.index('status');
  table.index('end_time');
  table.index(['status', 'end_time']);
});
```

### API Design Guidelines

#### RESTful Conventions

```
GET    /api/auctions          - List auctions
GET    /api/auctions/:id      - Get auction
POST   /api/auctions          - Create auction
PUT    /api/auctions/:id      - Update auction
DELETE /api/auctions/:id      - Delete auction

POST   /api/auctions/:id/bid  - Place bid (action)
```

#### Request/Response Format

```typescript
// Request
{
  "title": "iPhone 14 Pro",
  "startPrice": 100,
  "duration": 7
}

// Success Response
{
  "success": true,
  "data": {
    "id": "auc_123",
    "title": "iPhone 14 Pro",
    "startPrice": 100,
    "status": "active"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Start price must be positive",
    "details": {
      "field": "startPrice",
      "value": -100
    }
  }
}
```

### Service Communication

#### Event-Driven Architecture

```typescript
// Publish event
await eventBus.publish('auction.created', {
  auctionId: auction.id,
  listingId: auction.listingId,
  startPrice: auction.startPrice
});

// Subscribe to event
eventBus.subscribe('auction.created', async (event) => {
  await notificationService.notifyWatchers(event.listingId);
});
```

#### Service-to-Service Calls

```typescript
// Use HTTP client with retry logic
const response = await httpClient.post(
  'http://payment-service:3010/api/payments',
  { amount: 100, userId: 'usr_123' },
  { 
    timeout: 5000,
    retries: 3,
    retryDelay: 1000
  }
);
```

### Security Best Practices

#### Input Validation

```typescript
import { z } from 'zod';

const createAuctionSchema = z.object({
  listingId: z.string().uuid(),
  startPrice: z.number().positive(),
  duration: z.number().int().min(1).max(30)
});

// Validate input
const data = createAuctionSchema.parse(req.body);
```

#### Authentication Middleware

```typescript
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', message: 'Token required' }
    });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
    });
  }
}
```

#### SQL Injection Prevention

```typescript
// Bad: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// Good: Parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);
```

### Performance Optimization

#### Caching Strategy

```typescript
// Cache frequently accessed data
async function getAuction(id: string): Promise<Auction> {
  // Check cache first
  const cached = await redis.get(`auction:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const auction = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
  
  // Cache for 5 minutes
  await redis.setex(`auction:${id}`, 300, JSON.stringify(auction));
  
  return auction;
}
```

#### Database Connection Pooling

```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Debugging Tips

#### Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Use structured logging
logger.info('Auction created', {
  auctionId: auction.id,
  userId: user.id,
  startPrice: auction.startPrice
});
```

#### Debugging in VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auction Service",
      "program": "${workspaceFolder}/backend/services/auction-service/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/backend/services/auction-service/dist/**/*.js"]
    }
  ]
}
```

### Common Issues & Solutions

#### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs mnbara-postgres

# Restart database
docker-compose restart postgres
```

#### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Restart Redis
docker-compose restart redis
```



---

## Appendices

### A. Glossary

**Auction** - A listing where buyers bid on an item, highest bid wins

**Bid** - An offer to purchase an item at a specific price in an auction

**Buy It Now** - Purchase option to buy immediately at a fixed price

**Crowdshipping** - Peer-to-peer delivery service using travelers

**Custodii** - External decision authority service for compliance

**Decision Authority** - Service that approves/rejects actions based on rules

**Escrow** - Third-party holding of funds until transaction completes

**Hyper-Matching** - AI-powered algorithm to match travelers with delivery requests

**Internal Ledger** - Platform's internal accounting system

**KYC** - Know Your Customer - identity verification process

**Listing** - A product posted for sale on the platform

**Make Offer** - Feature allowing buyers to propose a price to sellers

**P2P Exchange** - Peer-to-peer currency/goods exchange marketplace

**Payout** - Transfer of funds from platform wallet to external account

**PostGIS** - PostgreSQL extension for geographic data

**Request** - Delivery request created by a shipper

**Settlement** - Final transfer of funds after transaction completion

**Shipper** - User who creates delivery requests

**Smart Buyer** - AI feature using camera/mic for product search

**Traveler** - User who delivers packages along their travel route

**Trust Score** - User reputation score based on behavior

**Wallet** - User's account balance on the platform

### B. External Projects Integration

Projects under `docs/external-projects/` are mapped and (where applicable) integrated into the main codebase. See **[EXTERNAL_PROJECTS_INTEGRATION.md](EXTERNAL_PROJECTS_INTEGRATION.md)** for:

- **mobile-app-flutter/** – Flutter e-commerce app (منبره) integrated from `docs/external-projects/mobile/flutter_app/`
- **Reference-only:** stripe-connect-sample, Real-Time-Bike-Auction-System-Backend, SmartContractEscrowSystem, KYC-Website, SiriusScan, xyops, openskills

Backend READMEs (stripe-connect-service, auction-service, escrow-service, kyc-service) link to these references where relevant.

### C. Acronyms

**AES** - Advanced Encryption Standard  
**AI** - Artificial Intelligence  
**AML** - Anti-Money Laundering  
**API** - Application Programming Interface  
**AWS** - Amazon Web Services  
**CDN** - Content Delivery Network  
**CI/CD** - Continuous Integration/Continuous Deployment  
**CRUD** - Create, Read, Update, Delete  
**DB** - Database  
**DTO** - Data Transfer Object  
**ECS** - Elastic Container Service  
**EKS** - Elastic Kubernetes Service  
**FCM** - Firebase Cloud Messaging  
**FX** - Foreign Exchange  
**GPS** - Global Positioning System  
**HPA** - Horizontal Pod Autoscaler  
**HTTP** - Hypertext Transfer Protocol  
**HTTPS** - HTTP Secure  
**IAM** - Identity and Access Management  
**JWT** - JSON Web Token  
**KYC** - Know Your Customer  
**ML** - Machine Learning  
**MFA** - Multi-Factor Authentication  
**MVP** - Minimum Viable Product  
**OAuth** - Open Authorization  
**ORM** - Object-Relational Mapping  
**P2P** - Peer-to-Peer  
**PII** - Personally Identifiable Information  
**PRD** - Product Requirements Document  
**RBAC** - Role-Based Access Control  
**RDS** - Relational Database Service  
**REST** - Representational State Transfer  
**RPO** - Recovery Point Objective  
**RTO** - Recovery Time Objective  
**S3** - Simple Storage Service  
**SDK** - Software Development Kit  
**SMS** - Short Message Service  
**SQL** - Structured Query Language  
**SSL** - Secure Sockets Layer  
**TLS** - Transport Layer Security  
**UI** - User Interface  
**UX** - User Experience  
**VPC** - Virtual Private Cloud  
**WAF** - Web Application Firewall  

### C. External Services

#### Stripe Connect
**Purpose:** Payment processing and seller payouts  
**Documentation:** https://stripe.com/docs/connect  
**Pricing:** 2.9% + $0.30 per transaction  
**Integration Status:** Planned (Week 2-3)

#### Escrow Kenya
**Purpose:** Money custody and escrow services  
**Documentation:** Contact partner  
**Pricing:** 1.5-2% per transaction  
**Integration Status:** Planned (Week 4-5)

#### OpenExchangeRates
**Purpose:** Real-time foreign exchange rates  
**Documentation:** https://openexchangerates.org/  
**Pricing:** $8/month (Unlimited plan)  
**Integration Status:** Planned (Week 4)

#### Custodii
**Purpose:** AI-powered decision authority  
**Documentation:** https://custodii.com/docs  
**Pricing:** Custom  
**Integration Status:** Integrated ✅

#### OneSignal
**Purpose:** Push notifications  
**Documentation:** https://onesignal.com/  
**Pricing:** Free up to 10K subscribers  
**Integration Status:** Planned

### D. Database Schema

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  kyc_status VARCHAR(20) DEFAULT 'pending',
  trust_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**listings**
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2),
  listing_type VARCHAR(20), -- 'fixed', 'auction', 'offer'
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**auctions**
```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  start_price DECIMAL(10,2) NOT NULL,
  current_bid DECIMAL(10,2),
  bid_count INTEGER DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**wallets**
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  escrow_balance DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### E. Environment Setup

#### Development Environment

**Required Software:**
- Node.js 18+
- Docker Desktop
- Git
- VS Code (recommended)

**VS Code Extensions:**
- ESLint
- Prettier
- TypeScript
- Docker
- GitLens
- REST Client

**Docker Compose Services:**
```yaml
services:
  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: mnbara
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

### F. Testing Strategy

#### Test Pyramid

```
        /\
       /  \
      / E2E \
     /--------\
    /Integration\
   /--------------\
  /   Unit Tests   \
 /------------------\
```

**Unit Tests (70%)**
- Test individual functions
- Mock external dependencies
- Fast execution
- High coverage

**Integration Tests (20%)**
- Test service interactions
- Use test database
- Test API endpoints
- Verify data flow

**E2E Tests (10%)**
- Test complete user flows
- Use staging environment
- Simulate real user behavior
- Critical paths only

#### Test Coverage Goals

- Overall: > 80%
- Critical paths: > 95%
- New code: > 90%

### G. Support & Resources

#### Documentation
- **Master Documentation:** This file
- **Service READMEs:** Each service directory
- **API Documentation:** Swagger/OpenAPI specs
- **Architecture Diagrams:** `/docs/architecture/`

#### Communication Channels
- **Development:** Slack #dev-team
- **Bugs:** GitHub Issues
- **Features:** GitHub Discussions
- **Urgent:** On-call rotation

#### Learning Resources
- **Node.js:** https://nodejs.org/docs
- **TypeScript:** https://www.typescriptlang.org/docs
- **PostgreSQL:** https://www.postgresql.org/docs
- **Docker:** https://docs.docker.com
- **Kubernetes:** https://kubernetes.io/docs

### H. Changelog

#### Version 1.0 (February 14, 2026)
- Initial master documentation created
- Consolidated 150+ scattered markdown files
- Documented all 87 microservices
- Added architecture diagrams
- Included API reference
- Added deployment guide
- Created development guide

#### Future Updates
- Version 1.1: Add mobile app documentation
- Version 1.2: Add AI features documentation
- Version 1.3: Add advanced financial features
- Version 2.0: Full vision documentation

---

## Document Information

**Version:** 1.0  
**Last Updated:** February 14, 2026  
**Maintained By:** Development Team  
**Review Cycle:** Monthly  
**Next Review:** March 14, 2026

**Contributors:**
- Development Team
- Product Team
- DevOps Team

**Feedback:**
For corrections or suggestions, please create a GitHub issue or contact the development team.

---

**End of Master Documentation**

