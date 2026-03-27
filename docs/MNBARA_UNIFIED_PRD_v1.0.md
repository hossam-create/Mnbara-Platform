# 🎯 Mnbara Platform - Unified Product Requirements Document (PRD)

**Document Version:** 1.0  
**Last Updated:** February 14, 2026  
**Status:** Production Ready - Comprehensive System Documentation  
**Platform:** Dual Marketplace (E-commerce + Crowdshipping)  
**Completion:** 40% of Full Vision

---

## 📋 EXECUTIVE SUMMARY

Mnbara is a sophisticated dual-marketplace platform combining e-commerce capabilities (like eBay) with innovative crowdshipping services (like Hitchhikers). The platform enables users to buy/sell products globally while leveraging travelers to deliver items across borders, creating a unique logistics solution for international commerce.

### Key Differentiators

- **87 Microservices Architecture** - Scalable, modular system design
- **AI-Powered Intelligence** - Advanced recommendation and pricing systems
- **Blockchain Integration** - Smart contract escrow and token economy
- **Multi-Role Ecosystem** - Buyers, Sellers, Travelers, Admins, Founders
- **Global Payment Infrastructure** - Multi-currency, multi-region support
- **Comprehensive Trust & Safety** - Advanced dispute resolution and guarantees

### Current State (February 2026)

**Completion Status:**
- Overall Platform: 40% complete
- Microservices: 87 total (35 active, 20 planned, 32 under review)
- Timeline to MVP: 6 weeks
- Timeline to Full Vision: 12-16 months

**Key Achievements:**
✅ Strong technical foundation (Microservices, Docker, PostgreSQL, Redis)  
✅ Core features working (Auth, Listings, Auctions, P2P Exchange)  
✅ Trust & Safety system (Decision Authority, KYC, Fraud Detection)  
✅ Admin dashboard and frontend components  
✅ Comprehensive testing framework

**Critical Gaps:**
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

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        WebApp[Web Application<br/>React/Next.js]
        MobileApp[Mobile Application<br/>React Native]
        AdminPortal[Admin Portal<br/>React]
        ControlCenter[Control Center<br/>React]
    end

    subgraph "API Gateway Layer"
        APIGateway[API Gateway<br/>Node.js/Express]
        AuthService[Auth Service<br/>JWT/OAuth]
        RateLimit[Rate Limiting<br/>Redis]
    end

    subgraph "Core Microservices"
        UserService[User Service]
        ListingService[Listing Service]
        PaymentService[Payment Service]
        AuctionService[Auction Service]
        CrowdshipService[Crowdship Service]
        MatchingService[Matching Service]
        EscrowService[Escrow Service]
        WalletService[Wallet Service]
        NotificationService[Notification Service]
        ChatService[Chat Service]
        ReviewService[Review Service]
        AnalyticsService[Analytics Service]
    end

    subgraph "Advanced Services"
        AIService[AI Services]
        PluginSystem[Plugin System]
        EbayLiveService[eBay Live Service]
        CrafterCMS[CrafterCMS Integration]
        DecisionAuthority[Decision Authority]
        P2PExchange[P2P Exchange Service]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Primary Database)]
        Redis[(Redis<br/>Cache/Session)]
        MongoDB[(MongoDB<br/>Analytics/Logs)]
        Elasticsearch[(Elasticsearch<br/>Search)]
    end

    subgraph "External Services"
        Stripe[Stripe Connect]
        PayPal[PayPal]
        MPesa[M-Pesa]
        EscrowKenya[Escrow Kenya]
        AWS[S3/CloudFront]
        Novu[Notifications]
        Twilio[SMS/Voice]
    end

    subgraph "Blockchain Layer"
        SmartContracts[Smart Contracts<br/>Solidity]
        TokenEconomy[Token Economy<br/>MNB Token]
        EscrowContract[Escrow Contract]
        StakingContract[Staking Contract]
    end

    WebApp --> APIGateway
    MobileApp --> APIGateway
    AdminPortal --> APIGateway
    ControlCenter --> APIGateway
    
    APIGateway --> AuthService
    APIGateway --> RateLimit
    APIGateway --> UserService
    APIGateway --> ListingService
    APIGateway --> PaymentService
    APIGateway --> AuctionService
    APIGateway --> CrowdshipService
    APIGateway --> MatchingService
    APIGateway --> EscrowService
    APIGateway --> WalletService
    
    UserService --> PostgreSQL
    ListingService --> PostgreSQL
    PaymentService --> PostgreSQL
    AuctionService --> PostgreSQL
    
    NotificationService --> Redis
    ChatService --> Redis
    AnalyticsService --> MongoDB
    
    PaymentService --> Stripe
    PaymentService --> PayPal
    PaymentService --> MPesa
    PaymentService --> EscrowKenya
    
    EscrowService --> SmartContracts
    WalletService --> TokenEconomy
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Next.js for SSR/SSG
- React Native for mobile
- TailwindCSS for styling
- Redux Toolkit for state management

