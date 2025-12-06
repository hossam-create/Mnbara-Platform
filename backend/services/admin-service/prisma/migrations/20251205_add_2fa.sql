-- Migration: Add 2FA tables
-- Created: 2025-12-05
-- Purpose: Two-factor authentication support

CREATE TABLE IF NOT EXISTS user_2fa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    backup_codes JSONB,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled_at TIMESTAMP,
    last_used TIMESTAMP,
    
    CONSTRAINT valid_user CHECK (user_id > 0)
);

CREATE INDEX idx_user2fa_user ON user_2fa(user_id);
CREATE INDEX idx_user2fa_enabled ON user_2fa(enabled);

-- Add 2FA required flag to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS require_2fa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS 2fa_enforced_at TIMESTAMP;

COMMENT ON TABLE user_2fa IS 'Stores 2FA secrets and backup codes for users';
COMMENT ON COLUMN user_2fa.secret IS 'TOTP secret in base32 format';
COMMENT ON COLUMN user_2fa.backup_codes IS 'Array of one-time backup codes';
COMMENT ON COLUMN users.require_2fa IS 'Whether 2FA is mandatory for this user';
