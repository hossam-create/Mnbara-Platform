# Wallet Ledger Implementation Guide

## Overview

The `WalletLedger` table provides a complete audit trail of all wallet balance changes in the MNBARA platform. Every transaction that affects a user's wallet balance is recorded with full context, enabling:

- Complete transaction history
- Balance reconciliation
- Dispute resolution
- Audit compliance
- Financial reporting

## Schema

### WalletLedger Model

```prisma
model WalletLedger {
  id              Int                 @id @default(autoincrement())
  walletId        Int
  wallet          Wallet              @relation(fields: [walletId], references: [id], onDelete: Cascade)
  
  // Transaction details
  amount          Decimal             @db.Decimal(10, 2)  // Positive for credit, negative for debit
  currency        String              @default("USD")
  type            WalletLedgerType
  
  // Balance tracking
  balanceBefore   Decimal             @db.Decimal(10, 2)
  balanceAfter    Decimal             @db.Decimal(10, 2)
  
  // References
  transactionId   Int?
  orderId         Int?
  escrowId        Int?
  
  // Metadata
  description     String?             @db.Text
  metadata        Json?
  
  // Audit
  performedBy     Int?
  ipAddress       String?
  
  createdAt       DateTime            @default(now())
}
```

### Transaction Types

```typescript
enum WalletLedgerType {
  DEPOSIT                 // Funds added to wallet
  WITHDRAWAL              // Funds removed from wallet
  PAYMENT                 // Payment for order/service
  REFUND                  // Refund received
  ESCROW_HOLD             // Funds held in escrow
  ESCROW_RELEASE          // Escrow funds released
  ESCROW_REFUND           // Escrow funds refunded
  TRANSFER_IN             // Transfer received from another wallet
  TRANSFER_OUT            // Transfer sent to another wallet
  COMMISSION_EARNED       // Platform commission earned
  COMMISSION_DEDUCTED     // Platform commission deducted
  REWARD_REDEMPTION       // Rewards redeemed
  ADJUSTMENT              // Manual adjustment by admin
  REVERSAL                // Transaction reversal
}
```

## Usage Examples

