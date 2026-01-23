# Internal Ledger Service

Simple internal wallet system for mnbarh platform with escrow functionality.

## Features

- **Simple Wallet System**: User wallets with available and locked balances
- **Multi-Currency Support**: Support for USD, EUR, SAR, and other currencies
- **Transaction Tracking**: Complete audit trail of all wallet movements
- **Escrow Management**: Lock and release funds for secure transactions
- **DECIMAL(19,4) Precision**: High-precision financial calculations

## Database Schema

### Tables

1. **Wallet**
   - `id`: Primary key
   - `userId`: User identifier
   - `currency`: Currency code (USD, EUR, SAR, etc.)
   - `availableBalance`: Available funds (DECIMAL 19,4)
   - `lockedBalance`: Funds locked in escrow (DECIMAL 19,4)
   - `createdAt`, `updatedAt`: Timestamps

2. **WalletTransaction**
   - `id`: Primary key
   - `walletId`: Foreign key to Wallet
   - `transactionType`: DEPOSIT, WITHDRAWAL, ESCROW_LOCK, ESCROW_RELEASE, ESCROW_REFUND, FEE_DEDUCTION, PAYOUT
   - `amount`: Transaction amount (DECIMAL 19,4)
   - `referenceType`: External entity type (Request, Payout, etc.)
   - `referenceId`: External entity ID
   - `status`: PENDING, COMPLETED, FAILED
   - `metadata`: JSON for additional details
   - `createdAt`: Timestamp

3. **EscrowHold**
   - `id`: Primary key
   - `requestId`: Unique request identifier
   - `buyerWalletId`: Buyer's wallet
   - `sellerWalletId`: Seller's wallet
   - `amount`: Escrow amount (DECIMAL 19,4)
   - `platformFee`: Platform fee (DECIMAL 19,4)
   - `status`: HELD, RELEASED, REFUNDED
   - `heldAt`, `releasedAt`, `expiresAt`: Timestamps
   - `releaseConditions`: JSON for release rules

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

## Usage

### Create a Wallet
```typescript
const wallet = await prisma.wallet.create({
  data: {
    userId: 123,
    currency: 'USD',
    availableBalance: 0,
    lockedBalance: 0
  }
});
```

### Record a Transaction
```typescript
const transaction = await prisma.walletTransaction.create({
  data: {
    walletId: wallet.id,
    transactionType: 'DEPOSIT',
    amount: 100.00,
    status: 'COMPLETED'
  }
});
```

### Create Escrow Hold
```typescript
const escrow = await prisma.escrowHold.create({
  data: {
    requestId: 456,
    buyerWalletId: buyerWallet.id,
    sellerWalletId: sellerWallet.id,
    amount: 50.00,
    platformFee: 5.00,
    status: 'HELD'
  }
});
```

## Transaction Types

- **DEPOSIT**: Add funds to wallet
- **WITHDRAWAL**: Remove funds from wallet
- **ESCROW_LOCK**: Lock funds for escrow
- **ESCROW_RELEASE**: Release escrowed funds to seller
- **ESCROW_REFUND**: Refund escrowed funds to buyer
- **FEE_DEDUCTION**: Deduct platform fees
- **PAYOUT**: Payout to external account

## Indexes

All tables have proper indexes for:
- User lookups
- Currency filtering
- Transaction type queries
- Status filtering
- Reference lookups
- Time-based queries

## Foreign Key Constraints

- WalletTransaction → Wallet
- EscrowHold → Wallet (buyer and seller)

## Precision

All monetary values use `DECIMAL(19,4)` for:
- 15 digits before decimal point
- 4 digits after decimal point
- Accurate financial calculations
