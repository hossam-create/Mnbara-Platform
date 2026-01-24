-- Migration: Fix referenceId type to support UUID
-- Change WalletTransaction.referenceId from INT to VARCHAR to support UUID references

-- Step 1: Drop the existing index that uses referenceId
DROP INDEX IF EXISTS "WalletTransaction_referenceType_referenceId_idx";

-- Step 2: Alter the column type from INT to VARCHAR
ALTER TABLE "WalletTransaction" 
  ALTER COLUMN "referenceId" TYPE VARCHAR(255) USING "referenceId"::VARCHAR;

-- Step 3: Recreate the index
CREATE INDEX "WalletTransaction_referenceType_referenceId_idx" 
  ON "WalletTransaction"("referenceType", "referenceId");
