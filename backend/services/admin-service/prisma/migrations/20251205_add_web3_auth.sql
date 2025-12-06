-- Migration: Add Web3 authentication tables

-- Wallet nonces for SIWE
CREATE TABLE IF NOT EXISTS wallet_nonces (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    nonce VARCHAR(66) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_nonces_address ON wallet_nonces(wallet_address);
CREATE INDEX idx_wallet_nonces_expires ON wallet_nonces(expires_at);

-- Refresh tokens for session management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    device_info JSONB,
    
    CONSTRAINT valid_user CHECK (user_id > 0)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Add Web3-related fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'traditional',
ADD COLUMN IF NOT EXISTS ens_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS wallet_verified BOOLEAN DEFAULT FALSE;

-- Cleanup expired nonces function
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
    DELETE FROM wallet_nonces WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired refresh tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE wallet_nonces IS 'Stores temporary nonces for wallet signature verification';
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for session management';
COMMENT ON COLUMN users.auth_method IS 'Authentication method: traditional, web3, or hybrid';
COMMENT ON COLUMN users.ens_name IS 'Ethereum Name Service (ENS) name if available';