### 1. Recording a Deposit

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recordDeposit(
  walletId: number,
  amount: number,
  transactionId: number,
  userId: number,
  ipAddress: string
) {
  return await prisma.$transaction(async (tx) => {
    // Get current wallet balance
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId }
    });
    
    if (!wallet) throw new Error('Wallet not found');
    
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore.plus(amount);
    
    // Update wallet balance
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: balanceAfter }
    });
    
    // Record in ledger
    await tx.walletLedger.create({
      data: {
        walletId,
        amount,
        currency: 'USD',
        type: 'DEPOSIT',
        balanceBefore,
        balanceAfter,
        transactionId,
        description: 'Deposit via Stripe',
        performedBy: userId,
        ipAddress
      }
    });
    
    return { balanceBefore, balanceAfter };
  });
}
```

### 2. Recording an Escrow Hold

```typescript
async function holdEscrow(
  walletId: number,
  amount: number,
  orderId: number,
  escrowId: number,
  userId: number
) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId }
    });
    
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.balance.lessThan(amount)) {
      throw new Error('Insufficient balance');
    }
    
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore.minus(amount);
    
    // Deduct from wallet
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: balanceAfter }
    });
    
    // Record hold in ledger (negative amount)
    await tx.walletLedger.create({
      data: {
        walletId,
        amount: amount.negated(), // Negative for debit
        currency: 'USD',
        type: 'ESCROW_HOLD',
        balanceBefore,
        balanceAfter,
        orderId,
        escrowId,
        description: `Escrow hold for order #${orderId}`,
        performedBy: userId,
        metadata: {
          escrowId,
          orderId
        }
      }
    });
    
    return { balanceBefore, balanceAfter };
  });
}
```

### 3. Recording an Escrow Release

```typescript
async function releaseEscrow(
  recipientWalletId: number,
  amount: number,
  orderId: number,
  escrowId: number,
  systemUserId: number
) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { id: recipientWalletId }
    });
    
    if (!wallet) throw new Error('Wallet not found');
    
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore.plus(amount);
    
    // Add to recipient wallet
    await tx.wallet.update({
      where: { id: recipientWalletId },
      data: { balance: balanceAfter }
    });
    
    // Record release in ledger
    await tx.walletLedger.create({
      data: {
        walletId: recipientWalletId,
        amount,
        currency: 'USD',
        type: 'ESCROW_RELEASE',
        balanceBefore,
        balanceAfter,
        orderId,
        escrowId,
        description: `Escrow released for order #${orderId}`,
        performedBy: systemUserId,
        metadata: {
          escrowId,
          orderId,
          releaseReason: 'Delivery confirmed'
        }
      }
    });
    
    return { balanceBefore, balanceAfter };
  });
}
```

### 4. Getting Transaction History

```typescript
async function getWalletHistory(
  walletId: number,
  limit: number = 50,
  offset: number = 0
) {
  return await prisma.walletLedger.findMany({
    where: { walletId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      wallet: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });
}
```

### 5. Balance Reconciliation

```typescript
async function reconcileBalance(walletId: number) {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId }
  });
  
  if (!wallet) throw new Error('Wallet not found');
  
  // Get the last ledger entry
  const lastEntry = await prisma.walletLedger.findFirst({
    where: { walletId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!lastEntry) {
    // No transactions yet, balance should be 0
    return {
      currentBalance: wallet.balance,
      ledgerBalance: 0,
      isReconciled: wallet.balance.equals(0)
    };
  }
  
  return {
    currentBalance: wallet.balance,
    ledgerBalance: lastEntry.balanceAfter,
    isReconciled: wallet.balance.equals(lastEntry.balanceAfter),
    lastTransaction: lastEntry.createdAt
  };
}
```

### 6. Calculate Balance at Point in Time

```typescript
async function getBalanceAtTime(
  walletId: number,
  timestamp: Date
) {
  const entry = await prisma.walletLedger.findFirst({
    where: {
      walletId,
      createdAt: { lte: timestamp }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return entry ? entry.balanceAfter : 0;
}
```

## Best Practices

### 1. Always Use Transactions

All wallet operations that modify balance MUST be wrapped in a database transaction to ensure atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  // Update wallet
  // Create ledger entry
});
```

### 2. Record Both Sides of Transfers

For wallet-to-wallet transfers, create two ledger entries:

```typescript
async function transferBetweenWallets(
  fromWalletId: number,
  toWalletId: number,
  amount: number,
  userId: number
) {
  return await prisma.$transaction(async (tx) => {
    // Debit from sender
    const fromWallet = await tx.wallet.findUnique({ where: { id: fromWalletId } });
    await tx.wallet.update({
      where: { id: fromWalletId },
      data: { balance: fromWallet.balance.minus(amount) }
    });
    await tx.walletLedger.create({
      data: {
        walletId: fromWalletId,
        amount: amount.negated(),
        type: 'TRANSFER_OUT',
        balanceBefore: fromWallet.balance,
        balanceAfter: fromWallet.balance.minus(amount),
        performedBy: userId
      }
    });
    
    // Credit to recipient
    const toWallet = await tx.wallet.findUnique({ where: { id: toWalletId } });
    await tx.wallet.update({
      where: { id: toWalletId },
      data: { balance: toWallet.balance.plus(amount) }
    });
    await tx.walletLedger.create({
      data: {
        walletId: toWalletId,
        amount,
        type: 'TRANSFER_IN',
        balanceBefore: toWallet.balance,
        balanceAfter: toWallet.balance.plus(amount),
        performedBy: userId
      }
    });
  });
}
```

### 3. Include Descriptive Metadata

Always include relevant context in the `metadata` field:

```typescript
metadata: {
  orderId: 123,
  escrowId: 456,
  reason: 'Delivery confirmed',
  adminNotes: 'Manual adjustment approved by admin@example.com'
}
```

### 4. Validate Balance Before Operations

Always check sufficient balance before debits:

```typescript
if (wallet.balance.lessThan(amount)) {
  throw new Error('Insufficient balance');
}
```

### 5. Use Negative Amounts for Debits

Convention: Positive amounts = credits, Negative amounts = debits

```typescript
// Credit (add to wallet)
amount: 100.00

// Debit (remove from wallet)
amount: -100.00
```

## Querying Examples

### Get All Escrow Holds

```typescript
const escrowHolds = await prisma.walletLedger.findMany({
  where: {
    type: 'ESCROW_HOLD',
    walletId
  },
  orderBy: { createdAt: 'desc' }
});
```

### Get Total Deposits

```typescript
const totalDeposits = await prisma.walletLedger.aggregate({
  where: {
    walletId,
    type: 'DEPOSIT'
  },
  _sum: {
    amount: true
  }
});
```

### Get Transactions by Date Range

```typescript
const transactions = await prisma.walletLedger.findMany({
  where: {
    walletId,
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  orderBy: { createdAt: 'asc' }
});
```

## Migration

To apply the wallet_ledger table to your database:

```bash
cd backend/services/payment-service
npx prisma migrate deploy
```

Or manually run the migration SQL:

```bash
psql -U your_user -d your_database -f prisma/migrations/20251211_add_wallet_ledger_table/migration.sql
```

## Monitoring and Maintenance

### Daily Balance Reconciliation

Run a daily job to ensure all wallet balances match their ledger:

```typescript
async function dailyReconciliation() {
  const wallets = await prisma.wallet.findMany();
  
  for (const wallet of wallets) {
    const result = await reconcileBalance(wallet.id);
    
    if (!result.isReconciled) {
      console.error(`Balance mismatch for wallet ${wallet.id}`, result);
      // Alert admin
    }
  }
}
```

### Archive Old Entries

Consider archiving ledger entries older than 2 years to a separate table for performance:

```sql
-- Archive entries older than 2 years
INSERT INTO wallet_ledger_archive
SELECT * FROM wallet_ledger
WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM wallet_ledger
WHERE created_at < NOW() - INTERVAL '2 years';
```

## Security Considerations

1. **Immutable Records**: Never delete or modify ledger entries. Use REVERSAL type for corrections.
2. **Access Control**: Restrict direct ledger writes to trusted services only.
3. **Audit Trail**: Always record `performedBy` and `ipAddress` for accountability.
4. **Encryption**: Consider encrypting sensitive metadata fields.

## Support

For questions or issues with the wallet ledger implementation, contact the platform team or refer to the main documentation.
