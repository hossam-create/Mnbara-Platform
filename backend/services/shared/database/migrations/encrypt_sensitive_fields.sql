-- Migrate sensitive fields to encrypted columns
-- Requirements: 19.1 - Enable Postgres encryption (TDE/PG Crypto)
-- 
-- This migration adds encrypted columns for sensitive data and migrates existing data
-- Run this AFTER enable_pgcrypto.sql

-- Ensure pgcrypto is enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        RAISE EXCEPTION 'pgcrypto extension must be enabled first. Run enable_pgcrypto.sql';
    END IF;
END $$;

-- ============================================
-- KYC UPLOADS - Encrypt document numbers
-- ============================================

-- Add encrypted column for document number
ALTER TABLE "KycUpload" 
ADD COLUMN IF NOT EXISTS document_number_encrypted BYTEA;

-- Migrate existing data (if encryption key is set)
-- Note: This requires the encryption key to be set in the session
-- Example: SELECT set_encryption_key('your-key-here');

-- Add encrypted column for file URL (contains sensitive path info)
ALTER TABLE "KycUpload" 
ADD COLUMN IF NOT EXISTS file_url_encrypted BYTEA;

-- Add index for encrypted columns (for performance)
CREATE INDEX IF NOT EXISTS idx_kyc_upload_doc_encrypted 
ON "KycUpload"(document_number_encrypted) 
WHERE document_number_encrypted IS NOT NULL;

-- ============================================
-- KYC VERIFICATION - Encrypt personal info
-- ============================================

-- Add encrypted columns for PII
ALTER TABLE "KycVerification" 
ADD COLUMN IF NOT EXISTS full_legal_name_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS date_of_birth_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS address_encrypted BYTEA;

-- ============================================
-- CONSENT - Encrypt IP addresses
-- ============================================

-- Add encrypted column for IP address
ALTER TABLE "Consent" 
ADD COLUMN IF NOT EXISTS ip_address_encrypted BYTEA;

-- ============================================
-- REFRESH TOKENS - Encrypt tokens
-- ============================================

-- Add encrypted column for refresh token
ALTER TABLE "RefreshToken" 
ADD COLUMN IF NOT EXISTS token_encrypted BYTEA;

CREATE INDEX IF NOT EXISTS idx_refresh_token_encrypted 
ON "RefreshToken"(token_encrypted) 
WHERE token_encrypted IS NOT NULL;

-- ============================================
-- HELPER VIEWS FOR ENCRYPTED DATA
-- ============================================

-- Create view for decrypted KYC data (admin use only)
CREATE OR REPLACE VIEW kyc_verification_decrypted AS
SELECT 
    id,
    "userId",
    level,
    status,
    CASE 
        WHEN full_legal_name_encrypted IS NOT NULL 
        THEN decrypt_data(full_legal_name_encrypted)
        ELSE "fullLegalName"
    END as full_legal_name,
    CASE 
        WHEN date_of_birth_encrypted IS NOT NULL 
        THEN decrypt_data(date_of_birth_encrypted)
        ELSE "dateOfBirth"::TEXT
    END as date_of_birth,
    CASE 
        WHEN address_encrypted IS NOT NULL 
        THEN decrypt_data(address_encrypted)
        ELSE address
    END as address_decrypted,
    "reviewedBy",
    "reviewedAt",
    "submittedAt",
    "approvedAt",
    "createdAt",
    "updatedAt"
FROM "KycVerification";

-- Restrict view access to admins only
REVOKE ALL ON kyc_verification_decrypted FROM PUBLIC;
GRANT SELECT ON kyc_verification_decrypted TO mnbara_admin;

-- ============================================
-- MIGRATION FUNCTIONS
-- ============================================

