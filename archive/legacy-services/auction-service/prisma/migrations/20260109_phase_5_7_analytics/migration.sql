-- Phase 5.7: Auction Analytics & Trust Signals
-- READ-ONLY analytics snapshots (append-only)

-- Trust Tier Enum
CREATE TYPE "TrustTier" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

-- Seller Badge Enum
CREATE TYPE "SellerBadge" AS ENUM (
  'NEW',
  'VERIFIED',
  'WATCHLISTED'
);

-- Auction Analytics Snapshot (APPEND-ONLY)
CREATE TABLE "AuctionAnalyticsSnapshot" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "totalBidsCount" INTEGER NOT NULL,
  "uniqueBiddersCount" INTEGER NOT NULL,
  "bidVelocity" DECIMAL(10, 4) NOT NULL,
  "priceProgression" JSONB NOT NULL,
  "competitivenessScore" INTEGER NOT NULL,
  "reserveMet" BOOLEAN NOT NULL,
  "auctionDurationMinutes" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "AuctionAnalyticsSnapshot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Bidder Trust Snapshot (APPEND-ONLY)
CREATE TABLE "BidderTrustSnapshot" (
  "id" SERIAL PRIMARY KEY,
  "bidderId" INTEGER NOT NULL,
  "participationCount" INTEGER NOT NULL,
  "winCount" INTEGER NOT NULL,
  "lossCount" INTEGER NOT NULL,
  "winLossRatio" DECIMAL(10, 4) NOT NULL,
  "bidRetractionRate" DECIMAL(10, 2) NOT NULL,
  "invalidatedBidsCount" INTEGER NOT NULL,
  "paymentCompletionRate" DECIMAL(10, 2) NOT NULL,
  "disputeInvolvementRate" DECIMAL(10, 2) NOT NULL,
  "trustTier" "TrustTier" NOT NULL,
  "confidenceScore" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seller Trust Snapshot (APPEND-ONLY)
CREATE TABLE "SellerTrustSnapshot" (
  "id" SERIAL PRIMARY KEY,
  "sellerId" INTEGER NOT NULL,
  "auctionsCompleted" INTEGER NOT NULL,
  "successfulSettlementsPercent" DECIMAL(10, 2) NOT NULL,
  "autoRelistFrequency" DECIMAL(10, 2) NOT NULL,
  "disputeRate" DECIMAL(10, 2) NOT NULL,
  "avgTimeToPaymentCompletionMinutes" INTEGER NOT NULL,
  "reliabilityScore" INTEGER NOT NULL,
  "badgeEligibility" "SellerBadge" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX "AuctionAnalyticsSnapshot_auctionId_idx" ON "AuctionAnalyticsSnapshot"("auctionId");
CREATE INDEX "AuctionAnalyticsSnapshot_createdAt_idx" ON "AuctionAnalyticsSnapshot"("createdAt");

CREATE INDEX "BidderTrustSnapshot_bidderId_idx" ON "BidderTrustSnapshot"("bidderId");
CREATE INDEX "BidderTrustSnapshot_trustTier_idx" ON "BidderTrustSnapshot"("trustTier");
CREATE INDEX "BidderTrustSnapshot_createdAt_idx" ON "BidderTrustSnapshot"("createdAt");

CREATE INDEX "SellerTrustSnapshot_sellerId_idx" ON "SellerTrustSnapshot"("sellerId");
CREATE INDEX "SellerTrustSnapshot_badgeEligibility_idx" ON "SellerTrustSnapshot"("badgeEligibility");
CREATE INDEX "SellerTrustSnapshot_createdAt_idx" ON "SellerTrustSnapshot"("createdAt");
