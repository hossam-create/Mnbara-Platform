-- Migration: KYC-Lite Verification System
-- Description: Creates tables for simplified KYC verification
-- Version: 005
-- Date: 2026-01-25

-- ============================================================================
-- Verification Documents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('ID', 'PASSPORT', 'DRIVER_LICENSE')),
  front_image_url TEXT NOT NULL,
  back_image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Phone Verifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS phone_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Email Verifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Add verification fields to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_level VARCHAR(20) DEFAULT 'UNVERIFIED' 
  CHECK (verification_level IN ('UNVERIFIED', 'EMAIL_VERIFIED', 'PHONE_VERIFIED', 'ID_VERIFIED'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Verification documents indexes
CREATE INDEX idx_verification_documents_user_id ON verification_documents(user_id);
CREATE INDEX idx_verification_documents_status ON verification_documents(status);
CREATE INDEX idx_verification_documents_uploaded_at ON verification_documents(uploaded_at DESC);
CREATE INDEX idx_verification_documents_reviewed_by ON verification_documents(reviewed_by);

-- Phone verifications indexes
CREATE INDEX idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_phone_number ON phone_verifications(phone_number);
CREATE INDEX idx_phone_verifications_expires_at ON phone_verifications(expires_at);

-- Email verifications indexes
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);

-- Users verification indexes
CREATE INDEX idx_users_verification_level ON users(verification_level);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_phone_verified ON users(phone_verified);
CREATE INDEX idx_users_id_verified ON users(id_verified);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_verification_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verification_documents_updated_at
  BEFORE UPDATE ON verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_documents_updated_at();

CREATE OR REPLACE FUNCTION update_phone_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verifications_updated_at();

CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_verifications_updated_at
  BEFORE UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verifications_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE verification_documents IS 'Stores user identity documents for KYC verification';
COMMENT ON COLUMN verification_documents.user_id IS 'User who uploaded the document';
COMMENT ON COLUMN verification_documents.document_type IS 'Type of identity document';
COMMENT ON COLUMN verification_documents.front_image_url IS 'URL to front image of document';
COMMENT ON COLUMN verification_documents.back_image_url IS 'URL to back image of document (optional)';
COMMENT ON COLUMN verification_documents.status IS 'Verification status (PENDING, APPROVED, REJECTED)';
COMMENT ON COLUMN verification_documents.reviewed_by IS 'Admin who reviewed the document';
COMMENT ON COLUMN verification_documents.rejection_reason IS 'Reason for rejection if status is REJECTED';

COMMENT ON TABLE phone_verifications IS 'Stores phone verification OTP codes';
COMMENT ON COLUMN phone_verifications.otp IS 'One-time password sent via SMS';
COMMENT ON COLUMN phone_verifications.expires_at IS 'Expiration time for OTP';
COMMENT ON COLUMN phone_verifications.attempts IS 'Number of verification attempts';

COMMENT ON TABLE email_verifications IS 'Stores email verification tokens';
COMMENT ON COLUMN email_verifications.token IS 'Verification token sent via email';
COMMENT ON COLUMN email_verifications.expires_at IS 'Expiration time for token';

COMMENT ON COLUMN users.verification_level IS 'Current KYC verification level';
COMMENT ON COLUMN users.email_verified IS 'Whether email has been verified';
COMMENT ON COLUMN users.phone_verified IS 'Whether phone has been verified';
COMMENT ON COLUMN users.id_verified IS 'Whether ID document has been verified';
