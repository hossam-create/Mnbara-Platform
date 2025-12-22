-- Mnbara Platform - Comprehensive Database Schema
-- This file contains all tables needed for the complete platform

-- Enable PostGIS extension for geo-spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- CORE TABLES (Already exist in most services)
-- ============================================

-- Users table (extended)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'buyer', -- buyer, traveler, seller, admin
    kyc_status BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallet Ledger - Complete audit trail of all wallet balance changes
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount DECIMAL(12,2) NOT NULL,              -- Positive for credit, negative for debit
    currency VARCHAR(3) DEFAULT 'USD',
    type VARCHAR(30) NOT NULL,                  -- DEPOSIT, WITHDRAWAL, PAYMENT, REFUND, ESCROW_HOLD, etc.
    
    -- Balance tracking
    balance_before DECIMAL(12,2) NOT NULL,      -- Balance before this transaction
    balance_after DECIMAL(12,2) NOT NULL,       -- Balance after this transaction
    
    -- Reference to related entities
    transaction_id INTEGER,                     -- Link to transactions table
    order_id INTEGER,                           -- Link to orders table
    escrow_id INTEGER,                          -- Link to escrow table
    
    -- Description and metadata
    description TEXT,
    metadata JSONB,                             -- Additional structured data
    
    -- Audit trail
    performed_by INTEGER,                       -- User ID who initiated (null for system actions)
    ip_address VARCHAR(45),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_ledger_wallet ON wallet_ledger(wallet_id);
CREATE INDEX idx_wallet_ledger_type ON wallet_ledger(type);
CREATE INDEX idx_wallet_ledger_transaction ON wallet_ledger(transaction_id);
CREATE INDEX idx_wallet_ledger_order ON wallet_ledger(order_id);
CREATE INDEX idx_wallet_ledger_created ON wallet_ledger(created_at);

-- ============================================
-- REWARDS SYSTEM
-- ============================================

-- Rewards accounts
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    redeemed_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reward transactions
CREATE TABLE IF NOT EXISTS reward_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- EARNED, REDEEMED
    action VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reward_trans_user ON reward_transactions(user_id);
CREATE INDEX idx_reward_trans_type ON reward_transactions(type);

-- ============================================
-- TRAVELER LOCATION & TRIPS
-- ============================================

-- Traveler locations (real-time)
CREATE TABLE IF NOT EXISTS traveler_locations (
    id SERIAL PRIMARY KEY,
    traveler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326), -- PostGIS point
    country VARCHAR(100),
    city VARCHAR(100),
    airport_code VARCHAR(10),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(traveler_id)
);

CREATE INDEX idx_traveler_location_geo ON traveler_locations USING GIST(location);

