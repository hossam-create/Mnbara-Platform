-- Migration to add Country of Origin Layer (COOL) fields to Product table
-- This migration adds the three required country fields for tracking product origin, purchase, and delivery countries

-- Add new columns to Product table
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "origin_country" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "purchase_country" VARCHAR(2),
ADD COLUMN IF NOT EXISTS "delivery_country" VARCHAR(2);

-- Add indexes for better query performance on country fields
CREATE INDEX IF NOT EXISTS "idx_product_origin_country" ON "Product"("origin_country");
CREATE INDEX IF NOT EXISTS "idx_product_purchase_country" ON "Product"("purchase_country");
CREATE INDEX IF NOT EXISTS "idx_product_delivery_country" ON "Product"("delivery_country");

-- Create composite index for common country-based queries
CREATE INDEX IF NOT EXISTS "idx_product_countries_composite" ON "Product"("origin_country", "purchase_country", "delivery_country");

-- Add check constraints to ensure valid ISO country codes (2-letter format)
ALTER TABLE "Product" 
ADD CONSTRAINT "chk_origin_country_format" CHECK ("origin_country" IS NULL OR LENGTH("origin_country") = 2),
ADD CONSTRAINT "chk_purchase_country_format" CHECK ("purchase_country" IS NULL OR LENGTH("purchase_country") = 2),
ADD CONSTRAINT "chk_delivery_country_format" CHECK ("delivery_country" IS NULL OR LENGTH("delivery_country") = 2);

-- Add comment documentation for the new fields
COMMENT ON COLUMN "Product"."origin_country" IS 'ISO 3166-1 alpha-2 country code where product was manufactured/originated';
COMMENT ON COLUMN "Product"."purchase_country" IS 'ISO 3166-1 alpha-2 country code where product is being purchased from';
COMMENT ON COLUMN "Product"."delivery_country" IS 'ISO 3166-1 alpha-2 country code where product will be delivered to';

-- Create a function to validate country codes against a reference table (to be implemented)
-- This would typically reference a countries table with valid ISO codes

-- Sample data migration (optional - uncomment if needed)
-- UPDATE "Product" SET "origin_country" = 'US' WHERE "country" = 'United States';
-- UPDATE "Product" SET "origin_country" = 'SA' WHERE "country" = 'Saudi Arabia';
-- UPDATE "Product" SET "origin_country" = 'AE' WHERE "country" = 'UAE' OR "country" = 'United Arab Emirates';