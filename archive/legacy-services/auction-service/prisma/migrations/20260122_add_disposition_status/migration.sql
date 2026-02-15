-- Add disposition_status and decision tracking to Listing model
-- Phase 4: Decision Authority Integration

-- Add disposition status enum
CREATE TYPE "DispositionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Add disposition_status column to listings table
ALTER TABLE "Listing" 
ADD COLUMN "disposition_status" "DispositionStatus" DEFAULT 'APPROVED',
ADD COLUMN "decision_id" INTEGER,
ADD COLUMN "decision_ref" TEXT,
ADD COLUMN "decision_requested_at" TIMESTAMP,
ADD COLUMN "decision_decided_at" TIMESTAMP;

-- Add index for disposition_status queries
CREATE INDEX "Listing_disposition_status_idx" ON "Listing"("disposition_status");

-- Add index for decision_id lookups
CREATE INDEX "Listing_decision_id_idx" ON "Listing"("decision_id");

-- Comment on columns
COMMENT ON COLUMN "Listing"."disposition_status" IS 'Decision Authority disposition status (PENDING, APPROVED, REJECTED, EXPIRED)';
COMMENT ON COLUMN "Listing"."decision_id" IS 'Reference to Decision Authority Service decision ID';
COMMENT ON COLUMN "Listing"."decision_ref" IS 'External decision reference (e.g., Custodii decision ID)';
COMMENT ON COLUMN "Listing"."decision_requested_at" IS 'When decision was requested';
COMMENT ON COLUMN "Listing"."decision_decided_at" IS 'When decision was made';
