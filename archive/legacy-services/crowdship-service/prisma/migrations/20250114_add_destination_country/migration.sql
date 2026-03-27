-- Add destinationCountry to ShopperRequest for matching
ALTER TABLE "ShopperRequest" ADD COLUMN "destinationCountry" TEXT;

CREATE INDEX "ShopperRequest_destinationCountry_idx" ON "ShopperRequest"("destinationCountry");





