-- Add OrderType enum and orderType field to Escrow for PAY-001
CREATE TYPE "OrderType" AS ENUM ('BUY_NOW', 'AUCTION');

ALTER TABLE "Escrow" 
  ADD COLUMN "orderType" "OrderType" NOT NULL DEFAULT 'BUY_NOW';

CREATE INDEX "Escrow_orderType_idx" ON "Escrow"("orderType");





