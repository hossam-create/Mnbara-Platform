# P2P Exchange Marketplace - Design Document

**Feature Name**: p2p-exchange-marketplace  
**Date**: January 25, 2026  
**Status**: Design Phase  
**Model**: Marketplace + Netting WITHOUT Custody

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Exchange UI  │  │ Marketplace  │  │ Admin Panel  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│                    (Core API Service)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    P2P Exchange Service (NEW)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Exchange     │  │ Matching     │  │ Settlement   │         │
│  │ Manager      │  │ Engine       │  │ Coordinator  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Existing Services (REUSE)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Internal     │  │ Trust &      │  │ User         │         │
│  │ Ledger       │  │ Safety       │  │ Service      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  External Integrations (NEW)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PSP          │  │ FX Provider  │  │ External     │         │
│  │ Integration  │  │ (Real Rates) │  │ Escrow       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Principles

1. **Non-Custodial**: Platform NEVER holds customer funds
2. **Reuse Existing**: Leverage 70% of existing infrastructure
3. **No Breaking Changes**: All existing features remain functional
4. **Dual-Layer Protection**: Internal netting + external escrow
5. **Seven-Layer Security**: Comprehensive anti-scam architecture



---

## 2. Database Schema

### 2.1 New Tables

#### ExchangeRequest
```prisma
model ExchangeRequest {
  id                Int                @id @default(autoincrement())
  userId            Int
  fromCurrency      String             // USD, SAR, AED, etc.
  toCurrency        String
  fromAmount        Decimal            @db.Decimal(18, 2)
  toAmount          Decimal            @db.Decimal(18, 2)
  desiredRate       Decimal            @db.Decimal(18, 6)
  actualRate        Decimal?           @db.Decimal(18, 6)
  platformFee       Decimal            @db.Decimal(18, 2)
  protectionFee     Decimal?           @db.Decimal(18, 2)
  status            ExchangeStatus     @default(OPEN)
  trustLevel        Int                @default(1)
  securityDeposit   Decimal            @db.Decimal(18, 2)
  expiresAt         DateTime
  matchedAt         DateTime?
  completedAt       DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  user              User               @relation(fields: [userId], references: [id])
  match             ExchangeMatch?     @relation("RequestMatch")
  counterMatch      ExchangeMatch?     @relation("CounterMatch")
  proofOfPayment    ProofOfPayment[]
  
  @@index([userId])
  @@index([status])
  @@index([fromCurrency, toCurrency])
  @@index([expiresAt])
}

enum ExchangeStatus {
  OPEN              // Request created, waiting for match
  MATCHED           // Matched with counter-party
  PAYMENT_INITIATED // User initiated payment
  PROOF_UPLOADED    // Proof of payment uploaded
  CONFIRMING        // Waiting for confirmation
  COMPLETED         // Exchange completed successfully
  CANCELLED         // Cancelled by user
  EXPIRED           // Expired without match
  DISPUTED          // Under dispute
  REFUNDED          // Refunded to user
}
```

#### ExchangeMatch
```prisma
model ExchangeMatch {
  id                Int                @id @default(autoincrement())
  requestId         Int                @unique
  counterRequestId  Int                @unique
  matchType         MatchType          @default(AUTOMATIC)
  matchScore        Decimal            @db.Decimal(5, 2)
  status            MatchStatus        @default(PENDING)
  escrowHoldId      Int?               @unique
  externalEscrowId  String?            // External provider escrow ID
  settlementMethod  SettlementMethod   @default(INTERNAL)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  request           ExchangeRequest    @relation("RequestMatch", fields: [requestId], references: [id])
  counterRequest    ExchangeRequest    @relation("CounterMatch", fields: [counterRequestId], references: [id])
  escrowHold        EscrowHold?        @relation(fields: [escrowHoldId], references: [id])
  settlement        Settlement?
  
  @@index([status])
  @@index([createdAt])
}

enum MatchType {
  AUTOMATIC         // Matched by matching engine
  MANUAL            // User manually accepted offer
}

enum MatchStatus {
  PENDING           // Match created, waiting for escrow
  ESCROWED          // Funds locked in escrow
  SETTLING          // Settlement in progress
  COMPLETED         // Settlement completed
  FAILED            // Settlement failed
  DISPUTED          // Under dispute
}

enum SettlementMethod {
  INTERNAL          // Internal netting only
  EXTERNAL_OPTIONAL // External escrow (user opted in)
  EXTERNAL_MANDATORY // External escrow (required for amount)
}
```


#### Settlement
```prisma
model Settlement {
  id                Int                @id @default(autoincrement())
  matchId           Int                @unique
  method            SettlementMethod
  pspProvider       String?            // Stripe, Plaid, Tatum, etc.
  pspTransactionId  String?
  pspStatus         String?
  externalEscrowProvider String?        // Tatum, Vodafone Cash, etc.
  externalEscrowId  String?
  status            SettlementStatus   @default(PENDING)
  initiatedAt       DateTime           @default(now())
  completedAt       DateTime?
  failedAt          DateTime?
  failureReason     String?
  retryCount        Int                @default(0)
  
  // Relations
  match             ExchangeMatch      @relation(fields: [matchId], references: [id])
  
  @@index([status])
  @@index([pspProvider])
}

enum SettlementStatus {
  PENDING           // Settlement initiated
  PSP_PROCESSING    // PSP processing transfer
  ESCROW_RELEASING  // External escrow releasing funds
  COMPLETED         // Settlement completed
  FAILED            // Settlement failed
  TIMEOUT           // Settlement timed out
}
```

#### ProofOfPayment
```prisma
model ProofOfPayment {
  id                Int                @id @default(autoincrement())
  requestId         Int
  userId            Int
  photoUrl          String             // S3 URL for photo
  videoUrl          String?            // S3 URL for video (optional)
  timestamp         DateTime
  referenceId       String             // Payment reference ID
  recipientName     String
  paymentMethod     String             // Bank transfer, mobile wallet, etc.
  metadata          Json?              // Additional metadata
  verificationStatus VerificationStatus @default(PENDING)
  verifiedBy        Int?               // Admin user ID
  verifiedAt        DateTime?
  rejectionReason   String?
  createdAt         DateTime           @default(now())
  
  // Relations
  request           ExchangeRequest    @relation(fields: [requestId], references: [id])
  user              User               @relation(fields: [userId], references: [id])
  
  @@index([requestId])
  @@index([verificationStatus])
}

enum VerificationStatus {
  PENDING           // Awaiting verification
  VERIFIED          // Verified by admin
  REJECTED          // Rejected by admin
  FLAGGED           // Flagged as suspicious
}
```

#### SecurityDeposit
```prisma
model SecurityDeposit {
  id                Int                @id @default(autoincrement())
  userId            Int
  amount            Decimal            @db.Decimal(18, 2)
  currency          String             @default("USD")
  source            DepositSource
  status            DepositStatus      @default(ACTIVE)
  frozenAmount      Decimal            @db.Decimal(18, 2) @default(0)
  frozenReason      String?
  frozenAt          DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  user              User               @relation(fields: [userId], references: [id])
  
  @@unique([userId, currency])
  @@index([userId])
  @@index([status])
}

enum DepositSource {
  TRANSACTION_HISTORY // Built from successful transactions
  PLATFORM_FEES      // Accumulated from fees
  CASH_DEPOSIT       // Direct cash deposit
  INITIAL_DEPOSIT    // Initial security deposit
}

enum DepositStatus {
  ACTIVE            // Available for use
  FROZEN            // Frozen due to suspicious activity
  DEDUCTED          // Deducted for compensation
  REFUNDED          // Refunded to user
}
```


#### TrustLevel
```prisma
model TrustLevel {
  id                Int                @id @default(autoincrement())
  userId            Int                @unique
  level             Int                @default(1)
  maxTransactionAmount Decimal         @db.Decimal(18, 2)
  successfulExchanges Int              @default(0)
  totalVolume       Decimal            @db.Decimal(18, 2) @default(0)
  disputeCount      Int                @default(0)
  timeoutCount      Int                @default(0)
  lastLevelUpAt     DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  user              User               @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([level])
}
```

#### CommunicationLog
```prisma
model CommunicationLog {
  id                Int                @id @default(autoincrement())
  matchId           Int
  senderId          Int
  recipientId       Int
  message           String             @db.Text
  flagged           Boolean            @default(false)
  flagReason        String?
  createdAt         DateTime           @default(now())
  
  // Relations
  match             ExchangeMatch      @relation(fields: [matchId], references: [id])
  sender            User               @relation("SentMessages", fields: [senderId], references: [id])
  recipient         User               @relation("ReceivedMessages", fields: [recipientId], references: [id])
  
  @@index([matchId])
  @@index([flagged])
}
```

#### ExternalEscrowProvider
```prisma
model ExternalEscrowProvider {
  id                Int                @id @default(autoincrement())
  name              String             @unique
  type              ProviderType
  country           String?            // Specific country or null for international
  supportedCurrencies String[]         // Array of supported currencies
  minAmount         Decimal?           @db.Decimal(18, 2)
  maxAmount         Decimal?           @db.Decimal(18, 2)
  feePercentage     Decimal            @db.Decimal(5, 2)
  feeFixed          Decimal?           @db.Decimal(18, 2)
  settlementTime    Int                // Minutes
  apiEndpoint       String
  apiKey            String?            // Encrypted
  isActive          Boolean            @default(true)
  priority          Int                @default(0)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@index([country])
  @@index([isActive])
}

enum ProviderType {
  BLOCKCHAIN        // Tatum.io, blockchain-based
  MOBILE_WALLET     // Vodafone Cash, STC Pay, etc.
  BANK              // Traditional bank escrow
  PAYMENT_PROCESSOR // Stripe, PayPal, etc.
}
```

### 2.2 Existing Tables (Reuse)

