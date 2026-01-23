-- Migration: Add payment and escrow fields to requests table
-- Date: 2026-01-23
-- Description: Add fields to support payment integration with Stripe and internal wallet

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_client_secret TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(19, 4),
ADD COLUMN IF NOT EXISTS payment_platform_fee DECIMAL(19, 4),
ADD COLUMN IF NOT EXISTS payment_total_amount DECIMAL(19, 4),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS escrow_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS escrow_refunded_at TIMESTAMP;

-- Add indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_requests_payment_intent_id ON requests(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_requests_payment_status ON requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_requests_escrow_status ON requests(escrow_status);

-- Add comment
COMMENT ON COLUMN requests.payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN requests.payment_client_secret IS 'Stripe PaymentIntent client secret for frontend';
COMMENT ON COLUMN requests.payment_amount IS 'Original payment amount (product price)';
COMMENT ON COLUMN requests.payment_platform_fee IS 'Platform fee (7% of amount)';
COMMENT ON COLUMN requests.payment_total_amount IS 'Total amount charged (amount + platform fee)';
COMMENT ON COLUMN requests.payment_status IS 'Payment status: PENDING, SUCCEEDED, FAILED, CANCELLED, REFUNDED';
COMMENT ON COLUMN requests.escrow_status IS 'Escrow status: HELD, RELEASED, REFUNDED';
COMMENT ON COLUMN requests.escrow_created_at IS 'Timestamp when escrow was created (funds locked)';
COMMENT ON COLUMN requests.escrow_released_at IS 'Timestamp when escrow was released (funds sent to traveler)';
COMMENT ON COLUMN requests.escrow_refunded_at IS 'Timestamp when escrow was refunded (funds returned to buyer)';
