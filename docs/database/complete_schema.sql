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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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
