-- ============================================================
-- PHASE 4.2 — ESCROW SCHEMA
-- State machine for fund holding — DOES NOT OWN MONEY
-- Money stays in wallets, tracked via ledger entries
-- ============================================================

-- ENUM: Escrow Status (State Machine)
CREATE TYPE escrow_status AS ENUM (
    'CREATED',      -- Escrow created, awaiting buyer funding
    'FUNDED',       -- Buyer funds held (PURCHASE_HOLD applied)
    'RELEASED',     -- Funds released to seller (PAYOUT applied)
    'REFUNDED',     -- Funds returned to buyer (REFUND applied)
    'DISPUTED',     -- Under manual review
    'CANCELLED'     -- Cancelled before funding
);

-- ENUM: Escrow Reference Type
CREATE TYPE escrow_reference_type AS ENUM (
    'ORDER',        -- Standard purchase order
    'AUCTION',      -- Auction winning bid
    'MANUAL'        -- Manual escrow (admin-created)
);

-- ============================================================
-- ESCROW TABLE
-- This is a STATE MACHINE record, NOT a money container
-- All money operations use existing wallet/ledger infrastructure
-- ============================================================
CREATE TABLE escrow (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parties involved (wallet IDs, NOT money storage)
    buyer_wallet_id     UUID NOT NULL,
    seller_wallet_id    UUID NOT NULL,
    
    -- Amount to hold (integer, minor units)
    amount              BIGINT NOT NULL CHECK (amount > 0),
    currency            CHAR(3) NOT NULL DEFAULT 'EGP',
    
    -- State machine
    status              escrow_status NOT NULL DEFAULT 'CREATED',
    
    -- What triggered this escrow
    reference_type      escrow_reference_type NOT NULL,
    reference_id        VARCHAR(255) NOT NULL,
    
    -- Optional description
    description         TEXT,
    
    -- Ledger entry references (for audit trail linkage)
    hold_entry_id       UUID,           -- Links to ledger_entry when funds held
    release_entry_id    UUID,           -- Links to ledger_entry when funds released
    refund_entry_id     UUID,           -- Links to ledger_entry when funds refunded
    
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    funded_at           TIMESTAMPTZ,    -- When buyer funds were held
    released_at         TIMESTAMPTZ,    -- When funds were released to seller
    refunded_at         TIMESTAMPTZ,    -- When funds were refunded to buyer
    disputed_at         TIMESTAMPTZ,    -- When dispute was opened
    resolved_at         TIMESTAMPTZ,    -- When dispute was resolved
    
    -- Audit fields
    created_by          VARCHAR(255) NOT NULL,  -- Who created this escrow
    released_by         VARCHAR(255),           -- Who released the funds
    refunded_by         VARCHAR(255),           -- Who refunded the funds
    dispute_reason      TEXT,                   -- Reason for dispute
    resolution_note     TEXT,                   -- How dispute was resolved
    
    -- Constraints
    CONSTRAINT uq_escrow_reference UNIQUE (reference_type, reference_id),
    CONSTRAINT fk_buyer_wallet FOREIGN KEY (buyer_wallet_id) REFERENCES wallet(id),
    CONSTRAINT fk_seller_wallet FOREIGN KEY (seller_wallet_id) REFERENCES wallet(id),
    CONSTRAINT fk_hold_entry FOREIGN KEY (hold_entry_id) REFERENCES ledger_entry(id),
    CONSTRAINT fk_release_entry FOREIGN KEY (release_entry_id) REFERENCES ledger_entry(id),
    CONSTRAINT fk_refund_entry FOREIGN KEY (refund_entry_id) REFERENCES ledger_entry(id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_escrow_buyer ON escrow (buyer_wallet_id);
CREATE INDEX idx_escrow_seller ON escrow (seller_wallet_id);
CREATE INDEX idx_escrow_status ON escrow (status);
CREATE INDEX idx_escrow_reference ON escrow (reference_type, reference_id);
CREATE INDEX idx_escrow_created_at ON escrow (created_at DESC);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_escrow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_escrow_update_timestamp
    BEFORE UPDATE ON escrow
    FOR EACH ROW
    EXECUTE FUNCTION update_escrow_timestamp();

-- ============================================================
-- FUNCTION: Validate State Transition
-- Ensures only valid state transitions occur
-- ============================================================
CREATE OR REPLACE FUNCTION validate_escrow_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid transitions
    IF OLD.status = 'CREATED' THEN
        IF NEW.status NOT IN ('FUNDED', 'CANCELLED') THEN
            RAISE EXCEPTION 'INVALID_TRANSITION: Cannot go from CREATED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'FUNDED' THEN
        IF NEW.status NOT IN ('RELEASED', 'REFUNDED', 'DISPUTED') THEN
            RAISE EXCEPTION 'INVALID_TRANSITION: Cannot go from FUNDED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'DISPUTED' THEN
        IF NEW.status NOT IN ('RELEASED', 'REFUNDED') THEN
            RAISE EXCEPTION 'INVALID_TRANSITION: Cannot go from DISPUTED to %', NEW.status;
        END IF;
    ELSIF OLD.status IN ('RELEASED', 'REFUNDED', 'CANCELLED') THEN
        -- Terminal states - no transitions allowed
        RAISE EXCEPTION 'INVALID_TRANSITION: % is a terminal state', OLD.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_escrow_validate_transition
    BEFORE UPDATE OF status ON escrow
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_escrow_transition();

-- ============================================================
-- VIEW: Escrow Summary
-- For admin dashboard
-- ============================================================
CREATE VIEW escrow_summary_view AS
SELECT 
    e.id,
    e.status,
    e.amount,
    e.currency,
    e.reference_type,
    e.reference_id,
    bw.owner_type AS buyer_type,
    bw.owner_id AS buyer_id,
    sw.owner_type AS seller_type,
    sw.owner_id AS seller_id,
    e.created_at,
    e.funded_at,
    e.released_at,
    e.refunded_at,
    e.disputed_at
FROM escrow e
JOIN wallet bw ON e.buyer_wallet_id = bw.id
JOIN wallet sw ON e.seller_wallet_id = sw.id;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE escrow IS 'State machine for fund holding - does NOT own money';
COMMENT ON COLUMN escrow.buyer_wallet_id IS 'Wallet that funds are debited from';
COMMENT ON COLUMN escrow.seller_wallet_id IS 'Wallet that funds are credited to on release';
COMMENT ON COLUMN escrow.amount IS 'Amount in minor units (e.g., 1000 = 10.00 EGP)';
COMMENT ON COLUMN escrow.hold_entry_id IS 'Ledger entry ID when PURCHASE_HOLD was applied';
COMMENT ON COLUMN escrow.release_entry_id IS 'Ledger entry ID when PAYOUT was applied';
COMMENT ON COLUMN escrow.refund_entry_id IS 'Ledger entry ID when REFUND was applied';