- **Wallet** (from internal-ledger-service) - Track user balances
- **EscrowHold** (from internal-ledger-service) - Internal escrow holds
- **WalletTransaction** (from internal-ledger-service) - Transaction history
- **User** (from user-service) - User authentication and profiles
- **Dispute** (from request-engine) - Dispute resolution
- **TrustScore** (from auction-service) - User reputation



---

## 3. Service Architecture

### 3.1 P2P Exchange Service (NEW)

**Location**: `backend/services/p2p-exchange-service/`

#### 3.1.1 Core Services

**ExchangeRequestService**
```typescript
class ExchangeRequestService {
  // Create new exchange request
  async createRequest(input: CreateExchangeRequestInput): Promise<ExchangeRequest>
  
  // Get request by ID
  async getRequest(requestId: number): Promise<ExchangeRequest>
  
  // Get user's requests
  async getUserRequests(userId: number, filters?: RequestFilters): Promise<ExchangeRequest[]>
  
  // Get open requests (marketplace)
  async getOpenRequests(filters?: RequestFilters): Promise<ExchangeRequest[]>
  
  // Cancel request
  async cancelRequest(requestId: number, userId: number): Promise<void>
  
  // Update request status
  async updateStatus(requestId: number, status: ExchangeStatus): Promise<void>
  
  // Check and expire old requests
  async expireOldRequests(): Promise<void>
}
```

**MatchingEngineService**
```typescript
class MatchingEngineService {
  // Run matching algorithm
  async runMatching(): Promise<ExchangeMatch[]>
  
  // Find compatible requests
  async findCompatibleRequests(request: ExchangeRequest): Promise<ExchangeRequest[]>
  
  // Calculate match score
  async calculateMatchScore(req1: ExchangeRequest, req2: ExchangeRequest): Promise<number>
  
  // Create match
  async createMatch(req1: ExchangeRequest, req2: ExchangeRequest, type: MatchType): Promise<ExchangeMatch>
  
  // Manual accept
  async manualAccept(requestId: number, counterRequestId: number, userId: number): Promise<ExchangeMatch>
  
  // Validate match
  async validateMatch(req1: ExchangeRequest, req2: ExchangeRequest): Promise<boolean>
}
```

**SettlementCoordinatorService**
```typescript
class SettlementCoordinatorService {
  // Initiate settlement
  async initiateSettlement(matchId: number): Promise<Settlement>
  
  // Process internal settlement
  async processInternalSettlement(matchId: number): Promise<void>
  
  // Process external settlement
  async processExternalSettlement(matchId: number, provider: string): Promise<void>
  
  // Handle PSP webhook
  async handlePSPWebhook(provider: string, payload: any): Promise<void>
  
  // Retry failed settlement
  async retrySettlement(settlementId: number): Promise<void>
  
  // Complete settlement
  async completeSettlement(settlementId: number): Promise<void>
  
  // Fail settlement
  async failSettlement(settlementId: number, reason: string): Promise<void>
}
```

**SecurityDepositService**
```typescript
class SecurityDepositService {
  // Get user's security deposit
  async getDeposit(userId: number, currency: string): Promise<SecurityDeposit>
  
  // Create initial deposit
  async createDeposit(userId: number, amount: Decimal, source: DepositSource): Promise<SecurityDeposit>
  
  // Add to deposit
  async addToDeposit(userId: number, amount: Decimal, source: DepositSource): Promise<void>
  
  // Freeze deposit
  async freezeDeposit(userId: number, amount: Decimal, reason: string): Promise<void>
  
  // Unfreeze deposit
  async unfreezeDeposit(userId: number, amount: Decimal): Promise<void>
  
  // Deduct from deposit (for compensation)
  async deductDeposit(userId: number, amount: Decimal, reason: string): Promise<void>
  
  // Check sufficient deposit
  async hasSufficientDeposit(userId: number, requiredAmount: Decimal): Promise<boolean>
}
```


**TrustLevelService**
```typescript
class TrustLevelService {
  // Get user's trust level
  async getTrustLevel(userId: number): Promise<TrustLevel>
  
  // Initialize trust level for new user
  async initializeTrustLevel(userId: number): Promise<TrustLevel>
  
  // Update trust level after successful exchange
  async updateAfterExchange(userId: number, amount: Decimal): Promise<void>
  
  // Downgrade trust level after dispute/timeout
  async downgradeLevel(userId: number, reason: string): Promise<void>
  
  // Check if user can perform exchange
  async canPerformExchange(userId: number, amount: Decimal): Promise<boolean>
  
  // Get max transaction amount for user
  async getMaxTransactionAmount(userId: number): Promise<Decimal>
}
```

**ProofOfPaymentService**
```typescript
class ProofOfPaymentService {
  // Upload proof of payment
  async uploadProof(input: UploadProofInput): Promise<ProofOfPayment>
  
  // Get proof by request ID
  async getProof(requestId: number): Promise<ProofOfPayment | null>
  
  // Verify proof (admin)
  async verifyProof(proofId: number, adminId: number, approved: boolean, reason?: string): Promise<void>
  
  // Flag proof as suspicious
  async flagProof(proofId: number, reason: string): Promise<void>
  
  // Get pending proofs for review
  async getPendingProofs(): Promise<ProofOfPayment[]>
}
```

**CommunicationService**
```typescript
class CommunicationService {
  // Send message
  async sendMessage(matchId: number, senderId: number, recipientId: number, message: string): Promise<CommunicationLog>
  
  // Get match messages
  async getMatchMessages(matchId: number): Promise<CommunicationLog[]>
  
  // Flag message
  async flagMessage(messageId: number, reason: string): Promise<void>
  
  // Check for external contact info
  async detectExternalContact(message: string): Promise<boolean>
  
  // Get flagged messages
  async getFlaggedMessages(): Promise<CommunicationLog[]>
}
```

**ExternalEscrowService**
```typescript
class ExternalEscrowService {
  // Get available providers for transaction
  async getAvailableProviders(amount: Decimal, currency: string, country?: string): Promise<ExternalEscrowProvider[]>
  
  // Create external escrow
  async createExternalEscrow(matchId: number, providerId: number): Promise<string>
  
  // Release external escrow
  async releaseExternalEscrow(externalEscrowId: string, providerId: number): Promise<void>
  
  // Refund external escrow
  async refundExternalEscrow(externalEscrowId: string, providerId: number): Promise<void>
  
  // Get escrow status
  async getEscrowStatus(externalEscrowId: string, providerId: number): Promise<string>
  
  // Handle provider webhook
  async handleProviderWebhook(providerId: number, payload: any): Promise<void>
}
```

#### 3.1.2 Integration Adapters

**PSPAdapter (Interface)**
```typescript
interface PSPAdapter {
  // Initiate transfer
  initiateTransfer(from: string, to: string, amount: Decimal, currency: string): Promise<string>
  
  // Get transfer status
  getTransferStatus(transactionId: string): Promise<TransferStatus>
  
  // Cancel transfer
  cancelTransfer(transactionId: string): Promise<void>
  
  // Handle webhook
  handleWebhook(payload: any): Promise<WebhookResult>
}
```

**Implementations**:
- `StripePSPAdapter` - Stripe Connect integration
- `PlaidPSPAdapter` - Plaid ACH transfers
- `TatumPSPAdapter` - Tatum blockchain transfers

**FXProviderAdapter (Interface)**
```typescript
interface FXProviderAdapter {
  // Get real-time rate
  getRate(baseCurrency: string, quoteCurrency: string): Promise<FXRate>
  
  // Get historical rates
  getHistoricalRates(baseCurrency: string, quoteCurrency: string, from: Date, to: Date): Promise<FXRate[]>
  
  // Convert amount
  convert(from: string, to: string, amount: Decimal): Promise<ConversionResult>
}
```

**Implementations**:
- `OpenExchangeRatesAdapter` - OpenExchangeRates.org (recommended)
- `XEAdapter` - XE.com API
- `WiseAdapter` - Wise API


**ExternalEscrowAdapter (Interface)**
```typescript
interface ExternalEscrowAdapter {
  // Create escrow
  createEscrow(amount: Decimal, currency: string, metadata: any): Promise<string>
  
  // Release escrow
  releaseEscrow(escrowId: string): Promise<void>
  
  // Refund escrow
  refundEscrow(escrowId: string): Promise<void>
  
  // Get escrow status
  getStatus(escrowId: string): Promise<EscrowStatus>
  
  // Handle webhook
  handleWebhook(payload: any): Promise<WebhookResult>
}
```

**Implementations**:
- `TatumEscrowAdapter` - Tatum.io blockchain escrow (recommended primary)
- `VodafoneCashAdapter` - Vodafone Cash (Egypt)
- `STCPayAdapter` - STC Pay (Saudi Arabia)
- `FawryAdapter` - Fawry (Egypt)
- `StripeEscrowAdapter` - Stripe escrow (if available)

### 3.2 Existing Services (Reuse)

**Internal Ledger Service** ✅
- `WalletService` - Balance tracking
- `EscrowService` - Internal escrow holds
- `TransactionService` - Transaction recording

**Request Engine Service** ✅
- `DisputeService` - Dispute resolution
- `EvidenceService` - Evidence handling
- `ResolutionService` - Dispute resolution

**Auction Service** ✅
- `TrustScoreService` - User reputation
- `FraudDetectionService` - Fraud detection
- `EventLoggerService` - Event logging

**User Service** ✅
- `AuthService` - Authentication
- `KYCService` - KYC verification
- `UserProfileService` - User profiles

---

## 4. API Design

### 4.1 Exchange Request APIs

**POST /api/v1/exchange/requests**
```typescript
// Create exchange request
Request: {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  desiredRate?: number; // Optional, use market rate if not provided
  expiresIn: number; // Hours
  useExternalEscrow?: boolean; // Optional, for amounts < $1000
}

Response: {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  actualRate: number;
  platformFee: number;
  protectionFee?: number;
  status: ExchangeStatus;
  expiresAt: string;
  estimatedMatchTime: number; // Minutes
}
```

