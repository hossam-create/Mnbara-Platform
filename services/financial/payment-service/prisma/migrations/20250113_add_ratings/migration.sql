-- Rating model for buyer/traveler reviews
CREATE TABLE IF NOT EXISTS "Rating" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "raterId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "rateeId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One rating per rater/order
CREATE UNIQUE INDEX IF NOT EXISTS "Rating_orderId_raterId_unq" ON "Rating"("orderId", "raterId");
CREATE INDEX IF NOT EXISTS "Rating_rateeId_idx" ON "Rating"("rateeId");

-- Aggregate fields on User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "ratingAverage" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "ratingCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratingSum" INTEGER NOT NULL DEFAULT 0;

-- Rating audit log
CREATE TABLE IF NOT EXISTS "RatingAudit" (
    "id" SERIAL PRIMARY KEY,
    "ratingId" INTEGER NOT NULL REFERENCES "Rating"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "performedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "RatingAudit_ratingId_idx" ON "RatingAudit"("ratingId");





