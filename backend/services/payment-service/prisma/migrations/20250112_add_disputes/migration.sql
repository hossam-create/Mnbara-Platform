-- Dispute enums and model
CREATE TYPE "DisputeReason" AS ENUM ('WRONG_ITEM', 'DAMAGED', 'MISSING_PARTS', 'NOT_AS_DESCRIBED');

CREATE TYPE "DisputeStatus" AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED_BUYER',
  'RESOLVED_TRAVELER',
  'CLOSED'
);

CREATE TABLE IF NOT EXISTS "Dispute" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "escrowId" INTEGER NOT NULL REFERENCES "Escrow"("id") ON DELETE CASCADE,
  "buyerId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "travelerId" INTEGER,
  "reason" "DisputeReason" NOT NULL,
  "buyerMessage" TEXT,
  "buyerEvidenceUrls" TEXT[],
  "travelerMessage" TEXT,
  "travelerEvidenceUrls" TEXT[],
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedBy" INTEGER,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Dispute_orderId_idx" ON "Dispute"("orderId");
CREATE INDEX IF NOT EXISTS "Dispute_escrowId_idx" ON "Dispute"("escrowId");
CREATE INDEX IF NOT EXISTS "Dispute_status_idx" ON "Dispute"("status");





