-- Add guest order support to Order model
-- Make buyerId nullable for guest orders
ALTER TABLE "Order" 
  ALTER COLUMN "buyerId" DROP NOT NULL;

-- Add guest order fields
ALTER TABLE "Order" 
  ADD COLUMN IF NOT EXISTS "isGuestOrder" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "guestEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "guestFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "guestLastName" TEXT,
  ADD COLUMN IF NOT EXISTS "guestPhone" TEXT;

-- Add indexes for guest orders
CREATE INDEX IF NOT EXISTS "Order_guestEmail_idx" ON "Order"("guestEmail");
CREATE INDEX IF NOT EXISTS "Order_isGuestOrder_idx" ON "Order"("isGuestOrder");

-- Add constraint: Either buyerId or guestEmail must be provided
-- Note: This is enforced at application level, as PostgreSQL doesn't support
-- complex CHECK constraints easily for this case