**GET /api/v1/exchange/requests/:id**
```typescript
// Get exchange request details
Response: {
  id: number;
  userId: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  desiredRate: number;
  actualRate?: number;
  platformFee: number;
  status: ExchangeStatus;
  trustLevel: number;
  securityDeposit: number;
  expiresAt: string;
  matchedAt?: string;
  completedAt?: string;
  match?: ExchangeMatch;
}
```

**GET /api/v1/exchange/requests**
```typescript
// Get user's exchange requests
Query: {
  status?: ExchangeStatus;
  fromCurrency?: string;
  toCurrency?: string;
  page?: number;
  limit?: number;
}

Response: {
  requests: ExchangeRequest[];
  total: number;
  page: number;
  limit: number;
}
```

**DELETE /api/v1/exchange/requests/:id**
```typescript
// Cancel exchange request
Response: {
  success: boolean;
  message: string;
}
```


### 4.2 Marketplace APIs

**GET /api/v1/exchange/marketplace**
```typescript
// Browse available exchange offers
Query: {
  fromCurrency?: string;
  toCurrency?: string;
  minAmount?: number;
  maxAmount?: number;
  minRate?: number;
  maxRate?: number;
  minTrustLevel?: number;
  sortBy?: 'rate' | 'amount' | 'reputation' | 'time';
  page?: number;
  limit?: number;
}

Response: {
  offers: Array<{
    id: number;
    userId: number;
    userReputation: number;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    rate: number;
    platformFee: number;
    estimatedCompletionTime: number; // Minutes
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
}
```

**POST /api/v1/exchange/marketplace/:requestId/accept**
```typescript
// Manually accept an exchange offer
Request: {
  useExternalEscrow?: boolean;
  externalEscrowProviderId?: number;
}

Response: {
  matchId: number;
  status: MatchStatus;
  escrowHoldId?: number;
  externalEscrowId?: string;
  nextSteps: string[];
}
```

### 4.3 Match APIs

**GET /api/v1/exchange/matches/:id**
```typescript
// Get match details
Response: {
  id: number;
  requestId: number;
  counterRequestId: number;
  matchType: MatchType;
  matchScore: number;
  status: MatchStatus;
  settlementMethod: SettlementMethod;
  escrowHoldId?: number;
  externalEscrowId?: string;
  settlement?: Settlement;
  createdAt: string;
  updatedAt: string;
}
```

**POST /api/v1/exchange/matches/:id/initiate-payment**
```typescript
// Mark payment as initiated
Response: {
  success: boolean;
  nextStep: string;
  deadline: string;
}
```

**POST /api/v1/exchange/matches/:id/upload-proof**
```typescript
// Upload proof of payment
Request: FormData {
  photo: File;
  video?: File;
  referenceId: string;
  recipientName: string;
  paymentMethod: string;
  metadata?: string; // JSON
}

Response: {
  proofId: number;
  status: VerificationStatus;
  nextStep: string;
}
```

**POST /api/v1/exchange/matches/:id/confirm-receipt**
```typescript
// Confirm receipt of payment
Response: {
  success: boolean;
  settlementStatus: SettlementStatus;
  estimatedCompletionTime: number; // Minutes
}
```

### 4.4 Settlement APIs

**GET /api/v1/exchange/settlements/:id**
```typescript
// Get settlement details
Response: {
  id: number;
  matchId: number;
  method: SettlementMethod;
  pspProvider?: string;
  pspTransactionId?: string;
  pspStatus?: string;
  externalEscrowProvider?: string;
  externalEscrowId?: string;
  status: SettlementStatus;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
}
```

**POST /api/v1/exchange/webhooks/psp/:provider**
```typescript
// PSP webhook endpoint
Request: any; // Provider-specific payload

Response: {
  received: boolean;
}
```

**POST /api/v1/exchange/webhooks/escrow/:provider**
```typescript
// External escrow webhook endpoint
Request: any; // Provider-specific payload

Response: {
  received: boolean;
}
```


### 4.5 Security & Trust APIs

**GET /api/v1/exchange/security-deposit**
```typescript
// Get user's security deposit
Response: {
  userId: number;
  amount: number;
  currency: string;
  source: DepositSource;
  status: DepositStatus;
  frozenAmount: number;
  availableAmount: number;
}
```

**POST /api/v1/exchange/security-deposit/add**
```typescript
// Add to security deposit
Request: {
  amount: number;
  source: DepositSource;
}

Response: {
  newBalance: number;
  transactionId: number;
}
```

**GET /api/v1/exchange/trust-level**
```typescript
// Get user's trust level
Response: {
  userId: number;
  level: number;
  maxTransactionAmount: number;
  successfulExchanges: number;
  totalVolume: number;
  disputeCount: number;
  timeoutCount: number;
  nextLevelRequirements: {
    exchangesNeeded: number;
    volumeNeeded: number;
  };
}
```

**GET /api/v1/exchange/external-escrow-providers**
```typescript
// Get available external escrow providers
Query: {
  amount: number;
  currency: string;
  country?: string;
}

Response: {
  providers: Array<{
    id: number;
    name: string;
    type: ProviderType;
    country?: string;
    feePercentage: number;
    feeFixed?: number;
    settlementTime: number; // Minutes
    recommended: boolean;
  }>;
}
```

### 4.6 Communication APIs

**POST /api/v1/exchange/matches/:matchId/messages**
```typescript
// Send message to counter-party
Request: {
  message: string;
}

Response: {
  messageId: number;
  flagged: boolean;
  flagReason?: string;
}
```

**GET /api/v1/exchange/matches/:matchId/messages**
```typescript
// Get match messages
Response: {
  messages: Array<{
    id: number;
    senderId: number;
    recipientId: number;
    message: string;
    flagged: boolean;
    createdAt: string;
  }>;
}
```

### 4.7 Admin APIs

**GET /api/v1/admin/exchange/requests**
```typescript
// Get all exchange requests (admin)
Query: {
  status?: ExchangeStatus;
  userId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

Response: {
  requests: ExchangeRequest[];
  total: number;
  stats: {
    totalVolume: number;
    totalFees: number;
    successRate: number;
  };
}
```

**GET /api/v1/admin/exchange/proofs/pending**
```typescript
// Get pending proofs for review
Response: {
  proofs: Array<{
    id: number;
    requestId: number;
    userId: number;
    photoUrl: string;
    videoUrl?: string;
    referenceId: string;
    recipientName: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}
```

**POST /api/v1/admin/exchange/proofs/:id/verify**
```typescript
// Verify proof of payment
Request: {
  approved: boolean;
  reason?: string;
}

Response: {
  success: boolean;
  nextAction: string;
}
```

**POST /api/v1/admin/exchange/settlements/:id/retry**
```typescript
// Retry failed settlement
Response: {
  success: boolean;
  newStatus: SettlementStatus;
}
```

**POST /api/v1/admin/exchange/security-deposit/:userId/freeze**
```typescript
// Freeze user's security deposit
Request: {
  amount: number;
  reason: string;
}

Response: {
  success: boolean;
  frozenAmount: number;
}
```


---

## 5. State Machine Design

### 5.1 Exchange Request State Machine

```
┌──────────┐
│   OPEN   │ ◄─── Initial state
└────┬─────┘
     │
     ├─────► MATCHED ◄─── Matched with counter-party
     │         │
     │         ├─────► PAYMENT_INITIATED ◄─── User initiated payment
     │         │           │
     │         │           ├─────► PROOF_UPLOADED ◄─── Proof uploaded
     │         │           │           │
     │         │           │           ├─────► CONFIRMING ◄─── Waiting for confirmation
     │         │           │           │           │
     │         │           │           │           ├─────► COMPLETED ✓
     │         │           │           │           │
     │         │           │           │           └─────► DISPUTED
     │         │           │           │
     │         │           │           └─────► DISPUTED
     │         │           │
     │         │           └─────► DISPUTED
     │         │
     │         └─────► DISPUTED
     │
     ├─────► CANCELLED ◄─── User cancelled
     │
     ├─────► EXPIRED ◄─── Expired without match
     │
     └─────► DISPUTED ◄─── Dispute filed
         │
         └─────► REFUNDED ◄─── Refunded after dispute
```

**State Transitions**:
- `OPEN → MATCHED`: Matching engine or manual accept
- `MATCHED → PAYMENT_INITIATED`: User marks payment as sent
- `PAYMENT_INITIATED → PROOF_UPLOADED`: User uploads proof
- `PROOF_UPLOADED → CONFIRMING`: Admin verifies proof
- `CONFIRMING → COMPLETED`: Counter-party confirms receipt
- `* → DISPUTED`: Dispute filed at any stage
- `DISPUTED → REFUNDED`: Dispute resolved in favor of buyer
- `DISPUTED → COMPLETED`: Dispute resolved in favor of seller
- `OPEN → CANCELLED`: User cancels before match
- `OPEN → EXPIRED`: Request expires without match

**Timeouts**:
- `MATCHED → PAYMENT_INITIATED`: 30 minutes
- `PAYMENT_INITIATED → PROOF_UPLOADED`: 30 minutes
- `PROOF_UPLOADED → CONFIRMING`: 60 minutes (admin review)
- `CONFIRMING → COMPLETED`: 60 minutes (counter-party confirmation)

### 5.2 Match State Machine

```
┌──────────┐
│ PENDING  │ ◄─── Initial state
└────┬─────┘
     │
     ├─────► ESCROWED ◄─── Funds locked in escrow
     │         │
     │         ├─────► SETTLING ◄─── Settlement in progress
     │         │           │
     │         │           ├─────► COMPLETED ✓
     │         │           │
     │         │           └─────► FAILED
     │         │
     │         └─────► DISPUTED
     │
     └─────► FAILED ◄─── Escrow creation failed
```

