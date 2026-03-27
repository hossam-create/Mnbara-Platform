-- Migration: Add Country of Origin Layer (COOL) fields to existing tables
-- Description: Adds country tracking fields to Product, Trip, and MatchCandidate tables

-- Add country fields to Product table (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'origin_country'
    ) THEN
        ALTER TABLE products ADD COLUMN origin_country VARCHAR(2);
        ALTER TABLE products ADD COLUMN purchase_country VARCHAR(2);
        ALTER TABLE products ADD COLUMN delivery_country VARCHAR(2);
        
        -- Add indexes for country fields
        CREATE INDEX IF NOT EXISTS idx_products_origin_country ON products(origin_country);
        CREATE INDEX IF NOT EXISTS idx_products_purchase_country ON products(purchase_country);
        CREATE INDEX IF NOT EXISTS idx_products_delivery_country ON products(delivery_country);
    END IF;
END $$;

-- Add country fields to Trip table (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trips' AND column_name = 'origin_country'
    ) THEN
        ALTER TABLE trips ADD COLUMN origin_country VARCHAR(2);
        ALTER TABLE trips ADD COLUMN destination_country VARCHAR(2);
        ALTER TABLE trips ADD COLUMN origin_city VARCHAR(100);
        ALTER TABLE trips ADD COLUMN destination_city VARCHAR(100);
        ALTER TABLE trips ADD COLUMN origin_airport VARCHAR(3);
        ALTER TABLE trips ADD COLUMN destination_airport VARCHAR(3);
        ALTER TABLE trips ADD COLUMN current_country VARCHAR(2);
        
        -- Add indexes for country fields
        CREATE INDEX IF NOT EXISTS idx_trips_origin_country ON trips(origin_country);
        CREATE INDEX IF NOT EXISTS idx_trips_destination_country ON trips(destination_country);
    END IF;
END $$;

-- Add country fields to MatchCandidate table (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'match_candidates' AND column_name = 'product_origin_country'
    ) THEN
        ALTER TABLE match_candidates ADD COLUMN product_origin_country VARCHAR(2);
        ALTER TABLE match_candidates ADD COLUMN product_purchase_country VARCHAR(2);
        ALTER TABLE match_candidates ADD COLUMN product_delivery_country VARCHAR(2);
        ALTER TABLE match_candidates ADD COLUMN trip_origin_country VARCHAR(2);
        ALTER TABLE match_candidates ADD COLUMN trip_destination_country VARCHAR(2);
        ALTER TABLE match_candidates ADD COLUMN country_match_valid BOOLEAN DEFAULT false;
        
        -- Add indexes for country fields
        CREATE INDEX IF NOT EXISTS idx_match_candidates_product_origin ON match_candidates(product_origin_country);
        CREATE INDEX IF NOT EXISTS idx_match_candidates_trip_destination ON match_candidates(trip_destination_country);
        CREATE INDEX IF NOT EXISTS idx_match_candidates_country_valid ON match_candidates(country_match_valid);
    END IF;
END $$;

-- Add country validation function
CREATE OR REPLACE FUNCTION validate_country_code(country_code VARCHAR(2))
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate ISO 3166-1 alpha-2 country code (2 uppercase letters)
    RETURN country_code ~ '^[A-Z]{2}$';
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the migration
COMMENT ON SCHEMA public IS 'Enhanced with Country of Origin Layer (COOL) for international marketplace support';
