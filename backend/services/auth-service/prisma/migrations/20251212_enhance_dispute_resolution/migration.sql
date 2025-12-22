-- Migration: Enhance Dispute Resolution
-- Requirements: 12.3, 12.4, 17.3 - Add dispute messages and enhanced resolution fields

-- Add new columns to Dispute table for enhanced resolution
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'medium';
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "raisedByRole" VARCHAR(20) DEFAULT 'buyer';
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "orderId" INTEGER;
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "resolutionData" JSONB;

-- Create DisputeEvidence table for storing evidence from both parties
CREATE TABLE IF NOT EXISTS "DisputeEvidence" (
    "id" SERIAL PRIMARY KEY,
    "disputeId" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'image', -- 'image', 'document', 'text'
    "url" TEXT,
    "content" TEXT,
    "uploadedBy" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") 
        REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create DisputeMessage table for communication history
CREATE TABLE IF NOT EXISTS "DisputeMessage" (
    "id" SERIAL PRIMARY KEY,
    "disputeId" INTEGER NOT NULL,
    "senderId" VARCHAR(255) NOT NULL,
    "senderName" VARCHAR(255) NOT NULL,
    "senderRole" VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'buyer', 'seller', 'admin'
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "DisputeMessage_disputeId_fkey" FOREIGN KEY ("disputeId") 
        REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");
CREATE INDEX IF NOT EXISTS "DisputeEvidence_uploadedBy_idx" ON "DisputeEvidence"("uploadedBy");
CREATE INDEX IF NOT EXISTS "DisputeMessage_disputeId_idx" ON "DisputeMessage"("disputeId");
CREATE INDEX IF NOT EXISTS "DisputeMessage_createdAt_idx" ON "DisputeMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "Dispute_priority_idx" ON "Dispute"("priority");
CREATE INDEX IF NOT EXISTS "Dispute_orderId_idx" ON "Dispute"("orderId");

-- Add DISPUTE_STATUS_CHANGED to AuditAction enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DISPUTE_STATUS_CHANGED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
        ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_STATUS_CHANGED';
    END IF;
END$$;

-- Comment for documentation
COMMENT ON TABLE "DisputeEvidence" IS 'Stores evidence submitted by buyers and sellers for dispute resolution (Req: 17.2)';
COMMENT ON TABLE "DisputeMessage" IS 'Communication history between parties and admin during dispute resolution (Req: 12.2)';
COMMENT ON COLUMN "Dispute"."resolutionData" IS 'JSON data containing resolution outcome, amount, notes, and escrow transaction details (Req: 12.3, 12.4)';