**Backend:**
- Node.js with Express/Fastify
- TypeScript for type safety
- Prisma ORM for database
- Redis for caching
- Socket.io for real-time features

**Databases:**
- PostgreSQL (primary data)
- Redis (cache/sessions)
- MongoDB (analytics/logs)
- Elasticsearch (search)

**Infrastructure:**
- Docker & Docker Compose
- Kubernetes for orchestration
- AWS/GCP for cloud hosting
- Terraform for IaC
- GitHub Actions for CI/CD


---

## 📦 MICROSERVICES CATALOG (87 Services)

### Core Services (10 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **API Gateway** | 8080 | ✅ Active | Central routing and load balancing |
| **Auth Service** | 3001 | ✅ Active | Authentication, JWT, OAuth2 |
| **User Service** | 3002 | ✅ Active | User profiles and management |
| **Listing Service** | 3003 | ✅ Active | Product listings and catalog |
| **Payment Service** | 3004 | ✅ Active | Payment processing (Stripe, PayPal) |
| **Orders Service** | 3005 | ✅ Active | Order management and tracking |
| **Cart Service** | 3006 | ✅ Active | Shopping cart functionality |
| **Product Service** | 3007 | ✅ Active | Product catalog and search |
| **Category Service** | 3008 | ✅ Active | Category hierarchy management |
| **Search Service** | 3009 | ✅ Active | Elasticsearch integration |

### Marketplace Services (8 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Auction Service** | 3010 | ✅ Active | Real-time bidding and auctions |
| **Matching Service** | 3011 | ✅ Active | Traveler-request matching |
| **Crowdship Service** | 3012 | ✅ Active | Crowdshipping logistics |
| **Trips Service** | 3013 | ✅ Active | Travel route management |
| **Request Engine** | 3014 | ✅ Active | Delivery request processing |
| **P2P Exchange Service** | 3015 | ✅ Active | Peer-to-peer marketplace |
| **Seller Service** | 3016 | 🔄 Planned | Seller dashboard and tools |
| **Wholesale Service** | 3017 | 🔄 Planned | B2B wholesale marketplace |

### Advanced Services (10 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Plugin System** | 3020 | ✅ Active | Extensible plugin architecture |
| **eBay Live Service** | 3021 | ✅ Active | eBay integration and sync |
| **CrafterCMS** | 3022 | ✅ Active | Content management system |
| **Decision Authority** | 3023 | ✅ Active | Custodii integration for decisions |
| **Feature Management** | 3024 | ✅ Active | Feature flags and A/B testing |
| **Event Bus** | 3025 | ✅ Active | Event-driven architecture |
| **Rules Engine** | 3026 | ✅ Active | Business rules processing |
| **Signal Aggregation** | 3027 | ✅ Active | Event signal processing |
| **UI Config Service** | 3028 | 🔄 Planned | Dynamic UI configuration |
| **SEO Service** | 3029 | 🔄 Planned | SEO optimization |

### AI Services (10 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **AI Agent Service** | 3030 | ✅ Active | AI-powered shopping assistant |
| **AI Recommendations** | 3031 | ✅ Active | Product recommendations |
| **AI Pricing Service** | 3032 | ⚠️ Partial | Dynamic pricing engine |
| **AI Buyer Service** | 3033 | ⚠️ Partial | Buyer behavior analysis |
| **AI Business Service** | 3034 | 🔄 Planned | Business intelligence |
| **AI Assistant Service** | 3035 | ⚠️ Partial | Virtual assistant |
| **AI Chatbot Service** | 3036 | 🔄 Planned | Customer support chatbot |
| **Mnbarh AI Engine** | 3037 | 🔄 Planned | Core AI engine |
| **Demand Forecasting** | 3038 | 🔄 Planned | Predictive analytics |
| **Image Recognition** | 3039 | ⚠️ Partial | Visual search |

