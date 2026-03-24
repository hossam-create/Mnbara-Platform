-- Escrow Kenya Integration Schema
-- For regional payment processing in Kenya and East Africa

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Escrow Kenya transactions
CREATE TABLE IF NOT EXISTS escrow_kenya_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'funded', 'released', 'refunded', 'cancelled')),
    order_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    funded_at TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    
    CONSTRAINT positive_escrow_kenya_amount CHECK (amount > 0)
);

-- Escrow Kenya payouts
CREATE TABLE IF NOT EXISTS escrow_kenya_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id VARCHAR(255) UNIQUE NOT NULL,
    seller_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    bank_account JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    transaction_id VARCHAR(255) REFERENCES escrow_kenya_transactions(transaction_id),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    CONSTRAINT positive_escrow_kenya_payout_amount CHECK (amount > 0)
);

-- Seller bank accounts for Kenya
CREATE TABLE IF NOT EXISTS seller_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'checking' 
        CHECK (account_type IN ('checking', 'savings')),
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_seller_bank_account UNIQUE (seller_id, bank_code, account_number)
);

-- M-Pesa payment records
CREATE TABLE IF NOT EXISTS mpesa_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    mpesa_receipt_number VARCHAR(50),
    checkout_request_id VARCHAR(255),
    response_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    CONSTRAINT positive_mpesa_amount CHECK (amount > 0)
);

-- Escrow Kenya webhook logs
CREATE TABLE IF NOT EXISTS escrow_kenya_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(255),
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Kenyan banks reference
CREATE TABLE IF NOT EXISTS kenyan_banks (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    swift_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Escrow Kenya transactions indexes
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_transactions_transaction_id ON escrow_kenya_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_transactions_buyer_id ON escrow_kenya_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_transactions_seller_id ON escrow_kenya_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_transactions_status ON escrow_kenya_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_transactions_created_at ON escrow_kenya_transactions(created_at);

-- Escrow Kenya payouts indexes
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_payouts_payout_id ON escrow_kenya_payouts(payout_id);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_payouts_seller_id ON escrow_kenya_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_payouts_status ON escrow_kenya_payouts(status);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_payouts_created_at ON escrow_kenya_payouts(created_at);

-- Seller bank accounts indexes
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_seller_id ON seller_bank_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_is_default ON seller_bank_accounts(is_default);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_is_verified ON seller_bank_accounts(is_verified);

-- M-Pesa payments indexes
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_transaction_id ON mpesa_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_phone_number ON mpesa_payments(phone_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_status ON mpesa_payments(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_created_at ON mpesa_payments(created_at);

-- Webhook logs indexes
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_webhook_logs_event_type ON escrow_kenya_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_webhook_logs_processed ON escrow_kenya_webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_escrow_kenya_webhook_logs_created_at ON escrow_kenya_webhook_logs(created_at);

-- ==================== TRIGGERS AND FUNCTIONS ====================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_escrow_kenya_transactions_updated_at BEFORE UPDATE ON escrow_kenya_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_kenya_payouts_updated_at BEFORE UPDATE ON escrow_kenya_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_bank_accounts_updated_at BEFORE UPDATE ON seller_bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mpesa_payments_updated_at BEFORE UPDATE ON mpesa_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default bank account per seller
CREATE OR REPLACE FUNCTION ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE seller_bank_accounts SET is_default = FALSE 
        WHERE seller_id = NEW.seller_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_bank_account_trigger
    BEFORE INSERT OR UPDATE ON seller_bank_accounts
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_bank_account();

-- ==================== VIEWS ====================

-- Escrow Kenya summary view
CREATE OR REPLACE VIEW escrow_kenya_summary AS
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN status = 'funded' THEN amount ELSE 0 END) as total_funded,
    SUM(CASE WHEN status = 'released' THEN amount ELSE 0 END) as total_released,
    SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as total_refunded,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
    COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_transactions,
    COUNT(CASE WHEN status = 'released' THEN 1 END) as released_transactions,
    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_transactions,
    DATE_TRUNC('day', created_at) as date
FROM escrow_kenya_transactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- M-Pesa payment summary view
CREATE OR REPLACE VIEW mpesa_summary AS
SELECT 
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    AVG(amount) as avg_payment_amount,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as successful_amount,
    DATE_TRUNC('day', created_at) as date
FROM mpesa_payments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ==================== INITIAL DATA ====================

-- Insert major Kenyan banks
INSERT INTO kenyan_banks (code, name, swift_code) VALUES
('01', 'Equity Bank', 'EQBLKENA'),
('07', 'Kenya Commercial Bank', 'KCBLKENA'),
('11', 'Cooperative Bank', 'KCOOKENA'),
('16', 'National Bank of Kenya', 'NBKEKENA'),
('18', 'Standard Chartered Bank', 'SCBLKENA'),
('23', 'Barclays Bank of Kenya', 'BARCKENA'),
('31', 'Family Bank', 'FMBLKENA'),
('35', 'Diamond Trust Bank', 'DTKEKENA'),
('49', 'NIC Bank', 'NCBLKENA'),
('57', 'I&M Bank', 'IMBLKENA'),
('63', 'Housing Finance', 'HFCKKENA'),
('68', 'Commercial Bank of Africa', 'CBOKENA'),
('70', 'Consolidated Bank', 'COBLKENA'),
('75', 'Credit Bank', 'CBLCKENA'),
('82', 'Sidian Bank', 'SIDNKENA'),
('88', 'Victoria Bank', 'VICBKENA'),
('90', 'Gulf African Bank', 'GAFCKENA')
ON CONFLICT (code) DO NOTHING;

-- ==================== FUNCTIONS ====================

-- Function to get escrow statistics
CREATE OR REPLACE FUNCTION get_escrow_kenya_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_transactions BIGINT,
    total_amount DECIMAL,
    successful_transactions BIGINT,
    successful_amount DECIMAL,
    pending_transactions BIGINT,
    pending_amount DECIMAL,
    refunded_transactions BIGINT,
    refunded_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(CASE WHEN status = 'released' THEN 1 END) as successful_transactions,
        COALESCE(SUM(CASE WHEN status = 'released' THEN amount ELSE 0 END), 0) as successful_amount,
        COUNT(CASE WHEN status = 'pending' OR status = 'funded' THEN 1 END) as pending_transactions,
        COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'funded' THEN amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_transactions,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as refunded_amount
    FROM escrow_kenya_transactions
    WHERE 
        (start_date IS NULL OR created_at >= start_date) AND
        (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql;

-- Function to get M-Pesa statistics
CREATE OR REPLACE FUNCTION get_mpesa_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_payments BIGINT,
    total_amount DECIMAL,
    successful_payments BIGINT,
    successful_amount DECIMAL,
    failed_payments BIGINT,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as successful_amount,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0 
        END as success_rate
    FROM mpesa_payments
    WHERE 
        (start_date IS NULL OR created_at >= start_date) AND
        (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql;

COMMIT;
