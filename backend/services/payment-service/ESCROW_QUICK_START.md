# Escrow Quick Start Guide

## TL;DR

```bash
# 1. Install dependencies
cd backend/services/payment-service
npm install

# 2. Apply migration
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Start service
npm run dev
```

## Basic Usage

### Hold Funds in Escrow

```typescript
import EscrowService from './services/escrow.service';
import { Decimal } from '@prisma/client/runtime/library';

const result = await EscrowService.holdFunds({
  orderId: 123,
  buyerId: 456,
  sellerId: 789,
  amount: new Decimal(100.00)
});

console.log(`Escrow ID: ${result.escrow.id}`);
console.log(`Status: ${result.escrow.status}`); // HELD
```

### Release Funds

```typescript
const release = await EscrowService.releaseFunds({
  escrowId: 1,
  recipientUserId: 789, // Seller ID
  systemUserId: 1,
  reason: 'Delivery confirmed'
});

console.log(`Status: ${release.escrow.status}`); // RELEASED
```

### Refund Funds

```typescript
const refund = await EscrowService.refundFunds({
  escrowId: 1,
  systemUserId: 1,
  reason: 'Order cancelled'
});

console.log(`Status: ${refund.escrow.status}`); // REFUNDED
```

### Dispute Escrow

```typescript
const disputed = await EscrowService.disputeEscrow(
  1, // escrowId
  'Item not as described'
);

console.log(`Status: ${disputed.status}`); // DISPUTED
```

## Common Patterns

### Crowdship Order Flow

```typescript
// 1. Create order
const order = await createOrder({...});

// 2. Hold escrow
const escrow = await EscrowService.holdFunds({
  orderId: order.id,
  buyerId: order.buyerId,
  sellerId: order.sellerId,
  travelerId: order.travelerId,
  amount: order.total,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
});

// 3. Traveler delivers
await submitDeliveryEvidence(order.id);

// 4. Release funds
await EscrowService.releaseFunds({
  escrowId: escrow.escrow.id,
  recipientUserId: order.sellerId,
  systemUserId: 1,
  reason: 'Delivery confirmed'
});
```

### Dispute Resolution

```typescript
// 1. Buyer raises dispute
await EscrowService.disputeEscrow(
  escrowId,
  'Item damaged',
  { evidence: ['photo1.jpg'] }
);

// 2. Admin reviews
const escrow = await EscrowService.getEscrowById(escrowId);

// 3. Admin decides
if (adminDecision === 'REFUND') {
  await EscrowService.refundFunds({
    escrowId,
    systemUserId: adminId,
    reason: 'Dispute resolved in favor of buyer'
  });
} else {
  await EscrowService.releaseFunds({
    escrowId,
    recipientUserId: escrow.sellerId,
    systemUserId: adminId,
    reason: 'Dispute resolved in favor of seller'
  });
}
```

## Query Examples

```typescript
// Get escrow by order ID
const escrow = await EscrowService.getEscrowByOrderId(123);

// Get all buyer's escrows
const buyerEscrows = await EscrowService.getEscrowsByBuyer(456);

// Get seller's held escrows
const sellerEscrows = await EscrowService.getEscrowsBySeller(789, 'HELD');

// Get expired escrows
const expired = await EscrowService.getExpiredEscrows();
```

## Error Handling

```typescript
try {
  await EscrowService.holdFunds({...});
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    // Handle insufficient funds
  } else if (error.message.includes('already exists')) {
    // Handle duplicate escrow
  } else {
    // Handle other errors
  }
}
```

## Status Flow

```
HELD → RELEASED (normal flow)
HELD → DISPUTED → RELEASED or REFUNDED (dispute flow)
HELD → REFUNDED (cancellation)
HELD → EXPIRED → RELEASED (auto-release)
```

## Key Features

✅ **Atomic Transactions**: All operations are atomic
✅ **Balance Validation**: Prevents overdrafts
✅ **Audit Trail**: Complete history in WalletLedger
✅ **Rollback Protection**: Failed operations don't corrupt data
✅ **Duplicate Prevention**: Can't create duplicate escrows
✅ **Authorization**: Validates recipients

## Requirements Satisfied

- ✅ Requirement 9.3: Escrow hold mechanism
- ✅ Requirement 9.4: Escrow release on delivery
- ✅ Requirement 14.1: Funds held with status "held"
- ✅ Requirement 14.2: Escrow release to seller/traveler
- ✅ Requirement 14.3: Dispute-related escrow freezing

## Next Steps

1. Read [ESCROW_IMPLEMENTATION.md](./ESCROW_IMPLEMENTATION.md) for detailed documentation
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment instructions
3. Check [WALLET_LEDGER_GUIDE.md](./WALLET_LEDGER_GUIDE.md) for wallet operations

## Support

- 📖 [Full Documentation](./ESCROW_IMPLEMENTATION.md)
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 💰 [Wallet Ledger Guide](./WALLET_LEDGER_GUIDE.md)
