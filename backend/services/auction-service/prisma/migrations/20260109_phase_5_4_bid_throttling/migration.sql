-- Phase 5.4: Anti-Fraud Bid Throttling
-- APPEND-ONLY throttling decision log

-- Throttle Decision Enum
CREATE TYPE "ThrottleDecision" AS ENUM (
  'ALLOW',
  'SOFT_BLOCK',
  'HARD_BLOCK'
);

-- Throttle Reason Enum
CREATE TYPE "ThrottleReason" AS ENUM (
  'RATE_LIMIT',
  'VELOCITY',
  'SELF_OUTBID',
  'PATTERN',
  'NONE'
);

-- Bid Throttle Log (APPEND-ONLY audit trail)
CREATE TABLE "BidThrottleLog" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "bidderId" INTEGER NOT NULL,
  "decision" "ThrottleDecision" NOT NULL,
  "reason" "ThrottleReason" NOT NULL,
  "timeSinceLastBid" INTEGER,
  "bidCountInWindow" INTEGER,
  "auctionVelocity" DECIMAL(10, 2),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "BidThrottleLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Throttle State (for tracking current state, NOT immutable)
CREATE TABLE "BidThrottleState" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "bidderId" INTEGER NOT NULL,
  "lastBidAt" TIMESTAMP(3),
  "bidCountInWindow" INTEGER NOT NULL DEFAULT 0,
  "softBlockUntil" TIMESTAMP(3),
  "hardBlockUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "BidThrottleState_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BidThrottleState_unique" UNIQUE("auctionId", "bidderId")
);

-- Indexes for performance
CREATE INDEX "BidThrottleLog_auctionId_idx" ON "BidThrottleLog"("auctionId");
CREATE INDEX "BidThrottleLog_bidderId_idx" ON "BidThrottleLog"("bidderId");
CREATE INDEX "BidThrottleLog_decision_idx" ON "BidThrottleLog"("decision");
CREATE INDEX "BidThrottleLog_createdAt_idx" ON "BidThrottleLog"("createdAt");

CREATE INDEX "BidThrottleState_auctionId_bidderId_idx" ON "BidThrottleState"("auctionId", "bidderId");
CREATE INDEX "BidThrottleState_softBlockUntil_idx" ON "BidThrottleState"("softBlockUntil");
CREATE INDEX "BidThrottleState_hardBlockUntil_idx" ON "BidThrottleState"("hardBlockUntil");
