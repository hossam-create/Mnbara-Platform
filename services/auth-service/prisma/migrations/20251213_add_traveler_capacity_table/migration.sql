-- Migration: Add TravelerCapacity Table
-- Description: Schema for traveler capacity tracking with constraints
-- Requirements: 11.1, 11.2 - Traveler trip management and capacity tracking

-- CreateEnum: CapacityUnit
CREATE TYPE "CapacityUnit" AS ENUM ('KG', 'LB', 'LITERS', 'CUBIC_CM');

-- CreateEnum: CapacityStatus
CREATE TYPE "CapacityStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'FULLY_BOOKED', 'EXPIRED');

-- CreateTable: TravelerCapacity
-- Tracks available capacity for each traveler trip
CREATE TABLE "TravelerCapacity" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "travelerId" INTEGER NOT NULL,
    
    -- Weight capacity
    "totalWeightKg" DECIMAL(8,2) NOT NULL,
    "reservedWeightKg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "availableWeightKg" DECIMAL(8,2) NOT NULL,
    
    -- Volume capacity (optional)
    "totalVolumeLiters" DECIMAL(8,2),
    "reservedVolumeLiters" DECIMAL(8,2) DEFAULT 0,
    "availableVolumeLiters" DECIMAL(8,2),
    
    -- Item count limits
    "maxItems" INTEGER DEFAULT 10,
    "reservedItems" INTEGER NOT NULL DEFAULT 0,
    "availableItems" INTEGER,
    
    -- Pricing
    "pricePerKg" DECIMAL(10,2) NOT NULL,
    "pricePerLiter" DECIMAL(10,2),
    "minimumCharge" DECIMAL(10,2) DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    
    -- Category restrictions
    "allowedCategories" TEXT[],
    "restrictedCategories" TEXT[],
    
    -- Size constraints
    "maxItemWeightKg" DECIMAL(8,2),
    "maxItemLengthCm" DECIMAL(8,2),
    "maxItemWidthCm" DECIMAL(8,2),
    "maxItemHeightCm" DECIMAL(8,2),
    
    -- Status
    "status" "CapacityStatus" NOT NULL DEFAULT 'AVAILABLE',
    
    -- Timestamps
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelerCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CapacityReservation
-- Tracks individual reservations against traveler capacity
CREATE TABLE "CapacityReservation" (
    "id" SERIAL NOT NULL,
    "capacityId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    
    -- Reserved amounts
    "reservedWeightKg" DECIMAL(8,2) NOT NULL,
    "reservedVolumeLiters" DECIMAL(8,2),
    "reservedItems" INTEGER NOT NULL DEFAULT 1,
    
    -- Pricing at time of reservation
    "priceCharged" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    
    -- Status
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    
    -- Timestamps
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacityReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: TravelerCapacity
CREATE UNIQUE INDEX "TravelerCapacity_tripId_key" ON "TravelerCapacity"("tripId");
CREATE INDEX "TravelerCapacity_tripId_idx" ON "TravelerCapacity"("tripId");
CREATE INDEX "TravelerCapacity_travelerId_idx" ON "TravelerCapacity"("travelerId");
CREATE INDEX "TravelerCapacity_status_idx" ON "TravelerCapacity"("status");
CREATE INDEX "TravelerCapacity_validFrom_validUntil_idx" ON "TravelerCapacity"("validFrom", "validUntil");
CREATE INDEX "TravelerCapacity_availableWeightKg_idx" ON "TravelerCapacity"("availableWeightKg");

-- CreateIndex: CapacityReservation
CREATE INDEX "CapacityReservation_capacityId_idx" ON "CapacityReservation"("capacityId");
CREATE INDEX "CapacityReservation_orderId_idx" ON "CapacityReservation"("orderId");
CREATE INDEX "CapacityReservation_buyerId_idx" ON "CapacityReservation"("buyerId");
CREATE INDEX "CapacityReservation_status_idx" ON "CapacityReservation"("status");
CREATE INDEX "CapacityReservation_expiresAt_idx" ON "CapacityReservation"("expiresAt");

-- AddForeignKey: TravelerCapacity
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "TravelerCapacity_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "TravelerCapacity_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CapacityReservation
ALTER TABLE "CapacityReservation" ADD CONSTRAINT "CapacityReservation_capacityId_fkey" FOREIGN KEY ("capacityId") REFERENCES "TravelerCapacity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CapacityReservation" ADD CONSTRAINT "CapacityReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CapacityReservation" ADD CONSTRAINT "CapacityReservation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add constraint: Ensure available weight doesn't exceed total
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "check_weight_capacity" 
    CHECK ("reservedWeightKg" >= 0 AND "reservedWeightKg" <= "totalWeightKg");

-- Add constraint: Ensure available volume doesn't exceed total (when volume is set)
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "check_volume_capacity" 
    CHECK ("reservedVolumeLiters" IS NULL OR ("reservedVolumeLiters" >= 0 AND "reservedVolumeLiters" <= "totalVolumeLiters"));

-- Add constraint: Ensure reserved items doesn't exceed max
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "check_items_capacity" 
    CHECK ("reservedItems" >= 0 AND ("maxItems" IS NULL OR "reservedItems" <= "maxItems"));

-- Add constraint: Ensure valid date range
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "check_valid_date_range" 
    CHECK ("validUntil" > "validFrom");

-- Add constraint: Ensure positive pricing
ALTER TABLE "TravelerCapacity" ADD CONSTRAINT "check_positive_pricing" 
    CHECK ("pricePerKg" >= 0 AND ("pricePerLiter" IS NULL OR "pricePerLiter" >= 0));

-- Create trigger function to auto-update available capacity
CREATE OR REPLACE FUNCTION update_available_capacity()
RETURNS TRIGGER AS $$
BEGIN
    NEW."availableWeightKg" := NEW."totalWeightKg" - NEW."reservedWeightKg";
    IF NEW."totalVolumeLiters" IS NOT NULL THEN
        NEW."availableVolumeLiters" := NEW."totalVolumeLiters" - COALESCE(NEW."reservedVolumeLiters", 0);
    END IF;
    IF NEW."maxItems" IS NOT NULL THEN
        NEW."availableItems" := NEW."maxItems" - NEW."reservedItems";
    END IF;
    
    -- Auto-update status based on capacity
    IF NEW."availableWeightKg" <= 0 OR (NEW."maxItems" IS NOT NULL AND NEW."availableItems" <= 0) THEN
        NEW."status" := 'FULLY_BOOKED';
    ELSIF NEW."reservedWeightKg" > 0 THEN
        NEW."status" := 'RESERVED';
    ELSE
        NEW."status" := 'AVAILABLE';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_available_capacity
    BEFORE INSERT OR UPDATE ON "TravelerCapacity"
    FOR EACH ROW
    EXECUTE FUNCTION update_available_capacity();

-- Create trigger function to update capacity when reservation changes
CREATE OR REPLACE FUNCTION update_capacity_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "TravelerCapacity"
        SET "reservedWeightKg" = "reservedWeightKg" + NEW."reservedWeightKg",
            "reservedVolumeLiters" = COALESCE("reservedVolumeLiters", 0) + COALESCE(NEW."reservedVolumeLiters", 0),
            "reservedItems" = "reservedItems" + NEW."reservedItems",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."capacityId";
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW."status" = 'CANCELLED' AND OLD."status" != 'CANCELLED') THEN
        UPDATE "TravelerCapacity"
        SET "reservedWeightKg" = "reservedWeightKg" - OLD."reservedWeightKg",
            "reservedVolumeLiters" = COALESCE("reservedVolumeLiters", 0) - COALESCE(OLD."reservedVolumeLiters", 0),
            "reservedItems" = "reservedItems" - OLD."reservedItems",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = OLD."capacityId";
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reservation changes
CREATE TRIGGER trigger_update_capacity_on_reservation
    AFTER INSERT OR UPDATE OR DELETE ON "CapacityReservation"
    FOR EACH ROW
    EXECUTE FUNCTION update_capacity_on_reservation();
