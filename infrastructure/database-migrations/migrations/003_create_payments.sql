-- Migration: 003_create_payments.sql
-- Description: Creates the payments table and related payment management tables
-- Created: 2024-01-01
-- Author: Mnbara Platform Team

-- UP Migration
-- ============

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    payer_id UUID REFERENCES users(id),
    payee_id UUID REFERENCES users(id),
    vendor_id UUID REFERENCES users(id),
    payment_type VARCHAR(50) NOT NULL DEFAULT 'order' CHECK (payment_type IN ('order', 'refund', 'deposit', 'withdrawal', 'payout', 'escrow_release', 'escrow_hold', 'tip', 'fee', 'subscription')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'wallet', 'paypal', 'stripe', 'paystack', 'momo', 'cash', 'crypto')),
    provider VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'disputed', 'chargeback')),
    status_reason VARCHAR(200),
    status_history JSONB DEFAULT '[]'::jsonb,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(12, 6) DEFAULT 1,
    converted_amount DECIMAL(15, 2),
    converted_currency VARCHAR(3),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    platform_fee DECIMAL(15, 2) DEFAULT 0,
    processing_fee DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    shipping_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    gross_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payout_amount DECIMAL(15, 2) DEFAULT 0,
    provider_payment_id VARCHAR(255),
    provider_transaction_id VARCHAR(255),
    provider_response JSONB DEFAULT '{}'::jsonb,
    provider_error_code VARCHAR(100),
    provider_error_message TEXT,
    card_brand VARCHAR(50),
    card_last_four VARCHAR(4),
    card_bin VARCHAR(6),
    card_hash VARCHAR(255),
    billing_address JSONB,
    billing_name VARCHAR(200),
    billing_email VARCHAR(255),
    refunded_amount DECIMAL(15, 2) DEFAULT 0,
    refund_count INTEGER DEFAULT 0,
    is_escrow BOOLEAN DEFAULT FALSE,
    escrow_id UUID,
    escrow_status VARCHAR(30) DEFAULT 'none' CHECK (escrow_status IN ('none', 'pending', 'held', 'releasing', 'released', 'returned')),
    escrow_released_at TIMESTAMP WITH TIME ZONE,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON payments(completed_at);

-- Payment Refunds Table
CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    refund_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    reason VARCHAR(200),
    reason_detail TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    provider_refund_id VARCHAR(255),
    provider_response JSONB DEFAULT '{}'::jsonb,
    order_id UUID REFERENCES orders(id),
    order_item_id UUID,
    return_id UUID,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order ON payment_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_refund_number ON payment_refunds(refund_number);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'bank_account', 'wallet', 'paypal', 'momo', 'crypto')),
    provider VARCHAR(100) NOT NULL,
    card_brand VARCHAR(50),
    card_last_four VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_hash VARCHAR(255),
    bank_name VARCHAR(200),
    bank_code VARCHAR(50),
    account_type VARCHAR(20),
    account_last_four VARCHAR(4),
    account_hash VARCHAR(255),
    wallet_address VARCHAR(255),
    wallet_type VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'removed')),
    billing_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT payment_methods_user_provider_unique UNIQUE (user_id, provider, card_last_four)
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);

-- Payment Gateway Settings Table
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_name VARCHAR(100) NOT NULL UNIQUE,
    gateway_type VARCHAR(50) NOT NULL CHECK (gateway_type IN ('stripe', 'paypal', 'paystack', 'momo', 'custom')),
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'test', 'production')),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    public_key_encrypted TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    supported_currencies JSONB DEFAULT '["USD", "EUR", "GBP"]'::jsonb,
    supported_methods JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    
    CONSTRAINT payment_gateway_settings_env_unique UNIQUE (gateway_name, environment)
);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_settings_gateway ON payment_gateway_settings(gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_settings_type ON payment_gateway_settings(gateway_type);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_settings_active ON payment_gateway_settings(is_active);

-- Payment Webhooks Table
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    headers JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'ignored')),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    payment_id UUID REFERENCES payments(id),
    processed_data JSONB DEFAULT '{}'::jsonb,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_gateway ON payment_webhooks(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_received_at ON payment_webhooks(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment ON payment_webhooks(payment_id);

-- Escrow Transactions Table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id VARCHAR(100) NOT NULL UNIQUE,
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    mediator_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    platform_fee DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'held', 'disputed', 'releasing', 'released', 'returned', 'cancelled')),
    terms TEXT,
    release_conditions JSONB DEFAULT '[]'::jsonb,
    dispute_reason TEXT,
    dispute_opened_at TIMESTAMP WITH TIME ZONE,
    dispute_resolved_at TIMESTAMP WITH TIME ZONE,
    dispute_resolution VARCHAR(20) CHECK (dispute_resolution IN ('buyer', 'seller', 'split', 'cancelled')),
    funded_at TIMESTAMP WITH TIME ZONE,
    held_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_order ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_created_at ON escrow_transactions(created_at DESC);

-- Generate payment number function
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR;
    sequence_num INTEGER;
    payment_num VARCHAR(50);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM payments
    WHERE SUBSTRING(payment_number FROM 1 FOR 8) = 'PAY-' || date_part;
    payment_num := 'PAY-' || date_part || '-' || LPAD(sequence_num::VARCHAR, 6, '0');
    RETURN payment_num;
END;
$$ LANGUAGE plpgsql;

-- Generate refund number function
CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR;
    sequence_num INTEGER;
    refund_num VARCHAR(50);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(refund_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM payment_refunds
    WHERE SUBSTRING(refund_number FROM 1 FOR 8) = 'REF-' || date_part;
    refund_num := 'REF-' || date_part || '-' || LPAD(sequence_num::VARCHAR, 6, '0');
    RETURN refund_num;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

CREATE TRIGGER payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

CREATE TRIGGER escrow_transactions_updated_at
    BEFORE UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();


-- DOWN Migration
-- =============
DROP TABLE IF EXISTS escrow_transactions CASCADE;
DROP TABLE IF EXISTS payment_webhooks CASCADE;
DROP TABLE IF EXISTS payment_gateway_settings CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payment_refunds CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP FUNCTION IF EXISTS generate_payment_number() CASCADE;
DROP FUNCTION IF EXISTS generate_refund_number() CASCADE;