**State Transitions**:
- `PENDING → ESCROWED`: Escrow hold created successfully
- `ESCROWED → SETTLING`: Settlement initiated
- `SETTLING → COMPLETED`: Settlement completed successfully
- `SETTLING → FAILED`: Settlement failed
- `* → DISPUTED`: Dispute filed

### 5.3 Settlement State Machine

```
┌──────────┐
│ PENDING  │ ◄─── Initial state
└────┬─────┘
     │
     ├─────► PSP_PROCESSING ◄─── PSP processing transfer
     │         │
     │         ├─────► COMPLETED ✓
     │         │
     │         └─────► FAILED
     │
     ├─────► ESCROW_RELEASING ◄─── External escrow releasing
     │         │
     │         ├─────► COMPLETED ✓
     │         │
     │         └─────► FAILED
     │
     ├─────► FAILED ◄─── Settlement failed
     │
     └─────► TIMEOUT ◄─── Settlement timed out (24 hours)
```

**State Transitions**:
- `PENDING → PSP_PROCESSING`: PSP transfer initiated
- `PENDING → ESCROW_RELEASING`: External escrow release initiated
- `PSP_PROCESSING → COMPLETED`: PSP confirms success
- `ESCROW_RELEASING → COMPLETED`: Escrow provider confirms release
- `* → FAILED`: Settlement fails
- `* → TIMEOUT`: 24 hours without completion



---

## 6. Matching Algorithm

### 6.1 Matching Criteria

**Compatible Requests**:
```typescript
function areCompatible(req1: ExchangeRequest, req2: ExchangeRequest): boolean {
  // Currency pairs must be inverse
  if (req1.fromCurrency !== req2.toCurrency) return false;
  if (req1.toCurrency !== req2.fromCurrency) return false;
  
  // Amounts must be within 5% tolerance
  const amountDiff = Math.abs(req1.fromAmount - req2.toAmount) / req1.fromAmount;
  if (amountDiff > 0.05) return false;
  
  // Rates must be within 2% spread
  const rateDiff = Math.abs(req1.desiredRate - (1 / req2.desiredRate)) / req1.desiredRate;
  if (rateDiff > 0.02) return false;
  
  // Both users must be verified
  if (!req1.user.isVerified || !req2.user.isVerified) return false;
  
  // Neither user can be suspended
  if (req1.user.isSuspended || req2.user.isSuspended) return false;
  
  // Both must have sufficient security deposit
  if (!hasSufficientDeposit(req1) || !hasSufficientDeposit(req2)) return false;
  
  return true;
}
```

### 6.2 Match Scoring

**Score Calculation**:
```typescript
function calculateMatchScore(req1: ExchangeRequest, req2: ExchangeRequest): number {
  let score = 0;
  
  // Rate compatibility (40 points)
  const rateDiff = Math.abs(req1.desiredRate - (1 / req2.desiredRate)) / req1.desiredRate;
  score += (1 - rateDiff / 0.02) * 40;
  
  // Amount compatibility (30 points)
  const amountDiff = Math.abs(req1.fromAmount - req2.toAmount) / req1.fromAmount;
  score += (1 - amountDiff / 0.05) * 30;
  
  // Combined reputation (20 points)
  const avgReputation = (req1.user.trustScore + req2.user.trustScore) / 2;
  score += (avgReputation / 100) * 20;
  
  // Time to completion (10 points)
  const avgCompletionTime = (req1.user.avgCompletionTime + req2.user.avgCompletionTime) / 2;
  score += (1 - avgCompletionTime / 120) * 10; // 120 minutes max
  
  return Math.min(100, Math.max(0, score));
}
```

### 6.3 Matching Priority

**Priority Order**:
1. **Best Rate** - Minimize spread for both parties
2. **Highest Reputation** - Prioritize trusted users
3. **Fastest Completion** - Users with fast completion history
4. **Oldest Request** - FIFO for equal scores

### 6.4 Matching Engine Schedule

**Automatic Matching**:
- Runs every 30 seconds
- Processes up to 100 matches per run
- Prioritizes high-value matches first
- Logs all matching decisions

**Manual Matching**:
- User can manually accept any open request
- Bypasses automatic matching queue
- Still validates compatibility
- Creates match immediately



---

## 7. Seven-Layer Anti-Scam Implementation

### 7.1 Layer 1: Security Deposit

**Implementation**:
```typescript
class SecurityDepositGuard {
  async validateDeposit(userId: number, transactionAmount: Decimal): Promise<void> {
    const deposit = await securityDepositService.getDeposit(userId, 'USD');
    
    // Calculate required deposit (10% of transaction)
    const requiredDeposit = transactionAmount.mul(0.1);
    
    // Check available deposit (total - frozen)
    const availableDeposit = deposit.amount.minus(deposit.frozenAmount);
    
    if (availableDeposit.lessThan(requiredDeposit)) {
      throw new InsufficientSecurityDepositError(
        userId,
        requiredDeposit,
        availableDeposit
      );
    }
  }
  
  async freezeOnSuspicion(userId: number, amount: Decimal, reason: string): Promise<void> {
    await securityDepositService.freezeDeposit(userId, amount, reason);
    await eventLogger.log('SECURITY_DEPOSIT_FROZEN', { userId, amount, reason });
  }
  
  async deductForCompensation(scammerId: number, victimId: number, amount: Decimal): Promise<void> {
    await securityDepositService.deductDeposit(scammerId, amount, 'Scam compensation');
    await walletService.credit(victimId, amount, 'USD');
    await eventLogger.log('SECURITY_DEPOSIT_DEDUCTED', { scammerId, victimId, amount });
  }
}
```

### 7.2 Layer 2: Progressive Trust Levels

**Trust Level Configuration**:
```typescript
const TRUST_LEVELS = {
  1: { maxAmount: 100, requiredExchanges: 0, requiredVolume: 0 },
  2: { maxAmount: 500, requiredExchanges: 5, requiredVolume: 500 },
  3: { maxAmount: 2000, requiredExchanges: 20, requiredVolume: 5000 },
  4: { maxAmount: 10000, requiredExchanges: 100, requiredVolume: 50000 },
  VIP: { maxAmount: 50000, requiredExchanges: 500, requiredVolume: 500000, manualReview: true }
};

class TrustLevelGuard {
  async validateTransactionAmount(userId: number, amount: Decimal): Promise<void> {
    const trustLevel = await trustLevelService.getTrustLevel(userId);
    const maxAmount = TRUST_LEVELS[trustLevel.level].maxAmount;
    
    if (amount.greaterThan(maxAmount)) {
      throw new ExceedsTransactionLimitError(userId, amount, maxAmount, trustLevel.level);
    }
  }
  
  async updateAfterSuccess(userId: number, amount: Decimal): Promise<void> {
    const trustLevel = await trustLevelService.getTrustLevel(userId);
    
    // Update stats
    trustLevel.successfulExchanges += 1;
    trustLevel.totalVolume = trustLevel.totalVolume.plus(amount);
    
    // Check for level up
    const nextLevel = trustLevel.level + 1;
    if (TRUST_LEVELS[nextLevel]) {
      const requirements = TRUST_LEVELS[nextLevel];
      if (
        trustLevel.successfulExchanges >= requirements.requiredExchanges &&
        trustLevel.totalVolume.greaterThanOrEqualTo(requirements.requiredVolume)
      ) {
        trustLevel.level = nextLevel;
        trustLevel.maxTransactionAmount = requirements.maxAmount;
        trustLevel.lastLevelUpAt = new Date();
        
        await eventLogger.log('TRUST_LEVEL_UP', { userId, newLevel: nextLevel });
      }
    }
    
    await trustLevelService.save(trustLevel);
  }
}
```

### 7.3 Layer 3: Proof of Payment

**Proof Validation**:
```typescript
class ProofOfPaymentGuard {
  async validateProof(proof: UploadProofInput): Promise<void> {
    // Validate photo
    if (!proof.photo) {
      throw new MissingProofPhotoError();
    }
    
    // Validate file types
    if (!this.isValidImageType(proof.photo)) {
      throw new InvalidProofFileTypeError('photo');
    }
    
    if (proof.video && !this.isValidVideoType(proof.video)) {
      throw new InvalidProofFileTypeError('video');
    }
    
    // Validate metadata
    if (!proof.referenceId || !proof.recipientName || !proof.paymentMethod) {
      throw new IncompleteProofMetadataError();
    }
    
    // Check for duplicate proof
    const existing = await proofOfPaymentService.findByReferenceId(proof.referenceId);
    if (existing) {
      throw new DuplicateProofError(proof.referenceId);
    }
  }
  
  async detectFraud(proof: ProofOfPayment): Promise<boolean> {
    // AI-based fraud detection
    const fraudScore = await aiService.analyzeProof({
      photoUrl: proof.photoUrl,
      videoUrl: proof.videoUrl,
      metadata: proof.metadata
    });
    
    if (fraudScore > 0.7) {
      await proofOfPaymentService.flagProof(proof.id, 'High fraud score');
      return true;
    }
    
    return false;
  }
}
```


### 7.4 Layer 4: Time-Locked Flow

