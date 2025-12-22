-- Migration: Add AuctionBids Table
-- Description: Enhanced bid history schema with validation triggers
-- Requirements: 5.2, 5.3 - Auction bidding functionality and proxy bids

-- CreateEnum: BidStatus
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'OUTBID', 'WINNING', 'WON', 'CANCELLED');

-- CreateEnum: BidType
CREATE TYPE "BidType" AS ENUM ('MANUAL', 'PROXY', 'AUTO_INCREMENT', 'BUY_NOW');

-- CreateTable: AuctionBids
-- Enhanced bid history with full audit trail
CREATE TABLE "AuctionBids" (
    "id" SERIAL NOT NULL,
    "auctionId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "bidderId" INTEGER NOT NULL,
    
    -- Bid amounts
    "bidAmount" DECIMAL(10,2) NOT NULL,
    "maxBidAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    
    -- Bid type and status
    "bidType" "BidType" NOT NULL DEFAULT 'MANUAL',
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Proxy bid settings
    "isProxyBid" BOOLEAN NOT NULL DEFAULT false,
    "proxyIncrement" DECIMAL(10,2),
    "proxyActive" BOOLEAN DEFAULT false,
    
    -- Previous bid reference (for bid history chain)
    "previousBidId" INTEGER,
    "outbidBy" INTEGER,
    
    -- Validation metadata
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validationMessage" TEXT,
    
    -- Client info for fraud detection
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    
    -- Timestamps
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "outbidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionBids_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuctionBidHistory
-- Immutable audit log of all bid state changes
CREATE TABLE "AuctionBidHistory" (
    "id" SERIAL NOT NULL,
    "bidId" INTEGER NOT NULL,
    "auctionId" INTEGER NOT NULL,
    
    -- State change
    "previousStatus" "BidStatus",
    "newStatus" "BidStatus" NOT NULL,
    "previousAmount" DECIMAL(10,2),
    "newAmount" DECIMAL(10,2),
    
    -- Change context
    "changeReason" TEXT,
    "changedBy" INTEGER,
    "isSystemChange" BOOLEAN NOT NULL DEFAULT false,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBidHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProxyBidConfig
-- Stores proxy bid configurations for users
CREATE TABLE "ProxyBidConfig" (
    "id" SERIAL NOT NULL,
    "auctionId" INTEGER NOT NULL,
    "bidderId" INTEGER NOT NULL,
    
    -- Proxy settings
    "maxAmount" DECIMAL(10,2) NOT NULL,
    "incrementAmount" DECIMAL(10,2) NOT NULL,
    "currentBidId" INTEGER,
    
    -- Status
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "exhausted" BOOLEAN NOT NULL DEFAULT false,
    "exhaustedAt" TIMESTAMP(3),
    
    -- Notifications
    "notifyOnOutbid" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnWin" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnExhausted" BOOLEAN NOT NULL DEFAULT true,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProxyBidConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AuctionBids
CREATE INDEX "AuctionBids_auctionId_idx" ON "AuctionBids"("auctionId");
CREATE INDEX "AuctionBids_listingId_idx" ON "AuctionBids"("listingId");
CREATE INDEX "AuctionBids_bidderId_idx" ON "AuctionBids"("bidderId");
CREATE INDEX "AuctionBids_status_idx" ON "AuctionBids"("status");
CREATE INDEX "AuctionBids_bidType_idx" ON "AuctionBids"("bidType");
CREATE INDEX "AuctionBids_placedAt_idx" ON "AuctionBids"("placedAt");
CREATE INDEX "AuctionBids_bidAmount_idx" ON "AuctionBids"("bidAmount" DESC);
CREATE INDEX "AuctionBids_auctionId_status_idx" ON "AuctionBids"("auctionId", "status");
CREATE INDEX "AuctionBids_auctionId_bidAmount_idx" ON "AuctionBids"("auctionId", "bidAmount" DESC);

-- CreateIndex: AuctionBidHistory
CREATE INDEX "AuctionBidHistory_bidId_idx" ON "AuctionBidHistory"("bidId");
CREATE INDEX "AuctionBidHistory_auctionId_idx" ON "AuctionBidHistory"("auctionId");
CREATE INDEX "AuctionBidHistory_createdAt_idx" ON "AuctionBidHistory"("createdAt");

-- CreateIndex: ProxyBidConfig
CREATE UNIQUE INDEX "ProxyBidConfig_auctionId_bidderId_key" ON "ProxyBidConfig"("auctionId", "bidderId");
CREATE INDEX "ProxyBidConfig_auctionId_idx" ON "ProxyBidConfig"("auctionId");
CREATE INDEX "ProxyBidConfig_bidderId_idx" ON "ProxyBidConfig"("bidderId");
CREATE INDEX "ProxyBidConfig_isActive_idx" ON "ProxyBidConfig"("isActive");

-- AddForeignKey: AuctionBids
ALTER TABLE "AuctionBids" ADD CONSTRAINT "AuctionBids_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuctionBids" ADD CONSTRAINT "AuctionBids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuctionBids" ADD CONSTRAINT "AuctionBids_previousBidId_fkey" FOREIGN KEY ("previousBidId") REFERENCES "AuctionBids"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuctionBids" ADD CONSTRAINT "AuctionBids_outbidBy_fkey" FOREIGN KEY ("outbidBy") REFERENCES "AuctionBids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: AuctionBidHistory
ALTER TABLE "AuctionBidHistory" ADD CONSTRAINT "AuctionBidHistory_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "AuctionBids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ProxyBidConfig
ALTER TABLE "ProxyBidConfig" ADD CONSTRAINT "ProxyBidConfig_listingId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProxyBidConfig" ADD CONSTRAINT "ProxyBidConfig_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProxyBidConfig" ADD CONSTRAINT "ProxyBidConfig_currentBidId_fkey" FOREIGN KEY ("currentBidId") REFERENCES "AuctionBids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add constraint: Bid amount must be positive
ALTER TABLE "AuctionBids" ADD CONSTRAINT "check_positive_bid_amount" 
    CHECK ("bidAmount" > 0);

-- Add constraint: Max bid must be >= bid amount for proxy bids
ALTER TABLE "AuctionBids" ADD CONSTRAINT "check_max_bid_amount" 
    CHECK ("maxBidAmount" IS NULL OR "maxBidAmount" >= "bidAmount");

-- Add constraint: Proxy increment must be positive
ALTER TABLE "ProxyBidConfig" ADD CONSTRAINT "check_positive_increment" 
    CHECK ("incrementAmount" > 0);

-- Add constraint: Max amount must be positive
ALTER TABLE "ProxyBidConfig" ADD CONSTRAINT "check_positive_max_amount" 
    CHECK ("maxAmount" > 0);

-- Create function to validate bid before insert
CREATE OR REPLACE FUNCTION validate_auction_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_listing RECORD;
    v_current_highest DECIMAL(10,2);
    v_min_increment DECIMAL(10,2);
BEGIN
    -- Get listing details
    SELECT * INTO v_listing FROM "Listing" WHERE "id" = NEW."listingId";
    
    -- Check if listing exists and is an auction
    IF v_listing IS NULL THEN
        NEW."isValid" := false;
        NEW."validationMessage" := 'Listing not found';
        NEW."status" := 'REJECTED';
        RETURN NEW;
    END IF;
    
    IF NOT v_listing."isAuction" THEN
        NEW."isValid" := false;
        NEW."validationMessage" := 'Listing is not an auction';
        NEW."status" := 'REJECTED';
        RETURN NEW;
    END IF;
    
    -- Check if auction has ended
    IF v_listing."auctionEndsAt" IS NOT NULL AND v_listing."auctionEndsAt" < CURRENT_TIMESTAMP THEN
        NEW."isValid" := false;
        NEW."validationMessage" := 'Auction has ended';
        NEW."status" := 'REJECTED';
        RETURN NEW;
    END IF;
    
    -- Check if auction is active
    IF v_listing."status" != 'ACTIVE' THEN
        NEW."isValid" := false;
        NEW."validationMessage" := 'Auction is not active';
        NEW."status" := 'REJECTED';
        RETURN NEW;
    END IF;
    
    -- Get current highest bid
    SELECT COALESCE(MAX("bidAmount"), v_listing."startingBid", v_listing."price") 
    INTO v_current_highest 
    FROM "AuctionBids" 
    WHERE "listingId" = NEW."listingId" AND "status" IN ('ACCEPTED', 'WINNING');
    
    -- Calculate minimum increment (default 1% or $1, whichever is higher)
    v_min_increment := GREATEST(v_current_highest * 0.01, 1.00);
    
    -- Check if bid meets minimum
    IF NEW."bidAmount" < v_current_highest + v_min_increment THEN
        NEW."isValid" := false;
        NEW."validationMessage" := 'Bid must be at least ' || (v_current_highest + v_min_increment)::TEXT;
        NEW."status" := 'REJECTED';
        RETURN NEW;
    END IF;
    
    -- Check if bidder is not the seller
    IF NEW."bidderId" = v_listing."sellerId" THEN
        NEW."isValid" := false;
        NEW."validationMessage" := 'Seller cannot bid on own auction';
        NEW."status" := 'REJECTED';
        RETURN NEW;
    END IF;
    
    -- Bid is valid
    NEW."isValid" := true;
    NEW."status" := 'ACCEPTED';
    NEW."processedAt" := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bid validation
CREATE TRIGGER trigger_validate_auction_bid
    BEFORE INSERT ON "AuctionBids"
    FOR EACH ROW
    EXECUTE FUNCTION validate_auction_bid();

-- Create function to update previous bids when new bid is accepted
CREATE OR REPLACE FUNCTION update_previous_bids()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."status" = 'ACCEPTED' AND NEW."isValid" = true THEN
        -- Mark all other accepted bids as outbid
        UPDATE "AuctionBids"
        SET "status" = 'OUTBID',
            "outbidAt" = CURRENT_TIMESTAMP,
            "outbidBy" = NEW."id",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "listingId" = NEW."listingId"
          AND "id" != NEW."id"
          AND "status" IN ('ACCEPTED', 'WINNING');
        
        -- Set new bid as winning
        NEW."status" := 'WINNING';
        
        -- Update listing current bid
        UPDATE "Listing"
        SET "currentBid" = NEW."bidAmount",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."listingId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating previous bids
CREATE TRIGGER trigger_update_previous_bids
    AFTER INSERT ON "AuctionBids"
    FOR EACH ROW
    WHEN (NEW."status" = 'ACCEPTED')
    EXECUTE FUNCTION update_previous_bids();

-- Create function to log bid history
CREATE OR REPLACE FUNCTION log_bid_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "AuctionBidHistory" ("bidId", "auctionId", "newStatus", "newAmount", "changeReason", "isSystemChange")
        VALUES (NEW."id", NEW."auctionId", NEW."status", NEW."bidAmount", 'Bid placed', false);
    ELSIF TG_OP = 'UPDATE' AND OLD."status" != NEW."status" THEN
        INSERT INTO "AuctionBidHistory" ("bidId", "auctionId", "previousStatus", "newStatus", "previousAmount", "newAmount", "changeReason", "isSystemChange")
        VALUES (NEW."id", NEW."auctionId", OLD."status", NEW."status", OLD."bidAmount", NEW."bidAmount", 'Status changed', true);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bid history logging
CREATE TRIGGER trigger_log_bid_history
    AFTER INSERT OR UPDATE ON "AuctionBids"
    FOR EACH ROW
    EXECUTE FUNCTION log_bid_history();

-- Create function to process proxy bids
CREATE OR REPLACE FUNCTION process_proxy_bids()
RETURNS TRIGGER AS $$
DECLARE
    v_proxy RECORD;
    v_new_bid_amount DECIMAL(10,2);
BEGIN
    -- Only process if a new winning bid was placed
    IF NEW."status" != 'WINNING' THEN
        RETURN NEW;
    END IF;
    
    -- Find active proxy bids for this auction (excluding the current bidder)
    FOR v_proxy IN 
        SELECT * FROM "ProxyBidConfig"
        WHERE "auctionId" = NEW."listingId"
          AND "bidderId" != NEW."bidderId"
          AND "isActive" = true
          AND "exhausted" = false
        ORDER BY "maxAmount" DESC
    LOOP
        -- Calculate next proxy bid amount
        v_new_bid_amount := NEW."bidAmount" + v_proxy."incrementAmount";
        
        -- Check if proxy can outbid
        IF v_new_bid_amount <= v_proxy."maxAmount" THEN
            -- Place proxy bid
            INSERT INTO "AuctionBids" (
                "auctionId", "listingId", "bidderId", "bidAmount", "maxBidAmount",
                "bidType", "isProxyBid", "proxyActive", "updatedAt"
            ) VALUES (
                NEW."auctionId", NEW."listingId", v_proxy."bidderId", v_new_bid_amount, v_proxy."maxAmount",
                'PROXY', true, true, CURRENT_TIMESTAMP
            );
            
            -- Update proxy config
            UPDATE "ProxyBidConfig"
            SET "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = v_proxy."id";
            
            EXIT; -- Only one proxy bid per trigger
        ELSE
            -- Mark proxy as exhausted
            UPDATE "ProxyBidConfig"
            SET "exhausted" = true,
                "exhaustedAt" = CURRENT_TIMESTAMP,
                "isActive" = false,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = v_proxy."id";
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for proxy bid processing
CREATE TRIGGER trigger_process_proxy_bids
    AFTER UPDATE ON "AuctionBids"
    FOR EACH ROW
    WHEN (NEW."status" = 'WINNING' AND OLD."status" != 'WINNING')
    EXECUTE FUNCTION process_proxy_bids();
