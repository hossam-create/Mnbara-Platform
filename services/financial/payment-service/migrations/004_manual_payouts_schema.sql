-- Manual Payout System Schema
-- Safe, manual payout processing for Mnbarh marketplace

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(50) UNIQUE NOT NULL DEFAULT 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(MICROSECONDS FROM NOW())::text, 6, '0'),
    seller_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    payout_method VARCHAR(20) NOT NULL DEFAULT 'bank_transfer' 
        CHECK (payout_method IN ('bank_transfer', 'mobile_money', 'paypal', 'check')),
    
    -- Bank account details
    bank_account_name VARCHAR(255) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_routing_number VARCHAR(50),
    bank_swift_code VARCHAR(20),
    bank_address TEXT,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'requested' 
        CHECK (status IN ('requested', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled')),
    
    -- Processing details
    requested_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    -- Review and approval
    reviewed_by UUID,
    approved_by UUID,
    rejection_reason TEXT,
    internal_notes TEXT,
    
    -- Payment processing
    batch_id VARCHAR(50),
    transaction_reference VARCHAR(100),
    payment_confirmation TEXT,
    
    -- Metadata
    order_ids TEXT[], -- Array of order IDs that contributed to this payout
    total_orders INTEGER DEFAULT 0,
    payout_period_start DATE,
    payout_period_end DATE,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_payout_amount CHECK (amount > 0),
    CONSTRAINT positive_net_amount CHECK (net_amount >= 0),
    CONSTRAINT valid_payout_status CHECK (status IN ('requested', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled'))
);

-- Payout batches for weekly processing
CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) UNIQUE NOT NULL DEFAULT 'BATCH-' || TO_CHAR(NOW(), 'YYYYWW') || '-' || LPAD(EXTRACT(MICROSECONDS FROM NOW())::text, 6, '0'),
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Batch totals
    total_requests INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    total_fees DECIMAL(12,2) DEFAULT 0,
    total_net_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Processing status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Processing details
    processed_at TIMESTAMP,
    processed_by UUID,
    export_file_path VARCHAR(500),
    payment_confirmation TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_weekly_batch UNIQUE (week_number, year)
);

-- Payout verification documents
CREATE TABLE IF NOT EXISTS payout_verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_request_id UUID REFERENCES payout_requests(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL 
        CHECK (document_type IN ('id_proof', 'bank_statement', 'address_proof', 'business_registration', 'other')),
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT
);

-- Payout audit log
CREATE TABLE IF NOT EXISTS payout_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_request_id UUID REFERENCES payout_requests(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    performed_by UUID,
    performed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    notes TEXT
);

-- Payout settings and configuration
CREATE TABLE IF NOT EXISTS payout_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seller payout profiles
CREATE TABLE IF NOT EXISTS seller_payout_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    
    -- Default payout method
    default_payout_method VARCHAR(20) NOT NULL DEFAULT 'bank_transfer',
    
    -- Default bank account
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_routing_number VARCHAR(50),
    bank_swift_code VARCHAR(20),
    bank_address TEXT,
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level VARCHAR(20) DEFAULT 'basic' 
        CHECK (verification_level IN ('basic', 'enhanced', 'premium')),
    
    -- Limits and restrictions
    daily_limit DECIMAL(10,2) DEFAULT 1000,
    weekly_limit DECIMAL(10,2) DEFAULT 5000,
    monthly_limit DECIMAL(10,2) DEFAULT 20000,
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    last_payout_date DATE,
    total_payouts DECIMAL(12,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Payout requests indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_request_id ON payout_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at ON payout_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_payout_requests_payout_period ON payout_requests(payout_period_start, payout_period_end);
CREATE INDEX IF NOT EXISTS idx_payout_requests_batch_id ON payout_requests(batch_id);

-- Payout batches indexes
CREATE INDEX IF NOT EXISTS idx_payout_batches_batch_id ON payout_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_batches_batch_date ON payout_batches(batch_date);
CREATE INDEX IF NOT EXISTS idx_payout_batches_week_year ON payout_batches(week_number, year);
CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON payout_batches(status);

-- Verification documents indexes
CREATE INDEX IF NOT EXISTS idx_payout_verification_docs_request_id ON payout_verification_documents(payout_request_id);
CREATE INDEX IF NOT EXISTS idx_payout_verification_docs_type ON payout_verification_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_payout_verification_docs_verified ON payout_verification_documents(verified);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_payout_audit_log_request_id ON payout_audit_log(payout_request_id);
CREATE INDEX IF NOT EXISTS idx_payout_audit_log_action ON payout_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_payout_audit_log_performed_at ON payout_audit_log(performed_at);

-- Seller payout profiles indexes
CREATE INDEX IF NOT EXISTS idx_seller_payout_profiles_seller_id ON seller_payout_profiles(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payout_profiles_user_id ON seller_payout_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_payout_profiles_verified ON seller_payout_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_seller_payout_profiles_risk_score ON seller_payout_profiles(risk_score);

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
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_batches_updated_at BEFORE UPDATE ON payout_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_settings_updated_at BEFORE UPDATE ON payout_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_payout_profiles_updated_at BEFORE UPDATE ON seller_payout_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION log_payout_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payout_audit_log (
            payout_request_id, action, old_status, new_status, 
            performed_by, notes
        ) VALUES (
            NEW.id, 'status_change', OLD.status, NEW.status,
            NEW.approved_by, 
            CASE 
                WHEN NEW.status = 'approved' THEN 'Payout approved'
                WHEN NEW.status = 'rejected' THEN 'Payout rejected: ' || COALESCE(NEW.rejection_reason, 'No reason provided')
                WHEN NEW.status = 'processing' THEN 'Payout processing started'
                WHEN NEW.status = 'paid' THEN 'Payout completed'
                ELSE 'Status changed to ' || NEW.status
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_payout_status_change_trigger
    AFTER UPDATE ON payout_requests
    FOR EACH ROW EXECUTE FUNCTION log_payout_status_change();

-- Auto-calculate net amount function
CREATE OR REPLACE FUNCTION calculate_payout_net_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_amount := NEW.amount - NEW.fee_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_payout_net_amount_trigger
    BEFORE INSERT OR UPDATE ON payout_requests
    FOR EACH ROW EXECUTE FUNCTION calculate_payout_net_amount();

-- ==================== VIEWS ====================

-- Payout summary view
CREATE OR REPLACE VIEW payout_summary AS
SELECT 
    COUNT(*) as total_requests,
    SUM(amount) as total_amount,
    SUM(fee_amount) as total_fees,
    SUM(net_amount) as total_net_amount,
    COUNT(CASE WHEN status = 'requested' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_requests,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
    DATE_TRUNC('day', requested_at) as date
FROM payout_requests
WHERE requested_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', requested_at)
ORDER BY date DESC;

-- Weekly payout report view
CREATE OR REPLACE VIEW weekly_payout_report AS
SELECT 
    b.batch_id,
    b.batch_date,
    b.week_number,
    b.year,
    b.total_requests,
    b.total_amount,
    b.total_fees,
    b.total_net_amount,
    b.status,
    b.processed_at,
    COUNT(CASE WHEN pr.status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN pr.status = 'processing' THEN 1 END) as processing_count
FROM payout_batches b
LEFT JOIN payout_requests pr ON b.batch_id = pr.batch_id
GROUP BY b.id, b.batch_id, b.batch_date, b.week_number, b.year, 
         b.total_requests, b.total_amount, b.total_fees, 
         b.total_net_amount, b.status, b.processed_at
ORDER BY b.batch_date DESC;

-- ==================== INITIAL DATA ====================

-- Insert default payout settings
INSERT INTO payout_settings (setting_key, setting_value, description) VALUES
('min_payout_amount', '10.00', 'Minimum payout amount in USD'),
('max_payout_amount', '50000.00', 'Maximum payout amount in USD'),
('payout_fee_percentage', '2.5', 'Payout fee percentage'),
('payout_fee_fixed', '0.50', 'Fixed payout fee in USD'),
('weekly_payout_day', '5', 'Day of week for weekly payouts (1=Monday, 5=Friday)'),
('payout_processing_days', '3', 'Business days for payout processing'),
('auto_approval_threshold', '100.00', 'Auto-approval threshold for verified sellers'),
('manual_review_threshold', '1000.00', 'Manual review threshold amount'),
('verification_required_amount', '500.00', 'Amount requiring identity verification')
ON CONFLICT (setting_key) DO NOTHING;

-- ==================== FUNCTIONS ====================

-- Function to get seller payout summary
CREATE OR REPLACE FUNCTION get_seller_payout_summary(seller_uuid UUID)
RETURNS TABLE(
    total_requests BIGINT,
    total_amount DECIMAL,
    total_fees DECIMAL,
    total_net_amount DECIMAL,
    pending_requests BIGINT,
    approved_requests BIGINT,
    paid_requests BIGINT,
    last_request_date DATE,
    average_processing_days DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(fee_amount), 0) as total_fees,
        COALESCE(SUM(net_amount), 0) as total_net_amount,
        COUNT(CASE WHEN status = 'requested' OR status = 'under_review' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_requests,
        MAX(requested_at)::DATE as last_request_date,
        COALESCE(AVG(CASE WHEN paid_at IS NOT NULL THEN paid_at - requested_at END), 0) as average_processing_days
    FROM payout_requests
    WHERE seller_id = seller_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to create weekly payout batch
CREATE OR REPLACE FUNCTION create_weekly_payout_batch()
RETURNS UUID AS $$
DECLARE
    batch_uuid UUID;
    week_num INTEGER;
    year_num INTEGER;
    batch_date DATE;
BEGIN
    week_num := EXTRACT(WEEK FROM CURRENT_DATE);
    year_num := EXTRACT(YEAR FROM CURRENT_DATE);
    batch_date := CURRENT_DATE;
    
    INSERT INTO payout_batches (
        week_number, 
        year, 
        batch_date,
        total_requests,
        total_amount,
        total_fees,
        total_net_amount
    ) VALUES (
        week_num,
        year_num,
        batch_date,
        0,
        0,
        0,
        0
    ) RETURNING id INTO batch_uuid;
    
    RETURN batch_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate payout fee
CREATE OR REPLACE FUNCTION calculate_payout_fee(payout_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    fee_percentage DECIMAL;
    fee_fixed DECIMAL;
    calculated_fee DECIMAL;
BEGIN
    SELECT CAST(setting_value AS DECIMAL) INTO fee_percentage 
    FROM payout_settings 
    WHERE setting_key = 'payout_fee_percentage' AND is_active = TRUE;
    
    SELECT CAST(setting_value AS DECIMAL) INTO fee_fixed 
    FROM payout_settings 
    WHERE setting_key = 'payout_fee_fixed' AND is_active = TRUE;
    
    calculated_fee := (payout_amount * COALESCE(fee_percentage, 0) / 100) + COALESCE(fee_fixed, 0);
    
    RETURN calculated_fee;
END;
$$ LANGUAGE plpgsql;

COMMIT;
