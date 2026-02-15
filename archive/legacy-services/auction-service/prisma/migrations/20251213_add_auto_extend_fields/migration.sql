-- Add auto-extend configuration fields to Listing table
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "auctionStartsAt" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "autoExtendEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "autoExtendThresholdMs" INTEGER NOT NULL DEFAULT 120000;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "autoExtendDurationMs" INTEGER NOT NULL DEFAULT 120000;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "maxExtensions" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "extensionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "originalEndTime" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "minBidIncrement" DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "winnerId" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "finalPrice" DECIMAL(10,2);

-- Add index on auctionEndsAt for efficient expired auction queries
CREATE INDEX IF NOT EXISTS "Listing_auctionEndsAt_idx" ON "Listing"("auctionEndsAt");

-- Add triggeredExtension field to Bid table
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "triggeredExtension" BOOLEAN NOT NULL DEFAULT false;

-- Create BidStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "BidStatus" AS ENUM ('ACTIVE', 'OUTBID', 'WINNING', 'WON', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status field to Bid table
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "status" "BidStatus" NOT NULL DEFAULT 'ACTIVE';

-- Create index on Bid status
CREATE INDEX IF NOT EXISTS "Bid_status_idx" ON "Bid"("status");

-- Update ListingStatus enum to include SCHEDULED and CANCELLED
DO $$ BEGIN
    ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
    ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ProxyBid table for automatic bidding
CREATE TABLE IF NOT EXISTS "ProxyBid" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "bidderId" INTEGER NOT NULL,
    "maxAmount" DECIMAL(10,2) NOT NULL,
    "currentBid" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProxyBid_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on ProxyBid (one proxy bid per user per auction)
CREATE UNIQUE INDEX IF NOT EXISTS "ProxyBid_listingId_bidderId_key" ON "ProxyBid"("listingId", "bidderId");

-- Create indexes on ProxyBid
CREATE INDEX IF NOT EXISTS "ProxyBid_listingId_idx" ON "ProxyBid"("listingId");
CREATE INDEX IF NOT EXISTS "ProxyBid_bidderId_idx" ON "ProxyBid"("bidderId");
CREATE INDEX IF NOT EXISTS "ProxyBid_isActive_idx" ON "ProxyBid"("isActive");

-- Add foreign keys for ProxyBid
ALTER TABLE "ProxyBid" ADD CONSTRAINT "ProxyBid_listingId_fkey" 
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProxyBid" ADD CONSTRAINT "ProxyBid_bidderId_fkey" 
    FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create AuctionExtension table for tracking extensions
CREATE TABLE IF NOT EXISTS "AuctionExtension" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "previousEndTime" TIMESTAMP(3) NOT NULL,
    "newEndTime" TIMESTAMP(3) NOT NULL,
    "extensionMs" INTEGER NOT NULL,
    "triggeredByBidId" INTEGER,
    "extensionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionExtension_pkey" PRIMARY KEY ("id")
);

-- Create indexes on AuctionExtension
CREATE INDEX IF NOT EXISTS "AuctionExtension_listingId_idx" ON "AuctionExtension"("listingId");
CREATE INDEX IF NOT EXISTS "AuctionExtension_createdAt_idx" ON "AuctionExtension"("createdAt");

-- Add foreign key for AuctionExtension
ALTER TABLE "AuctionExtension" ADD CONSTRAINT "AuctionExtension_listingId_fkey" 
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update existing auctions to have originalEndTime set
UPDATE "Listing" 
SET "originalEndTime" = "auctionEndsAt" 
WHERE "isAuction" = true AND "originalEndTime" IS NULL AND "auctionEndsAt" IS NOT NULL;