### Support Services (12 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Notification Service** | 3060 | ✅ Active | Multi-channel notifications |
| **Chat Service** | 3061 | ✅ Active | Real-time messaging |
| **Review Service** | 3062 | ✅ Active | Ratings and reviews |
| **KYC Service** | 3063 | ✅ Active | Identity verification |
| **Compliance Service** | 3064 | ✅ Active | Regulatory compliance |
| **Push Notification** | 3065 | ✅ Active | Mobile push notifications |
| **Novu Service** | 3066 | ✅ Active | Notification infrastructure |
| **I18n Service** | 3067 | ✅ Active | Internationalization |
| **Image Processing** | 3068 | ✅ Active | Image optimization |
| **File Storage** | 3069 | ✅ Active | S3 integration |
| **Job Queue** | 3070 | ✅ Active | Background job processing |
| **Task Scheduler** | 3071 | ✅ Active | Cron job management |

### Financial Services (15 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Escrow Service** | 3080 | ✅ Active | Escrow management |
| **Wallet Service** | 3081 | ✅ Active | Digital wallet |
| **Internal Ledger** | 3082 | ✅ Active | Transaction ledger |
| **Settlement Service** | 3083 | ✅ Active | Payment settlement |
| **Crypto Service** | 3084 | ⚠️ Partial | Cryptocurrency support |
| **BNPL Service** | 3085 | 🔄 Planned | Buy now pay later |
| **Card Service** | 3086 | 🔄 Planned | Card management |
| **Stripe Connect** | 3087 | ✅ Active | Stripe integration |
| **PayPal Service** | 3088 | ⚠️ Partial | PayPal integration |
| **Unified Wallet** | 3089 | ⚠️ Partial | Multi-currency wallet |
| **Rewards Service** | 3090 | ⚠️ Partial | Loyalty program |
| **Customer ID Service** | 3091 | ✅ Active | Customer identification |
| **Blockchain Service** | 3092 | 🔄 Planned | Blockchain integration |
| **MNB Token** | 3093 | 🔄 Planned | Platform token |
| **Staking Service** | 3094 | 🔄 Planned | Token staking |

### Security Services (8 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Fraud Detection** | 3100 | ✅ Active | Fraud prevention |
| **Security Service** | 3101 | ✅ Active | Security monitoring |
| **Geolock Service** | 3102 | ⚠️ Partial | Geographic restrictions |
| **Location Service** | 3103 | ✅ Active | Geolocation tracking |
| **Monitoring** | 3104 | ✅ Active | System monitoring |
| **Security Audit** | 3105 | ⚠️ Partial | Audit logging |
| **Performance Testing** | 3106 | ⚠️ Partial | Load testing |
| **Integration Testing** | 3107 | ✅ Active | E2E testing |

### Commerce Services (8 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Medusa Adapter** | 3110 | ✅ Active | Medusa.js integration |
| **Social Commerce** | 3111 | 🔄 Planned | Social shopping |
| **Voice Commerce** | 3112 | 🔄 Planned | Voice shopping |
| **AR Preview** | 3113 | 🔄 Planned | Augmented reality |
| **VR Showroom** | 3114 | 🔄 Planned | Virtual reality |
| **Sustainability** | 3115 | 🔄 Planned | Carbon tracking |
| **Smart Delivery** | 3116 | 🔄 Planned | Intelligent routing |
| **Ad Service** | 3117 | 🔄 Planned | Advertising platform |

### Analytics Services (6 services)

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Analytics Service** | 3120 | ✅ Active | Business analytics |
| **Recommendation Engine** | 3121 | ✅ Active | ML recommendations |
| **Admin Service** | 3122 | ✅ Active | Admin operations |
| **Mnbara Backend** | 3123 | ✅ Active | Legacy backend |
| **Shared Services** | 3124 | ✅ Active | Common utilities |
| **API Client** | 3125 | ✅ Active | Client SDK |

**Legend:**
- ✅ Active: Fully implemented and operational
- ⚠️ Partial: Partially implemented, needs completion
- 🔄 Planned: Designed but not yet implemented
- ❌ Deprecated: No longer in use


---

## 🎛️ DASHBOARDS & USER INTERFACES

### Dashboard Hierarchy

