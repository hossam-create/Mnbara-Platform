-- Migration: Add Real-Time Auction Fields
-- Date: 2026-02-03
-- Description: Add idempotencyKey and isWinning fields to Bid model for real-time auction support

-- Add idempotencyKey to Bid table (unique constraint for duplicate prevention)
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- Add isWinning flag to Bid table (track current winning bid)
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "isWinning" BOOLEAN NOT NULL DEFAULT false;

-- Create unique index on idempotencyKey
CREATE UNIQUE INDEX IF NOT EXISTS "Bid_idempotencyKey_key" ON "Bid"("idempotencyKey");

-- Create index on isWinning for faster queries
CREATE INDEX IF NOT EXISTS "Bid_isWinning_idx" ON "Bid"("isWinning");

-- Add reason field to AuctionExtension if not exists
ALTER TABLE "AuctionExtension" ADD COLUMN IF NOT EXISTS "reason" TEXT;

-- Update existing AuctionExtension records to have extensionNumber
-- This ensures backward compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'AuctionExtension' AND column_name = 'extensionNumber'
  ) THEN
    ALTER TABLE "AuctionExtension" ADD COLUMN "extensionNumber" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Comment on new fields
COMMENT ON COLUMN "Bid"."idempotencyKey" IS 'Client-supplied key to prevent duplicate bids';
COMMENT ON COLUMN "Bid"."isWinning" IS 'Flag indicating if this is the current winning bid';
