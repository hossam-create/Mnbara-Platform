-- CreateEnum
CREATE TYPE "SwapStatus" AS ENUM (
  'PENDING',
  'PROPOSED',
  'ACCEPTED',
  'REJECTED',
  'IN_ESCROW',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'DISPUTED'
);

-- CreateEnum
CREATE TYPE "SwapItemType" AS ENUM (
  'LISTING',
  'PRODUCT',
  'CASH_ADDITION'
);

-- CreateTable
CREATE TABLE "Swap" (
  "id" SERIAL NOT NULL,
  "swapNumber" TEXT NOT NULL,
  "initiatorId" INTEGER NOT NULL,
  "receiverId" INTEGER NOT NULL,
  "status" "SwapStatus" NOT NULL DEFAULT 'PENDING',
  "matchScore" DECIMAL(5,2),
  "initiatorConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "receiverConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "initiatorConfirmedAt" TIMESTAMP(3),
  "receiverConfirmedAt" TIMESTAMP(3),
  "escrowInitiatorId" INTEGER,
  "escrowReceiverId" INTEGER,
  "message" TEXT,
  "counterOfferCount" INTEGER NOT NULL DEFAULT 0,
  "maxCounterOffers" INTEGER NOT NULL DEFAULT 3,
  "expiresAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "cancelledBy" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapItem" (
  "id" SERIAL NOT NULL,
  "swapId" INTEGER NOT NULL,
  "ownerId" INTEGER NOT NULL,
  "itemType" "SwapItemType" NOT NULL DEFAULT 'LISTING',
  "listingId" INTEGER,
  "productName" TEXT,
  "productDescription" TEXT,
  "estimatedValue" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "condition" TEXT,
  "images" TEXT[],
  "cashAmount" DECIMAL(10,2),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SwapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapHistory" (
  "id" SERIAL NOT NULL,
  "swapId" INTEGER NOT NULL,
  "previousStatus" "SwapStatus",
  "newStatus" "SwapStatus" NOT NULL,
  "action" TEXT NOT NULL,
  "performedBy" INTEGER,
  "isSystemAction" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SwapHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapMatch" (
  "id" SERIAL NOT NULL,
  "initiatorListingId" INTEGER NOT NULL,
  "matchedListingId" INTEGER NOT NULL,
  "matchScore" DECIMAL(5,2) NOT NULL,
  "categoryMatch" BOOLEAN NOT NULL DEFAULT false,
  "priceRangeMatch" BOOLEAN NOT NULL DEFAULT false,
  "locationMatch" BOOLEAN NOT NULL DEFAULT false,
  "conditionMatch" BOOLEAN NOT NULL DEFAULT false,
  "valueDifference" DECIMAL(10,2),
  "valueDifferencePercent" DECIMAL(5,2),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "viewedAt" TIMESTAMP(3),
  "swapId" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SwapMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Swap_swapNumber_key" ON "Swap"("swapNumber");
CREATE INDEX "Swap_initiatorId_idx" ON "Swap"("initiatorId");
CREATE INDEX "Swap_receiverId_idx" ON "Swap"("receiverId");
CREATE INDEX "Swap_status_idx" ON "Swap"("status");
CREATE INDEX "Swap_expiresAt_idx" ON "Swap"("expiresAt");
CREATE INDEX "Swap_createdAt_idx" ON "Swap"("createdAt");

-- CreateIndex
CREATE INDEX "SwapItem_swapId_idx" ON "SwapItem"("swapId");
CREATE INDEX "SwapItem_ownerId_idx" ON "SwapItem"("ownerId");
CREATE INDEX "SwapItem_listingId_idx" ON "SwapItem"("listingId");

-- CreateIndex
CREATE INDEX "SwapHistory_swapId_idx" ON "SwapHistory"("swapId");
CREATE INDEX "SwapHistory_createdAt_idx" ON "SwapHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SwapMatch_initiatorListingId_matchedListingId_key" ON "SwapMatch"("initiatorListingId", "matchedListingId");
CREATE INDEX "SwapMatch_initiatorListingId_idx" ON "SwapMatch"("initiatorListingId");
CREATE INDEX "SwapMatch_matchedListingId_idx" ON "SwapMatch"("matchedListingId");
CREATE INDEX "SwapMatch_matchScore_idx" ON "SwapMatch"("matchScore");
CREATE INDEX "SwapMatch_isActive_idx" ON "SwapMatch"("isActive");

-- AddForeignKey
ALTER TABLE "Swap" ADD CONSTRAINT "Swap_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Swap" ADD CONSTRAINT "Swap_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapItem" ADD CONSTRAINT "SwapItem_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapItem" ADD CONSTRAINT "SwapItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SwapItem" ADD CONSTRAINT "SwapItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapHistory" ADD CONSTRAINT "SwapHistory_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapMatch" ADD CONSTRAINT "SwapMatch_initiatorListingId_fkey" FOREIGN KEY ("initiatorListingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapMatch" ADD CONSTRAINT "SwapMatch_matchedListingId_fkey" FOREIGN KEY ("matchedListingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapMatch" ADD CONSTRAINT "SwapMatch_swapId_fkey" FOREIGN KEY ("swapId") REFERENCES "Swap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