```mermaid
graph TD
    subgraph "Entry Points"
        Home[Home Page]
        Login[Login Page]
        Register[Register Page]
    end

    subgraph "Role-Based Dashboards"
        BuyerDash[Buyer Dashboard]
        SellerDash[Seller Dashboard]
        TravelerDash[Traveler Dashboard]
        AdminDash[Admin Dashboard]
        FounderDash[Founder Dashboard]
        ControlCenter[Control Center]
    end

    subgraph "Specialized Interfaces"
        Auctions[Auction Interface]
        LiveStream[Live Streaming]
        PluginMarket[Plugin Marketplace]
        P2PExchange[P2P Exchange]
        Disputes[Dispute Resolution]
    end

    Home --> Login
    Login --> BuyerDash
    Login --> SellerDash
    Login --> TravelerDash
    Login --> AdminDash
    Login --> FounderDash
    Login --> ControlCenter

    BuyerDash --> Auctions
    BuyerDash --> P2PExchange
    BuyerDash --> Disputes

    SellerDash --> Auctions
    SellerDash --> LiveStream
    SellerDash --> PluginMarket

    TravelerDash --> P2PExchange
    TravelerDash --> Disputes

    AdminDash --> PluginMarket
    AdminDash --> Disputes

    FounderDash --> ControlCenter
    ControlCenter --> LiveStream
    ControlCenter --> PluginMarket
```

### Control Center Dashboard

**Purpose:** Founder-level system monitoring and control

**Key Features:**
- System health monitoring (CPU, memory, network)
- Network integrity tracking (uptime, latency)
- Threat level assessment (security status)
- Financial metrics (escrow, revenue)
- User activity monitoring
- Real-time logs and terminal access
- Emergency controls and alerts

### Admin Dashboard

**Purpose:** Platform administration and management

**Key Features:**
- CMS Manager (content control)
- Ads Manager (campaign management)
- Travelers Manager (user oversight)
- Orders Manager (transaction control)
- Financial Guarantees (escrow management)
- Revenue analytics
- User analytics
- Performance metrics
- Quick actions (ban/suspend/verify users)

### Buyer Dashboard

**Purpose:** Shopping and purchase management

**Key Features:**
- Product browsing and search
- Watchlist and favorites
- Active bids and auctions
- Order tracking
- Wallet and payment methods
- Delivery requests
- Dispute management
- Purchase history

### Seller Dashboard

**Purpose:** Selling and inventory management

**Key Features:**
- Listing management
- Inventory tracking
- Order fulfillment
- Sales analytics
- Revenue reports
- Customer communication
- Dispute resolution
- Performance metrics

### Traveler Dashboard

**Purpose:** Trip and delivery management

**Key Features:**
- Trip creation and management
- Delivery requests
- Route planning
- Earnings tracking
- Delivery history
- Rating and reviews
- Document management
- Real-time tracking


---

## 🔄 CORE FLOWS

### E-commerce Flow

```mermaid
graph TD
    A[Browse Products] --> B[View Product Details]
    B --> C[Add to Cart]
    C --> D[Proceed to Checkout]
    D --> E[Select Shipping Method]
    E --> F[Choose Payment Method]
    F --> G[Review Order]
    G --> H[Confirm Purchase]
    H --> I[Payment Processing]
    I --> J[Escrow Creation]
    J --> K[Order Confirmation]
    K --> L[Seller Ships Item]
    L --> M[Buyer Receives Item]
    M --> N[Confirm Delivery]
    N --> O[Escrow Release]
    O --> P[Rate & Review]
```

### Crowdshipping Flow

```mermaid
graph TD
    A[Traveler Creates Trip] --> B[Set Route & Dates]
    B --> C[Publish Trip]
    C --> D[Buyer Creates Request]
    D --> E[Search Available Trips]
    E --> F[Send Request to Traveler]
    F --> G{Traveler Accepts?}
    G -->|Yes| H[Payment Processing]
    G -->|No| E
    H --> I[Escrow Creation]
    I --> J[Coordinate Pickup]
    J --> K[Item Verification]
    K --> L[Transport Item]
    L --> M[Real-time Tracking]
    M --> N[Coordinate Delivery]
    N --> O[Delivery Confirmation]
    O --> P[Escrow Release]
    P --> Q[Rate & Review]
```

### Auction Flow

```mermaid
graph TD
    A[Seller Creates Auction] --> B[Set Starting Price]
    B --> C[Set Duration]
    C --> D[Publish Auction]
    D --> E[Buyers Place Bids]
    E --> F[Proxy Bidding Active]
    F --> G[Anti-Snipe Protection]
    G --> H{Auction Ends}
    H --> I[Highest Bidder Wins]
    I --> J[Payment Processing]
    J --> K[Escrow Creation]
    K --> L[Seller Ships Item]
    L --> M[Buyer Receives Item]
    M --> N[Confirm Delivery]
    N --> O[Escrow Release]
    O --> P[Rate & Review]
```

### P2P Exchange Flow

