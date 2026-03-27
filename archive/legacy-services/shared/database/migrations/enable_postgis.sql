-- =====================================================
-- PostGIS Extension and Spatial Data Migration
-- MNBARA Platform - AI Hyper-Matching Support
-- =====================================================
-- Requirements: 12.1, 12.2 - Geo-spatial queries for matching

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- =====================================================
-- Add geometry columns to Listing table
-- =====================================================

-- Add geometry column for listing location
ALTER TABLE "Listing" 
ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Populate geometry from existing lat/lon data
UPDATE "Listing" 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- Create spatial index on listing location
CREATE INDEX IF NOT EXISTS idx_listing_location_gist 
ON "Listing" USING GIST (location);

-- =====================================================
-- Add geometry columns to TravelerLocation table
-- =====================================================

-- Add geometry column for traveler current location
ALTER TABLE "TravelerLocation" 
ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Populate geometry from existing lat/lon data
UPDATE "TravelerLocation" 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- Create spatial index on traveler location
CREATE INDEX IF NOT EXISTS idx_traveler_location_gist 
ON "TravelerLocation" USING GIST (location);

-- =====================================================
-- Add geometry columns to Trip table for route tracking
-- =====================================================

-- Add origin and destination geometry columns
ALTER TABLE "Trip" 
ADD COLUMN IF NOT EXISTS origin_location geometry(Point, 4326),
ADD COLUMN IF NOT EXISTS dest_location geometry(Point, 4326);

-- Create spatial indexes on trip locations
CREATE INDEX IF NOT EXISTS idx_trip_origin_gist 
ON "Trip" USING GIST (origin_location);

CREATE INDEX IF NOT EXISTS idx_trip_dest_gist 
ON "Trip" USING GIST (dest_location);

-- =====================================================
-- Add geometry columns to Order table
-- =====================================================

-- Add pickup and delivery geometry columns
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS pickup_location geometry(Point, 4326),
ADD COLUMN IF NOT EXISTS delivery_location geometry(Point, 4326);

-- Create spatial indexes on order locations
CREATE INDEX IF NOT EXISTS idx_order_pickup_gist 
ON "Order" USING GIST (pickup_location);

CREATE INDEX IF NOT EXISTS idx_order_delivery_gist 
ON "Order" USING GIST (delivery_location);

-- =====================================================
-- Create spatial helper functions
-- =====================================================

