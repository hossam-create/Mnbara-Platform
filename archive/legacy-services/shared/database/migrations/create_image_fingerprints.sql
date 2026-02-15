-- Migration: Create Image Fingerprints Table
-- Description: Stores digital fingerprints for image protection and duplicate detection
-- Date: 2024-12-13

-- Create image_fingerprints table
CREATE TABLE IF NOT EXISTS image_fingerprints (
    id VARCHAR(50) PRIMARY KEY,
    hash VARCHAR(128) NOT NULL,
    perceptual_hash VARCHAR(64) NOT NULL,
    uploader_id VARCHAR(50) NOT NULL,
    listing_id VARCHAR(50),
    original_filename VARCHAR(255),
    mime_type VARCHAR(50),
    size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    watermark_applied BOOLEAN DEFAULT false,
    watermark_type VARCHAR(20), -- 'visible', 'invisible', 'both'
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of VARCHAR(50), -- Reference to original fingerprint if duplicate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON image_fingerprints(hash);
CREATE INDEX IF NOT EXISTS idx_fingerprints_perceptual_hash ON image_fingerprints(perceptual_hash);
CREATE INDEX IF NOT EXISTS idx_fingerprints_uploader ON image_fingerprints(uploader_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_listing ON image_fingerprints(listing_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_created_at ON image_fingerprints(created_at);
CREATE INDEX IF NOT EXISTS idx_fingerprints_duplicate ON image_fingerprints(is_duplicate) WHERE is_duplicate = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_fingerprint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fingerprint_updated_at ON image_fingerprints;
CREATE TRIGGER fingerprint_updated_at
    BEFORE UPDATE ON image_fingerprints
    FOR EACH ROW
    EXECUTE FUNCTION update_fingerprint_timestamp();

-- Create view for duplicate analysis
CREATE OR REPLACE VIEW duplicate_images AS
SELECT 
    f1.id AS original_id,
    f1.uploader_id AS original_uploader,
    f1.created_at AS original_created_at,
    f2.id AS duplicate_id,
    f2.uploader_id AS duplicate_uploader,
    f2.created_at AS duplicate_created_at
FROM image_fingerprints f1
JOIN image_fingerprints f2 ON f1.perceptual_hash = f2.perceptual_hash
WHERE f1.id != f2.id
  AND f1.created_at < f2.created_at;

-- Create function to find similar images
CREATE OR REPLACE FUNCTION find_similar_images(
    p_perceptual_hash VARCHAR(64),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id VARCHAR(50),
    hash VARCHAR(128),
    perceptual_hash VARCHAR(64),
    uploader_id VARCHAR(50),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.hash,
        f.perceptual_hash,
        f.uploader_id,
        1.0::FLOAT AS similarity -- Exact match for now
    FROM image_fingerprints f
    WHERE f.perceptual_hash = p_perceptual_hash
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get fingerprint statistics
CREATE OR REPLACE FUNCTION get_fingerprint_stats()
RETURNS TABLE (
    total_fingerprints BIGINT,
    unique_hashes BIGINT,
    unique_perceptual_hashes BIGINT,
    watermarked_images BIGINT,
    duplicate_images BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_fingerprints,
        COUNT(DISTINCT hash)::BIGINT AS unique_hashes,
        COUNT(DISTINCT perceptual_hash)::BIGINT AS unique_perceptual_hashes,
        COUNT(*) FILTER (WHERE watermark_applied = true)::BIGINT AS watermarked_images,
        COUNT(*) FILTER (WHERE is_duplicate = true)::BIGINT AS duplicate_images
    FROM image_fingerprints;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE image_fingerprints IS 'Stores digital fingerprints for image protection and duplicate detection';
COMMENT ON COLUMN image_fingerprints.hash IS 'Cryptographic hash (SHA-256) of the image';
COMMENT ON COLUMN image_fingerprints.perceptual_hash IS 'Perceptual hash for similarity detection';
COMMENT ON COLUMN image_fingerprints.watermark_applied IS 'Whether watermark was applied to the image';
COMMENT ON COLUMN image_fingerprints.is_duplicate IS 'Whether this image is a duplicate of another';
