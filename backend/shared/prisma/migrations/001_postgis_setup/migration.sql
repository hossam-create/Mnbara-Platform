-- Migration: PostGIS Setup and Performance Indexes
-- This migration enables PostGIS extensions and creates optimized indexes

-- ============================================
-- ENABLE POSTGIS EXTENSIONS
-- ============================================

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis_topology CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis_raster CASCADE;

-- Enable text search extensions
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm CASCADE;

-- Verify PostGIS installation
SELECT postgis_full_version();

-- ============================================
-- PERFORMANCE INDEXES - LISTINGS
-- ============================================

-- Index for active listings (partial index for better performance)
CREATE INDEX CONCURRENTLY idx_listing_status_active 
ON "Listing" (status) 
WHERE status = 'ACTIVE';

-- Index for active auctions
CREATE INDEX CONCURRENTLY idx_listing_auction_active 
ON "Listing" (auctionEndsAt) 
WHERE isAuction = true AND status = 'ACTIVE';

-- Index for seller listings
CREATE INDEX CONCURRENTLY idx_listing_seller 
ON "Listing" (sellerId, status);

-- Index for category filtering
CREATE INDEX CONCURRENTLY idx_listing_category 
ON "Listing" (categoryId, status);

-- Index for price range queries
CREATE INDEX CONCURRENTLY idx_listing_price 
ON "Listing" (price) 
WHERE status = 'ACTIVE';

-- Index for search on title (with trigram)
CREATE INDEX CONCURRENTLY idx_listing_title_trgm 
ON "Listing" USING gin (title gin_trgm_ops);

-- Index for search on description (with trigram)
CREATE INDEX CONCURRENTLY idx_listing_description_trgm 
ON "Listing" USING gin (description gin_trgm_ops);

-- Index for created date sorting
CREATE INDEX CONCURRENTLY idx_listing_created 
ON "Listing" (createdAt DESC) 
WHERE status = 'ACTIVE';

-- ============================================
-- PERFORMANCE INDEXES - BIDS
-- ============================================

-- Index for auction bid history
CREATE INDEX CONCURRENTLY idx_bid_listing 
ON "Bid" (listingId, createdAt DESC);

-- Index for user bid history
CREATE INDEX CONCURRENTLY idx_bid_bidder 
ON "Bid" (bidderId, createdAt DESC);

-- Index for winning bid identification
CREATE INDEX CONCURRENTLY idx_bid_winning 
ON "Bid" (listingId, isWinning) 
WHERE isWinning = true;

-- ============================================
-- PERFORMANCE INDEXES - ORDERS
-- ============================================

-- Index for user order history
CREATE INDEX CONCURRENTLY idx_order_user 
ON "Order" (userId, createdAt DESC);

-- Index for order status filtering
CREATE INDEX CONCURRENTLY idx_order_status 
ON "Order" (status, createdAt DESC);

-- Index for payment status filtering
CREATE INDEX CONCURRENTLY idx_order_payment 
ON "Order" (paymentStatus, createdAt DESC);

-- Index for order number lookup
CREATE INDEX CONCURRENTLY idx_order_number 
ON "Order" (orderNumber);

-- ============================================
-- PERFORMANCE INDEXES - TRANSACTIONS
-- ============================================

-- Index for wallet transactions
CREATE INDEX CONCURRENTLY idx_transaction_wallet 
ON "Transaction" (fromWalletId, createdAt DESC);

CREATE INDEX CONCURRENTLY idx_transaction_order 
ON "Transaction" (orderId, createdAt DESC);

-- Index for transaction status
CREATE INDEX CONCURRENTLY idx_transaction_status 
ON "Transaction" (status, createdAt DESC);

-- ============================================
-- PERFORMANCE INDEXES - NOTIFICATIONS
-- ============================================

-- Index for unread notifications
CREATE INDEX CONCURRENTLY idx_notification_unread 
ON "Notification" (userId, read) 
WHERE read = false;

-- Index for notification type filtering
CREATE INDEX CONCURRENTLY idx_notification_type 
ON "Notification" (userId, type);

-- ============================================
-- PERFORMANCE INDEXES - REVIEWS
-- ============================================

-- Index for listing ratings
CREATE INDEX CONCURRENTLY idx_review_listing 
ON "Review" (listingId, rating DESC);

-- Index for user reviews
CREATE INDEX CONCURRENTLY idx_review_user 
ON "Review" (userId, createdAt DESC);

-- Index for verified reviews
CREATE INDEX CONCURRENTLY idx_review_verified 
ON "Review" (isVerified, status) 
WHERE isVerified = true AND status = 'APPROVED';

-- ============================================
-- PERFORMANCE INDEXES - USERS
-- ============================================

-- Index for user lookup
CREATE INDEX CONCURRENTLY idx_user_email 
ON "User" (email);

-- Index for user status
CREATE INDEX CONCURRENTLY idx_user_status 
ON "User" (status, role);

-- Index for KYC status
CREATE INDEX CONCURRENTLY idx_user_kyc 
ON "User" (kycStatus) WHERE kycStatus = 'PENDING';

-- ============================================
-- POSTGIS SPATIAL INDEXES
-- ============================================

-- Spatial index for location-based queries
CREATE INDEX CONCURRENTLY idx_location_geography 
ON "PostGISPoint" USING gist (location);

-- Index for latitude/longitude (fallback for non-PostGIS systems)
CREATE INDEX CONCURRENTLY idx_location_coords 
ON "PostGISPoint" (latitude, longitude);

-- ============================================
-- FULL-TEXT SEARCH SETUP (Optional)
-- ============================================

-- Create tsvector column for full-text search
ALTER TABLE "Listing" ADD COLUMN search_vector tsvector;

-- Create GIN index for full-text search
CREATE INDEX CONCURRENTLY idx_listing_search_vector 
ON "Listing" USING gin (search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION listing_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.categoryId::text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on insert/update
DROP TRIGGER IF EXISTS trg_listing_search_vector ON "Listing";
CREATE TRIGGER trg_listing_search_vector
  BEFORE INSERT OR UPDATE OF title, description, categoryId
  ON "Listing"
  FOR EACH ROW
  EXECUTE FUNCTION listing_search_vector_update();

-- ============================================
-- CACHE TABLE FOR POPULAR QUERIES
-- ============================================

-- Create cache table for category counts
CREATE TABLE IF NOT EXISTS category_stats (
  category_id INT PRIMARY KEY,
  listing_count INT DEFAULT 0,
  avg_price DECIMAL(10, 2),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create cache table for popular listings
CREATE TABLE IF NOT EXISTS popular_listings (
  listing_id INT PRIMARY KEY,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  last_calculated TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ANALYZE TABLES (Update statistics)
-- ============================================

ANALYZE "Listing";
ANALYZE "Bid";
ANALYZE "Order";
ANALYZE "Transaction";
ANALYZE "Notification";
ANALYZE "Review";
ANALYZE "User";
ANALYZE "PostGISPoint";
