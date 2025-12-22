# Escrow Implementation with Atomic Transactions

## Overview

This document describes the implementation of the escrow hold/release functionality with atomic transactions for the MNBARA platform. The escrow system ensures buyer funds are protected during transactions, particularly for crowdship orders where delivery confirmation is required before releasing funds.

## Architecture

### Database Schema

The escrow system consists of two main components:

1. **Escrow Table**: Tracks escrow records and their status
2. **WalletLedger Integration**: Records all fund movements with complete audit trail

```sql
CREATE TABLE "Escrow" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER UNIQUE NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "travelerId" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "status" "EscrowStatus" DEFAULT 'HELD',
    "holdLedgerId" INTEGER,
    "releaseLedgerId" INTEGER,
    "heldAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
);
```

### Escrow Status Flow

```
HELD → RELEASED (funds to seller/traveler)
  ↓
DISPUTED → RELEASED or REFUNDED (admin decision)
  ↓
REFUNDED (funds back to buyer)
  ↓
EXPIRED → RELEASED (auto-release)
  ↓
CANCELLED → REFUNDED
```

## Key Features

### 1. Atomic Transactions

All escrow operations use Prisma transactions to ensure:
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Wallet balances always match ledger entries
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Committed transactions are permanent

### 2. Complete Audit Trail

Every fund movement is recorded in the `WalletLedger` table with:
- Balance before and after
- Transaction type (ESCROW_HOLD, ESCROW_RELEASE, ESCROW_REFUND)
- Order and escrow references
- User who performed the action
- Timestamp and metadata

### 3. Balance Validation

Before holding funds:
- Check wallet exists
- Verify wallet is not locked
- Validate sufficient balance
- Prevent duplicate escrows for same order

### 4. Rollback Protection

If any step fails during an escrow operation:
- Database transaction is rolled back
- No partial updates occur
- Wallet balances remain unchanged
- Error is thrown with clear message

## API Reference

### Hold Funds in Escrow

```typescript
import EscrowService from './services/escrow.service';
import { Decimal } from '@prisma/client/runtime/library';

const result = await EscrowService.holdFunds({
  orderId: 123,
  buyerId: 456,
  sellerId: 789,
  travelerId: 101, // Optional for crowdship
  amount: new Decimal(100.00),
  currency: 'USD',
  expiresAt: new Date('2025-12-31'), // Optional auto-release date
  description: 'Escrow for iPhone 15 Pro',
  metadata: { orderType: 'crowdship' }
});

// Returns:
// {
//   escrow: Escrow,
//   ledgerEntry: WalletLedger,
//   balanceBefore: Decimal,
//   balanceAfter: Decimal
// }
```

### Release Funds to Seller/Traveler

```typescript
const result = await EscrowService.releaseFunds({
  escrowId: 1,
  recipientUserId: 789, // Seller or traveler
  systemUserId: 1, // Admin or system user
  reason: 'Delivery confirmed by buyer',
  metadata: { deliveryEvidence: 'photo_url' }
});
```

### Refund Funds to Buyer

```typescript
const result = await EscrowService.refundFunds({
  escrowId: 1,
  systemUserId: 1,
  reason: 'Order cancelled by seller',
  metadata: { cancellationReason: 'Out of stock' }
});
```

### Dispute Escrow

```typescript
const escrow = await EscrowService.disputeEscrow(
  escrowId: 1,
  disputeReason: 'Item not as described',
  metadata: { disputeEvidence: ['photo1.jpg', 'photo2.jpg'] }
);
```

### Query Escrows

```typescript
// Get escrow by order ID
const escrow = await EscrowService.getEscrowByOrderId(123);

// Get all escrows for a buyer
const buyerEscrows = await EscrowService.getEscrowsByBuyer(456);

// Get held escrows for a seller
const sellerEscrows = await EscrowService.getEscrowsBySeller(789, 'HELD');

// Get expired escrows
const expired = await EscrowService.getExpiredEscrows();
```

### Auto-Release Expired Escrows

```typescript
// Should be run by a cron job
const results = await EscrowService.autoReleaseExpiredEscrows(systemUserId: 1);

// Returns array of results:
// [
//   { success: true, escrowId: 1, result: {...} },
//   { success: false, escrowId: 2, error: 'Wallet locked' }
// ]
```

## Transaction Flow Examples

### Example 1: Successful Crowdship Order

```typescript
// 1. Buyer places order
const order = await createOrder({...});

// 2. Hold funds in escrow
const escrow = await EscrowService.holdFunds({
  orderId: order.id,
  buyerId: buyer.id,
  sellerId: seller.id,
  travelerId: traveler.id,
  amount: new Decimal(150.00),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
});

// Buyer's wallet: $500 → $350 (held $150)
// Escrow status: HELD

// 3. Traveler delivers item
await submitDeliveryEvidence(order.id, evidence);

// 4. Buyer confirms receipt
await confirmDelivery(order.id);

// 5. Release funds (80% to seller, 20% to traveler)
await EscrowService.releaseFunds({
  escrowId: escrow.escrow.id,
  recipientUserId: seller.id,
  systemUserId: 1,
  reason: 'Delivery confirmed',
  metadata: { split: { seller: 120, traveler: 30 } }
});

// Seller's wallet: $200 → $320 (+$120)
// Escrow status: RELEASED
```

