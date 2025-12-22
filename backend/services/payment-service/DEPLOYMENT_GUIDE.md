# Escrow Hold/Release Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the escrow hold/release functionality with atomic transactions.

## Prerequisites

- PostgreSQL database running
- Node.js 18+ installed
- npm or yarn package manager
- Database connection configured in `.env`

## Deployment Steps

### 1. Install Dependencies

```bash
cd backend/services/payment-service
npm install
```

This will install:
- `prisma@^5.8.1` - Prisma CLI
- `@prisma/client@^5.8.1` - Prisma Client
- All other dependencies

### 2. Review Schema Changes

Review the new Escrow model and EscrowStatus enum:

```bash
cat prisma/schema.prisma
```

Key additions:
- `Escrow` model for tracking escrow records
- `EscrowStatus` enum (HELD, RELEASED, REFUNDED, DISPUTED, EXPIRED, CANCELLED)
- Indexes for performance optimization

### 3. Apply Database Migrations

**Option A: Using Prisma Migrate (Recommended for Development)**

```bash
npx prisma migrate dev --name add_escrow_table
```

This will:
- Create the migration if it doesn't exist
- Apply it to the database
- Generate Prisma Client automatically

**Option B: Using Prisma Migrate Deploy (Production)**

```bash
npx prisma migrate deploy
```

This will:
- Apply all pending migrations
- Not generate Prisma Client (do it separately)

**Option C: Manual SQL Execution**

If you prefer to run SQL manually:

```bash
psql -U your_user -d your_database -f prisma/migrations/20251211_add_escrow_table/migration.sql
```

### 4. Generate Prisma Client

After applying migrations, generate the Prisma Client:

```bash
npx prisma generate
```

This creates TypeScript types for:
- `Escrow` model
- `EscrowStatus` enum
- All Prisma operations

**Verify Generation:**

```bash
ls node_modules/@prisma/client/
```

You should see generated files including `index.d.ts` with the new types.

### 5. Verify Database Schema

Check that the Escrow table was created:

```bash
npx prisma db pull
```

Or connect to PostgreSQL:

```sql
\d "Escrow"
\dT "EscrowStatus"
```

Expected output:

```
Table "public.Escrow"
     Column      |           Type           | Nullable |              Default
-----------------+--------------------------+----------+-----------------------------------
 id              | integer                  | not null | nextval('"Escrow_id_seq"'::regclass)
 orderId         | integer                  | not null |
 buyerId         | integer                  | not null |
 sellerId        | integer                  | not null |
 travelerId      | integer                  |          |
 amount          | numeric(10,2)            | not null |
 currency        | text                     | not null | 'USD'::text
 status          | "EscrowStatus"           | not null | 'HELD'::"EscrowStatus"
 holdLedgerId    | integer                  |          |
 releaseLedgerId | integer                  |          |
 heldAt          | timestamp(3)             | not null | CURRENT_TIMESTAMP
 releasedAt      | timestamp(3)             |          |
 expiresAt       | timestamp(3)             |          |
 description     | text                     |          |
 metadata        | jsonb                    |          |
 createdAt       | timestamp(3)             | not null | CURRENT_TIMESTAMP
 updatedAt       | timestamp(3)             | not null |
```

### 6. Run TypeScript Compilation

Compile the TypeScript code to verify no type errors:

```bash
npm run build
```

This should complete without errors. If you see errors about missing types, ensure Prisma Client was generated correctly.

### 7. Run Tests (Optional)

If you have tests configured:

```bash
npm test
```

### 8. Start the Service

**Development Mode:**

```bash
npm run dev
```

**Production Mode:**

```bash
npm run build
npm start
```

## Verification

### 1. Check Service Health

```bash
curl http://localhost:3004/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "payment-service",
  "timestamp": "2025-12-11T..."
}
```

### 2. Test Escrow Operations

**Create a test escrow:**