```mermaid
graph TD
    A[User Creates Exchange Request] --> B[Specify Currency Pair]
    B --> C[Set Amount & Rate]
    C --> D[Publish Request]
    D --> E[Matching Engine Searches]
    E --> F{Match Found?}
    F -->|Yes| G[Create Match]
    F -->|No| H[Wait for Match]
    H --> E
    G --> I[Security Deposit Required]
    I --> J[Both Parties Deposit]
    J --> K[Payment Initiation]
    K --> L[Proof of Payment Upload]
    L --> M[Receipt Confirmation]
    M --> N[Settlement Coordinator]
    N --> O[Funds Released]
    O --> P[Rate & Review]
```

### Dispute Resolution Flow

```mermaid
graph TD
    A[Issue Reported] --> B[Categorize Issue]
    B --> C[Create Support Ticket]
    C --> D[Gather Evidence]
    D --> E[Review Timeline]
    E --> F[Contact Both Parties]
    F --> G[AI-Assisted Analysis]
    G --> H{Resolution Type}
    H -->|Refund| I[Full/Partial Refund]
    H -->|Release| J[Release to Seller]
    H -->|Mediation| K[Third-party Mediator]
    K --> L[Arbitration]
    L --> M[Final Decision]
    I --> N[Close Ticket]
    J --> N
    M --> N
    N --> O[Collect Feedback]
```


---

## 💳 PAYMENT MODEL & FEES

### Money Flow Architecture

```mermaid
graph TD
    subgraph "Payment Sources"
        Buyer[Buyer Payment]
        Stripe[Stripe Connect]
        PayPal[PayPal]
        MPesa[M-Pesa]
        Crypto[Crypto Wallet]
    end

    subgraph "Escrow System"
        EscrowCreation[Escrow Creation]
        FundsHeld[Funds Held]
        ReleaseTrigger[Release Trigger]
        DisputeHold[Dispute Hold]
        FinalRelease[Final Release]
    end

    subgraph "Distribution"
        SellerPayment[Seller Payment<br/>85-92%]
        MarketplaceFee[Marketplace Fee<br/>5% Global, 3% Kenya]
        EscrowFee[Escrow Fee<br/>2.5%]
        TravelerFee[Traveler Fee]
        PayoutFee[Payout Fee<br/>1% Min $1]
        MPesaFee[M-Pesa Fee<br/>0.5%]
    end

    Buyer --> Stripe
    Stripe --> EscrowCreation
    PayPal --> EscrowCreation
    MPesa --> EscrowCreation
    Crypto --> EscrowCreation

    EscrowCreation --> FundsHeld
    FundsHeld --> ReleaseTrigger
    ReleaseTrigger --> FinalRelease
    FundsHeld --> DisputeHold
    DisputeHold --> FinalRelease

    FinalRelease --> SellerPayment
    FinalRelease --> MarketplaceFee
    FinalRelease --> EscrowFee
    FinalRelease --> TravelerFee
    FinalRelease --> PayoutFee
    FinalRelease --> MPesaFee
```

### Fee Structure

| Fee Type | Rate | Minimum | Applies To | Notes |
|----------|------|---------|------------|-------|
| **Marketplace Fee** | 5% Global<br/>3% Kenya | $0.50 | Total Transaction | Platform revenue |
| **Escrow Fee** | 2.5% | $1.00 | Total Transaction | Custody & dispute resolution |
| **Payout Fee** | 1% | $1.00 | Payout Amount | Bank transfer processing |
| **M-Pesa Fee** | 0.5% | $0.10 | M-Pesa Amount | Mobile money processing |
| **Currency Conversion** | 2.5% | $0.25 | Conversion Amount | Real-time FX rates |
| **Dispute Fee** | $25 | $25 | Per Dispute | Charged to losing party |
| **Chargeback Fee** | $15 | $15 | Per Chargeback | Payment processor passthrough |
| **Traveler Commission** | 10-20% | $5.00 | Delivery Fee | Traveler earnings |

### Payment Methods Supported

**Credit/Debit Cards:**
- Visa, Mastercard, American Express
- 3D Secure authentication
- Tokenization for security

**Digital Wallets:**
- PayPal
- Apple Pay
- Google Pay

**Mobile Money:**
- M-Pesa (Kenya)
- Airtel Money
- MTN Mobile Money

**Bank Transfers:**
- ACH (US)
- SEPA (Europe)
- Local bank transfers

**Cryptocurrency:**
- MNB Token (platform token)
- Bitcoin, Ethereum (planned)


---

## 🔐 TRUST & SAFETY

### Multi-Layered Security

