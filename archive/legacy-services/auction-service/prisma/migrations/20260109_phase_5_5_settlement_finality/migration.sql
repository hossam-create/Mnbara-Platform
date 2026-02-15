-- Phase 5.5: Settlement Finality & Appeals Window
-- APPEND-ONLY appeals and override logs

-- Appeal Reason Enum
CREATE TYPE "AppealReason" AS ENUM (
  'TECHNICAL_ERROR',
  'FRAUD_CLAIM',
  'DISPUTE_UNRESOLVED',
  'ESCROW_ISSUE',
  'SETTLEMENT_ERROR',
  'OTHER'
);

-- Appeal Status Enum
CREATE TYPE "AppealStatus" AS ENUM (
  'OPEN',
  'REJECTED',
  'ACCEPTED',
  'ESCALATED'
);

-- Settlement State Enum (extended)
CREATE TYPE "SettlementState" AS ENUM (
  'ENDED',
  'SETTLED_PENDING_APPEAL',
  'FINALIZED',
  'OVERRIDDEN'
);

-- Auction Appeal (APPEND-ONLY)
CREATE TABLE "AuctionAppeal" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "appellantId" INTEGER NOT NULL,
  "reasonCode" "AppealReason" NOT NULL,
  "description" TEXT,
  "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "resolutionNote" TEXT,
  
  CONSTRAINT "AuctionAppeal_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Settlement Override Log (APPEND-ONLY, requires dual approval)
CREATE TABLE "SettlementOverrideLog" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "overrideReason" TEXT NOT NULL,
  "previousState" "SettlementState" NOT NULL,
  "newState" "SettlementState" NOT NULL,
  "initiatedBy" TEXT NOT NULL,
  "approvedBy" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SettlementOverrideLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Appeals Window Configuration (per auction)
CREATE TABLE "AppealsWindowConfig" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL UNIQUE,
  "windowDurationMs" INTEGER NOT NULL,
  "windowStartsAt" TIMESTAMP(3) NOT NULL,
  "windowEndsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "AppealsWindowConfig_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "AuctionAppeal_auctionId_idx" ON "AuctionAppeal"("auctionId");
CREATE INDEX "AuctionAppeal_appellantId_idx" ON "AuctionAppeal"("appellantId");
CREATE INDEX "AuctionAppeal_status_idx" ON "AuctionAppeal"("status");
CREATE INDEX "AuctionAppeal_createdAt_idx" ON "AuctionAppeal"("createdAt");

CREATE INDEX "SettlementOverrideLog_auctionId_idx" ON "SettlementOverrideLog"("auctionId");
CREATE INDEX "SettlementOverrideLog_createdAt_idx" ON "SettlementOverrideLog"("createdAt");

CREATE INDEX "AppealsWindowConfig_auctionId_idx" ON "AppealsWindowConfig"("auctionId");
CREATE INDEX "AppealsWindowConfig_windowEndsAt_idx" ON "AppealsWindowConfig"("windowEndsAt");
