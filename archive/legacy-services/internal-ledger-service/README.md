# Internal Ledger Service v2.0

## Overview

Enhanced Internal Ledger & Settlement System for Mnbara e-commerce platform with:
- **Double-Entry Bookkeeping** - Proper debit/credit tracking
- **Buyer/Seller Matching Algorithm** - Automatic order matching
- **Real-time Settlement Processing** - Instant transactions with fee calculation
- **AML/KYC Compliance** - Integrated compliance checks
- **Complete Audit Trail** - Full transaction logging
- **Transaction Rollback** - Failure recovery mechanism

## Features

### 1. Double-Entry Ledger System

Tracks all financial movements with proper accounting:

```typescript
// Create balanced double-entry
await ledgerService.createDoubleEntry(
  transactionId,
  'Payment for order #123',
  { accountType: AccountType.WALLET_AVAILABLE, accountId: 'WALLET-1', amount: 100, currency: 'USD' },
  { accountType: AccountType.WALLET_AVAILABLE, accountId: 'WALLET-2', amount: 100, currency: 'USD' }
);
```

### 2. Matching Algorithm

Automatic matching of buyer requests with seller offers:

```typescript
// Create a buy request
const buyRequest = await matchingService.createBuyRequest({
  userId: 1,
  currency: 'USD',
  amount: 1000,
  maxPricePerUnit: 1.10,
});

// Create a sell offer
const sellOffer = await matchingService.createSellOffer({
  userId: 2,
  currency: 'USD',
  amount: 500,
  minPricePerUnit: 1.05,
});

// Run matching
await matchingService.runMatching(buyRequest.id, 'USD');
```

### 3. Real-time Settlement

Process settlements with automatic fee calculation:

```typescript
const result = await settlementService.processSettlement({
  fromUserId: 1,
  toUserId: 2,
  amount: new Decimal('1000'),
  currency: 'USD',
  referenceType: 'Order',
  referenceId: 'ORD-123',
  description: 'Payment for order #123',
});

// Fees calculated automatically
console.log(result.fees); // { platformFee, processingFee, totalFees, netAmount }
```

### 4. Fee Calculation

Configurable fee structure:

| Fee Type | Rate | Fixed |
|----------|------|-------|
| Platform Fee | 2% | - |
| Processing Fee | 2.9% | $0.30 |

### 5. Compliance Integration

Automated AML/KYC checks:

```typescript
const status = await complianceService.getComplianceStatus(userId);
// Returns: { kycVerified, watchlistStatus, riskLevel, activeLimits }
```

### 6. Audit Trail

Complete logging of all actions:

```typescript
await auditService.log({
  action: 'SETTLEMENT_PROCESSED',
  entityType: 'Settlement',
  entityId: 'SETT-123',
  userId: 1,
  description: 'Settlement completed',
});
```

### 7. Rollback Mechanism

Recover from failed transactions:

```typescript
await settlementService.rollbackSettlement(
  'SETT-123',
  'Customer requested cancellation',
  adminUserId
);
```

## Database Schema

### Core Tables

1. **Wallet** - User wallets per currency
2. **WalletTransaction** - Transaction history
3. **EscrowHold** - Escrow balances
4. **LedgerEntry** - Double-entry records
5. **BuyRequest** - Buyer orders
6. **SellOffer** - Seller offers
7. **MatchingSettlement** - Trade settlements
8. **PayoutRequest** - Withdrawal requests
9. **ComplianceCheck** - AML/KYC records
10. **TransactionLimit** - User limits
11. **AuditLog** - Audit trail
12. **RollbackRecord** - Rollback records

## API Endpoints

### Ledger
- `GET /api/ledger/balances` - Get balance summary
- `GET /api/ledger/entries/:transactionId` - Get transaction entries

### Matching
- `GET /api/matching/buy-requests` - List buy requests
- `GET /api/matching/sell-offers` - List sell offers
- `POST /api/matching/run` - Run matching algorithm

### Settlement
- `POST /api/settlement/process` - Process settlement
- `POST /api/settlement/rollback` - Rollback settlement

### Compliance
- `GET /api/compliance/status/:userId` - Get compliance status
- `GET /api/compliance/limits/:userId` - Get transaction limits

### Audit
- `GET /api/audit/logs` - List audit logs
- `GET /api/audit/trail/:transactionId` - Get transaction audit trail

### Rollback
- `GET /api/rollback/status/:rollbackId` - Get rollback status
- `POST /api/rollback/retry/:rollbackId` - Retry failed rollback

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Start development server:
```bash
npm run dev
```

## Configuration

### Fee Configuration

```typescript
settlementService.configureFees({
  platformFeeRate: new Decimal('0.02'),
  processingFeeRate: new Decimal('0.029'),
  processingFeeFixed: new Decimal('0.30'),
  minPlatformFee: new Decimal('1.00'),
  maxPlatformFee: new Decimal('1000.00'),
  feeExemptUserIds: [1, 2, 3],
});
```

### Transaction Limits

Default limits:
- Daily Deposit: $10,000
- Daily Withdrawal: $5,000
- Daily Transaction: $25,000
- Single Transaction: $50,000

## Running Tests

```bash
npm test
npm run test:coverage
```

## Deployment

```bash
npm run build
npm start
```

## Service Health

```bash
curl http://localhost:3010/health
```

Response:
```json
{
  "status": "healthy",
  "service": "internal-ledger-service",
  "version": "2.0.0",
  "features": [
    "double-entry-ledger",
    "matching-algorithm",
    "real-time-settlement",
    "compliance-kyc",
    "audit-trail",
    "rollback-support"
  ],
  "timestamp": "2026-02-05T01:00:00.000Z"
}
```

## Integration

### With Wallet Service

```typescript
import { walletService } from '@mnbarh/wallet-service';
import { ledgerService } from '@mnbarh/internal-ledger-service';

// Lock funds in wallet and create ledger entry
await walletService.lockFunds(userId, amount, requestId);
await ledgerService.createEntry({...});
```

### With Escrow Service

```typescript
import { escrowService } from '@mnbarh/escrow-service';
import { settlementService } from '@mnbarh/internal-ledger-service';

// Release escrow and process settlement
await escrowService.releaseFunds(requestId);
await settlementService.processSettlement({...});
```

## Error Handling

All services throw typed errors:

```typescript
try {
  await settlementService.processSettlement(params);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    // Handle insufficient funds
  }
  if (error instanceof ComplianceCheckFailedError) {
    // Handle compliance failure
  }
}
```

## License

MIT
