ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "originalOrderId" INTEGER,
  ADD COLUMN IF NOT EXISTS "originalProductUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationReceiptUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "isVerifiedImported" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isResale" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Listing_originalOrderId_idx" ON "Listing"("originalOrderId");
CREATE INDEX IF NOT EXISTS "Listing_isResale_idx" ON "Listing"("isResale");





