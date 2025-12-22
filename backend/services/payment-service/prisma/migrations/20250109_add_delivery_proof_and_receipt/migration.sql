-- Delivery proof and purchase receipts linked to escrow/order
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

ALTER TABLE "Escrow"
  ADD COLUMN IF NOT EXISTS "buyerConfirmedDelivery" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "receiptUploaded" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "DeliveryProof" (
    "id" SERIAL PRIMARY KEY,
    "escrowId" INTEGER NOT NULL REFERENCES "Escrow"("id") ON DELETE CASCADE,
    "orderId" INTEGER NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseReceipt" (
    "id" SERIAL PRIMARY KEY,
    "escrowId" INTEGER NOT NULL REFERENCES "Escrow"("id") ON DELETE CASCADE,
    "orderId" INTEGER NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "receiptUrl" TEXT NOT NULL,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "DeliveryProof_escrowId_idx" ON "DeliveryProof"("escrowId");
CREATE INDEX IF NOT EXISTS "PurchaseReceipt_escrowId_idx" ON "PurchaseReceipt"("escrowId");