### Example 2: Disputed Order

```typescript
// 1. Funds held in escrow
const escrow = await EscrowService.holdFunds({...});

// 2. Buyer raises dispute
await EscrowService.disputeEscrow(
  escrow.escrow.id,
  'Item damaged during delivery',
  { evidence: ['photo1.jpg'] }
);

// Escrow status: DISPUTED (funds frozen)

// 3. Admin reviews and decides to refund
await EscrowService.refundFunds({
  escrowId: escrow.escrow.id,
  systemUserId: adminId,
  reason: 'Dispute resolved in favor of buyer',
  metadata: { disputeId: 123 }
});

// Buyer's wallet: $350 → $500 (refunded $150)
// Escrow status: REFUNDED
```

### Example 3: Auto-Release After Expiration

```typescript
// Cron job runs daily
const results = await EscrowService.autoReleaseExpiredEscrows(systemUserId: 1);

// For each expired escrow:
// - Funds automatically released to seller
// - Escrow status: RELEASED
// - Metadata includes: { autoReleased: true }
```

## Error Handling

### Common Errors

```typescript
try {
  await EscrowService.holdFunds({...});
} catch (error) {
  // Possible errors:
  // - "Wallet not found for buyer {id}"
  // - "Buyer wallet {id} is locked"
  // - "Insufficient balance. Available: X, Required: Y"
  // - "Escrow already exists for order {id}"
}

try {
  await EscrowService.releaseFunds({...});
} catch (error) {
  // Possible errors:
  // - "Escrow {id} not found"
  // - "Cannot release escrow {id}. Current status: {status}"
  // - "User {id} is not authorized to receive funds"
  // - "Recipient wallet {id} is locked"
}
```

### Rollback Scenarios

All operations are wrapped in database transactions. If any step fails:

1. **Hold Funds Fails**:
   - Escrow record not created
   - Wallet balance unchanged
   - No ledger entry created

2. **Release Funds Fails**:
   - Escrow status unchanged
   - Recipient wallet balance unchanged
   - No ledger entry created

3. **Refund Funds Fails**:
   - Escrow status unchanged
   - Buyer wallet balance unchanged
   - No ledger entry created

## Integration with Other Services

### Order Service Integration

```typescript
// In order-service
import EscrowService from '@mnbara/payment-service';

// When order is created with escrow option
if (order.useEscrow) {
  const escrow = await EscrowService.holdFunds({
    orderId: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    amount: order.total,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  
  order.escrowId = escrow.escrow.id;
  await order.save();
}

// When delivery is confirmed
if (order.escrowId) {
  await EscrowService.releaseFunds({
    escrowId: order.escrowId,
    recipientUserId: order.sellerId,
    systemUserId: 1,
    reason: 'Delivery confirmed'
  });
}
```

### Dispute Service Integration

```typescript
// In admin-service
import EscrowService from '@mnbara/payment-service';

// When dispute is created
const order = await getOrder(disputeData.orderId);
if (order.escrowId) {
  await EscrowService.disputeEscrow(
    order.escrowId,
    disputeData.reason,
    { disputeId: dispute.id }
  );
}

// When dispute is resolved
if (dispute.resolution === 'REFUND_BUYER') {
  await EscrowService.refundFunds({
    escrowId: order.escrowId,
    systemUserId: adminId,
    reason: dispute.resolutionNotes
  });
} else if (dispute.resolution === 'RELEASE_TO_SELLER') {
  await EscrowService.releaseFunds({
    escrowId: order.escrowId,
    recipientUserId: order.sellerId,
    systemUserId: adminId,
    reason: dispute.resolutionNotes
  });
}
```

## Performance Considerations

### Database Indexes

The following indexes optimize escrow queries:

```sql
CREATE INDEX "Escrow_orderId_idx" ON "Escrow"("orderId");
CREATE INDEX "Escrow_buyerId_idx" ON "Escrow"("buyerId");
CREATE INDEX "Escrow_sellerId_idx" ON "Escrow"("sellerId");
CREATE INDEX "Escrow_status_idx" ON "Escrow"("status");
CREATE INDEX "Escrow_expiresAt_idx" ON "Escrow"("expiresAt");
```

### Transaction Isolation

Prisma uses `READ COMMITTED` isolation level by default, which:
- Prevents dirty reads
- Allows concurrent transactions
- Provides good balance between consistency and performance

For critical operations, consider using serializable isolation:

```typescript
await prisma.$transaction(
  async (tx) => {
    // Critical operations
  },
  {
    isolationLevel: 'Serializable'
  }
);
```

### Concurrent Operations