**Authentication:**
- Social Login (Google, Facebook, Apple)
- Two-Factor Authentication (SMS, Authenticator)
- Biometric Authentication (mobile)
- Session Management (Redis, 24-hour expiration)
- Device Fingerprinting

**Fraud Detection:**
- Behavioral Analysis (pattern recognition)
- Geographic Risk Assessment
- Transaction Pattern Monitoring
- Machine Learning Models (real-time scoring)
- Velocity Checks (rapid transaction detection)

**Data Protection:**
- Encryption at Rest (AES-256)
- Encryption in Transit (TLS 1.3)
- PCI Compliance (Stripe handles card data)
- GDPR Compliance
- Regional Compliance (Kenyan regulations)

### Trust Score System

**Trust Factors:**
- Identity Verification (KYC/documents)
- Transaction History (completion rate, timeliness)
- Rating System (feedback from users)
- Dispute History (number and resolution)
- Account Age (time on platform)
- Verification Level (phone, email, address)

**Trust Levels:**
- **New User:** Limited history, basic access
- **Standard User:** Basic verification complete
- **Verified User:** Full verification complete
- **Trusted User:** Excellent history, premium access
- **Restricted User:** Risk identified, limited access

### Dispute Resolution

**SLA Tracking:**
- First Response: 2-24 hours (based on severity)
- Resolution Time: 24-168 hours (based on complexity)
- Customer Satisfaction: Feedback collection
- Performance Metrics: Analytics dashboard

**Resolution Options:**
- Full Refund (complete buyer protection)
- Partial Refund (proportional settlement)
- Item Replacement (alternative resolution)
- Escrow Release (evidence-based distribution)
- Account Action (user restriction/suspension)

**Escalation Process:**
1. Automated categorization and assignment
2. Evidence collection (messages, photos, documents)
3. AI-assisted analysis
4. Mediation (third-party mediator)
5. Arbitration (final decision authority)
6. Senior review (complex cases)


---

## 📊 CURRENT STATUS & GAPS

### Completion Breakdown

**Overall Platform:** 40% Complete

**By Category:**
- Core Infrastructure: 80% ✅
- E-commerce Features: 60% ⚠️
- Crowdshipping Features: 50% ⚠️
- Payment Processing: 40% ⚠️ (mock implementation)
- AI Features: 10% ❌
- Mobile Apps: 20% ❌
- Geolocation: 5% ❌
- Blockchain: 0% ❌

### Critical Gaps

**1. Real Money Custody (Priority: CRITICAL)**
- Current: Mock escrow implementation
- Needed: Escrow Kenya integration
- Timeline: 2 weeks
- Budget: $10K-$15K
- Risk: Low (partner account ready)

**2. Bank Integration (Priority: CRITICAL)**
- Current: Mock payment processing
- Needed: Stripe Connect full integration
- Timeline: 2 weeks
- Budget: $5K-$10K
- Risk: Low (proven provider)

**3. AI Features (Priority: HIGH)**
- Current: 10% complete (basic recommendations)
- Needed: Dynamic pricing, predictive analytics, chatbot
- Timeline: 8-12 weeks
- Budget: $20K-$30K
- Risk: Medium (requires ML expertise)

**4. Geolocation Features (Priority: HIGH)**
- Current: 5% complete (basic location service)
- Needed: Real-time tracking, route optimization
- Timeline: 6-8 weeks
- Budget: $15K-$20K
- Risk: Medium (GPS accuracy challenges)

**5. Mobile Apps (Priority: MEDIUM)**
- Current: 20% complete (structure exists)
- Needed: Full feature parity with web
- Timeline: 10-12 weeks
- Budget: $25K-$35K
- Risk: Low (React Native expertise available)

### MVP Requirements (6 Weeks)

**Must Have:**
✅ User authentication and profiles
✅ Product listings and search
✅ Auction system
✅ Basic payment processing (Stripe)
✅ Escrow integration (Escrow Kenya)
✅ Order management
✅ Basic admin dashboard
✅ Dispute resolution system

**Should Have:**
⚠️ Real-time notifications
⚠️ Chat system
⚠️ Rating and reviews
⚠️ Basic mobile app

**Could Have:**
❌ AI recommendations
❌ Dynamic pricing
❌ Live streaming
❌ Blockchain integration

### Timeline to Full Vision

**Phase 1: MVP (Weeks 1-6)**
- Escrow Kenya integration
- Stripe Connect full setup
- Basic mobile app
- Production deployment

**Phase 2: Core Features (Weeks 7-12)**
- Real-time tracking
- Advanced notifications
- Enhanced admin tools
- Performance optimization

