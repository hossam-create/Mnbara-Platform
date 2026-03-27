-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM (
  'PAYMENT',
  'REFUND',
  'ESCROW_HOLD',
  'ESCROW_RELEASE',
  'ESCROW_REFUND',
  'WITHDRAWAL',
  'DEPOSIT',
  'FEE',
  'REWARD',
  'SWAP_INITIATED',
  'SWAP_COMPLETED',
  'SWAP_CANCELLED',
  'ORDER_CREATED',
  'ORDER_COMPLETED',
  'ORDER_CANCELLED',
  'BID_PLACED',
  'AUCTION_WON',
  'SYSTEM_ADJUSTMENT',
  'MIGRATION'
);

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'FAILED',
  'REVERSED'
);

-- CreateTable: ImmutableLedger
-- This table is append-only with cryptographic chaining for integrity
CREATE TABLE "ImmutableLedger" (
  "id" SERIAL NOT NULL,
  "entryNumber" TEXT NOT NULL,
  "entryType" "LedgerEntryType" NOT NULL,
  "status" "LedgerEntryStatus" NOT NULL DEFAULT 'PENDING',
  
  -- Participants
  "fromUserId" INTEGER,
  "toUserId" INTEGER,
  
  -- Amount
  "amount" DECIMAL(18,8) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  
  -- References
  "orderId" INTEGER,
  "escrowId" INTEGER,
  "swapId" INTEGER,
  "auctionId" INTEGER,
  "transactionRef" TEXT,
  
  -- Description
  "description" TEXT NOT NULL,
  
  -- Metadata (JSON)
  "metadata" JSONB,
  
  -- Cryptographic chain
  "previousHash" TEXT NOT NULL,
  "entryHash" TEXT NOT NULL,
  "hashAlgorithm" TEXT NOT NULL DEFAULT 'SHA-256',
  
  -- Sequence for ordering
  "sequenceNumber" BIGINT NOT NULL,
  
  -- Timestamps
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  
  CONSTRAINT "ImmutableLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraints
CREATE UNIQUE INDEX "ImmutableLedger_entryNumber_key" ON "ImmutableLedger"("entryNumber");
CREATE UNIQUE INDEX "ImmutableLedger_sequenceNumber_key" ON "ImmutableLedger"("sequenceNumber");
CREATE UNIQUE INDEX "ImmutableLedger_entryHash_key" ON "ImmutableLedger"("entryHash");

-- CreateIndex: Query indexes
CREATE INDEX "ImmutableLedger_entryType_idx" ON "ImmutableLedger"("entryType");
CREATE INDEX "ImmutableLedger_status_idx" ON "ImmutableLedger"("status");
CREATE INDEX "ImmutableLedger_fromUserId_idx" ON "ImmutableLedger"("fromUserId");
CREATE INDEX "ImmutableLedger_toUserId_idx" ON "ImmutableLedger"("toUserId");
CREATE INDEX "ImmutableLedger_orderId_idx" ON "ImmutableLedger"("orderId");
CREATE INDEX "ImmutableLedger_escrowId_idx" ON "ImmutableLedger"("escrowId");
CREATE INDEX "ImmutableLedger_swapId_idx" ON "ImmutableLedger"("swapId");
CREATE INDEX "ImmutableLedger_auctionId_idx" ON "ImmutableLedger"("auctionId");
CREATE INDEX "ImmutableLedger_createdAt_idx" ON "ImmutableLedger"("createdAt");
CREATE INDEX "ImmutableLedger_sequenceNumber_idx" ON "ImmutableLedger"("sequenceNumber");

-- AddForeignKey
ALTER TABLE "ImmutableLedger" ADD CONSTRAINT "ImmutableLedger_fromUserId_fkey" 
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImmutableLedger" ADD CONSTRAINT "ImmutableLedger_toUserId_fkey" 
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create function to prevent updates (append-only)
CREATE OR REPLACE FUNCTION prevent_ledger_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow status updates from PENDING to CONFIRMED/FAILED
  IF OLD.status = 'PENDING' AND NEW.status IN ('CONFIRMED', 'FAILED') THEN
    -- Ensure no other fields are modified
    IF OLD.entryNumber != NEW.entryNumber OR
       OLD.entryType != NEW.entryType OR
       OLD.fromUserId IS DISTINCT FROM NEW.fromUserId OR
       OLD.toUserId IS DISTINCT FROM NEW.toUserId OR
       OLD.amount != NEW.amount OR
       OLD.currency != NEW.currency OR
       OLD.orderId IS DISTINCT FROM NEW.orderId OR
       OLD.escrowId IS DISTINCT FROM NEW.escrowId OR
       OLD.swapId IS DISTINCT FROM NEW.swapId OR
       OLD.auctionId IS DISTINCT FROM NEW.auctionId OR
       OLD.description != NEW.description OR
       OLD.previousHash != NEW.previousHash OR
       OLD.entryHash != NEW.entryHash OR
       OLD.sequenceNumber != NEW.sequenceNumber THEN
      RAISE EXCEPTION 'Immutable ledger entries cannot be modified except for status confirmation';
    END IF;
    RETURN NEW;
  END IF;
  
  RAISE EXCEPTION 'Immutable ledger entries cannot be modified';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce immutability
CREATE TRIGGER enforce_ledger_immutability
  BEFORE UPDATE ON "ImmutableLedger"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_update();

-- Create function to prevent deletes
CREATE OR REPLACE FUNCTION prevent_ledger_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Immutable ledger entries cannot be deleted';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletes
CREATE TRIGGER prevent_ledger_deletion
  BEFORE DELETE ON "ImmutableLedger"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_delete();

-- Create sequence for entry numbers
CREATE SEQUENCE IF NOT EXISTS ledger_sequence_seq START 1;

-- Create function to get next sequence number atomically
CREATE OR REPLACE FUNCTION get_next_ledger_sequence()
RETURNS BIGINT AS $$
DECLARE
  next_seq BIGINT;
BEGIN
  SELECT nextval('ledger_sequence_seq') INTO next_seq;
  RETURN next_seq;
END;
$$ LANGUAGE plpgsql;

-- Create genesis entry (first entry in the chain)
INSERT INTO "ImmutableLedger" (
  "entryNumber",
  "entryType",
  "status",
  "amount",
  "currency",
  "description",
  "previousHash",
  "entryHash",
  "sequenceNumber",
  "confirmedAt"
) VALUES (
  'GENESIS-0000000000',
  'MIGRATION',
  'CONFIRMED',
  0,
  'USD',
  'Genesis block - Immutable ledger initialization',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'GENESIS_HASH_MNBARA_PLATFORM_2024',
  0,
  CURRENT_TIMESTAMP
);

-- Comment on table
COMMENT ON TABLE "ImmutableLedger" IS 'Append-only immutable transaction ledger with cryptographic chaining for audit trail integrity';
