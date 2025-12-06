-- Phase 9A: Auction System Database Migration
-- Created: 2025-12-05

-- Auction Listings Table
CREATE TABLE IF NOT EXISTS auction_listings (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Pricing
  starting_price DECIMAL(10,2) NOT NULL,
  reserve_price DECIMAL(10,2), -- Minimum acceptable price
  buy_now_price DECIMAL(10,2), -- Instant purchase option
  current_price DECIMAL(10,2) DEFAULT 0,
  
  -- Listing Type
  listing_type VARCHAR(20) NOT NULL DEFAULT 'auction' CHECK (listing_type IN ('auction', 'buy_now', 'both')),
  
  -- Timing
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  winner_id INTEGER REFERENCES users(id),
  total_bids INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bid Details
  amount DECIMAL(10,2) NOT NULL,
  bid_time TIMESTAMP DEFAULT NOW(),
  
  -- Proxy Bidding (Auto-bid)
  is_auto_bid BOOLEAN DEFAULT FALSE,
  max_amount DECIMAL(10,2), -- Maximum willing to pay
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'outbid', 'winning', 'won', 'lost', 'cancelled')),
  
  UNIQUE(listing_id, bidder_id, bid_time)
);

-- Escrow Transactions Table (Smart Contract Integration)
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES auction_listings(id),
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Payment Details
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0, -- Platform fee
  
  -- Blockchain Data
  contract_address VARCHAR(42), -- Ethereum contract address (0x...)
  transaction_hash VARCHAR(66), -- Transaction hash
  block_number BIGINT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'released', 'refunded', 'failed')),
  
  -- Timestamps
  locked_at TIMESTAMP,
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_auction_listings_seller ON auction_listings(seller_id);
CREATE INDEX idx_auction_listings_status ON auction_listings(status);
CREATE INDEX idx_auction_listings_end_time ON auction_listings(end_time);
CREATE INDEX idx_bids_listing ON bids(listing_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_escrow_listing ON escrow_transactions(listing_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auction_listings_updated_at BEFORE UPDATE ON auction_listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