-- Trips (Traveler's planned journeys)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    traveler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_country VARCHAR(100) NOT NULL,
    origin_city VARCHAR(100),
    destination_country VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100),
    departure_date DATE NOT NULL,
    arrival_date DATE,
    max_weight DECIMAL(8,2), -- kg
    max_volume DECIMAL(8,2), -- liters
    allowed_categories TEXT[], -- ['electronics', 'clothing']
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_traveler ON trips(traveler_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(departure_date, arrival_date);

-- ============================================
-- PRODUCTS & LISTINGS
-- ============================================

-- Products/Listings (extended for auctions)
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(12,2),
    listing_type VARCHAR(20) DEFAULT 'buy_now', -- buy_now, auction, make_offer
    -- Auction specific
    is_auction BOOLEAN DEFAULT FALSE,
    starting_bid DECIMAL(12,2),
    current_bid DECIMAL(12,2),
    auction_ends_at TIMESTAMP,
    -- Location
    origin_country VARCHAR(100),
    location_hint TEXT,
    location GEOGRAPHY(POINT, 4326),
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SOLD, CANCELLED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_type ON listings(listing_type);
CREATE INDEX idx_listings_auction ON listings(is_auction) WHERE is_auction = TRUE;
CREATE INDEX idx_listings_location ON listings USING GIST(location) WHERE location IS NOT NULL;

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bids_listing ON bids(listing_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_amount ON bids(amount DESC);

-- ============================================
-- ORDERS & SHIPMENTS
-- ============================================

--Orders/Buyer Requests
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    traveler_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    -- Product details
    product_name VARCHAR(255) NOT NULL,
    product_url TEXT,
    product_type VARCHAR(100),
    weight DECIMAL(8,2),
    -- Pricing
    product_price DECIMAL(12,2),
    delivery_fee DECIMAL(12,2),
    platform_fee DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    -- Location
    pickup_country VARCHAR(100),
    pickup_location TEXT,
    delivery_country VARCHAR(100),
    delivery_location TEXT,
    -- Status tracking
    status VARCHAR(20) DEFAULT 'REQUESTED', 
    -- REQUESTED, MATCHED, PURCHASED, IN_TRANSIT, ARRIVED, DELIVERED, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_traveler ON orders(traveler_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Shipment tracking events
CREATE TABLE IF NOT EXISTS tracking_events (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_order ON tracking_events(order_id);
CREATE INDEX idx_tracking_status ON tracking_events(status);

-- ============================================
-- TRANSACTIONS & ESCROW
-- ============================================

-- Transactions table (extended)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(30) NOT NULL, -- DEPOSIT, WITHDRAWAL, ESCROW_HOLD, ESCROW_RELEASE, ESCROW_REFUND, PAYMENT
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, HELD, REFUNDED
    description TEXT,
    stripe_id VARCHAR(255),
    paypal_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================
-- COMMUNICATION
-- ============================================

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_order ON chat_messages(order_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- ORDER_UPDATE, BID_PLACED, DELIVERY_STATUS, REWARD_EARNED
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(order_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['users', 'wallets', 'rewards', 'trips', 'listings', 'orders']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$$;

COMMENT ON DATABASE mnbara_db IS 'Mnbara Platform - Crowdshipping & Marketplace';

-- ============================================
-- CONSENT & KYC TABLES (GDPR Compliance)
-- ============================================

-- User Consents - GDPR compliant consent tracking
CREATE TABLE IF NOT EXISTS consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Consent types
    essential_data BOOLEAN DEFAULT TRUE,           -- Required - core platform functionality
    analytics_consent BOOLEAN DEFAULT FALSE,       -- Anonymous usage data & crash reports
    personalization_consent BOOLEAN DEFAULT FALSE, -- Personalized recommendations
    marketing_consent BOOLEAN DEFAULT FALSE,       -- Promotional emails & offers
    
    -- Terms acceptance
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_version VARCHAR(50),                     -- Version of terms accepted
    terms_accepted_at TIMESTAMP,
    
    privacy_policy_accepted BOOLEAN DEFAULT FALSE,
    privacy_policy_version VARCHAR(50),            -- Version of privacy policy accepted
    privacy_policy_accepted_at TIMESTAMP,
    
    -- Consent metadata
    ip_address VARCHAR(45),                        -- IP at time of consent (IPv6 compatible)
    user_agent TEXT,                               -- Browser/device info
    consent_source VARCHAR(20) DEFAULT 'WEB',      -- WEB, MOBILE_IOS, MOBILE_ANDROID, API
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_consents_user ON consents(user_id);
CREATE INDEX idx_consents_marketing ON consents(marketing_consent);

-- Consent History - Audit trail for consent changes
CREATE TABLE IF NOT EXISTS consent_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What changed
    consent_type VARCHAR(50) NOT NULL,             -- e.g., 'marketing_consent', 'analytics_consent'
    previous_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    source VARCHAR(20) DEFAULT 'WEB',
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consent_history_user ON consent_history(user_id);
CREATE INDEX idx_consent_history_type ON consent_history(consent_type);
CREATE INDEX idx_consent_history_created ON consent_history(created_at);

-- KYC Uploads - Document storage for identity verification
CREATE TABLE IF NOT EXISTS kyc_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document details
    document_type VARCHAR(30) NOT NULL,            -- PASSPORT, NATIONAL_ID, DRIVERS_LICENSE, etc.
    document_number VARCHAR(255),                  -- Encrypted document number
    document_country VARCHAR(3),                   -- Issuing country (ISO code)
    
    -- File storage
    file_url TEXT NOT NULL,                        -- MinIO/S3 URL (encrypted path)
    file_name VARCHAR(255) NOT NULL,               -- Original filename
    file_size INTEGER NOT NULL,                    -- Size in bytes
    mime_type VARCHAR(100) NOT NULL,               -- e.g., 'image/jpeg', 'application/pdf'
    file_hash VARCHAR(64),                         -- SHA-256 hash for integrity
    
    -- Document validity
    issued_date DATE,
    expiry_date DATE,
    
    -- Verification
    status VARCHAR(30) DEFAULT 'PENDING',          -- PENDING, IN_REVIEW, APPROVED, REJECTED, EXPIRED
    verified_at TIMESTAMP,
    verified_by INTEGER,                           -- Admin user ID who verified
    
    -- Rejection details
    rejection_reason VARCHAR(255),
    rejection_notes TEXT,
    
    -- Metadata
    upload_ip_address VARCHAR(45),
    upload_user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kyc_uploads_user ON kyc_uploads(user_id);
CREATE INDEX idx_kyc_uploads_type ON kyc_uploads(document_type);
CREATE INDEX idx_kyc_uploads_status ON kyc_uploads(status);
CREATE INDEX idx_kyc_uploads_expiry ON kyc_uploads(expiry_date);

-- KYC Verification - Overall KYC application status
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Verification level
    level VARCHAR(20) DEFAULT 'BASIC',             -- NONE, BASIC, STANDARD, ENHANCED
    
    -- Overall status
    status VARCHAR(30) DEFAULT 'PENDING',          -- PENDING, IN_REVIEW, APPROVED, REJECTED
    
    -- Personal info (encrypted)
    full_legal_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(3),                        -- ISO country code
    address TEXT,
    
    -- Review details
    reviewed_by INTEGER,                           -- Admin user ID
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kyc_verifications_user ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_verifications_level ON kyc_verifications(level);

-- Apply updated_at trigger to new tables
DO $
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['consents', 'kyc_uploads', 'kyc_verifications']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$;

