-- Phase 4: Decision Authority Integration - Add disposition fields to Listing model

-- Add disposition status enum if not exists
DO $$ BEGIN
    CREATE TYPE "DispositionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add disposition fields to listings table
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "disposition_status" "DispositionStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "decision_id" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "decision_ref" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "decision_requested_at" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "decision_decided_at" TIMESTAMP(3);

-- Add index for disposition_status for efficient filtering
CREATE INDEX IF NOT EXISTS "Listing_disposition_status_idx" ON "Listing"("disposition_status");
CREATE INDEX IF NOT EXISTS "Listing_decision_id_idx" ON "Listing"("decision_id");
