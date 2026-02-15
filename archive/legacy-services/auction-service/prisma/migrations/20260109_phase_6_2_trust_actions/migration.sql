-- ============================================================
-- PHASE 6.2 — Trust Actions (Hard Controls) Migration
-- ============================================================

-- Create TrustActionType enum
CREATE TYPE "TrustActionType" AS ENUM (
  'FREEZE_WALLET',
  'FREEZE_ESCROW_RELEASE',
  'BLOCK_PAYOUTS',
  'AUCTION_BID_BLOCK',
  'ACCOUNT_RESTRICTED'
);

-- Create TrustSeverity enum
CREATE TYPE "TrustSeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

-- Create TrustActionStatus enum
CREATE TYPE "TrustActionStatus" AS ENUM (
  'ACTIVE',
  'LIFTED',
  'EXPIRED',
  'REVERTED'
);

-- Create TrustAction table (APPEND-ONLY)
CREATE TABLE "TrustAction" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id"),
  "walletId" INTEGER,
  "auctionId" INTEGER REFERENCES "Listing"("id"),
  "actionType" "TrustActionType" NOT NULL,
  "severity" "TrustSeverity" NOT NULL,
  "status" "TrustActionStatus" NOT NULL DEFAULT 'ACTIVE',
  "reason" TEXT NOT NULL,
  "durationMinutes" INTEGER,
  "activatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "liftedAt" TIMESTAMP(3),
  "liftedBy" TEXT,
  "revertedAt" TIMESTAMP(3),
  "revertedBy" TEXT,
  "expiredAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TrustActionLog table (APPEND-ONLY)
CREATE TABLE "TrustActionLog" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "actionId" INTEGER NOT NULL REFERENCES "TrustAction"("id"),
  "action_type" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "TrustAction_userId_idx" ON "TrustAction"("userId");
CREATE INDEX "TrustAction_walletId_idx" ON "TrustAction"("walletId");
CREATE INDEX "TrustAction_auctionId_idx" ON "TrustAction"("auctionId");
CREATE INDEX "TrustAction_actionType_idx" ON "TrustAction"("actionType");
CREATE INDEX "TrustAction_severity_idx" ON "TrustAction"("severity");
CREATE INDEX "TrustAction_status_idx" ON "TrustAction"("status");
CREATE INDEX "TrustAction_expiresAt_idx" ON "TrustAction"("expiresAt");
CREATE INDEX "TrustAction_createdAt_idx" ON "TrustAction"("createdAt");

CREATE INDEX "TrustActionLog_actionId_idx" ON "TrustActionLog"("actionId");
CREATE INDEX "TrustActionLog_action_type_idx" ON "TrustActionLog"("action_type");
CREATE INDEX "TrustActionLog_createdAt_idx" ON "TrustActionLog"("createdAt");
