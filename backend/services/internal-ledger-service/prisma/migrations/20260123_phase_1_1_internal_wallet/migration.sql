-- ============================================================
-- PHASE 1.1: Internal Wallet System
-- Simple ledger system for mnbarh platform
-- ============================================================

-- Create Wallet table
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "availableBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- Create WalletTransaction table
CREATE TABLE "WalletTransaction" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- Create EscrowHold table
CREATE TABLE "EscrowHold" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "buyerWalletId" INTEGER NOT NULL,
    "sellerWalletId" INTEGER NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "platformFee" DECIMAL(19,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "releaseConditions" JSONB,

    CONSTRAINT "EscrowHold_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on Wallet
CREATE UNIQUE INDEX "Wallet_userId_currency_key" ON "Wallet"("userId", "currency");

-- Create unique constraint on EscrowHold
CREATE UNIQUE INDEX "EscrowHold_requestId_key" ON "EscrowHold"("requestId");

-- Create indexes for Wallet
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");
CREATE INDEX "Wallet_currency_idx" ON "Wallet"("currency");

-- Create indexes for WalletTransaction
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");
CREATE INDEX "WalletTransaction_transactionType_idx" ON "WalletTransaction"("transactionType");
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");
CREATE INDEX "WalletTransaction_referenceType_referenceId_idx" ON "WalletTransaction"("referenceType", "referenceId");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- Create indexes for EscrowHold
CREATE INDEX "EscrowHold_requestId_idx" ON "EscrowHold"("requestId");
CREATE INDEX "EscrowHold_buyerWalletId_idx" ON "EscrowHold"("buyerWalletId");
CREATE INDEX "EscrowHold_sellerWalletId_idx" ON "EscrowHold"("sellerWalletId");
CREATE INDEX "EscrowHold_status_idx" ON "EscrowHold"("status");
CREATE INDEX "EscrowHold_expiresAt_idx" ON "EscrowHold"("expiresAt");

-- Add foreign key constraints
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EscrowHold" ADD CONSTRAINT "EscrowHold_buyerWalletId_fkey" FOREIGN KEY ("buyerWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EscrowHold" ADD CONSTRAINT "EscrowHold_sellerWalletId_fkey" FOREIGN KEY ("sellerWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