-- Function to find listings within radius (in kilometers)
CREATE OR REPLACE FUNCTION find_listings_within_radius(
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION
)
RETURNS TABLE (
    listing_id INTEGER,
    title VARCHAR,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        ST_Distance(
            l.location::geography,
            ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
        ) / 1000 AS distance_km
    FROM "Listing" l
    WHERE l.location IS NOT NULL
      AND l.status = 'ACTIVE'
      AND ST_DWithin(
          l.location::geography,
          ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
          radius_km * 1000
      )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to find travelers within radius
CREATE OR REPLACE FUNCTION find_travelers_within_radius(
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION
)
RETURNS TABLE (
    traveler_id INTEGER,
    distance_km DOUBLE PRECISION,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tl."travelerId",
        ST_Distance(
            tl.location::geography,
            ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
        ) / 1000 AS distance_km,
        tl."lastSeenAt"
    FROM "TravelerLocation" tl
    WHERE tl.location IS NOT NULL
      AND ST_DWithin(
          tl.location::geography,
          ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
          radius_km * 1000
      )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to find trips with origin near a point
CREATE OR REPLACE FUNCTION find_trips_near_origin(
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION
)
RETURNS TABLE (
    trip_id INTEGER,
    traveler_id INTEGER,
    origin_city VARCHAR,
    dest_city VARCHAR,
    departure_date TIMESTAMP WITH TIME ZONE,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t."travelerId",
        t."originCity",
        t."destCity",
        t."departureDate",
        ST_Distance(
            t.origin_location::geography,
            ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
        ) / 1000 AS distance_km
    FROM "Trip" t
    WHERE t.origin_location IS NOT NULL
      AND t.status = 'ACTIVE'
      AND t."departureDate" > NOW()
      AND ST_DWithin(
          t.origin_location::geography,
          ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
          radius_km * 1000
      )
    ORDER BY distance_km, t."departureDate";
END;
$$ LANGUAGE plpgsql;

-- Function to match orders with nearby trips
CREATE OR REPLACE FUNCTION match_orders_with_trips(
    order_id INTEGER,
    max_pickup_radius_km DOUBLE PRECISION DEFAULT 50,
    max_delivery_radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
    trip_id INTEGER,
    traveler_id INTEGER,
    pickup_distance_km DOUBLE PRECISION,
    delivery_distance_km DOUBLE PRECISION,
    total_distance_km DOUBLE PRECISION,
    departure_date TIMESTAMP WITH TIME ZONE,
    arrival_date TIMESTAMP WITH TIME ZONE,
    price_per_kg DECIMAL,
    available_weight DECIMAL
) AS $$
DECLARE
    order_pickup geometry;
    order_delivery geometry;
BEGIN
    -- Get order locations
    SELECT o.pickup_location, o.delivery_location 
    INTO order_pickup, order_delivery
    FROM "Order" o 
    WHERE o.id = order_id;
    
    IF order_pickup IS NULL OR order_delivery IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id AS trip_id,
        t."travelerId" AS traveler_id,
        ST_Distance(t.origin_location::geography, order_pickup::geography) / 1000 AS pickup_distance_km,
        ST_Distance(t.dest_location::geography, order_delivery::geography) / 1000 AS delivery_distance_km,
        (ST_Distance(t.origin_location::geography, order_pickup::geography) + 
         ST_Distance(t.dest_location::geography, order_delivery::geography)) / 1000 AS total_distance_km,
        t."departureDate",
        t."arrivalDate",
        t."pricePerKg",
        t."availableWeight"
    FROM "Trip" t
    WHERE t.status = 'ACTIVE'
      AND t."departureDate" > NOW()
      AND t.origin_location IS NOT NULL
      AND t.dest_location IS NOT NULL
      AND ST_DWithin(
          t.origin_location::geography,
          order_pickup::geography,
          max_pickup_radius_km * 1000
      )
      AND ST_DWithin(
          t.dest_location::geography,
          order_delivery::geography,
          max_delivery_radius_km * 1000
      )
    ORDER BY total_distance_km, t."departureDate";
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create trigger to auto-update geometry on lat/lon change
-- =====================================================

-- Trigger function for Listing
CREATE OR REPLACE FUNCTION update_listing_geometry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Listing
DROP TRIGGER IF EXISTS trg_listing_geometry ON "Listing";
CREATE TRIGGER trg_listing_geometry
    BEFORE INSERT OR UPDATE OF latitude, longitude ON "Listing"
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_geometry();

-- Trigger function for TravelerLocation
CREATE OR REPLACE FUNCTION update_traveler_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for TravelerLocation
DROP TRIGGER IF EXISTS trg_traveler_location_geometry ON "TravelerLocation";
CREATE TRIGGER trg_traveler_location_geometry
    BEFORE INSERT OR UPDATE OF latitude, longitude ON "TravelerLocation"
    FOR EACH ROW
    EXECUTE FUNCTION update_traveler_location_geometry();

-- =====================================================
-- Verification queries (run to verify installation)
-- =====================================================

-- Check PostGIS version
-- SELECT PostGIS_Version();

-- Check spatial indexes exist
-- SELECT indexname FROM pg_indexes WHERE indexname LIKE '%gist%';

-- Test find_listings_within_radius function
-- SELECT * FROM find_listings_within_radius(25.1972, 55.2744, 10);

COMMENT ON FUNCTION find_listings_within_radius IS 'Find active listings within specified radius (km) from a point';
COMMENT ON FUNCTION find_travelers_within_radius IS 'Find travelers within specified radius (km) from a point';
COMMENT ON FUNCTION find_trips_near_origin IS 'Find active trips with origin near specified point';
COMMENT ON FUNCTION match_orders_with_trips IS 'Match an order with compatible trips based on pickup/delivery proximity';
