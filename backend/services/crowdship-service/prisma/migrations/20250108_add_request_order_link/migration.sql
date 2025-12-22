-- Order link for accepted shopper requests
CREATE TYPE "OrderLinkStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELLED');

CREATE TABLE "RequestOrder" (
    "id" SERIAL PRIMARY KEY,
    "requestId" INTEGER NOT NULL REFERENCES "ShopperRequest"("id") ON DELETE CASCADE,
    "offerId" INTEGER NOT NULL REFERENCES "TravelerOffer"("id") ON DELETE CASCADE,
    "buyerId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "travelerId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "productTitle" TEXT,
    "productUrl" TEXT NOT NULL,
    "sourceSite" TEXT,
    "sourceCountry" TEXT,
    "priceBreakdown" JSONB NOT NULL,
    "totalProposed" DECIMAL(10,2) NOT NULL,
    "travelDepartureDate" TIMESTAMP(3),
    "travelArrivalDate" TIMESTAMP(3),
    "status" "OrderLinkStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "RequestOrder_requestId_unq" ON "RequestOrder"("requestId");
CREATE INDEX "RequestOrder_offerId_idx" ON "RequestOrder"("offerId");





