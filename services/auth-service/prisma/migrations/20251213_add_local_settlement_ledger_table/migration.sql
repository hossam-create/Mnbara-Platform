-- Migration: Add LocalSettlementLedger Table
-- Description: Local settlement tracking schema with reconciliation support
-- Requirements: 9.4 - Support location tracking and delivery progress for settlements

-- ========================================
-- SETTLEMENT ENUMS
-- ========================================

-- Settlement status
CREATE TYPE "SettlementStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'ON_HOLD',
    'DISPUTED',
    'RECONCILED'
);

-- Settlement type
CREATE TYPE "SettlementType" AS ENUM (
    'SELLER_PAYOUT',
    'TRAVELER_PAYOUT',
    'PLATFORM_FEE',
    'REFUND',
    'ADJUSTMENT',
    'COMMISSION',
    'BONUS'
);

-- Payment method for settlement
CREATE TYPE "SettlementPaymentMethod" AS ENUM (
    'BANK_TRANSFER',
    'WALLET',
    'STRIPE',
    'PAYPAL',
    'PAYMOB',
    'MNB_TOKEN',
    'CASH'
);

-- ========================================
-- LOCAL SETTLEMENT LEDGER TABLE
-- ========================================

-- Main settlement ledger for tracking all payouts
CREATE TABLE "LocalSettlementLedger" (
    "id" SERIAL PRIMARY KEY,
    "settlementNumber" VARCHAR(50) NOT NULL UNIQUE,
    
    -- Recipient info
    "recipientId" INTEGER NOT NULL,
    "recipientType" VARCHAR(50) NOT NULL,  -- 'SELLER', 'TRAVELER', 'PLATFORM'
    
    -- Settlement details
    "type" "SettlementType" NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Amounts
    "grossAmount" DECIMAL(12, 2) NOT NULL,
    "platformFee" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "processingFee" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "taxWithheld" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Exchange rate (for multi-currency)
    "exchangeRate" DECIMAL(10, 6) DEFAULT 1.0,
    "originalCurrency" VARCHAR(3),
    "originalAmount" DECIMAL(12, 2),
    
    -- Source reference
    "orderId" INTEGER,
    "escrowId" INTEGER,
    "transactionId" INTEGER,
    
    -- Payment method
    "paymentMethod" "SettlementPaymentMethod" NOT NULL DEFAULT 'WALLET',
    "paymentDetails" JSONB,  -- Bank account, wallet address, etc.
    
    -- Processing info
    "processedAt" TIMESTAMP(3),
    "processedBy" INTEGER,
    "paymentReference" VARCHAR(255),  -- External payment ID
    "paymentGatewayResponse" JSONB,
    
    -- Failure handling
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    
    -- Reconciliation
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" INTEGER,
    "reconciliationNotes" TEXT,
    "reconciliationBatchId" VARCHAR(100),
    
    -- Metadata
    "description" TEXT,
    "metadata" JSONB,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "LocalSettlementLedger_recipientId_fkey" FOREIGN KEY ("recipientId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LocalSettlementLedger_orderId_fkey" FOREIGN KEY ("orderId") 
        REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LocalSettlementLedger_escrowId_fkey" FOREIGN KEY ("escrowId") 
        REFERENCES "Escrow"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for settlement ledger
CREATE INDEX "LocalSettlementLedger_settlementNumber_idx" ON "LocalSettlementLedger"("settlementNumber");
CREATE INDEX "LocalSettlementLedger_recipientId_idx" ON "LocalSettlementLedger"("recipientId");
CREATE INDEX "LocalSettlementLedger_recipientType_idx" ON "LocalSettlementLedger"("recipientType");
CREATE INDEX "LocalSettlementLedger_type_idx" ON "LocalSettlementLedger"("type");
CREATE INDEX "LocalSettlementLedger_status_idx" ON "LocalSettlementLedger"("status");
CREATE INDEX "LocalSettlementLedger_orderId_idx" ON "LocalSettlementLedger"("orderId");
CREATE INDEX "LocalSettlementLedger_escrowId_idx" ON "LocalSettlementLedger"("escrowId");
CREATE INDEX "LocalSettlementLedger_createdAt_idx" ON "LocalSettlementLedger"("createdAt" DESC);
CREATE INDEX "LocalSettlementLedger_processedAt_idx" ON "LocalSettlementLedger"("processedAt");
CREATE INDEX "LocalSettlementLedger_reconciliationBatchId_idx" ON "LocalSettlementLedger"("reconciliationBatchId");
CREATE INDEX "LocalSettlementLedger_status_nextRetryAt_idx" ON "LocalSettlementLedger"("status", "nextRetryAt") 
    WHERE "status" = 'FAILED' AND "nextRetryAt" IS NOT NULL;

-- ========================================
-- SETTLEMENT BATCH TABLE
-- ========================================

-- Batch processing for settlements
CREATE TABLE "SettlementBatch" (
    "id" SERIAL PRIMARY KEY,
    "batchNumber" VARCHAR(50) NOT NULL UNIQUE,
    
    -- Batch details
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "totalSettlements" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    
    -- Amounts
    "totalGrossAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "totalNetAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Processing
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processedBy" INTEGER,
    
    -- Metadata
    "notes" TEXT,
    "metadata" JSONB,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for settlement batch
CREATE INDEX "SettlementBatch_batchNumber_idx" ON "SettlementBatch"("batchNumber");
CREATE INDEX "SettlementBatch_status_idx" ON "SettlementBatch"("status");
CREATE INDEX "SettlementBatch_createdAt_idx" ON "SettlementBatch"("createdAt" DESC);

-- ========================================
-- SETTLEMENT HISTORY TABLE
-- ========================================

-- Audit trail for settlement status changes
CREATE TABLE "SettlementHistory" (
    "id" SERIAL PRIMARY KEY,
    "settlementId" INTEGER NOT NULL,
    
    -- Status change
    "previousStatus" "SettlementStatus",
    "newStatus" "SettlementStatus" NOT NULL,
    
    -- Change context
    "changeReason" TEXT,
    "changedBy" INTEGER,
    "isSystemChange" BOOLEAN DEFAULT false,
    
    -- Metadata
    "metadata" JSONB,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT "SettlementHistory_settlementId_fkey" FOREIGN KEY ("settlementId") 
        REFERENCES "LocalSettlementLedger"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for settlement history
CREATE INDEX "SettlementHistory_settlementId_idx" ON "SettlementHistory"("settlementId");
CREATE INDEX "SettlementHistory_createdAt_idx" ON "SettlementHistory"("createdAt" DESC);

-- ========================================
-- RECONCILIATION REPORT TABLE
-- ========================================

-- Daily/weekly reconciliation reports
CREATE TABLE "ReconciliationReport" (
    "id" SERIAL PRIMARY KEY,
    "reportNumber" VARCHAR(50) NOT NULL UNIQUE,
    
    -- Report period
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "reportType" VARCHAR(50) NOT NULL DEFAULT 'DAILY',  -- DAILY, WEEKLY, MONTHLY
    
    -- Summary
    "totalSettlements" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Breakdown by type
    "sellerPayouts" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "travelerPayouts" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "platformFees" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "refunds" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    
    -- Discrepancies
    "discrepancyCount" INTEGER NOT NULL DEFAULT 0,
    "discrepancyAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "discrepancyDetails" JSONB,
    
    -- Status
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    
    -- Notes
    "notes" TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reconciliation report
CREATE INDEX "ReconciliationReport_reportNumber_idx" ON "ReconciliationReport"("reportNumber");
CREATE INDEX "ReconciliationReport_periodStart_periodEnd_idx" ON "ReconciliationReport"("periodStart", "periodEnd");
CREATE INDEX "ReconciliationReport_status_idx" ON "ReconciliationReport"("status");
CREATE INDEX "ReconciliationReport_createdAt_idx" ON "ReconciliationReport"("createdAt" DESC);

-- ========================================
-- TRIGGER: Update timestamps
-- ========================================

CREATE TRIGGER local_settlement_ledger_updated_at_trigger
    BEFORE UPDATE ON "LocalSettlementLedger"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

CREATE TRIGGER settlement_batch_updated_at_trigger
    BEFORE UPDATE ON "SettlementBatch"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

CREATE TRIGGER reconciliation_report_updated_at_trigger
    BEFORE UPDATE ON "ReconciliationReport"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

-- ========================================
-- TRIGGER: Auto-create settlement history
-- ========================================

CREATE OR REPLACE FUNCTION log_settlement_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."status" IS DISTINCT FROM NEW."status" THEN
        INSERT INTO "SettlementHistory" (
            "settlementId", "previousStatus", "newStatus", 
            "changeReason", "isSystemChange"
        ) VALUES (
            NEW."id", OLD."status", NEW."status",
            'Status changed from ' || COALESCE(OLD."status"::TEXT, 'NULL') || ' to ' || NEW."status"::TEXT,
            true
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settlement_status_change_trigger
    AFTER UPDATE ON "LocalSettlementLedger"
    FOR EACH ROW
    EXECUTE FUNCTION log_settlement_status_change();

-- ========================================
-- FUNCTION: Generate settlement number
-- ========================================

CREATE OR REPLACE FUNCTION generate_settlement_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_date_part VARCHAR(8);
    v_seq_part VARCHAR(6);
    v_count INTEGER;
BEGIN
    v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM "LocalSettlementLedger"
    WHERE "createdAt"::DATE = CURRENT_DATE;
    
    v_seq_part := LPAD(v_count::TEXT, 6, '0');
    
    RETURN 'STL-' || v_date_part || '-' || v_seq_part;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTION: Create settlement from escrow release
-- ========================================

CREATE OR REPLACE FUNCTION create_settlement_from_escrow(
    p_escrow_id INTEGER,
    p_recipient_id INTEGER,
    p_recipient_type VARCHAR(50),
    p_settlement_type "SettlementType",
    p_gross_amount DECIMAL(12, 2),
    p_platform_fee_percent DECIMAL(5, 2) DEFAULT 5.0,
    p_payment_method "SettlementPaymentMethod" DEFAULT 'WALLET'
)
RETURNS INTEGER AS $$
DECLARE
    v_settlement_id INTEGER;
    v_platform_fee DECIMAL(12, 2);
    v_net_amount DECIMAL(12, 2);
    v_settlement_number VARCHAR(50);
    v_order_id INTEGER;
BEGIN
    -- Calculate fees
    v_platform_fee := ROUND(p_gross_amount * (p_platform_fee_percent / 100), 2);
    v_net_amount := p_gross_amount - v_platform_fee;
    
    -- Generate settlement number
    v_settlement_number := generate_settlement_number();
    
    -- Get order ID from escrow
    SELECT "orderId" INTO v_order_id FROM "Escrow" WHERE "id" = p_escrow_id;
    
    -- Create settlement record
    INSERT INTO "LocalSettlementLedger" (
        "settlementNumber", "recipientId", "recipientType", "type", "status",
        "grossAmount", "platformFee", "netAmount", "orderId", "escrowId",
        "paymentMethod", "description"
    ) VALUES (
        v_settlement_number, p_recipient_id, p_recipient_type, p_settlement_type, 'PENDING',
        p_gross_amount, v_platform_fee, v_net_amount, v_order_id, p_escrow_id,
        p_payment_method, 
        'Settlement for ' || p_recipient_type || ' from escrow #' || p_escrow_id
    )
    RETURNING "id" INTO v_settlement_id;
    
    RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE "LocalSettlementLedger" IS 'Main ledger for tracking all settlements and payouts to sellers and travelers';
COMMENT ON TABLE "SettlementBatch" IS 'Batch processing records for bulk settlement operations';
COMMENT ON TABLE "SettlementHistory" IS 'Audit trail for all settlement status changes';
COMMENT ON TABLE "ReconciliationReport" IS 'Periodic reconciliation reports for financial auditing';
COMMENT ON FUNCTION generate_settlement_number IS 'Generates unique settlement numbers in format STL-YYYYMMDD-NNNNNN';
COMMENT ON FUNCTION create_settlement_from_escrow IS 'Creates a settlement record when escrow is released';
