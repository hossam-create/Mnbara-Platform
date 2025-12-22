# Immutable Ledger System

This module implements an append-only immutable transaction ledger with cryptographic chaining for maintaining a tamper-proof audit trail of all financial transactions on the MNBARA platform.

## Features

- **Append-Only**: Entries cannot be modified or deleted after creation
- **Cryptographic Chaining**: Each entry's hash includes the previous entry's hash (blockchain-like)
- **Integrity Verification**: Chain can be verified at any time to detect tampering
- **Database Enforcement**: PostgreSQL triggers prevent updates and deletes
- **Audit Trail**: Complete history for orders, escrows, swaps, and auctions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Immutable Ledger                              │
├─────────────────────────────────────────────────────────────────┤
│  Entry N                                                         │
│  ├─ entryHash = SHA256(data + previousHash)                     │
│  └─ previousHash ─────────────────────────────────────┐         │
│                                                        │         │
│  Entry N-1                                             │         │
│  ├─ entryHash ◄───────────────────────────────────────┘         │
│  └─ previousHash ─────────────────────────────────────┐         │
│                                                        │         │
│  Entry N-2                                             │         │
│  ├─ entryHash ◄───────────────────────────────────────┘         │
│  └─ previousHash ───► ...                                       │
│                                                                  │
│  Genesis Block (Entry 0)                                         │
│  └─ previousHash = 0x000...000                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Usage

### Appending Entries

```typescript
import { ImmutableLedgerService, LedgerEntryType } from './ledger';

const ledger = new ImmutableLedgerService(prisma);

// Record a payment
const entry = await ledger.appendEntry({
  entryType: LedgerEntryType.PAYMENT,
  fromUserId: buyerId,
  toUserId: sellerId,
  amount: 100.00,
  currency: 'USD',
  orderId: 12345,
  description: 'Payment for order #12345'
});

// Confirm the entry after processing
await ledger.confirmEntry(entry.id);
```

### Querying the Ledger

```typescript
// Get user's transaction history
const { entries, total } = await ledger.getUserEntries(userId, {
  limit: 50,
  offset: 0
});

// Get audit trail for an order
const orderHistory = await ledger.getOrderAuditTrail(orderId);

// Query with filters
const { entries } = await ledger.queryEntries({
  entryType: LedgerEntryType.ESCROW_HOLD,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  minAmount: 100
});
```

### Verifying Integrity

```typescript
// Verify entire chain
const result = await ledger.verifyChainIntegrity();

if (!result.isValid) {
  console.error('Chain integrity compromised!');
  console.error('Invalid entries:', result.invalidEntries);
}

// Verify specific range
const rangeResult = await ledger.verifyChainIntegrity({
  startSequence: 1000,
  endSequence: 2000
});
```

### Creating Reversals

```typescript
// Instead of modifying entries, create reversal entries
const reversal = await ledger.createReversalEntry(
  originalEntryId,
  'Customer refund requested'
);
```

## Entry Types

| Type | Description |
|------|-------------|
| PAYMENT | Standard payment transaction |
| REFUND | Refund to customer |
| ESCROW_HOLD | Funds held in escrow |
| ESCROW_RELEASE | Escrow released to recipient |
| ESCROW_REFUND | Escrow refunded to payer |
| WITHDRAWAL | Withdrawal from wallet |
| DEPOSIT | Deposit to wallet |
| FEE | Platform fee |
| REWARD | Reward points/tokens |
| SWAP_INITIATED | P2P swap started |
| SWAP_COMPLETED | P2P swap completed |
| SWAP_CANCELLED | P2P swap cancelled |
| ORDER_CREATED | New order created |
| ORDER_COMPLETED | Order fulfilled |
| ORDER_CANCELLED | Order cancelled |
| BID_PLACED | Auction bid placed |
| AUCTION_WON | Auction won |
| SYSTEM_ADJUSTMENT | System adjustment |
| MIGRATION | Data migration |

## Entry Lifecycle

```
PENDING → CONFIRMED (success)
        → FAILED (failure)
        
CONFIRMED → REVERSED (via reversal entry)
```

## Database Constraints

The PostgreSQL schema enforces immutability:

1. **Update Trigger**: Only allows status changes from PENDING to CONFIRMED/FAILED
2. **Delete Trigger**: Prevents all deletions
3. **Unique Constraints**: Entry number, sequence number, and hash must be unique
4. **Foreign Keys**: Links to users, orders, escrows, swaps, auctions

## Hash Calculation

Each entry's hash is calculated as:

```
entryHash = SHA256(JSON.stringify({
  sequenceNumber,
  entryNumber,
  entryType,
  fromUserId,
  toUserId,
  amount,
  currency,
  orderId,
  escrowId,
  swapId,
  auctionId,
  transactionRef,
  description,
  previousHash  // Links to previous entry
}))
```

## Compliance & Audit

The ledger supports compliance requirements:

- **Export**: Export entries to JSON or CSV for auditors
- **Verification**: Cryptographic proof of data integrity
- **Traceability**: Complete audit trail for any transaction
- **Non-repudiation**: Entries cannot be altered after creation

```typescript
// Export for audit
const csvData = await ledger.exportEntries({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
}, 'csv');

// Get summary statistics
const summary = await ledger.getLedgerSummary(startDate, endDate);
```
