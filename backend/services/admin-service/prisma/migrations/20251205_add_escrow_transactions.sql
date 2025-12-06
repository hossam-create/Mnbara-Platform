-- Migration: Add escrow_transactions table
-- Created: 2025-12-05
-- Purpose: Store blockchain escrow transaction records

CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 2) NOT NULL,
    commission DECIMAL(18, 2) DEFAULT 0,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number INTEGER,
    escrow_address VARCHAR(42),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status: 'pending', 'locked', 'released', 'refunded', 'disputed', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    dispute_reason TEXT,
    resolution_notes TEXT,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'locked', 'released', 'refunded', 'disputed', 'expired')),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Indexes for performance
CREATE INDEX idx_escrow_listing_id ON escrow_transactions(listing_id);
CREATE INDEX idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_transactions(seller_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_transaction_hash ON escrow_transactions(transaction_hash);
CREATE INDEX idx_escrow_created_at ON escrow_transactions(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_escrow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER escrow_update_timestamp
BEFORE UPDATE ON escrow_transactions
FOR EACH ROW
EXECUTE FUNCTION update_escrow_timestamp();

-- Add wallet addresses to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42) UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMP;

-- Add seller/buyer wallet addresses to auction_listings if not exists
ALTER TABLE auction_listings
ADD COLUMN IF NOT EXISTS seller_wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS buyer_wallet_address VARCHAR(42);

-- Add bidder wallet address to bids table if not exists
ALTER TABLE bids
ADD COLUMN IF NOT EXISTS bidder_wallet_address VARCHAR(42);

-- Comments for documentation
COMMENT ON TABLE escrow_transactions IS 'Blockchain escrow transaction records for auction payments';
COMMENT ON COLUMN escrow_transactions.transaction_hash IS 'Ethereum/Polygon transaction hash';
COMMENT ON COLUMN escrow_transactions.escrow_address IS 'Smart contract escrow address';
COMMENT ON COLUMN escrow_transactions.status IS 'Current status of the escrow';