The system handles concurrent operations safely:
- Multiple users can hold escrow simultaneously
- Wallet balance checks prevent overdrafts
- Unique constraint on `orderId` prevents duplicate escrows
- Row-level locking prevents race conditions

## Monitoring and Alerts

### Metrics to Track

1. **Escrow Volume**:
   - Total amount held in escrow
   - Number of active escrows
   - Average escrow duration

2. **Release Rate**:
   - Percentage of escrows released vs refunded
   - Average time to release
   - Auto-release rate

3. **Dispute Rate**:
   - Percentage of escrows disputed
   - Average dispute resolution time
   - Dispute outcomes

### Alerts to Configure

1. **High Escrow Balance**: Alert if total held exceeds threshold
2. **Stuck Escrows**: Alert if escrows held > 60 days
3. **High Dispute Rate**: Alert if dispute rate > 5%
4. **Failed Releases**: Alert on release/refund failures
5. **Balance Mismatches**: Alert on wallet reconciliation failures

## Security Considerations

### 1. Authorization

- Only buyers can initiate escrow holds
- Only system/admin can release or refund
- Recipient validation prevents unauthorized releases

### 2. Wallet Locking

- Locked wallets cannot send or receive funds
- Prevents operations on suspended accounts

### 3. Audit Trail

- Every operation logged with user ID and IP
- Immutable ledger entries
- Metadata tracks all state changes

### 4. Amount Validation

- Decimal precision prevents rounding errors
- Balance checks prevent overdrafts
- Currency validation ensures consistency

## Testing

### Unit Tests

```typescript
describe('EscrowService', () => {
  describe('holdFunds', () => {
    it('should hold funds and create escrow record', async () => {
      const result = await EscrowService.holdFunds({...});
      expect(result.escrow.status).toBe('HELD');
      expect(result.balanceAfter).toBeLessThan(result.balanceBefore);
    });

    it('should throw error for insufficient balance', async () => {
      await expect(
        EscrowService.holdFunds({ amount: new Decimal(1000000) })
      ).rejects.toThrow('Insufficient balance');
    });

    it('should prevent duplicate escrows', async () => {
      await EscrowService.holdFunds({ orderId: 123, ... });
      await expect(
        EscrowService.holdFunds({ orderId: 123, ... })
      ).rejects.toThrow('Escrow already exists');
    });
  });

  describe('releaseFunds', () => {
    it('should release funds to seller', async () => {
      const hold = await EscrowService.holdFunds({...});
      const release = await EscrowService.releaseFunds({
        escrowId: hold.escrow.id,
        recipientUserId: sellerId
      });
      expect(release.escrow.status).toBe('RELEASED');
    });

    it('should throw error for unauthorized recipient', async () => {
      await expect(
        EscrowService.releaseFunds({
          escrowId: 1,
          recipientUserId: 999 // Not seller or traveler
        })
      ).rejects.toThrow('not authorized');
    });
  });
});
```

### Integration Tests

```typescript
describe('Escrow Integration', () => {
  it('should handle complete order flow', async () => {
    // 1. Create order
    const order = await createOrder({...});
    
    // 2. Hold escrow
    const escrow = await EscrowService.holdFunds({
      orderId: order.id,
      ...
    });
    
    // 3. Confirm delivery
    await confirmDelivery(order.id);
    
    // 4. Release funds
    const release = await EscrowService.releaseFunds({
      escrowId: escrow.escrow.id,
      recipientUserId: order.sellerId
    });
    
    // 5. Verify balances
    const buyerWallet = await getWallet(order.buyerId);
    const sellerWallet = await getWallet(order.sellerId);
    
    expect(buyerWallet.balance).toBe(initialBuyerBalance - order.total);
    expect(sellerWallet.balance).toBe(initialSellerBalance + order.total);
  });
});
```

## Deployment

### Migration Steps

1. **Apply Database Migration**:
   ```bash
   cd backend/services/payment-service
   npx prisma migrate deploy
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Verify Schema**:
   ```bash
   npx prisma db pull
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

### Rollback Plan

If issues occur:

1. **Revert Migration**:
   ```sql
   DROP TABLE "Escrow";
   DROP TYPE "EscrowStatus";
   ```

2. **Restore Previous Service**:
   ```bash
   git revert <commit-hash>
   ```

3. **Verify Data Integrity**:
   ```bash
   npm run verify-wallets
   ```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 9.3**: Escrow hold mechanism with atomic transactions
- **Requirement 9.4**: Escrow release on delivery confirmation
- **Requirement 14.1**: Funds held in escrow with status "held"
- **Requirement 14.2**: Escrow release to seller and traveler
- **Requirement 14.3**: Dispute-related escrow freezing

## Related Documentation

- [Wallet Ledger Implementation](./WALLET_LEDGER_IMPLEMENTATION.md)
- [Wallet Ledger Usage Guide](./WALLET_LEDGER_GUIDE.md)
- [Database Schema](../../docs/database/DATABASE_SCHEMA.md)

---

**Implementation Date**: December 11, 2025
**Version**: 1.0.0
**Status**: ✅ Complete
