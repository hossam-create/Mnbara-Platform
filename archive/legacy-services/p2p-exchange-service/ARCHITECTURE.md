# P2P Exchange Service - Architecture Documentation

**Version**: 1.0.0  
**Last Updated**: 2026-01-28

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Model](#data-model)
4. [Service Layer](#service-layer)
5. [Security Architecture](#security-architecture)
6. [External Integrations](#external-integrations)
7. [Scalability](#scalability)
8. [Deployment Architecture](#deployment-architecture)

---

## Overview

The P2P Exchange Service enables peer-to-peer currency exchange through a marketplace model with internal netting and optional external escrow. The service implements a seven-layer security system to ensure safe and trustworthy exchanges.

### Key Features

- **Marketplace**: Browse and accept exchange requests
- **Automatic Matching**: Intelligent matching engine
- **Dual Settlement**: Internal netting + external escrow
- **Seven-Layer Security**: Comprehensive fraud prevention
- **Trust System**: Progressive trust levels
- **Communication**: Secure in-platform messaging

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React Web    │  │ Mobile App   │  │ Admin Panel  │      │
│  │ Components   │  │ (Future)     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Express.js REST API                                  │   │
│  │ - Authentication & Authorization                     │   │
│  │ - Rate Limiting                                      │   │
│  │ - Request Validation                                 │   │
│  │ - Error Handling                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Exchange     │  │ Matching     │  │ Settlement   │      │
│  │ Request      │  │ Engine       │  │ Coordinator  │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Security     │  │ Trust Level  │  │ Communication│      │
│  │ Deposit      │  │ Service      │  │ Service      │      │
│  │ Service      │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Proof of     │  │ Fee          │  │ Transaction  │      │
│  │ Payment      │  │ Calculation  │  │ Classifier   │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ Redis Cache  │  │ S3 Storage   │      │
│  │ Database     │  │              │  │ (Proofs)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OpenExchange │  │ Tatum.io     │  │ PSPs         │      │
│  │ Rates (FX)   │  │ (Escrow)     │  │ (Payments)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
User Creates Request
        ↓
Exchange Request Service
        ↓
Security Deposit Check → Security Deposit Service
        ↓
Trust Level Check → Trust Level Service
        ↓
Fee Calculation → Fee Calculation Service
        ↓
Save to Database
        ↓
Publish to Marketplace
        ↓
Matching Engine (Cron Job)
        ↓
Find Compatible Requests
        ↓
Calculate Match Score
        ↓
Create Match
        ↓
Settlement Coordinator
        ↓
Internal or External Settlement
        ↓
Complete Exchange
        ↓
Update Trust Levels
```

---

## Data Model

### Core Entities

#### ExchangeRequest

```typescript
{
  id: string;              // Unique identifier
  userId: string;          // User who created request
  type: 'BUY' | 'SELL';   // Request type
  fromCurrency: string;    // Source currency (USD, EGP, etc.)
  toCurrency: string;      // Target currency
  fromAmount: number;      // Source amount
  toAmount: number;        // Target amount
  rate: number;            // Exchange rate
  status: RequestStatus;   // OPEN, MATCHED, COMPLETED, etc.
  matchId?: string;        // Associated match (if matched)
  expiresAt: Date;         // Expiration time
  createdAt: Date;
  updatedAt: Date;
}
```

#### ExchangeMatch

```typescript
{
  id: string;
  request1Id: string;      // First request
  request2Id: string;      // Second request
  status: MatchStatus;     // PENDING_PAYMENT, PAYMENT_INITIATED, etc.
  matchScore: number;      // Match quality score (0-100)
  settlementMethod: 'internal' | 'external';
  settlementId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Settlement

```typescript
{
  id: string;
  matchId: string;
  method: 'internal' | 'external';
  provider?: string;       // PSP or escrow provider
  status: SettlementStatus;
  fromUserId: string;
  toUserId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  externalReference?: string;
  initiatedAt: Date;
  completedAt?: Date;
}
```

#### SecurityDeposit

```typescript
{
  id: string;
  userId: string;
  balance: number;         // Total balance
  frozen: number;          // Frozen amount
  available: number;       // Available = balance - frozen
  currency: string;        // USD
  lastUpdated: Date;
}
```

#### TrustLevel

```typescript
{
  id: string;
  userId: string;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  maxTransactionAmount: number;
  completedExchanges: number;
  successRate: number;
  averageCompletionTime: number;
  disputeRate: number;
  lastUpdated: Date;
}
```

#### ProofOfPayment

```typescript
{
  id: string;
  matchId: string;
  uploaderId: string;
  fileUrl: string;
  fileType: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  uploadedAt: Date;
}
```

#### CommunicationLog

```typescript
{
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  flagged: boolean;
  flagReason?: string;
  createdAt: Date;
}
```

### Database Schema

```sql
-- Exchange Requests
CREATE TABLE exchange_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  from_amount DECIMAL(18, 2) NOT NULL,
  to_amount DECIMAL(18, 2) NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  status VARCHAR(50) NOT NULL,
  match_id VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_currencies (from_currency, to_currency),
  INDEX idx_expires_at (expires_at)
);

-- Exchange Matches
CREATE TABLE exchange_matches (
  id VARCHAR(255) PRIMARY KEY,
  request1_id VARCHAR(255) NOT NULL,
  request2_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  match_score INT NOT NULL,
  settlement_method VARCHAR(20) NOT NULL,
  settlement_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_status (status),
  INDEX idx_requests (request1_id, request2_id)
);

-- Settlements
CREATE TABLE settlements (
  id VARCHAR(255) PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL,
  method VARCHAR(20) NOT NULL,
  provider VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  from_user_id VARCHAR(255) NOT NULL,
  to_user_id VARCHAR(255) NOT NULL,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  from_amount DECIMAL(18, 2) NOT NULL,
  to_amount DECIMAL(18, 2) NOT NULL,
  external_reference VARCHAR(255),
  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  INDEX idx_match_id (match_id),
  INDEX idx_status (status)
);

-- Security Deposits
CREATE TABLE security_deposits (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
  frozen DECIMAL(18, 2) NOT NULL DEFAULT 0,
  available DECIMAL(18, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  last_updated TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id)
);

-- Trust Levels
CREATE TABLE trust_levels (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'BRONZE',
  max_transaction_amount DECIMAL(18, 2) NOT NULL,
  completed_exchanges INT NOT NULL DEFAULT 0,
  success_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  average_completion_time INT NOT NULL DEFAULT 0,
  dispute_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_level (level)
);

-- Proofs of Payment
CREATE TABLE proofs_of_payment (
  id VARCHAR(255) PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL,
  uploader_id VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  notes TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_match_id (match_id),
  INDEX idx_status (status)
);

-- Communication Logs
CREATE TABLE communication_logs (
  id VARCHAR(255) PRIMARY KEY,
  match_id VARCHAR(255) NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_match_id (match_id),
  INDEX idx_flagged (flagged)
);
```

---

## Service Layer

### Exchange Request Service

**Responsibilities**:
- Create, read, update, delete exchange requests
- Validate request parameters
- Check security deposit and trust level
- Calculate fees
- Manage request lifecycle

**Key Methods**:
- `createRequest(data)`: Create new exchange request
- `getRequest(id)`: Get request by ID
- `getUserRequests(userId)`: Get user's requests
- `getOpenRequests()`: Get marketplace requests
- `cancelRequest(id)`: Cancel request
- `expireOldRequests()`: Expire timed-out requests

### Matching Engine Service

**Responsibilities**:
- Find compatible exchange requests
- Calculate match scores
- Create matches automatically
- Handle manual acceptance

**Matching Algorithm**:
1. Find requests with opposite types (BUY ↔ SELL)
2. Match currencies (A→B with B→A)
3. Check amount compatibility (within 10%)
4. Check rate compatibility (within 5%)
5. Calculate match score based on:
   - Rate difference (40%)
   - Amount difference (30%)
   - Trust level (20%)
   - Time in marketplace (10%)
6. Create match if score > 70

**Key Methods**:
- `runMatching()`: Run matching engine (cron job)
- `findCompatibleRequests(request)`: Find matches
- `calculateMatchScore(req1, req2)`: Calculate score
- `createMatch(req1, req2)`: Create match
- `manualAccept(requestId, acceptorId)`: Manual match

### Settlement Coordinator Service

**Responsibilities**:
- Coordinate settlement process
- Handle internal and external settlements
- Process PSP webhooks
- Retry failed settlements

**Settlement Flow**:
1. **Internal Settlement**:
   - Debit buyer's wallet
   - Credit seller's wallet
   - Record transaction
   - Complete match

2. **External Settlement**:
   - Create escrow with provider
   - Wait for payment confirmation
   - Release escrow to seller
   - Complete match

**Key Methods**:
- `initiateSettlement(matchId)`: Start settlement
- `processInternalSettlement(match)`: Internal flow
- `processExternalSettlement(match)`: External flow
- `handlePSPWebhook(provider, data)`: Process webhook
- `retrySettlement(settlementId)`: Retry failed

### Security Deposit Service

**Responsibilities**:
- Manage user security deposits
- Freeze/unfreeze deposits
- Deduct deposits for violations
- Validate sufficient deposits

**Key Methods**:
- `getDeposit(userId)`: Get deposit balance
- `createDeposit(userId)`: Initialize deposit
- `addToDeposit(userId, amount)`: Add funds
- `freezeDeposit(userId, amount)`: Freeze funds
- `unfreezeDeposit(userId, amount)`: Unfreeze funds
- `deductDeposit(userId, amount)`: Deduct funds
- `hasSufficientDeposit(userId, required)`: Check balance

### Trust Level Service

**Responsibilities**:
- Manage user trust levels
- Calculate trust scores
- Upgrade/downgrade levels
- Enforce transaction limits

**Trust Levels**:
- **BRONZE**: $0-$1,000 per transaction
- **SILVER**: $1,000-$5,000 per transaction
- **GOLD**: $5,000-$10,000 per transaction
- **PLATINUM**: Unlimited

**Upgrade Criteria**:
- Completed exchanges
- Success rate
- Low dispute rate
- Fast completion time

**Key Methods**:
- `getTrustLevel(userId)`: Get trust level
- `initializeTrustLevel(userId)`: Initialize
- `updateAfterExchange(userId, success)`: Update stats
- `downgradeLevel(userId, reason)`: Downgrade
- `canPerformExchange(userId, amount)`: Check limit

---

## Security Architecture

### Seven-Layer Security System

#### Layer 1: Security Deposit (5%)
- Every user must maintain a security deposit
- Minimum 5% of transaction value
- Frozen during active exchanges
- Deducted for violations

#### Layer 2: Trust Level
- Progressive trust system
- Transaction limits based on level
- Earned through successful exchanges
- Lost through disputes/violations

#### Layer 3: Proof of Payment
- Buyer must upload proof
- Image or PDF format
- Manual or automatic verification
- Seller confirms receipt

#### Layer 4: Timeouts
- Payment: 30 minutes
- Proof upload: 60 minutes
- Receipt confirmation: 30 minutes
- Automatic dispute if timeout

#### Layer 5: Communication Monitoring
- All messages logged
- External contact detection
- Phone/email/social media patterns
- Automatic flagging and freezing

#### Layer 6: Identity Anchor
- Phone number verification
- Email verification
- KYC for high-value transactions
- Device fingerprinting

#### Layer 7: Arbitration
- Dispute resolution system
- Admin review
- Evidence evaluation
- Fair resolution

### Security Guards

Each layer is implemented as a guard that validates transactions:

```typescript
// Example: Security Deposit Guard
class SecurityDepositGuard {
  async validate(userId: string, amount: number): Promise<void> {
    const deposit = await this.depositService.getDeposit(userId);
    const required = amount * 0.05; // 5%
    
    if (deposit.available < required) {
      throw new InsufficientSecurityDepositError(required, deposit.available);
    }
  }
}
```

---

## External Integrations

### FX Provider (OpenExchangeRates)

**Purpose**: Real-time exchange rates

**Integration**:
- REST API
- 60-second cache (Redis)
- Fallback to last known rate

**Endpoints Used**:
- `GET /latest.json`: Current rates
- `GET /historical/{date}.json`: Historical rates

### External Escrow (Tatum.io)

**Purpose**: Blockchain-based escrow for crypto exchanges

**Integration**:
- REST API
- Webhook callbacks
- Multi-currency support (BTC, ETH, USDT)

**Flow**:
1. Create escrow address
2. Buyer sends funds
3. Confirm receipt
4. Release to seller

### Payment Service Providers

**Stripe**:
- Credit card payments
- Bank transfers
- Webhook notifications

**PayPal**:
- PayPal balance
- Credit card
- Webhook notifications

**Wise**:
- International transfers
- Multi-currency
- Webhook notifications

---

## Scalability

### Horizontal Scaling

- **Stateless Service**: Can run multiple instances
- **Load Balancer**: Distribute traffic
- **Database Connection Pooling**: Efficient connections
- **Redis Caching**: Reduce database load

### Performance Optimizations

1. **Database Indexes**: On frequently queried fields
2. **Query Optimization**: Efficient SQL queries
3. **Caching**: Redis for FX rates, user data
4. **Async Processing**: Background jobs for matching
5. **CDN**: Static assets and proof files

### Monitoring & Alerting

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Sentry**: Error tracking
- **Winston**: Structured logging

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                    (NGINX/ALB)                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              P2P Exchange Service Instances              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Instance 1   │  │ Instance 2   │  │ Instance 3   │  │
│  │ (Container)  │  │ (Container)  │  │ (Container)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │ Redis        │  │ S3           │  │
│  │ (RDS)        │  │ (ElastiCache)│  │ (Storage)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Monitoring Stack                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Prometheus   │  │ Grafana      │  │ Sentry       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Container Configuration

**Docker**:
- Base image: Node.js 18 Alpine
- Multi-stage build
- Health checks
- Resource limits (2GB RAM, 2 CPUs)

**Kubernetes** (Future):
- Deployment with 3 replicas
- Horizontal Pod Autoscaler
- Service mesh (Istio)
- Ingress controller

---

## Security Best Practices

1. **Authentication**: JWT tokens with short expiry
2. **Authorization**: Role-based access control
3. **Input Validation**: Strict validation on all inputs
4. **SQL Injection**: Parameterized queries (Prisma)
5. **XSS Prevention**: Content sanitization
6. **CSRF Protection**: CSRF tokens
7. **Rate Limiting**: Per-user and per-IP limits
8. **Encryption**: TLS for all communications
9. **Secrets Management**: Environment variables, AWS Secrets Manager
10. **Audit Logging**: All sensitive operations logged

---

## Future Enhancements

1. **Machine Learning**: Fraud detection, match optimization
2. **Mobile App**: Native iOS and Android apps
3. **More Currencies**: Expand currency support
4. **More PSPs**: Additional payment providers
5. **API for Third Parties**: Public API for integrations
6. **Advanced Analytics**: Business intelligence dashboard
7. **Referral Program**: User acquisition incentives
8. **Liquidity Pools**: Market maker program

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