```typescript
import EscrowService from './services/escrow.service';
import { Decimal } from '@prisma/client/runtime/library';

// Hold funds
const result = await EscrowService.holdFunds({
  orderId: 1,
  buyerId: 1,
  sellerId: 2,
  amount: new Decimal(100.00),
  description: 'Test escrow'
});

console.log('Escrow created:', result.escrow.id);
console.log('Balance after:', result.balanceAfter.toString());
```

**Release funds:**

```typescript
const release = await EscrowService.releaseFunds({
  escrowId: result.escrow.id,
  recipientUserId: 2, // Seller
  systemUserId: 1,
  reason: 'Test release'
});

console.log('Escrow released:', release.escrow.status);
```

### 3. Verify Database Records

```sql
-- Check escrow records
SELECT * FROM "Escrow" ORDER BY "createdAt" DESC LIMIT 5;

-- Check wallet ledger entries
SELECT * FROM "WalletLedger" 
WHERE type IN ('ESCROW_HOLD', 'ESCROW_RELEASE', 'ESCROW_REFUND')
ORDER BY "createdAt" DESC LIMIT 10;

-- Verify wallet balances
SELECT w.id, w."userId", w.balance, 
       (SELECT "balanceAfter" FROM "WalletLedger" 
        WHERE "walletId" = w.id 
        ORDER BY "createdAt" DESC LIMIT 1) as ledger_balance
FROM "Wallet" w;
```

## Troubleshooting

### Issue: Prisma Client Not Generated

**Symptoms:**
- TypeScript errors: `Module '"@prisma/client"' has no exported member 'EscrowStatus'`
- Import errors in IDE

**Solution:**

```bash
cd backend/services/payment-service
npx prisma generate
```

If that fails, try:

```bash
rm -rf node_modules/@prisma
npm install
npx prisma generate
```

### Issue: Migration Already Applied

**Symptoms:**
- Error: "Migration `20251211_add_escrow_table` has already been applied"

**Solution:**

This is normal if the migration was already applied. Skip to generating Prisma Client:

```bash
npx prisma generate
```

### Issue: Database Connection Error

**Symptoms:**
- Error: "Can't reach database server"
- Connection timeout

**Solution:**

1. Check `.env` file has correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mnbara_payment?schema=public"
```

2. Verify PostgreSQL is running:

```bash
pg_isready -h localhost -p 5432
```

3. Test connection:

```bash
npx prisma db pull
```

### Issue: Type Errors in escrow.service.ts

**Symptoms:**
- `Parameter 'tx' implicitly has an 'any' type`

**Solution:**

This is a TypeScript configuration issue. The code is correct. To fix:

1. Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": false,
    // or
    "noImplicitAny": false
  }
}
```

2. Or add explicit type:

```typescript
return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  // ...
});
```

### Issue: Insufficient Balance Error

**Symptoms:**
- Error: "Insufficient balance. Available: X, Required: Y"

**Solution:**

This is expected behavior. Ensure the buyer's wallet has sufficient funds:

```sql
-- Add funds to wallet
UPDATE "Wallet" 
SET balance = balance + 1000 
WHERE "userId" = 1;
```

Or use the wallet ledger service:

```typescript
await WalletLedgerService.recordDeposit(
  walletId: 1,
  amount: new Decimal(1000),
  transactionId: 1,
  userId: 1
);
```

## Rollback Procedure

If you need to rollback the changes:

### 1. Revert Database Migration

```sql
-- Drop the Escrow table
DROP TABLE IF EXISTS "Escrow";

-- Drop the EscrowStatus enum
DROP TYPE IF EXISTS "EscrowStatus";
```

### 2. Revert Code Changes

```bash
git revert <commit-hash>
```

### 3. Regenerate Prisma Client

```bash
npx prisma generate
```

### 4. Restart Service

```bash
npm run build
npm start
```

## Monitoring

### Key Metrics to Monitor

1. **Escrow Volume**:
   ```sql
   SELECT status, COUNT(*), SUM(amount) 
   FROM "Escrow" 
   GROUP BY status;
   ```

2. **Average Escrow Duration**:
   ```sql
   SELECT AVG(EXTRACT(EPOCH FROM ("releasedAt" - "heldAt"))/3600) as avg_hours
   FROM "Escrow" 
   WHERE status IN ('RELEASED', 'REFUNDED');
   ```

