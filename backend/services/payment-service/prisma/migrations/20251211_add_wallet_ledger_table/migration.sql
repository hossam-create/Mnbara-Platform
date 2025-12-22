-- CreateEnum for WalletLedgerType
CREATE TYPE "WalletLedgerType" AS ENUM (
  'DEPOSIT',
  'WITHDRAWAL',
  'PAYMENT',
  'REFUND',
  'ESCROW_HOLD',
  'ESCROW_RELEASE',
  'ESCROW_REFUND',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'COMMISSION_EARNED',
  'COMMISSION_DEDUCTED',
  'REWARD_REDEMPTION',
  'ADJUSTMENT',
  'REVERSAL'
);

-- CreateTable WalletLedger
CREATE TABLE "WalletLedger" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" "WalletLedgerType" NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "transactionId" INTEGER,
    "orderId" INTEGER,
    "escrowId" INTEGER,
    "description" TEXT,
    "metadata" JSONB,
    "performedBy" INTEGER,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletLedger_walletId_idx" ON "WalletLedger"("walletId");

-- CreateIndex
CREATE INDEX "WalletLedger_type_idx" ON "WalletLedger"("type");

-- CreateIndex
CREATE INDEX "WalletLedger_transactionId_idx" ON "WalletLedger"("transactionId");

-- CreateIndex
CREATE INDEX "WalletLedger_orderId_idx" ON "WalletLedger"("orderId");

-- CreateIndex
CREATE INDEX "WalletLedger_createdAt_idx" ON "WalletLedger"("createdAt");

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
