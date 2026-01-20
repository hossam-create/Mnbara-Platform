-- CMS Tables Migration
-- Phase 2.5: CMS-Driven Homepage Architecture

-- Pages table
CREATE TABLE IF NOT EXISTS cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sections table
CREATE TABLE IF NOT EXISTS cms_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('carousel', 'deals', 'categories', 'banner', 'values', 'products')),
    title VARCHAR(255),
    enabled BOOLEAN DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Section Items table
CREATE TABLE IF NOT EXISTS cms_section_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES cms_sections(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Assets table
CREATE TABLE IF NOT EXISTS cms_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
    size_bytes INTEGER,
    alt_text VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_sections_page_id ON cms_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_sections_enabled ON cms_sections(enabled);
CREATE INDEX IF NOT EXISTS idx_cms_section_items_section_id ON cms_section_items(section_id);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_cms_pages_updated_at ON cms_pages;
CREATE TRIGGER update_cms_pages_updated_at
    BEFORE UPDATE ON cms_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cms_sections_updated_at ON cms_sections;
CREATE TRIGGER update_cms_sections_updated_at
    BEFORE UPDATE ON cms_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cms_section_items_updated_at ON cms_section_items;
CREATE TRIGGER update_cms_section_items_updated_at
    BEFORE UPDATE ON cms_section_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