**Phase 3: AI Integration (Weeks 13-20)**
- Recommendation engine
- Dynamic pricing
- Predictive analytics
- Chatbot assistant

**Phase 4: Advanced Features (Weeks 21-32)**
- Live streaming
- AR/VR preview
- Voice commerce
- Social commerce

**Phase 5: Blockchain (Weeks 33-48)**
- Smart contracts
- Token economy
- Staking system
- Governance

**Phase 6: Scale & Optimize (Weeks 49-64)**
- Performance tuning
- Global expansion
- Advanced analytics
- Enterprise features


---

## 🚀 DEPLOYMENT & OPERATIONS

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/mnbara/platform.git
cd platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start databases
docker-compose up -d postgres redis mongodb elasticsearch

# Run database migrations
npm run migrate

# Start all services
npm run dev

# Access applications
# Web App: http://localhost:3000
# Admin Dashboard: http://localhost:3001
# API Gateway: http://localhost:8080
```

### Production Deployment

**Infrastructure:**
- **Cloud Provider:** AWS/GCP
- **Container Orchestration:** Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **CDN:** CloudFront
- **DNS:** Route 53

**Deployment Process:**
1. Code push to GitHub
2. Automated tests run (unit, integration, E2E)
3. Docker images built and pushed to registry
4. Kubernetes deployment updated
5. Health checks performed
6. Traffic gradually shifted to new version
7. Monitoring and alerting active

**Scaling Strategy:**
- Horizontal scaling for stateless services
- Vertical scaling for databases
- Auto-scaling based on CPU/memory metrics
- Load balancing across multiple regions
- CDN for static assets

### Monitoring & Alerting

**Key Metrics:**
- System Health (CPU, memory, disk, network)
- Application Performance (response time, throughput)
- Error Rates (4xx, 5xx errors)
- Database Performance (query time, connections)
- Queue Depth (background jobs)
- User Activity (active users, transactions)

**Alerts:**
- Critical: System down, database failure
- High: High error rate, slow response time
- Medium: Queue backlog, high CPU usage
- Low: Disk space warning, cache miss rate

### Backup & Recovery

**Backup Strategy:**
- Database: Daily full backup, hourly incremental
- Files: Continuous replication to S3
- Configuration: Version controlled in Git
- Retention: 30 days for daily, 7 days for hourly

**Disaster Recovery:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Multi-region failover capability
- Regular disaster recovery drills


---

## 🛠️ DEVELOPMENT GUIDE

### Code Standards

**TypeScript:**
- Strict mode enabled
- No implicit any
- Explicit return types for functions
- Interface over type for object shapes

**Naming Conventions:**
- PascalCase for components and classes
- camelCase for variables and functions
- UPPER_SNAKE_CASE for constants
- kebab-case for file names

**Code Organization:**
```
service-name/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── Dockerfile           # Container definition
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

### Testing Strategy

**Unit Tests:**
- Test individual functions and methods
- Mock external dependencies
- Aim for 80%+ code coverage
- Use Jest for testing framework

**Integration Tests:**
- Test service interactions
- Use test database
- Test API endpoints
- Verify data persistence

**End-to-End Tests:**
- Test complete user flows
- Use Playwright/Cypress
- Test critical paths
- Run before deployment

**Property-Based Tests:**
- Test invariants and properties
- Use fast-check library
- Validate business rules
- Catch edge cases

### Git Workflow

**Branching Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Emergency fixes

**Commit Messages:**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

### API Documentation

**OpenAPI/Swagger:**
- All endpoints documented
- Request/response schemas defined
- Authentication requirements specified
- Example requests provided

**Postman Collections:**
- Organized by service
- Environment variables configured
- Pre-request scripts included
- Test assertions added


---

## 📚 APPENDICES

### A. Glossary

**Crowdshipping:** Peer-to-peer package delivery using travelers
**Escrow:** Third-party holding of funds until conditions are met
**KYC:** Know Your Customer - identity verification process
**P2P:** Peer-to-peer transactions between users
**Proxy Bidding:** Automatic bidding up to a maximum amount
**Anti-Snipe:** Auction time extension to prevent last-second bids
**Trust Score:** User reputation based on transaction history
**MNB Token:** Platform cryptocurrency token
**Decision Authority:** Custodii integration for automated decisions
**Disposition Status:** Final state of a transaction or item

### B. Acronyms