**Timeout Configuration**:
```typescript
const TIMEOUTS = {
  PAYMENT_INITIATION: 30 * 60 * 1000, // 30 minutes
  PROOF_UPLOAD: 30 * 60 * 1000, // 30 minutes
  ADMIN_REVIEW: 60 * 60 * 1000, // 60 minutes
  CONFIRMATION: 60 * 60 * 1000, // 60 minutes
  DISPUTE_RESPONSE: 48 * 60 * 60 * 1000 // 48 hours
};

class TimeoutGuard {
  async scheduleTimeout(matchId: number, stage: string, timeoutMs: number): Promise<void> {
    await scheduler.schedule({
      jobId: `timeout-${matchId}-${stage}`,
      runAt: new Date(Date.now() + timeoutMs),
      handler: async () => {
        await this.handleTimeout(matchId, stage);
      }
    });
  }
  
  async handleTimeout(matchId: number, stage: string): Promise<void> {
    const match = await exchangeMatchService.getMatch(matchId);
    
    switch (stage) {
      case 'PAYMENT_INITIATION':
        // Auto-cancel match
        await exchangeMatchService.updateStatus(matchId, MatchStatus.FAILED);
        await this.refundEscrow(match);
        await this.recordTimeout(match.requestId, 'payment_initiation');
        break;
        
      case 'PROOF_UPLOAD':
        // Create automatic dispute
        await disputeService.createDispute({
          matchId,
          reason: 'Proof of payment not uploaded within time limit',
          filedBy: match.counterRequestId
        });
        break;
        
      case 'CONFIRMATION':
        // Create automatic dispute
        await disputeService.createDispute({
          matchId,
          reason: 'Payment confirmation not received within time limit',
          filedBy: match.requestId
        });
        break;
    }
    
    await eventLogger.log('TIMEOUT_TRIGGERED', { matchId, stage });
  }
  
  async recordTimeout(requestId: number, stage: string): Promise<void> {
    const trustLevel = await trustLevelService.getTrustLevel(requestId);
    trustLevel.timeoutCount += 1;
    
    // Downgrade after 3 timeouts
    if (trustLevel.timeoutCount >= 3) {
      await trustLevelService.downgradeLevel(requestId, 'Multiple timeouts');
    }
    
    await trustLevelService.save(trustLevel);
  }
}
```

### 7.5 Layer 5: No External Communication

**Communication Monitoring**:
```typescript
class CommunicationGuard {
  private readonly EXTERNAL_CONTACT_PATTERNS = [
    /\b\d{10,}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /\b(whatsapp|telegram|signal|wechat|line)\b/i, // Messaging apps
    /\b(facebook|instagram|twitter|snapchat)\b/i, // Social media
    /\b(skype|zoom|meet)\b/i // Video call apps
  ];
  
  async validateMessage(message: string): Promise<{ valid: boolean; reason?: string }> {
    // Check for external contact patterns
    for (const pattern of this.EXTERNAL_CONTACT_PATTERNS) {
      if (pattern.test(message)) {
        return {
          valid: false,
          reason: 'External contact information detected'
        };
      }
    }
    
    return { valid: true };
  }
  
  async flagMessage(messageId: number, reason: string): Promise<void> {
    await communicationService.flagMessage(messageId, reason);
    
    // Get message details
    const message = await communicationService.getMessage(messageId);
    
    // Warn user
    await notificationService.send(message.senderId, {
      type: 'WARNING',
      title: 'Communication Policy Violation',
      message: 'Sharing external contact information is prohibited. Repeated violations will result in account suspension.'
    });
    
    // Track violations
    const violations = await this.getViolationCount(message.senderId);
    if (violations >= 3) {
      await userService.suspendUser(message.senderId, 'Multiple communication policy violations');
    }
    
    await eventLogger.log('COMMUNICATION_VIOLATION', { messageId, userId: message.senderId, reason });
  }
  
  async enforceInDisputeResolution(disputeId: number): Promise<void> {
    const dispute = await disputeService.getDispute(disputeId);
    const messages = await communicationService.getMatchMessages(dispute.matchId);
    
    // Check if either party attempted external communication
    const violations = messages.filter(m => m.flagged);
    
    if (violations.length > 0) {
      // Automatic loss for violating party
      const violatorId = violations[0].senderId;
      await disputeService.resolveDispute(disputeId, {
        decision: 'REJECT',
        reason: 'Communication policy violation - attempted external contact',
        winnerId: violatorId === dispute.requestUserId ? dispute.counterRequestUserId : dispute.requestUserId
      });
    }
  }
}
```

### 7.6 Layer 6: One-Way Identity Anchor

**Identity Tracking**:
```typescript
class IdentityAnchorGuard {
  async captureIdentityFingerprint(userId: number, request: Request): Promise<void> {
    const fingerprint = {
      userId,
      phoneNumber: await userService.getPhoneNumber(userId),
      email: await userService.getEmail(userId),
      deviceFingerprint: this.extractDeviceFingerprint(request),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date()
    };
    
    await identityService.saveFingerprint(fingerprint);
  }
  
  private extractDeviceFingerprint(request: Request): string {
    // Combine multiple device characteristics
    const components = [
      request.headers['user-agent'],
      request.headers['accept-language'],
      request.headers['accept-encoding'],
      // Add more device characteristics
    ];
    
    return crypto.createHash('sha256').update(components.join('|')).digest('hex');
  }
  
  async detectBanEvasion(userId: number, request: Request): Promise<boolean> {
    const fingerprint = this.extractDeviceFingerprint(request);
    
    // Check if device is banned
    const bannedDevice = await identityService.isBannedDevice(fingerprint);
    if (bannedDevice) {
      await userService.suspendUser(userId, 'Ban evasion detected - banned device');
      return true;
    }
    
    // Check if IP is banned
    const bannedIP = await identityService.isBannedIP(request.ip);
    if (bannedIP) {
      await userService.suspendUser(userId, 'Ban evasion detected - banned IP');
      return true;
    }
    
    // Check behavioral patterns
    const similarUsers = await identityService.findSimilarBehavior(userId);
    for (const similarUser of similarUsers) {
      if (similarUser.isBanned) {
        await userService.flagUser(userId, 'Suspicious behavior similar to banned user');
        return true;
      }
    }
    
    return false;
  }
  
  async banUser(userId: number, reason: string): Promise<void> {
    // Ban user account
    await userService.banUser(userId, reason);
    
    // Ban all associated devices
    const fingerprints = await identityService.getUserFingerprints(userId);
    for (const fp of fingerprints) {
      await identityService.banDevice(fp.deviceFingerprint);
      await identityService.banIP(fp.ipAddress);
    }
    
    // Ban payment methods
    const paymentMethods = await paymentService.getUserPaymentMethods(userId);
    for (const pm of paymentMethods) {
      await paymentService.blacklistPaymentMethod(pm.id);
    }
    
    await eventLogger.log('USER_BANNED', { userId, reason });
  }
}
```


### 7.7 Layer 7: Real Arbitration

