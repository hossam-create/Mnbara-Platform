-- Buyer Protection / Protection Requests
CREATE TYPE "ProtectionReason" AS ENUM ('NOT_DELIVERED', 'WRONG_ITEM', 'DAMAGED');
CREATE TYPE "ProtectionStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS "ProtectionRequest" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "escrowId" INTEGER NOT NULL REFERENCES "Escrow"("id") ON DELETE CASCADE,
    "buyerId" INTEGER NOT NULL,
    "reason" "ProtectionReason" NOT NULL,
    "status" "ProtectionStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProtectionRequest_orderId_idx" ON "ProtectionRequest"("orderId");
CREATE INDEX IF NOT EXISTS "ProtectionRequest_escrowId_idx" ON "ProtectionRequest"("escrowId");
CREATE INDEX IF NOT EXISTS "ProtectionRequest_status_idx" ON "ProtectionRequest"("status");





