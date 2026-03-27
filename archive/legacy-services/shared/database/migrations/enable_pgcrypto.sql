-- Enable pgcrypto extension for PostgreSQL encryption
-- Requirements: 19.1 - Enable Postgres encryption (TDE/PG Crypto)

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify extension is installed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
    ) THEN
        RAISE EXCEPTION 'pgcrypto extension failed to install';
    END IF;
END $$;

-- Create function to set encryption key in session
CREATE OR REPLACE FUNCTION set_encryption_key(key TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.encryption_key', key, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'));
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit table for encryption key rotations
CREATE TABLE IF NOT EXISTS encryption_key_audit (
    id SERIAL PRIMARY KEY,
    key_version INTEGER NOT NULL,
    rotated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    rotated_by TEXT,
    notes TEXT
);

-- Add comment
COMMENT ON TABLE encryption_key_audit IS 'Audit trail for encryption key rotations';

-- Create index
CREATE INDEX IF NOT EXISTS idx_encryption_key_audit_rotated_at 
ON encryption_key_audit(rotated_at DESC);

-- Grant permissions (adjust based on your user setup)
GRANT EXECUTE ON FUNCTION set_encryption_key(TEXT) TO mnbara_user;
GRANT EXECUTE ON FUNCTION encrypt_data(TEXT) TO mnbara_user;
GRANT EXECUTE ON FUNCTION decrypt_data(BYTEA) TO mnbara_user;

-- Log successful setup
INSERT INTO encryption_key_audit (key_version, notes)
VALUES (1, 'Initial pgcrypto setup completed');

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'pgcrypto extension enabled successfully';
    RAISE NOTICE 'Encryption functions created: set_encryption_key, encrypt_data, decrypt_data';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Set encryption key: SELECT set_encryption_key(''your-secure-key'');';
    RAISE NOTICE '2. Migrate sensitive fields to encrypted columns';
    RAISE NOTICE '3. Configure TDE at PostgreSQL server level for data-at-rest encryption';
END $$;