**Dispute Resolution Process**:
```typescript
class ArbitrationGuard {
  async createDispute(input: CreateDisputeInput): Promise<Dispute> {
    // Validate dispute
    if (!input.reason || input.reason.length < 20) {
      throw new InvalidDisputeReasonError();
    }
    
    // Create dispute
    const dispute = await disputeService.createDispute({
      matchId: input.matchId,
      filedBy: input.userId,
      reason: input.reason,
      evidence: input.evidence,
      status: 'PENDING',
      sla: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    });
    
    // Freeze security deposits
    const match = await exchangeMatchService.getMatch(input.matchId);
    await securityDepositService.freezeDeposit(
      match.request.userId,
      match.request.securityDeposit,
      `Dispute #${dispute.id}`
    );
    await securityDepositService.freezeDeposit(
      match.counterRequest.userId,
      match.counterRequest.securityDeposit,
      `Dispute #${dispute.id}`
    );
    
    // Notify admin
    await notificationService.sendToAdmins({
      type: 'DISPUTE_CREATED',
      title: `New Dispute #${dispute.id}`,
      message: `Match #${input.matchId} - ${input.reason}`,
      priority: 'HIGH'
    });
    
    await eventLogger.log('DISPUTE_CREATED', { disputeId: dispute.id, matchId: input.matchId });
    
    return dispute;
  }
  
  async resolveDispute(disputeId: number, resolution: DisputeResolution): Promise<void> {
    const dispute = await disputeService.getDispute(disputeId);
    const match = await exchangeMatchService.getMatch(dispute.matchId);
    
    // Determine winner and loser
    const winnerId = resolution.winnerId;
    const loserId = winnerId === match.request.userId 
      ? match.counterRequest.userId 
      : match.request.userId;
    
    // Deduct security deposit from loser
    const loserDeposit = await securityDepositService.getDeposit(loserId, 'USD');
    await securityDepositService.deductDeposit(
      loserId,
      loserDeposit.frozenAmount,
      `Dispute #${disputeId} - Lost arbitration`
    );
    
    // Compensate winner
    await walletService.credit(winnerId, loserDeposit.frozenAmount, 'USD');
    
    // Unfreeze winner's deposit
    const winnerDeposit = await securityDepositService.getDeposit(winnerId, 'USD');
    await securityDepositService.unfreezeDeposit(winnerId, winnerDeposit.frozenAmount);
    
    // Ban loser if scam detected
    if (resolution.banUser) {
      await identityAnchorGuard.banUser(loserId, `Dispute #${disputeId} - Scam detected`);
    }
    
    // Update dispute
    await disputeService.updateDispute(disputeId, {
      status: 'RESOLVED',
      resolution: resolution.decision,
      resolvedBy: resolution.adminId,
      resolvedAt: new Date(),
      notes: resolution.notes
    });
    
    // Update trust levels
    await trustLevelService.updateAfterDispute(winnerId, 'WON');
    await trustLevelService.updateAfterDispute(loserId, 'LOST');
    
    await eventLogger.log('DISPUTE_RESOLVED', { 
      disputeId, 
      winnerId, 
      loserId, 
      decision: resolution.decision 
    });
  }
  
  async escalateOverdueDis putes(): Promise<void> {
    const overdueDisputes = await disputeService.getOverdueDisputes();
    
    for (const dispute of overdueDisputes) {
      await notificationService.sendToAdmins({
        type: 'DISPUTE_OVERDUE',
        title: `Overdue Dispute #${dispute.id}`,
        message: `SLA exceeded - requires immediate attention`,
        priority: 'CRITICAL'
      });
    }
  }
}
```

---

## 8. Dual-Layer Escrow Implementation

### 8.1 Transaction Classification

**Classification Logic**:
```typescript
class TransactionClassifier {
  async classifyTransaction(request: ExchangeRequest): Promise<SettlementMethod> {
    const amount = request.fromAmount;
    const trustLevel = await trustLevelService.getTrustLevel(request.userId);
    
    // Small amounts (< $300) - Internal only
    if (amount.lessThan(300)) {
      return SettlementMethod.INTERNAL;
    }
    
    // Large amounts (> $1000) - External mandatory
    if (amount.greaterThan(1000)) {
      return SettlementMethod.EXTERNAL_MANDATORY;
    }
    
    // Medium amounts ($300-$1000) - Optional external
    // Check user preference
    if (request.useExternalEscrow) {
      return SettlementMethod.EXTERNAL_OPTIONAL;
    }
    
    // Check trust level - low trust requires external
    if (trustLevel.level < 3) {
      return SettlementMethod.EXTERNAL_MANDATORY;
    }
    
    return SettlementMethod.INTERNAL;
  }
}
```

### 8.2 Internal Netting Flow

**Internal Settlement**:
```typescript
class InternalSettlementService {
  async processSettlement(matchId: number): Promise<void> {
    const match = await exchangeMatchService.getMatch(matchId);
    
    // Step 1: Verify escrow holds exist
    const escrowHold = await escrowService.getEscrowByRequestId(match.requestId);
    if (!escrowHold || escrowHold.status !== 'HELD') {
      throw new EscrowNotFoundError(match.requestId);
    }
    
    // Step 2: Release escrow to seller
    await escrowService.releaseEscrow(escrowHold.id);
    
    // Step 3: Update match status
    await exchangeMatchService.updateStatus(matchId, MatchStatus.COMPLETED);
    
    // Step 4: Update request statuses
    await exchangeRequestService.updateStatus(match.requestId, ExchangeStatus.COMPLETED);
    await exchangeRequestService.updateStatus(match.counterRequestId, ExchangeStatus.COMPLETED);
    
    // Step 5: Update trust levels
    await trustLevelService.updateAfterExchange(match.request.userId, match.request.fromAmount);
    await trustLevelService.updateAfterExchange(match.counterRequest.userId, match.counterRequest.fromAmount);
    
    // Step 6: Update security deposits
    await securityDepositService.addToDeposit(
      match.request.userId,
      match.request.platformFee.mul(0.1),
      DepositSource.PLATFORM_FEES
    );
    await securityDepositService.addToDeposit(
      match.counterRequest.userId,
      match.counterRequest.platformFee.mul(0.1),
      DepositSource.PLATFORM_FEES
    );
    
    await eventLogger.log('INTERNAL_SETTLEMENT_COMPLETED', { matchId });
  }
}
```


### 8.3 External Escrow Flow

**External Settlement**:
```typescript
class ExternalSettlementService {
  async processSettlement(matchId: number, providerId: number): Promise<void> {
    const match = await exchangeMatchService.getMatch(matchId);
    const provider = await externalEscrowService.getProvider(providerId);
    
    // Step 1: User A deposits to external provider
    const externalEscrowId = await externalEscrowService.createExternalEscrow(matchId, providerId);
    
    // Step 2: Wait for deposit confirmation
    await this.waitForDepositConfirmation(externalEscrowId, providerId);
    
    // Step 3: User B transfers to User A directly
    // (This happens outside the platform - User B's bank to User A's bank)
    
    // Step 4: User A confirms receipt
    await this.waitForReceiptConfirmation(matchId);
    
    // Step 5: Platform instructs provider to release to User B
    await externalEscrowService.releaseExternalEscrow(externalEscrowId, providerId);
    
    // Step 6: Wait for release confirmation
    await this.waitForReleaseConfirmation(externalEscrowId, providerId);
    
    // Step 7: Complete settlement
    await this.completeSettlement(matchId);
    
    await eventLogger.log('EXTERNAL_SETTLEMENT_COMPLETED', { matchId, providerId });
  }
  
