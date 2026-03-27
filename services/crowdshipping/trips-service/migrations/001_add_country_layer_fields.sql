-- Migration to add Country of Origin Layer (COOL) fields to Trips service
-- This migration enhances the trips service with country-specific routing and tracking

-- Add new columns to Trip table
ALTER TABLE "trips" 
ADD COLUMN IF NOT EXISTS "origin_country" VARCHAR(2) NOT NULL,
ADD COLUMN IF NOT EXISTS "destination_country" VARCHAR(2) NOT NULL,
ADD COLUMN IF NOT EXISTS "origin_city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "destination_city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "origin_airport" VARCHAR(3),
ADD COLUMN IF NOT EXISTS "destination_airport" VARCHAR(3),
ADD COLUMN IF NOT EXISTS "current_country" VARCHAR(2);

-- Add new columns to Stopover table
ALTER TABLE "stopovers" 
ADD COLUMN IF NOT EXISTS "country" VARCHAR(2) NOT NULL,
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "airport" VARCHAR(3);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_trips_origin_country" ON "trips"("origin_country");
CREATE INDEX IF NOT EXISTS "idx_trips_destination_country" ON "trips"("destination_country");
CREATE INDEX IF NOT EXISTS "idx_trips_countries_composite" ON "trips"("origin_country", "destination_country");
CREATE INDEX IF NOT EXISTS "idx_trips_current_country" ON "trips"("current_country");
CREATE INDEX IF NOT EXISTS "idx_stopovers_country" ON "stopovers"("country");

-- Add check constraints to ensure valid ISO country codes
ALTER TABLE "trips" 
ADD CONSTRAINT "chk_trips_origin_country_format" CHECK (LENGTH("origin_country") = 2),
ADD CONSTRAINT "chk_trips_destination_country_format" CHECK (LENGTH("destination_country") = 2),
ADD CONSTRAINT "chk_trips_current_country_format" CHECK ("current_country" IS NULL OR LENGTH("current_country") = 2);

ALTER TABLE "stopovers" 
ADD CONSTRAINT "chk_stopovers_country_format" CHECK (LENGTH("country") = 2),
ADD CONSTRAINT "chk_stopovers_airport_format" CHECK ("airport" IS NULL OR LENGTH("airport") = 3);

-- Add comment documentation for the new fields
COMMENT ON COLUMN "trips"."origin_country" IS 'ISO 3166-1 alpha-2 country code for trip origin';
COMMENT ON COLUMN "trips"."destination_country" IS 'ISO 3166-1 alpha-2 country code for trip destination';
COMMENT ON COLUMN "trips"."origin_city" IS 'City name for trip origin';
COMMENT ON COLUMN "trips"."destination_city" IS 'City name for trip destination';
COMMENT ON COLUMN "trips"."origin_airport" IS 'IATA airport code for trip origin';
COMMENT ON COLUMN "trips"."destination_airport" IS 'IATA airport code for trip destination';
COMMENT ON COLUMN "trips"."current_country" IS 'Current country location of traveler';
COMMENT ON COLUMN "stopovers"."country" IS 'ISO 3166-1 alpha-2 country code for stopover location';
COMMENT ON COLUMN "stopovers"."city" IS 'City name for stopover location';
COMMENT ON COLUMN "stopovers"."airport" IS 'IATA airport code for stopover location';

-- Create a function to get country-based trip statistics
CREATE OR REPLACE FUNCTION get_country_trip_stats(country_code VARCHAR(2))
RETURNS TABLE (
  total_trips BIGINT,
  completed_trips BIGINT,
  active_trips BIGINT,
  avg_capacity_utilization NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_trips,
    COUNT(*) FILTER (WHERE status = 'COMPLETED')::BIGINT as completed_trips,
    COUNT(*) FILTER (WHERE status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT'))::BIGINT as active_trips,
    AVG(used_capacity / NULLIF(total_capacity, 0))::NUMERIC as avg_capacity_utilization
  FROM trips
  WHERE origin_country = country_code OR destination_country = country_code;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find matching trips between countries
CREATE OR REPLACE FUNCTION find_matching_trips(origin_country_param VARCHAR(2), destination_country_param VARCHAR(2))
RETURNS TABLE (
  trip_id VARCHAR,
  traveler_id VARCHAR,
  departure_date TIMESTAMP,
  arrival_date TIMESTAMP,
  remaining_capacity FLOAT,
  risk_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id::VARCHAR as trip_id,
    traveler_id::VARCHAR as traveler_id,
    departure_date as departure_date,
    arrival_date as arrival_date,
    remaining_capacity as remaining_capacity,
    0::INTEGER as risk_score -- This would be calculated based on country rules
  FROM trips
  WHERE origin_country = origin_country_param 
    AND destination_country = destination_country_param
    AND status IN ('SCHEDULED', 'BOARDING')
    AND remaining_capacity > 0
  ORDER BY departure_date ASC;
END;
$$ LANGUAGE plpgsql;