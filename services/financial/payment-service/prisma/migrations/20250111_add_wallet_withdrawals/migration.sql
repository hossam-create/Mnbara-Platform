-- Add pending balance to wallet
ALTER TABLE "Wallet"
  ADD COLUMN IF NOT EXISTS "pendingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Payout methods
CREATE TABLE IF NOT EXISTS "PayoutMethod" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "maskedIdentifier" TEXT NOT NULL,
  "externalRef" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PayoutMethod_userId_idx" ON "PayoutMethod"("userId");

-- Withdrawal requests
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "walletId" INTEGER NOT NULL REFERENCES "Wallet"("id") ON DELETE CASCADE,
  "payoutMethodId" INTEGER NOT NULL REFERENCES "PayoutMethod"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_walletId_idx" ON "WithdrawalRequest"("walletId");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");






