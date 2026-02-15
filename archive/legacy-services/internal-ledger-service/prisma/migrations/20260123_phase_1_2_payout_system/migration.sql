-- Migration: Add Payout System
-- Description: Manual payout system for travelers to withdraw funds
-- Date: 2026-01-23

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  wallet_id VARCHAR(255) NOT NULL,
  
  -- Amount details
  amount DECIMAL(19, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  -- PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED
  
  -- Payout method
  method VARCHAR(50) NOT NULL,
  -- BANK_TRANSFER, PAYPAL, STRIPE_TRANSFER
  
  -- Encrypted account details (JSON)
  account_details TEXT NOT NULL,
  
  -- Timestamps
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  rejected_at TIMESTAMP,
  
  -- Admin tracking
  processed_by_admin_id VARCHAR(255),
  approved_by_admin_id VARCHAR(255),
  rejected_by_admin_id VARCHAR(255),
  
  -- Notes and rejection reason
  notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_payout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payout_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_payout_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_payout_status CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED')),
  CONSTRAINT chk_payout_method CHECK (method IN ('BANK_TRANSFER', 'PAYPAL', 'STRIPE_TRANSFER'))
);

-- Create indexes for performance
CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_requests_wallet_id ON payout_requests(wallet_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_requested_at ON payout_requests(requested_at DESC);
CREATE INDEX idx_payout_requests_processed_by ON payout_requests(processed_by_admin_id);

-- Create composite index for admin queries
CREATE INDEX idx_payout_requests_status_requested ON payout_requests(status, requested_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payout_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_payout_requests_updated_at();

-- Add comment to table
COMMENT ON TABLE payout_requests IS 'Manual payout requests from travelers to withdraw funds from their wallets';
COMMENT ON COLUMN payout_requests.account_details IS 'Encrypted JSON containing bank account or payment method details';
COMMENT ON COLUMN payout_requests.status IS 'PENDING: Awaiting admin review, APPROVED: Admin approved, PROCESSING: Transfer in progress, COMPLETED: Transfer completed, REJECTED: Request rejected';
