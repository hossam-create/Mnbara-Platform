-- Phase 5.2: Auction Disputes & Bid Invalidations
-- APPEND-ONLY dispute and invalidation layer

-- Dispute Reason Enum
CREATE TYPE "DisputeReason" AS ENUM (
  'FRAUD_SUSPECTED',
  'DUPLICATE_BID',
  'BOT_ACTIVITY',
  'ESCROW_FAILURE_POST_ACCEPT',
  'RULE_VIOLATION',
  'SYSTEM_ERROR'
);

-- Dispute Status Enum
CREATE TYPE "DisputeStatus" AS ENUM (
  'OPEN',
  'RESOLVED',
  'ESCALATED'
);

-- Resolution Type Enum
CREATE TYPE "ResolutionType" AS ENUM (
  'DISMISS',
  'INVALIDATE',
  'ESCALATE'
);

-- Extend BidStatus enum to include INVALIDATED
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'INVALIDATED';

-- AuctionDispute table (APPEND-ONLY)
CREATE TABLE "AuctionDispute" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "bidId" INTEGER NOT NULL,
  "reason" "DisputeReason" NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" "ResolutionType",
  "resolutionNote" TEXT,
  "createdBy" TEXT NOT NULL,
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  
  CONSTRAINT "AuctionDispute_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuctionDispute_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- DisputeResolutionLog table (APPEND-ONLY audit trail)
CREATE TABLE "DisputeResolutionLog" (
  "id" SERIAL PRIMARY KEY,
  "disputeId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "previousStatus" "DisputeStatus",
  "newStatus" "DisputeStatus",
  "actorId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DisputeResolutionLog_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "AuctionDispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- BidInvalidationLog table (APPEND-ONLY audit trail for bid invalidations)
CREATE TABLE "BidInvalidationLog" (
  "id" SERIAL PRIMARY KEY,
  "bidId" INTEGER NOT NULL,
  "auctionId" INTEGER NOT NULL,
  "disputeId" INTEGER,
  "reason" "DisputeReason" NOT NULL,
  "previousStatus" "BidStatus" NOT NULL,
  "escrowAction" TEXT,
  "escrowEntryId" TEXT,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "BidInvalidationLog_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BidInvalidationLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BidInvalidationLog_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "AuctionDispute"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "AuctionDispute_auctionId_idx" ON "AuctionDispute"("auctionId");
CREATE INDEX "AuctionDispute_bidId_idx" ON "AuctionDispute"("bidId");
CREATE INDEX "AuctionDispute_status_idx" ON "AuctionDispute"("status");
CREATE INDEX "AuctionDispute_createdAt_idx" ON "AuctionDispute"("createdAt");

CREATE INDEX "DisputeResolutionLog_disputeId_idx" ON "DisputeResolutionLog"("disputeId");
CREATE INDEX "DisputeResolutionLog_createdAt_idx" ON "DisputeResolutionLog"("createdAt");

CREATE INDEX "BidInvalidationLog_bidId_idx" ON "BidInvalidationLog"("bidId");
CREATE INDEX "BidInvalidationLog_auctionId_idx" ON "BidInvalidationLog"("auctionId");
CREATE INDEX "BidInvalidationLog_createdAt_idx" ON "BidInvalidationLog"("createdAt");

-- Add hasOpenDisputes flag to Listing for settlement safety
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "hasOpenDisputes" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Listing_hasOpenDisputes_idx" ON "Listing"("hasOpenDisputes");
