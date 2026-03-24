-- ============================================================
-- PHASE 4.1 — WALLET & LEDGER SCHEMA
-- Production-grade, ledger-first design
-- Money stored as INTEGER (minor units): 1000 = 10.00 EGP
-- ============================================================

-- ENUM: Wallet Owner Types
CREATE TYPE owner_type AS ENUM ('USER', 'SELLER', 'TRAVELER', 'SYSTEM');

-- ENUM: Wallet Status
CREATE TYPE wallet_status AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- ENUM: Ledger Entry Type (double-entry direction)
CREATE TYPE entry_type AS ENUM ('CREDIT', 'DEBIT');

-- ENUM: Ledger Reason (business operation)
CREATE TYPE ledger_reason AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'PURCHASE_HOLD',
    'PURCHASE_RELEASE',
    'REFUND',
    'PAYOUT',
    'FEE',
    'ADJUSTMENT',
    'TRANSFER_IN',
    'TRANSFER_OUT'
);

-- ENUM: Reference Type (what triggered this entry)
CREATE TYPE reference_type AS ENUM ('ORDER', 'ESCROW', 'TRANSFER', 'MANUAL', 'SYSTEM');

-- ============================================================
-- WALLET TABLE
-- Balance is DERIVED from ledger, not stored directly
-- ============================================================
CREATE TABLE wallet (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type      owner_type NOT NULL,
    owner_id        VARCHAR(255) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'EGP',
    status          wallet_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one wallet per owner per currency
    CONSTRAINT uq_wallet_owner_currency UNIQUE (owner_type, owner_id, currency)
);

-- Index for fast lookup by owner
CREATE INDEX idx_wallet_owner ON wallet (owner_type, owner_id);
CREATE INDEX idx_wallet_status ON wallet (status);

-- ============================================================
-- LEDGER ENTRY TABLE (SOURCE OF TRUTH)
-- Immutable: INSERT only, no UPDATE or DELETE
-- ============================================================
CREATE TABLE ledger_entry (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id           UUID NOT NULL REFERENCES wallet(id),
    
    -- Entry classification
    entry_type          entry_type NOT NULL,
    amount              BIGINT NOT NULL CHECK (amount > 0),
    
    -- Business context
    reason              ledger_reason NOT NULL,
    description         TEXT,
    
    -- Reference linking
    reference_type      reference_type NOT NULL,
    reference_id        VARCHAR(255),
    
    -- Idempotency protection
    idempotency_key     VARCHAR(255) NOT NULL,
    
    -- Running balance after this entry (for fast reads)
    balance_after       BIGINT NOT NULL,
    
    -- Audit trail
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255) NOT NULL,
    
    -- Prevent duplicate operations
    CONSTRAINT uq_ledger_idempotency UNIQUE (wallet_id, idempotency_key)
);

-- Indexes for common query patterns
CREATE INDEX idx_ledger_wallet_created ON ledger_entry (wallet_id, created_at DESC);
CREATE INDEX idx_ledger_reference ON ledger_entry (reference_type, reference_id);
CREATE INDEX idx_ledger_reason ON ledger_entry (reason, created_at DESC);

-- Additional indexes for Control Center queries
CREATE INDEX idx_wallet_owner_type_status ON wallet (owner_type, status);
CREATE INDEX idx_wallet_created_at ON wallet (created_at DESC);
CREATE INDEX idx_ledger_created_at ON ledger_entry (created_at DESC);
CREATE INDEX idx_ledger_entry_type_created ON ledger_entry (entry_type, created_at DESC);
CREATE INDEX idx_ledger_created_by ON ledger_entry (created_by, created_at DESC);

-- ============================================================
-- VIEW: Wallet Balance (Derived from Ledger)
-- ============================================================
CREATE VIEW wallet_balance_view AS
SELECT 
    w.id AS wallet_id,
    w.owner_type,
    w.owner_id,
    w.currency,
    w.status,
    COALESCE(
        (SELECT balance_after 
         FROM ledger_entry 
         WHERE wallet_id = w.id 
         ORDER BY created_at DESC 
         LIMIT 1
        ), 0
    )::BIGINT AS balance,
    w.created_at,
    w.updated_at
FROM wallet w;

-- ============================================================
-- FUNCTION: Get Wallet Balance
-- Calculates balance from ledger entries
-- ============================================================
CREATE OR REPLACE FUNCTION get_wallet_balance(p_wallet_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_balance BIGINT;
BEGIN
    SELECT COALESCE(balance_after, 0)
    INTO v_balance
    FROM ledger_entry
    WHERE wallet_id = p_wallet_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: Insert Ledger Entry (Atomic)
-- Ensures atomicity and calculates running balance
-- ============================================================
CREATE OR REPLACE FUNCTION insert_ledger_entry(
    p_wallet_id UUID,
    p_entry_type entry_type,
    p_amount BIGINT,
    p_reason ledger_reason,
    p_description TEXT,
    p_reference_type reference_type,
    p_reference_id VARCHAR(255),
    p_idempotency_key VARCHAR(255),
    p_created_by VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
    v_entry_id UUID;
    v_current_balance BIGINT;
    v_new_balance BIGINT;
    v_wallet_status wallet_status;
BEGIN
    -- Lock wallet row for update
    SELECT status INTO v_wallet_status 
    FROM wallet 
    WHERE id = p_wallet_id 
    FOR UPDATE;
    
    IF v_wallet_status IS NULL THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: %', p_wallet_id;
    END IF;
    
    IF v_wallet_status != 'ACTIVE' THEN
        RAISE EXCEPTION 'WALLET_%: %', v_wallet_status, p_wallet_id;
    END IF;
    
    -- Get current balance
    v_current_balance := get_wallet_balance(p_wallet_id);
    
    -- Calculate new balance
    IF p_entry_type = 'CREDIT' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSE
        v_new_balance := v_current_balance - p_amount;
    END IF;
    
    -- Prevent negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE: current=%, requested=%', 
            v_current_balance, p_amount;
    END IF;
    
    -- Insert ledger entry
    INSERT INTO ledger_entry (
        wallet_id, entry_type, amount, reason, description,
        reference_type, reference_id, idempotency_key, balance_after, created_by
    ) VALUES (
        p_wallet_id, p_entry_type, p_amount, p_reason, p_description,
        p_reference_type, p_reference_id, p_idempotency_key, v_new_balance, p_created_by
    )
    RETURNING id INTO v_entry_id;
    
    -- Update wallet timestamp
    UPDATE wallet SET updated_at = NOW() WHERE id = p_wallet_id;
    
    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Prevent Ledger Entry Updates
-- Ensures immutability
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_ledger_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'LEDGER_IMMUTABLE: Updates not allowed on ledger_entry';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ledger_no_update
    BEFORE UPDATE ON ledger_entry
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_update();

CREATE TRIGGER tr_ledger_no_delete
    BEFORE DELETE ON ledger_entry
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_update();