-- Function to migrate KYC document numbers to encrypted format
CREATE OR REPLACE FUNCTION migrate_kyc_document_numbers()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER := 0;
BEGIN
    -- Check if encryption key is set
    IF current_setting('app.encryption_key', true) IS NULL THEN
        RAISE EXCEPTION 'Encryption key not set. Call set_encryption_key() first.';
    END IF;
    
    -- Migrate document numbers
    UPDATE "KycUpload"
    SET document_number_encrypted = pgp_sym_encrypt(
        "documentNumber"::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE "documentNumber" IS NOT NULL 
    AND document_number_encrypted IS NULL;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Migrated % KYC document numbers to encrypted format', rows_updated;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate KYC file URLs to encrypted format
CREATE OR REPLACE FUNCTION migrate_kyc_file_urls()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER := 0;
BEGIN
    IF current_setting('app.encryption_key', true) IS NULL THEN
        RAISE EXCEPTION 'Encryption key not set. Call set_encryption_key() first.';
    END IF;
    
    UPDATE "KycUpload"
    SET file_url_encrypted = pgp_sym_encrypt(
        "fileUrl"::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE "fileUrl" IS NOT NULL 
    AND file_url_encrypted IS NULL;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Migrated % KYC file URLs to encrypted format', rows_updated;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate KYC verification personal info
CREATE OR REPLACE FUNCTION migrate_kyc_personal_info()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER := 0;
BEGIN
    IF current_setting('app.encryption_key', true) IS NULL THEN
        RAISE EXCEPTION 'Encryption key not set. Call set_encryption_key() first.';
    END IF;
    
    -- Migrate full legal name
    UPDATE "KycVerification"
    SET full_legal_name_encrypted = pgp_sym_encrypt(
        "fullLegalName"::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE "fullLegalName" IS NOT NULL 
    AND full_legal_name_encrypted IS NULL;
    
    -- Migrate date of birth
    UPDATE "KycVerification"
    SET date_of_birth_encrypted = pgp_sym_encrypt(
        "dateOfBirth"::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE "dateOfBirth" IS NOT NULL 
    AND date_of_birth_encrypted IS NULL;
    
    -- Migrate address
    UPDATE "KycVerification"
    SET address_encrypted = pgp_sym_encrypt(
        address::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE address IS NOT NULL 
    AND address_encrypted IS NULL;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Migrated % KYC personal info records to encrypted format', rows_updated;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate consent IP addresses
CREATE OR REPLACE FUNCTION migrate_consent_ip_addresses()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER := 0;
BEGIN
    IF current_setting('app.encryption_key', true) IS NULL THEN
        RAISE EXCEPTION 'Encryption key not set. Call set_encryption_key() first.';
    END IF;
    
    UPDATE "Consent"
    SET ip_address_encrypted = pgp_sym_encrypt(
        "ipAddress"::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE "ipAddress" IS NOT NULL 
    AND ip_address_encrypted IS NULL;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Migrated % consent IP addresses to encrypted format', rows_updated;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate refresh tokens
CREATE OR REPLACE FUNCTION migrate_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER := 0;
BEGIN
    IF current_setting('app.encryption_key', true) IS NULL THEN
        RAISE EXCEPTION 'Encryption key not set. Call set_encryption_key() first.';
    END IF;
    
    UPDATE "RefreshToken"
    SET token_encrypted = pgp_sym_encrypt(
        token::TEXT, 
        current_setting('app.encryption_key')
    )
    WHERE token IS NOT NULL 
    AND token_encrypted IS NULL;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE 'Migrated % refresh tokens to encrypted format', rows_updated;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Master migration function
CREATE OR REPLACE FUNCTION migrate_all_sensitive_fields()
RETURNS TABLE(
    table_name TEXT,
    rows_migrated INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'KycUpload.documentNumber'::TEXT, migrate_kyc_document_numbers()
    UNION ALL
    SELECT 'KycUpload.fileUrl'::TEXT, migrate_kyc_file_urls()
    UNION ALL
    SELECT 'KycVerification.personalInfo'::TEXT, migrate_kyc_personal_info()
    UNION ALL
    SELECT 'Consent.ipAddress'::TEXT, migrate_consent_ip_addresses()
    UNION ALL
    SELECT 'RefreshToken.token'::TEXT, migrate_refresh_tokens();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_kyc_document_numbers() TO mnbara_admin;
GRANT EXECUTE ON FUNCTION migrate_kyc_file_urls() TO mnbara_admin;
GRANT EXECUTE ON FUNCTION migrate_kyc_personal_info() TO mnbara_admin;
GRANT EXECUTE ON FUNCTION migrate_consent_ip_addresses() TO mnbara_admin;
GRANT EXECUTE ON FUNCTION migrate_refresh_tokens() TO mnbara_admin;
GRANT EXECUTE ON FUNCTION migrate_all_sensitive_fields() TO mnbara_admin;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sensitive Fields Encryption Setup Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'To migrate existing data:';
    RAISE NOTICE '1. Set encryption key: SELECT set_encryption_key(''your-secure-key'');';
    RAISE NOTICE '2. Run migration: SELECT * FROM migrate_all_sensitive_fields();';
    RAISE NOTICE '';
    RAISE NOTICE 'After successful migration:';
    RAISE NOTICE '3. Update application code to use encrypted columns';
    RAISE NOTICE '4. Drop old unencrypted columns (backup first!)';
    RAISE NOTICE '';
    RAISE NOTICE 'Encrypted columns added:';
    RAISE NOTICE '- KycUpload: document_number_encrypted, file_url_encrypted';
    RAISE NOTICE '- KycVerification: full_legal_name_encrypted, date_of_birth_encrypted, address_encrypted';
    RAISE NOTICE '- Consent: ip_address_encrypted';
    RAISE NOTICE '- RefreshToken: token_encrypted';
END $$;