  private async waitForDepositConfirmation(escrowId: string, providerId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new SettlementTimeoutError('Deposit confirmation timeout'));
      }, 60 * 60 * 1000); // 1 hour
      
      // Subscribe to webhook events
      webhookService.on(`escrow.deposited.${escrowId}`, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  private async waitForReceiptConfirmation(matchId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new SettlementTimeoutError('Receipt confirmation timeout'));
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      // Subscribe to confirmation event
      eventEmitter.on(`match.receipt.confirmed.${matchId}`, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
```

### 8.4 Provider Selection

**Provider Recommendation**:
```typescript
class ProviderRecommendationService {
  async recommendProviders(
    amount: Decimal,
    currency: string,
    country?: string
  ): Promise<ExternalEscrowProvider[]> {
    // Get all available providers
    let providers = await externalEscrowService.getAvailableProviders(amount, currency, country);
    
    // Filter by amount limits
    providers = providers.filter(p => {
      if (p.minAmount && amount.lessThan(p.minAmount)) return false;
      if (p.maxAmount && amount.greaterThan(p.maxAmount)) return false;
      return true;
    });
    
    // Calculate total cost for each provider
    const providersWithCost = providers.map(p => ({
      ...p,
      totalCost: this.calculateTotalCost(amount, p),
      score: this.calculateProviderScore(p, country)
    }));
    
    // Sort by score (best first)
    providersWithCost.sort((a, b) => b.score - a.score);
    
    // Mark recommended provider
    if (providersWithCost.length > 0) {
      providersWithCost[0].recommended = true;
    }
    
    return providersWithCost;
  }
  
  private calculateTotalCost(amount: Decimal, provider: ExternalEscrowProvider): Decimal {
    let cost = amount.mul(provider.feePercentage).div(100);
    if (provider.feeFixed) {
      cost = cost.plus(provider.feeFixed);
    }
    return cost;
  }
  
  private calculateProviderScore(provider: ExternalEscrowProvider, country?: string): number {
    let score = 0;
    
    // Priority (higher is better)
    score += provider.priority * 10;
    
    // Local provider bonus
    if (country && provider.country === country) {
      score += 20;
    }
    
    // Settlement time (faster is better)
    score += (120 - provider.settlementTime) / 10;
    
    // Fee (lower is better)
    score += (5 - provider.feePercentage.toNumber()) * 5;
    
    return score;
  }
}
```

---

## 9. Fee Calculation

### 9.1 Fee Structure

**Fee Calculation Service**:
```typescript
class FeeCalculationService {
  async calculateFees(request: CreateExchangeRequestInput): Promise<FeeBreakdown> {
    const amount = new Decimal(request.fromAmount);
    
    // Platform fee (tiered)
    const platformFeePercentage = this.getPlatformFeePercentage(amount);
    const platformFee = amount.mul(platformFeePercentage).div(100);
    
    // Protection fee (optional)
    let protectionFee = new Decimal(0);
    if (request.useProtection) {
      protectionFee = this.getProtectionFee(amount);
    }
    
    // Priority matching fee (optional)
    let priorityFee = new Decimal(0);
    if (request.usePriorityMatching) {
      priorityFee = new Decimal(10); // Fixed $10
    }
    
    // External escrow fee (if applicable)
    let externalEscrowFee = new Decimal(0);
    if (request.useExternalEscrow && request.externalEscrowProviderId) {
      const provider = await externalEscrowService.getProvider(request.externalEscrowProviderId);
      externalEscrowFee = amount.mul(provider.feePercentage).div(100);
      if (provider.feeFixed) {
        externalEscrowFee = externalEscrowFee.plus(provider.feeFixed);
      }
    }
    
    const totalFees = platformFee.plus(protectionFee).plus(priorityFee).plus(externalEscrowFee);
    
    return {
      platformFee,
      platformFeePercentage,
      protectionFee,
      priorityFee,
      externalEscrowFee,
      totalFees,
      netAmount: amount.minus(totalFees)
    };
  }
  
  private getPlatformFeePercentage(amount: Decimal): Decimal {
    if (amount.lessThan(300)) {
      return new Decimal(1.5); // 1.5% for small amounts
    } else if (amount.lessThan(1000)) {
      return new Decimal(1.0); // 1.0% for medium amounts
    } else {
      return new Decimal(0.5); // 0.5% for large amounts
    }
  }
  
  private getProtectionFee(amount: Decimal): Decimal {
    if (amount.lessThan(500)) {
      return new Decimal(2); // $2 for small amounts
    } else if (amount.lessThan(2000)) {
      return new Decimal(5); // $5 for medium amounts
    } else {
      return new Decimal(10); // $10 for large amounts
    }
  }
}
```



---

## 10. External Integrations

### 10.1 FX Provider Integration (OpenExchangeRates)

**Implementation**:
```typescript
class OpenExchangeRatesAdapter implements FXProviderAdapter {
  private apiKey: string;
  private baseUrl = 'https://openexchangerates.org/api';
  private cache: Map<string, { rate: FXRate; expiresAt: Date }> = new Map();
  
  async getRate(baseCurrency: string, quoteCurrency: string): Promise<FXRate> {
    // Check cache
    const cacheKey = `${baseCurrency}:${quoteCurrency}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.rate;
    }
    
    // Fetch from API
    const response = await axios.get(`${this.baseUrl}/latest.json`, {
      params: {
        app_id: this.apiKey,
        base: baseCurrency,
        symbols: quoteCurrency
      }
    });
    
    const rate: FXRate = {
      baseCurrency,
      quoteCurrency,
      rate: new Decimal(response.data.rates[quoteCurrency]),
      bid: new Decimal(response.data.rates[quoteCurrency]).mul(0.999), // 0.1% spread
      ask: new Decimal(response.data.rates[quoteCurrency]).mul(1.001),
      timestamp: new Date(response.data.timestamp * 1000),
      source: 'OpenExchangeRates'
    };
    
    // Cache for 60 seconds
    this.cache.set(cacheKey, {
      rate,
      expiresAt: new Date(Date.now() + 60 * 1000)
    });
    
    // Save to database for history
    await prisma.forexRate.create({ data: rate });
    
    return rate;
  }
  
  async convert(from: string, to: string, amount: Decimal): Promise<ConversionResult> {
    const rate = await this.getRate(from, to);
    
    // Use ask rate (user pays spread)
    const convertedAmount = amount.mul(rate.ask);
    
    // Platform FX markup: 0.3%
    const markup = convertedAmount.mul(0.003);
    const finalAmount = convertedAmount.minus(markup);
    
    return {
      from: { currency: from, amount },
      to: { 
        currency: to, 
        amount: finalAmount,
        beforeMarkup: convertedAmount 
      },
      rate: rate.ask,
      markup: { amount: markup, currency: to, percentage: 0.3 },
      timestamp: new Date()
    };
  }
}
```

### 10.2 Tatum.io Integration (Recommended Primary Escrow)

**Implementation**:
```typescript
class TatumEscrowAdapter implements ExternalEscrowAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.tatum.io/v3';
  
  async createEscrow(amount: Decimal, currency: string, metadata: any): Promise<string> {
    // Create escrow smart contract on blockchain
    const response = await axios.post(
      `${this.baseUrl}/blockchain/escrow`,
      {
        amount: amount.toString(),
        currency,
        sender: metadata.senderAddress,
        recipient: metadata.recipientAddress,
        releaseConditions: {
          type: 'MANUAL',
          approver: metadata.platformAddress
        },
        metadata: {
          matchId: metadata.matchId,
          platform: 'Mnbara'
        }
      },
      {
        headers: {
          'x-api-key': this.apiKey
        }
      }
    );
    
    return response.data.escrowId;
  }
  
  async releaseEscrow(escrowId: string): Promise<void> {
    await axios.post(
      `${this.baseUrl}/blockchain/escrow/${escrowId}/release`,
      {},
      {
        headers: {
          'x-api-key': this.apiKey
        }
      }
    );
  }
  
  async refundEscrow(escrowId: string): Promise<void> {
    await axios.post(
      `${this.baseUrl}/blockchain/escrow/${escrowId}/refund`,
      {},
      {
        headers: {
          'x-api-key': this.apiKey
        }
      }
    );
  }
  
  async getStatus(escrowId: string): Promise<EscrowStatus> {
    const response = await axios.get(
      `${this.baseUrl}/blockchain/escrow/${escrowId}`,
      {
        headers: {
          'x-api-key': this.apiKey
        }
      }
    );
    
    return response.data.status;
  }
  
  async handleWebhook(payload: any): Promise<WebhookResult> {
    // Verify webhook signature
    const isValid = this.verifyWebhookSignature(payload);
    if (!isValid) {
      throw new InvalidWebhookSignatureError();
    }
    
    // Process webhook event
    switch (payload.event) {
      case 'escrow.created':
        await this.handleEscrowCreated(payload.data);
        break;
      case 'escrow.deposited':
        await this.handleEscrowDeposited(payload.data);
        break;
      case 'escrow.released':
        await this.handleEscrowReleased(payload.data);
        break;
      case 'escrow.refunded':
        await this.handleEscrowRefunded(payload.data);
        break;
    }
    
    return { processed: true };
  }
  
  private verifyWebhookSignature(payload: any): boolean {
    // Implement Tatum webhook signature verification
    // ...
    return true;
  }
}
```

### 10.3 Stripe Connect Integration (PSP)

**Implementation**:
```typescript
class StripePSPAdapter implements PSPAdapter {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }
  
  async initiateTransfer(
    from: string, // Stripe account ID
    to: string, // Stripe account ID
    amount: Decimal,
    currency: string
  ): Promise<string> {
    const transfer = await this.stripe.transfers.create({
      amount: amount.mul(100).toNumber(), // Convert to cents
      currency: currency.toLowerCase(),
      destination: to,
      source_transaction: from,
      metadata: {
        platform: 'Mnbara',
        type: 'p2p_exchange'
      }
    });
    
    return transfer.id;
  }
  
  async getTransferStatus(transactionId: string): Promise<TransferStatus> {
    const transfer = await this.stripe.transfers.retrieve(transactionId);
    
    return {
      id: transfer.id,
      status: transfer.status,
      amount: new Decimal(transfer.amount).div(100),
      currency: transfer.currency.toUpperCase(),
      createdAt: new Date(transfer.created * 1000)
    };
  }
  
  async cancelTransfer(transactionId: string): Promise<void> {
    await this.stripe.transfers.cancel(transactionId);
  }
  
  async handleWebhook(payload: any): Promise<WebhookResult> {
    const sig = payload.headers['stripe-signature'];
    
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new InvalidWebhookSignatureError();
    }
    
    switch (event.type) {
      case 'transfer.created':
        await this.handleTransferCreated(event.data.object);
        break;
      case 'transfer.updated':
        await this.handleTransferUpdated(event.data.object);
        break;
      case 'transfer.failed':
        await this.handleTransferFailed(event.data.object);
        break;
    }
    
    return { processed: true };
  }
}
```



---

## 11. Event Logging & Monitoring

### 11.1 Event Taxonomy

**P2P Exchange Events**:
```typescript
enum P2PExchangeEvent {
  // Request events
  EXCHANGE_REQUEST_CREATED = 'EXCHANGE_REQUEST_CREATED',
  EXCHANGE_REQUEST_CANCELLED = 'EXCHANGE_REQUEST_CANCELLED',
  EXCHANGE_REQUEST_EXPIRED = 'EXCHANGE_REQUEST_EXPIRED',
  
  // Match events
  EXCHANGE_MATCHED = 'EXCHANGE_MATCHED',
  MATCH_ACCEPTED = 'MATCH_ACCEPTED',
  MATCH_FAILED = 'MATCH_FAILED',
  
  // Payment events
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PROOF_UPLOADED = 'PROOF_UPLOADED',
  PROOF_VERIFIED = 'PROOF_VERIFIED',
  PROOF_REJECTED = 'PROOF_REJECTED',
  RECEIPT_CONFIRMED = 'RECEIPT_CONFIRMED',
  
  // Settlement events
  SETTLEMENT_INITIATED = 'SETTLEMENT_INITIATED',
  INTERNAL_SETTLEMENT_COMPLETED = 'INTERNAL_SETTLEMENT_COMPLETED',
  EXTERNAL_SETTLEMENT_COMPLETED = 'EXTERNAL_SETTLEMENT_COMPLETED',
  SETTLEMENT_FAILED = 'SETTLEMENT_FAILED',
  
  // Security events
  SECURITY_DEPOSIT_FROZEN = 'SECURITY_DEPOSIT_FROZEN',
  SECURITY_DEPOSIT_DEDUCTED = 'SECURITY_DEPOSIT_DEDUCTED',
  TRUST_LEVEL_UP = 'TRUST_LEVEL_UP',
  TRUST_LEVEL_DOWN = 'TRUST_LEVEL_DOWN',
  
  // Communication events
  COMMUNICATION_VIOLATION = 'COMMUNICATION_VIOLATION',
  MESSAGE_FLAGGED = 'MESSAGE_FLAGGED',
  
  // Dispute events
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  DISPUTE_OVERDUE = 'DISPUTE_OVERDUE',
  
  // Timeout events
  TIMEOUT_TRIGGERED = 'TIMEOUT_TRIGGERED',
  
  // Ban events
  USER_BANNED = 'USER_BANNED',
  DEVICE_BANNED = 'DEVICE_BANNED',
  BAN_EVASION_DETECTED = 'BAN_EVASION_DETECTED'
}
```

### 11.2 Monitoring Metrics

**Key Metrics**:
```typescript
class P2PExchangeMetrics {
  // Volume metrics
  async trackExchangeVolume(amount: Decimal, currency: string): Promise<void> {
    await metricsService.increment('p2p.exchange.volume', amount.toNumber(), {
      currency
    });
  }
  
  // Match metrics
  async trackMatchTime(matchId: number, timeMs: number): Promise<void> {
    await metricsService.histogram('p2p.match.time', timeMs);
  }
  
  async trackMatchRate(matched: boolean): Promise<void> {
    await metricsService.increment('p2p.match.rate', 1, {
      matched: matched.toString()
    });
  }
  
  // Settlement metrics
  async trackSettlementTime(settlementId: number, timeMs: number): Promise<void> {
    await metricsService.histogram('p2p.settlement.time', timeMs);
  }
  
  async trackSettlementSuccess(success: boolean, method: SettlementMethod): Promise<void> {
    await metricsService.increment('p2p.settlement.success', 1, {
      success: success.toString(),
      method
    });
  }
  
  // Fee metrics
  async trackFeeRevenue(amount: Decimal, feeType: string): Promise<void> {
    await metricsService.increment('p2p.fee.revenue', amount.toNumber(), {
      feeType
    });
  }
  
  // Security metrics
  async trackSecurityEvent(eventType: string): Promise<void> {
    await metricsService.increment('p2p.security.events', 1, {
      eventType
    });
  }
  
  // Dispute metrics
  async trackDisputeRate(disputed: boolean): Promise<void> {
    await metricsService.increment('p2p.dispute.rate', 1, {
      disputed: disputed.toString()
    });
  }
}
```

### 11.3 Alerting Rules

**Critical Alerts**:
```typescript
const ALERT_RULES = {
  // High dispute rate
  HIGH_DISPUTE_RATE: {
    condition: 'dispute_rate > 5%',
    severity: 'CRITICAL',
    action: 'Pause matching engine and notify admin'
  },
  
  // Settlement failure spike
  SETTLEMENT_FAILURE_SPIKE: {
    condition: 'settlement_failure_rate > 10%',
    severity: 'CRITICAL',
    action: 'Pause external settlements and notify admin'
  },
  
  // Security deposit depletion
  SECURITY_DEPOSIT_LOW: {
    condition: 'security_deposit < required_minimum',
    severity: 'HIGH',
    action: 'Notify user and restrict exchange creation'
  },
  
  // Fraud detection
  FRAUD_DETECTED: {
    condition: 'fraud_score > 0.7',
    severity: 'CRITICAL',
    action: 'Freeze user account and notify admin'
  },
  
  // PSP outage
  PSP_OUTAGE: {
    condition: 'psp_error_rate > 50%',
    severity: 'CRITICAL',
    action: 'Switch to backup PSP and notify admin'
  },
  
  // External escrow provider outage
  ESCROW_PROVIDER_OUTAGE: {
    condition: 'provider_error_rate > 50%',
    severity: 'HIGH',
    action: 'Disable provider and notify admin'
  }
};
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

**Test Coverage**:
- All service methods
- All state transitions
- All fee calculations
- All validation logic
- All security guards

**Example**:
```typescript
describe('ExchangeRequestService', () => {
  describe('createRequest', () => {
    it('should create exchange request with valid input', async () => {
      const input = {
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: 100,
        desiredRate: 3.75,
        expiresIn: 24
      };
      
      const request = await exchangeRequestService.createRequest(input);
      
      expect(request.status).toBe(ExchangeStatus.OPEN);
      expect(request.fromAmount).toBe(100);
      expect(request.toAmount).toBe(375);
    });
    
    it('should throw error if insufficient security deposit', async () => {
      const input = {
        userId: 1,
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        fromAmount: 10000, // Exceeds security deposit
        desiredRate: 3.75,
        expiresIn: 24
      };
      
      await expect(exchangeRequestService.createRequest(input))
        .rejects.toThrow(InsufficientSecurityDepositError);
    });
  });
});
```

### 12.2 Integration Tests

**Test Scenarios**:
- Complete exchange flow (internal netting)
- Complete exchange flow (external escrow)
- Match creation and escrow locking
- Settlement with PSP
- Dispute resolution
- Timeout handling
- Security deposit management

### 12.3 End-to-End Tests

**User Journeys**:
1. Create request → Auto-match → Internal settlement → Complete
2. Create request → Manual accept → External escrow → Complete
3. Create request → Match → Dispute → Resolution
4. Create request → Timeout → Auto-cancel
5. Create request → Fraud detection → Account freeze



---

## 13. Deployment Strategy

### 13.1 Phase A: Design Freeze (Week 1)

**Deliverables**:
- ✅ Requirements document approved
- ✅ Design document approved
- ✅ Database schema finalized
- ✅ API contracts defined
- ✅ Legal wording approved
- ✅ UI mockups created

**Approval Required**:
- CTO (technical architecture)
- Legal (terms, disclaimers, compliance)
- Product (user experience)
- Compliance (regulatory requirements)

### 13.2 Phase B: Implementation (Weeks 2-4)

**Week 2: Core Services**
- Implement database migrations
- Build ExchangeRequestService
- Build MatchingEngineService
- Build SecurityDepositService
- Build TrustLevelService
- Unit tests for all services

**Week 3: Integration & Security**
- Implement FX provider integration
- Build seven-layer security guards
- Implement proof of payment service
- Implement communication service
- Integration tests

**Week 4: Settlement & External**
- Implement internal settlement
- Build external escrow integration
- Implement PSP integration
- Build webhook handlers
- End-to-end tests

### 13.3 Phase C: Soft Enable (Week 5)

**Feature Flag**:
```typescript
const FEATURE_FLAGS = {
  P2P_EXCHANGE_ENABLED: false, // Master switch
  EXTERNAL_ESCROW_ENABLED: false, // External escrow
  AUTO_MATCHING_ENABLED: false, // Automatic matching
  MANUAL_MATCHING_ENABLED: true // Manual matching only
};
```

**Pilot Program**:
- Select 50 trusted users
- Limit to small amounts (< $100)
- Internal netting only
- Manual admin oversight
- Daily monitoring

### 13.4 Phase D: MVP Launch (Weeks 6-8)

**Week 6: Beta Testing**
- Expand to 500 users
- Increase limits to $500
- Enable automatic matching
- Enable external escrow (optional)
- Monitor closely

**Week 7: Optimization**
- Optimize matching algorithm
- Improve settlement speed
- Enhance fraud detection
- Fix bugs and issues

**Week 8: Public Launch**
- Remove feature flags
- Full user access
- Marketing campaign
- Customer support ready

### 13.5 Phase E: Scale & Optimize (Months 3-6)

**Month 3: Additional Providers**
- Integrate 3-5 more external escrow providers
- Add more PSP options
- Support more currencies
- Optimize fees

**Month 4: Advanced Features**
- Automated fraud detection (AI)
- Advanced matching algorithms
- Bulk exchange options
- API for third-party integrations

**Month 5: Mobile App**
- Native iOS app
- Native Android app
- Mobile-specific features
- Push notifications

**Month 6: International Expansion**
- Additional countries
- Local compliance
- Local payment methods
- Multi-language support

---

## 14. Risk Mitigation

### 14.1 Technical Risks

**Risk: PSP Outage**
- Mitigation: Multiple PSP integrations, automatic failover
- Fallback: Manual settlement procedures

**Risk: External Escrow Provider Failure**
- Mitigation: Multiple provider options, automatic provider switching
- Fallback: Internal netting for affected transactions

**Risk: Matching Engine Performance**
- Mitigation: Optimize algorithm, horizontal scaling
- Fallback: Manual matching only

**Risk: Database Performance**
- Mitigation: Proper indexing, query optimization, caching
- Fallback: Read replicas, connection pooling

### 14.2 Business Risks

**Risk: Low Liquidity**
- Mitigation: Market maker program, liquidity incentives
- Fallback: Partner with liquidity providers

**Risk: High Dispute Rate**
- Mitigation: Seven-layer security, strong verification
- Fallback: Pause feature, investigate root cause

**Risk: Regulatory Changes**
- Mitigation: Legal counsel on retainer, compliance monitoring
- Fallback: Adjust model to maintain compliance

**Risk: User Trust Issues**
- Mitigation: Clear communication, insurance options, strong reputation system
- Fallback: Enhanced user education, testimonials

### 14.3 Security Risks

**Risk: Fraud/Scams**
- Mitigation: Seven-layer anti-scam architecture
- Fallback: Manual review, account freezing, law enforcement

**Risk: Account Takeover**
- Mitigation: 2FA, device fingerprinting, behavioral analysis
- Fallback: Account recovery procedures, fraud investigation

**Risk: Data Breach**
- Mitigation: Encryption, access controls, security audits
- Fallback: Incident response plan, user notification

---

## 15. Success Metrics

### 15.1 Technical Metrics

- **Uptime**: 99.9%
- **Match Time**: < 5 seconds (average)
- **Settlement Time**: < 24 hours (95th percentile)
- **API Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 0.1%

### 15.2 Business Metrics

- **Exchange Volume**: $1M/month by Month 3
- **Revenue**: $10K/month by Month 3
- **Active Users**: 1000 by Month 3
- **Match Rate**: 80% within 1 hour
- **Settlement Success**: 95%

### 15.3 User Satisfaction Metrics

- **User Rating**: 4.5/5 average
- **NPS Score**: > 50
- **Dispute Rate**: < 5%
- **Repeat Usage**: > 60%
- **Support Tickets**: < 10% of transactions

---

## 16. Documentation Requirements

### 16.1 Technical Documentation

- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Service architecture diagrams
- Integration guides for PSPs and escrow providers
- Deployment runbooks
- Monitoring and alerting guides

### 16.2 User Documentation

- User guide for creating exchange requests
- Marketplace browsing guide
- Proof of payment guide
- Dispute resolution guide
- FAQ
- Video tutorials

### 16.3 Legal Documentation

- Terms of service
- Privacy policy
- User agreement
- Dispute resolution policy
- Fee disclosure
- Risk disclaimers

### 16.4 Compliance Documentation

- Regulatory compliance framework
- Audit trail procedures
- Reporting procedures
- Incident response plan
- Data retention policy

---

## 17. Next Steps

1. **Review Design Document** - Stakeholder approval (CTO, Legal, Product, Compliance)
2. **Create Tasks Document** - Break down into implementable tasks
3. **Set Up Development Environment** - Create new service, configure dependencies
4. **Database Migration** - Create and test database schema
5. **Implement Core Services** - Build exchange, matching, settlement services
6. **Integrate External Services** - FX provider, PSP, external escrow
7. **Implement Security Layers** - Seven-layer anti-scam architecture
8. **Testing** - Unit, integration, end-to-end tests
9. **Soft Launch** - Feature flag, pilot program
10. **MVP Launch** - Public release with monitoring

---

**Status**: READY FOR REVIEW ✅  
**Next Phase**: Tasks Document  
**Approval Required**: CTO, Legal, Compliance, Product  
**Timeline**: 8 weeks to MVP  
**Budget**: $50K-100K for MVP

---

**Critical Success Factors:**
1. ✅ Platform NEVER holds customer funds
2. ✅ Seven-layer anti-scam protection active
3. ✅ Dual-layer escrow model (internal + external)
4. ✅ Reuses 70% of existing infrastructure
5. ✅ No breaking changes to existing features
6. ✅ Clear legal protection for platform
7. ✅ Strong user protection and trust
8. ✅ Comprehensive monitoring and alerting
9. ✅ Scalable architecture
10. ✅ Clear documentation and runbooks

