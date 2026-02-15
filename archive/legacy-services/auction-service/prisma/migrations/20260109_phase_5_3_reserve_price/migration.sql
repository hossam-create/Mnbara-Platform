-- Phase 5.3: Reserve Price & Hidden Minimums
-- APPEND-ONLY reserve price and settlement outcome tracking

-- Extended AuctionStatus enum
CREATE TYPE "AuctionEndReason" AS ENUM (
  'NORMAL',
  'RESERVE_NOT_MET',
  'CANCELLED',
  'SYSTEM_ERROR'
);

-- Extend Listing table with reserve price fields
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "reservePriceEncrypted" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "reservePriceIV" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "reserveMet" BOOLEAN;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "endedReason" "AuctionEndReason";
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "minIncrementRule" DECIMAL(10, 2);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "reserveSetAt" TIMESTAMP(3);

-- Settlement Outcome Log (APPEND-ONLY audit trail)
CREATE TABLE "SettlementOutcomeLog" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "highestValidBidId" INTEGER,
  "highestValidBidAmount" DECIMAL(18, 2),
  "reservePrice" DECIMAL(18, 2),
  "reserveMet" BOOLEAN NOT NULL,
  "endedReason" "AuctionEndReason" NOT NULL,
  "winnerId" INTEGER,
  "finalPrice" DECIMAL(18, 2),
  "invalidatedBidsCount" INTEGER NOT NULL DEFAULT 0,
  "totalBidsCount" INTEGER NOT NULL DEFAULT 0,
  "escrowsReleasedCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SettlementOutcomeLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Escrow Release Log (APPEND-ONLY for reserve-unmet releases)
CREATE TABLE "EscrowReleaseLog" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "bidId" INTEGER NOT NULL,
  "bidderId" INTEGER NOT NULL,
  "escrowAmount" DECIMAL(18, 2) NOT NULL,
  "releaseReason" TEXT NOT NULL,
  "ledgerEntryId" TEXT,
  "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedBy" TEXT NOT NULL,
  
  CONSTRAINT "EscrowReleaseLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EscrowReleaseLog_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "SettlementOutcomeLog_auctionId_idx" ON "SettlementOutcomeLog"("auctionId");
CREATE INDEX "SettlementOutcomeLog_createdAt_idx" ON "SettlementOutcomeLog"("createdAt");
CREATE INDEX "SettlementOutcomeLog_reserveMet_idx" ON "SettlementOutcomeLog"("reserveMet");

CREATE INDEX "EscrowReleaseLog_auctionId_idx" ON "EscrowReleaseLog"("auctionId");
CREATE INDEX "EscrowReleaseLog_bidId_idx" ON "EscrowReleaseLog"("bidId");
CREATE INDEX "EscrowReleaseLog_releasedAt_idx" ON "EscrowReleaseLog"("releasedAt");
