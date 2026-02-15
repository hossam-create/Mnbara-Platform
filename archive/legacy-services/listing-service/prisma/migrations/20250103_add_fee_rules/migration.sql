-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FIXED', 'TIERED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "FeeRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "listingType" TEXT,
    "categoryId" INTEGER,
    "minPrice" DECIMAL(10,2),
    "maxPrice" DECIMAL(10,2),
    "feeType" "FeeType" NOT NULL DEFAULT 'PERCENTAGE',
    "feeValue" DECIMAL(10,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentProcessingFee" DECIMAL(10,4),
    "listingFee" DECIMAL(10,2),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "FeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FeeRule_isActive_idx" ON "FeeRule"("isActive");
CREATE INDEX IF NOT EXISTS "FeeRule_version_idx" ON "FeeRule"("version");
CREATE INDEX IF NOT EXISTS "FeeRule_listingType_idx" ON "FeeRule"("listingType");
CREATE INDEX IF NOT EXISTS "FeeRule_categoryId_idx" ON "FeeRule"("categoryId");
CREATE INDEX IF NOT EXISTS "FeeRule_effectiveFrom_effectiveTo_idx" ON "FeeRule"("effectiveFrom", "effectiveTo");
CREATE INDEX IF NOT EXISTS "FeeRule_priority_idx" ON "FeeRule"("priority");

-- AddForeignKey
ALTER TABLE "FeeRule" ADD CONSTRAINT "FeeRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default fee rules
INSERT INTO "FeeRule" (
    "name",
    "version",
    "isActive",
    "listingType",
    "categoryId",
    "minPrice",
    "maxPrice",
    "feeType",
    "feeValue",
    "currency",
    "paymentProcessingFee",
    "listingFee",
    "priority",
    "effectiveFrom",
    "description"
) VALUES
-- Tier 1: $0 - $100 (10% platform fee)
(
    'Standard Platform Fee - Tier 1',
    1,
    true,
    NULL,
    NULL,
    0.00,
    100.00,
    'PERCENTAGE',
    10.00,
    'USD',
    2.90,
    NULL,
    0,
    NOW(),
    'Platform fee for transactions $0-$100: 10%'
),
-- Tier 2: $101 - $500 (8% platform fee)
(
    'Standard Platform Fee - Tier 2',
    1,
    true,
    NULL,
    NULL,
    101.00,
    500.00,
    'PERCENTAGE',
    8.00,
    'USD',
    2.90,
    NULL,
    0,
    NOW(),
    'Platform fee for transactions $101-$500: 8%'
),
-- Tier 3: $500+ (6% platform fee)
(
    'Standard Platform Fee - Tier 3',
    1,
    true,
    NULL,
    NULL,
    500.01,
    NULL,
    'PERCENTAGE',
    6.00,
    'USD',
    2.90,
    NULL,
    0,
    NOW(),
    'Platform fee for transactions $500+: 6%'
);





