-- Migration: Create legal consent tables
-- Version: 005_legal_consent_tables
-- Created: 2024-12-21

-- Legal documents table
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    language VARCHAR(2) NOT NULL DEFAULT 'en',
    content_hash VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT legal_documents_slug_language_unique UNIQUE (slug, language)
);

-- User consents table
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    document_id UUID NOT NULL,
    document_version VARCHAR(20) NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT false,
    ip_address INET NOT NULL,
    device_fingerprint VARCHAR(64) NOT NULL,
    user_agent TEXT NOT NULL,
    locale VARCHAR(10) NOT NULL,
    accepted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_user_consents_document
        FOREIGN KEY (document_id)
        REFERENCES legal_documents(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_user_consents_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_legal_documents_slug ON legal_documents(slug);
CREATE INDEX idx_legal_documents_active ON legal_documents(is_active);
CREATE INDEX idx_user_consents_user ON user_consents(user_id);
CREATE INDEX idx_user_consents_document ON user_consents(document_id);
CREATE INDEX idx_user_consents_created ON user_consents(created_at);

-- Insert initial legal documents
INSERT INTO legal_documents (slug, version, language, content_hash, is_active) VALUES
('user-agreement', '1.0.0', 'en', 'hash_user_agreement_en_v1', true),
('user-agreement', '1.0.0', 'ar', 'hash_user_agreement_ar_v1', true),
('privacy-policy', '1.0.0', 'en', 'hash_privacy_policy_en_v1', true),
('privacy-policy', '1.0.0', 'ar', 'hash_privacy_policy_ar_v1', true),
('trust-guarantee', '1.0.0', 'en', 'hash_trust_guarantee_en_v1', true),
('trust-guarantee', '1.0.0', 'ar', 'hash_trust_guarantee_ar_v1', true),
('dispute-resolution', '1.0.0', 'en', 'hash_dispute_resolution_en_v1', true),
('dispute-resolution', '1.0.0', 'ar', 'hash_dispute_resolution_ar_v1', true),
('traveler-agreement', '1.0.0', 'en', 'hash_traveler_agreement_en_v1', true),
('traveler-agreement', '1.0.0', 'ar', 'hash_traveler_agreement_ar_v1', true),
('buyer-responsibilities', '1.0.0', 'en', 'hash_buyer_responsibilities_en_v1', true),
('buyer-responsibilities', '1.0.0', 'ar', 'hash_buyer_responsibilities_ar_v1', true),
('cookies-policy', '1.0.0', 'en', 'hash_cookies_policy_en_v1', true),
('cookies-policy', '1.0.0', 'ar', 'hash_cookies_policy_ar_v1', true),
('ai-transparency', '1.0.0', 'en', 'hash_ai_transparency_en_v1', true),
('ai-transparency', '1.0.0', 'ar', 'hash_ai_transparency_ar_v1', true);