3. **Wallet Balance Reconciliation**:
   ```sql
   SELECT w.id, w.balance as wallet_balance, 
          wl."balanceAfter" as ledger_balance,
          w.balance - wl."balanceAfter" as difference
   FROM "Wallet" w
   LEFT JOIN LATERAL (
     SELECT "balanceAfter" 
     FROM "WalletLedger" 
     WHERE "walletId" = w.id 
     ORDER BY "createdAt" DESC 
     LIMIT 1
   ) wl ON true
   WHERE w.balance != wl."balanceAfter";
   ```

### Alerts to Configure

1. **Balance Mismatch**: Alert if wallet balance != ledger balance
2. **Stuck Escrows**: Alert if escrows held > 60 days
3. **High Dispute Rate**: Alert if dispute rate > 5%
4. **Failed Operations**: Alert on escrow operation failures

## Performance Optimization

### Database Indexes

The migration creates these indexes automatically:

```sql
CREATE INDEX "Escrow_orderId_idx" ON "Escrow"("orderId");
CREATE INDEX "Escrow_buyerId_idx" ON "Escrow"("buyerId");
CREATE INDEX "Escrow_sellerId_idx" ON "Escrow"("sellerId");
CREATE INDEX "Escrow_status_idx" ON "Escrow"("status");
CREATE INDEX "Escrow_expiresAt_idx" ON "Escrow"("expiresAt");
```

### Query Optimization

For large datasets, consider:

1. **Partitioning**: Partition Escrow table by date
2. **Archiving**: Archive old escrows (>1 year) to separate table
3. **Read Replicas**: Use read replicas for reporting queries

## Security Checklist

- [ ] Database credentials secured in environment variables
- [ ] SSL/TLS enabled for database connections
- [ ] Wallet operations require authentication
- [ ] Escrow operations logged for audit
- [ ] Rate limiting configured on API endpoints
- [ ] Input validation on all escrow parameters
- [ ] Authorization checks for release/refund operations

## Integration with Other Services

### Order Service

```typescript
// In order-service
import EscrowService from '@mnbara/payment-service';

// When creating order with escrow
if (order.useEscrow) {
  const escrow = await EscrowService.holdFunds({
    orderId: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    amount: order.total
  });
  order.escrowId = escrow.escrow.id;
}
```

### Crowdship Service

```typescript
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

### Admin Service

```typescript
// When resolving dispute
if (dispute.resolution === 'REFUND_BUYER') {
  await EscrowService.refundFunds({
    escrowId: order.escrowId,
    systemUserId: adminId,
    reason: dispute.resolutionNotes
  });
}
```

## Cron Jobs

### Auto-Release Expired Escrows

Set up a daily cron job:

```bash
# crontab -e
0 2 * * * cd /path/to/payment-service && node scripts/auto-release-escrows.js
```

Create `scripts/auto-release-escrows.js`:

```javascript
const EscrowService = require('../dist/services/escrow.service').default;

async function main() {
  console.log('Starting auto-release of expired escrows...');
  const results = await EscrowService.autoReleaseExpiredEscrows(1);
  console.log(`Processed ${results.length} expired escrows`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
}

main().catch(console.error);
```

## Support

For issues or questions:

1. Check this deployment guide
2. Review [ESCROW_IMPLEMENTATION.md](./ESCROW_IMPLEMENTATION.md)
3. Check [WALLET_LEDGER_IMPLEMENTATION.md](./WALLET_LEDGER_IMPLEMENTATION.md)
4. Contact the development team

## Related Documentation

- [Escrow Implementation](./ESCROW_IMPLEMENTATION.md)
- [Wallet Ledger Implementation](./WALLET_LEDGER_IMPLEMENTATION.md)
- [Wallet Ledger Usage Guide](./WALLET_LEDGER_GUIDE.md)
- [Database Schema](../../docs/database/DATABASE_SCHEMA.md)

---

**Last Updated**: December 11, 2025
**Version**: 1.0.0