- **API:** Application Programming Interface
- **AWS:** Amazon Web Services
- **BNPL:** Buy Now Pay Later
- **CDN:** Content Delivery Network
- **CI/CD:** Continuous Integration/Continuous Deployment
- **CMS:** Content Management System
- **CRUD:** Create, Read, Update, Delete
- **ELK:** Elasticsearch, Logstash, Kibana
- **FX:** Foreign Exchange
- **GDPR:** General Data Protection Regulation
- **JWT:** JSON Web Token
- **ML:** Machine Learning
- **MVP:** Minimum Viable Product
- **OAuth:** Open Authorization
- **ORM:** Object-Relational Mapping
- **PCI:** Payment Card Industry
- **PRD:** Product Requirements Document
- **REST:** Representational State Transfer
- **RPO:** Recovery Point Objective
- **RTO:** Recovery Time Objective
- **SDK:** Software Development Kit
- **SEO:** Search Engine Optimization
- **SLA:** Service Level Agreement
- **SMS:** Short Message Service
- **SSR:** Server-Side Rendering
- **TLS:** Transport Layer Security
- **UI/UX:** User Interface/User Experience
- **WebRTC:** Web Real-Time Communication

### C. External Services

**Payment Processors:**
- Stripe Connect: https://stripe.com/connect
- PayPal: https://www.paypal.com
- M-Pesa: https://www.safaricom.co.ke/mpesa
- Escrow Kenya: https://escrowkenya.com

**Infrastructure:**
- AWS: https://aws.amazon.com
- Google Cloud: https://cloud.google.com
- Vercel: https://vercel.com
- Render: https://render.com

**Communication:**
- Twilio: https://www.twilio.com
- Novu: https://novu.co
- OneSignal: https://onesignal.com
- Firebase Cloud Messaging: https://firebase.google.com/fcm

**Analytics:**
- Plausible: https://plausible.io
- PostHog: https://posthog.com
- Google Analytics: https://analytics.google.com

**Monitoring:**
- Sentry: https://sentry.io
- Prometheus: https://prometheus.io
- Grafana: https://grafana.com

### D. Database Schema

**Core Tables:**
- users
- profiles
- listings
- orders
- payments
- escrows
- wallets
- transactions
- trips
- delivery_requests
- matches
- reviews
- disputes
- notifications
- messages

**Relationships:**
- User → Profile (1:1)
- User → Listings (1:N)
- User → Orders (1:N)
- Order → Payment (1:1)
- Order → Escrow (1:1)
- User → Wallet (1:1)
- Wallet → Transactions (1:N)
- Trip → DeliveryRequests (1:N)
- DeliveryRequest → Match (1:1)
- User → Reviews (1:N)
- Order → Dispute (1:1)

### E. Environment Variables

**Required:**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mnbara
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# External Services
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=mnbara-uploads

# Notifications
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
NOVU_API_KEY=...

# Monitoring
SENTRY_DSN=...
```

### F. Testing Strategy

**Test Pyramid:**
- Unit Tests: 70% (fast, isolated)
- Integration Tests: 20% (service interactions)
- E2E Tests: 10% (critical user flows)

**Coverage Goals:**
- Overall: 80%+
- Critical paths: 95%+
- New features: 90%+

**Test Environments:**
- Local: Developer machines
- CI: GitHub Actions
- Staging: Pre-production
- Production: Live monitoring

### G. Support Resources

**Documentation:**
- Technical Docs: `/docs`
- API Docs: `/docs/api`
- User Guides: `/docs/guides`
- Runbooks: `/docs/runbooks`

**Communication:**
- Slack: #mnbara-dev
- Email: dev@mnbara.com
- Issue Tracker: GitHub Issues

**Training:**
- Onboarding Guide: `/docs/onboarding.md`
- Architecture Overview: `/docs/architecture.md`
- Code Standards: `/docs/standards.md`

### H. Changelog

**v1.0.0 (February 14, 2026)**
- Initial unified PRD release
- Merged Kiro and Kimi documentation
- Comprehensive microservices catalog
- Complete flow diagrams
- Deployment and operations guide
- Development standards and guidelines

---

## 📝 Document Maintenance

**Ownership:** Platform Team  
**Review Cycle:** Monthly  
**Last Review:** February 14, 2026  
**Next Review:** March 14, 2026

**Contributors:**
- Kiro AI Assistant (Technical Documentation)
- Kimi AI Assistant (Product Requirements)
- Platform Team (Review and Validation)

**Feedback:**
For questions, corrections, or suggestions, please contact:
- Email: docs@mnbara.com
- Slack: #mnbara-docs
- GitHub: Create an issue

---

**END OF DOCUMENT**
