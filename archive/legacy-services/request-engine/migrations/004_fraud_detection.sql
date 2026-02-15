-- Migration: Fraud Detection System
-- Description: Creates tables and indexes for fraud detection and alerts
-- Version: 004
-- Date: 2026-01-24

-- ============================================================================
-- Fraud Alerts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45) NOT NULL,
  check_type VARCHAR(50) NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  flags TEXT[] NOT NULL DEFAULT '{}',
  action VARCHAR(20) NOT NULL CHECK (action IN ('ALLOW', 'REVIEW', 'BLOCK')),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index for user lookups
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);

-- Index for IP lookups
CREATE INDEX idx_fraud_alerts_ip_address ON fraud_alerts(ip_address);

-- Index for check type
CREATE INDEX idx_fraud_alerts_check_type ON fraud_alerts(check_type);

-- Index for risk level
CREATE INDEX idx_fraud_alerts_risk_level ON fraud_alerts(risk_level);

-- Index for action
CREATE INDEX idx_fraud_alerts_action ON fraud_alerts(action);

-- Index for created_at (for time-based queries)
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at DESC);

-- Composite index for user + check type
CREATE INDEX idx_fraud_alerts_user_check ON fraud_alerts(user_id, check_type);

-- Composite index for IP + created_at (for velocity checks)
CREATE INDEX idx_fraud_alerts_ip_time ON fraud_alerts(ip_address, created_at DESC);

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_fraud_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fraud_alerts_updated_at
  BEFORE UPDATE ON fraud_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_fraud_alerts_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE fraud_alerts IS 'Stores fraud detection alerts and risk assessments';
COMMENT ON COLUMN fraud_alerts.user_id IS 'User associated with the alert (nullable for anonymous checks)';
COMMENT ON COLUMN fraud_alerts.ip_address IS 'IP address of the request';
COMMENT ON COLUMN fraud_alerts.check_type IS 'Type of fraud check performed';
COMMENT ON COLUMN fraud_alerts.risk_score IS 'Calculated risk score (0-100)';
COMMENT ON COLUMN fraud_alerts.risk_level IS 'Risk level classification';
COMMENT ON COLUMN fraud_alerts.flags IS 'Array of fraud flags detected';
COMMENT ON COLUMN fraud_alerts.action IS 'Recommended action (ALLOW, REVIEW, BLOCK)';
COMMENT ON COLUMN fraud_alerts.reasons IS 'Array of reasons for the risk assessment';
COMMENT ON COLUMN fraud_alerts.metadata IS 'Additional metadata about the check';
