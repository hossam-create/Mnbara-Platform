-- Enums
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('OFFERED', 'COUNTERED', 'ACCEPTED', 'REJECTED');
CREATE TYPE "TravelStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- Shopper requests
CREATE TABLE "ShopperRequest" (
    "id" SERIAL PRIMARY KEY,
    "buyerId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "productUrl" TEXT NOT NULL,
    "title" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sourceSite" TEXT,
    "sourceCountry" TEXT,
    "imageUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "isOrderReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ShopperRequest_buyerId_idx" ON "ShopperRequest"("buyerId");
CREATE INDEX "ShopperRequest_status_idx" ON "ShopperRequest"("status");
CREATE INDEX "ShopperRequest_sourceCountry_idx" ON "ShopperRequest"("sourceCountry");

-- Traveler offers
CREATE TABLE "TravelerOffer" (
    "id" SERIAL PRIMARY KEY,
    "requestId" INTEGER NOT NULL REFERENCES "ShopperRequest"("id") ON DELETE CASCADE,
    "travelerId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "listedPrice" DECIMAL(10,2) NOT NULL,
    "estimatedTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estimatedShipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "travelerProfit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalProposed" DECIMAL(10,2) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'OFFERED',
    "lastActor" TEXT NOT NULL DEFAULT 'traveler',
    "counterNote" TEXT,
    "travelDepartureDate" TIMESTAMP(3),
    "travelArrivalDate" TIMESTAMP(3),
    "travelStatus" "TravelStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "TravelerOffer_requestId_idx" ON "TravelerOffer"("requestId");
CREATE INDEX "TravelerOffer_travelerId_idx" ON "TravelerOffer"("travelerId");
CREATE INDEX "TravelerOffer_status_idx" ON "TravelerOffer"("status");
CREATE UNIQUE INDEX "TravelerOffer_request_traveler_unq" ON "TravelerOffer"("requestId", "travelerId");





