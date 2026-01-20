-- Sprint 16: Due Diligence / Data Room Mode Database Schema
-- Provides controlled, verifiable, audit-ready data room for due diligence
-- Zero noise. Full traceability. Maximum trust.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Data Room Folders Structure
CREATE TABLE data_room_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    parent_folder_id UUID REFERENCES data_room_folders(id),
    folder_name VARCHAR(200) NOT NULL,
    folder_path VARCHAR(1000) NOT NULL,
    folder_type VARCHAR(50) NOT NULL CHECK (folder_type IN ('financial', 'legal', 'operational', 'governance', 'contracts', 'tax', 'risk', 'kpi')),
    description TEXT,
    access_level VARCHAR(20) DEFAULT 'confidential' CHECK (access_level IN ('public', 'confidential', 'restricted', 'classified')),
    sort_order INTEGER DEFAULT 0,
    is_system_folder BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT data_room_folders_unique_path UNIQUE(business_account_id, folder_path),
    CONSTRAINT data_room_folders_no_self_reference CHECK (id != parent_folder_id)
);

-- Data Room Documents
CREATE TABLE data_room_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES data_room_folders(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    -- Document Information
    document_name VARCHAR(300) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('financial_statement', 'ledger_extract', 'fpna_model', 'contract', 'corporate_doc', 'tax_summary', 'risk_register', 'kpi_report', 'evidence', 'other')),
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_format VARCHAR(10) NOT NULL CHECK (file_format IN ('pdf', 'docx', 'xlsx', 'csv', 'txt', 'zip')),
    mime_type VARCHAR(100) NOT NULL,
    
    -- Content Classification
    sensitivity_level VARCHAR(20) DEFAULT 'confidential' CHECK (sensitivity_level IN ('public', 'confidential', 'restricted', 'classified')),
    data_classification VARCHAR(20) DEFAULT 'financial' CHECK (data_classification IN ('financial', 'legal', 'operational', 'governance', 'strategic')),
    
    -- Version Control
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES data_room_documents(id),
    
    -- Source Traceability
    source_system VARCHAR(100),
    source_entity_type VARCHAR(100),
    source_entity_id UUID,
    source_data_hash VARCHAR(64),
    extraction_timestamp TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('verified', 'pending', 'failed', 'manual_review')),
    
    -- Document Metadata
    description TEXT,
    tags TEXT[],
    keywords TEXT[],
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    
    -- Access Control
    requires_nda BOOLEAN DEFAULT false,
    nda_version VARCHAR(50),
    watermark_enabled BOOLEAN DEFAULT true,
    watermark_text VARCHAR(200),
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT data_room_documents_unique_name UNIQUE(folder_id, document_name, version_number)
);

-- Data Room Access Control
CREATE TABLE data_room_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    user_id UUID REFERENCES users(id),
    
    -- Access Roles
    access_role VARCHAR(30) NOT NULL CHECK (access_role IN ('data_room_admin', 'due_diligence_lead', 'legal_counsel', 'financial_analyst', 'auditor', 'viewer')),
    
    -- Folder Permissions
    can_view_financial BOOLEAN DEFAULT false,
    can_view_legal BOOLEAN DEFAULT false,
    can_view_operational BOOLEAN DEFAULT false,
    can_view_governance BOOLEAN DEFAULT false,
    can_view_contracts BOOLEAN DEFAULT false,
    can_view_tax BOOLEAN DEFAULT false,
    can_view_risk BOOLEAN DEFAULT false,
    can_view_kpi BOOLEAN DEFAULT false,
    
    -- Document Permissions
    can_download_documents BOOLEAN DEFAULT false,
    can_print_documents BOOLEAN DEFAULT false,
    can_share_documents BOOLEAN DEFAULT false,
    can_upload_documents BOOLEAN DEFAULT false,
    can_delete_documents BOOLEAN DEFAULT false,
    
    -- Access Restrictions
    access_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_end_date TIMESTAMP WITH TIME ZONE,
    ip_restriction_enabled BOOLEAN DEFAULT false,
    allowed_ip_ranges INET[],
    session_timeout_minutes INTEGER DEFAULT 120,
    require_mfa BOOLEAN DEFAULT true,
    device_restriction_enabled BOOLEAN DEFAULT false,
    
    -- NDA Requirements
    nda_signed BOOLEAN DEFAULT false,
    nda_signed_date TIMESTAMP WITH TIME ZONE,
    nda_version VARCHAR(50),
    
    -- Grant Management
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT data_room_access_unique_user UNIQUE(user_id, business_account_id),
    CONSTRAINT data_room_access_date_order CHECK (access_end_date IS NULL OR access_end_date >= access_start_date)
);

-- Data Room External Access Links
CREATE TABLE data_room_external_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    folder_id UUID REFERENCES data_room_folders(id),
    document_id UUID REFERENCES data_room_documents(id),
    
    -- Access Configuration
    access_token VARCHAR(128) UNIQUE NOT NULL,
    access_title VARCHAR(200) NOT NULL,
    access_description TEXT,
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('folder', 'document', 'evidence_pack')),
    
    -- Security Controls
    password_protected BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    nda_required BOOLEAN DEFAULT true,
    nda_text TEXT,
    
    -- Time Restrictions
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count_limit INTEGER,
    download_limit INTEGER,
    
    -- IP and Domain Restrictions
    ip_whitelist INET[],
    domain_whitelist VARCHAR[],
    country_restrictions VARCHAR[],
    
    -- Watermarking and Tracking
    watermark_enabled BOOLEAN DEFAULT true,
    watermark_text VARCHAR(200),
    track_views BOOLEAN DEFAULT true,
    track_downloads BOOLEAN DEFAULT true,
    
    -- Usage Tracking
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Creation Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    purpose TEXT,
    
    -- Constraints
    CONSTRAINT data_room_external_expires_future CHECK (expires_at > created_at)
);

-- Data Room Activity Log
CREATE TABLE data_room_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('folder_accessed', 'document_viewed', 'document_downloaded', 'document_printed', 'document_shared', 'document_uploaded', 'search_performed', 'access_granted', 'access_revoked', 'nda_signed', 'external_link_accessed')),
    activity_description TEXT NOT NULL,
    
    -- Entity Context
    entity_type VARCHAR(50) CHECK (entity_type IN ('folder', 'document', 'external_link', 'user', 'access_control')),
    entity_id UUID,
    entity_name VARCHAR(300),
    
    -- User Context
    performed_by UUID REFERENCES users(id),
    user_role VARCHAR(30),
    user_email VARCHAR(255),
    session_id VARCHAR(128),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Access Context
    access_method VARCHAR(20) CHECK (access_method IN ('direct', 'external_link', 'api', 'bulk_export')),
    external_access_token VARCHAR(128),
    
    -- Security Context
    mfa_verified BOOLEAN DEFAULT false,
    nda_verified BOOLEAN DEFAULT false,
    access_granted BOOLEAN DEFAULT true,
    access_denied_reason VARCHAR(200),
    
    -- Performance Metrics
    activity_duration_ms INTEGER,
    data_volume_bytes INTEGER,
    
    -- Document Specific
    document_version_accessed INTEGER,
    pages_viewed INTEGER,
    
    -- Temporal Data
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_start_time TIMESTAMP WITH TIME ZONE,
    session_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Additional Data
    additional_data JSONB
);

-- Data Room Evidence Packs
CREATE TABLE data_room_evidence_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    snapshot_id UUID REFERENCES investor_snapshots(id),
    
    -- Pack Configuration
    pack_name VARCHAR(200) NOT NULL,
    pack_type VARCHAR(30) NOT NULL CHECK (pack_type IN ('financial_due_diligence', 'legal_review', 'operational_audit', 'risk_assessment', 'custom')),
    pack_description TEXT,
    
    -- Content Summary
    included_folders TEXT[],
    included_documents UUID[],
    total_documents INTEGER NOT NULL,
    total_size_bytes BIGINT NOT NULL,
    
    -- Evidence Verification
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_progress', 'verified', 'failed')),
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Access Control
    access_level VARCHAR(20) DEFAULT 'restricted' CHECK (access_level IN ('public', 'confidential', 'restricted', 'classified')),
    requires_approval BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Generation Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id),
    generation_duration_ms INTEGER,
    template_version VARCHAR(20) DEFAULT '1.0',
    
    -- File Generation
    pack_file_path VARCHAR(500),
    pack_file_format VARCHAR(10) CHECK (pack_file_format IN ('pdf', 'zip')),
    pack_file_size_bytes BIGINT,
    download_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Watermarking
    watermark_enabled BOOLEAN DEFAULT true,
    watermark_text VARCHAR(200),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Room Search Index
CREATE TABLE data_room_search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    document_id UUID NOT NULL REFERENCES data_room_documents(id) ON DELETE CASCADE,
    
    -- Search Content
    searchable_content TEXT NOT NULL,
    content_type VARCHAR(20) CHECK (content_type IN ('document_name', 'description', 'content', 'tags', 'metadata')),
    
    -- Indexing Metadata
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    index_version VARCHAR(20) DEFAULT '1.0',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Relevance Scoring
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    boost_factor DECIMAL(3,2) DEFAULT 1.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Room Compliance Reports
CREATE TABLE data_room_compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    -- Report Configuration
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN ('access_summary', 'document_inventory', 'activity_audit', 'nda_compliance', 'security_review', 'data_retention')),
    report_name VARCHAR(200) NOT NULL,
    report_period_start TIMESTAMP WITH TIME ZONE,
    report_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Report Content
    report_data JSONB NOT NULL,
    summary_metrics JSONB,
    findings JSONB,
    recommendations JSONB,
    
    -- Generation Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id),
    generation_duration_ms INTEGER,
    
    -- File Output
    report_file_path VARCHAR(500),
    report_file_format VARCHAR(10) CHECK (report_file_format IN ('pdf', 'xlsx', 'csv')),
    report_file_size_bytes INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Data Room Analytics

-- Data Room Document Summary
CREATE MATERIALIZED VIEW data_room_document_summary AS
SELECT 
    business_account_id,
    folder_type,
    document_type,
    sensitivity_level,
    COUNT(*) as document_count,
    SUM(file_size_bytes) as total_size_bytes,
    AVG(file_size_bytes) as avg_file_size,
    COUNT(DISTINCT created_by) as unique_uploaders,
    MAX(created_at) as latest_upload,
    COUNT(CASE WHEN is_latest_version = true THEN 1 END) as latest_versions,
    COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_documents
FROM data_room_documents
GROUP BY business_account_id, folder_type, document_type, sensitivity_level;

-- Data Room Access Summary
CREATE MATERIALIZED VIEW data_room_access_summary AS
SELECT 
    business_account_id,
    access_role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN can_view_financial = true THEN 1 END) as financial_access,
    COUNT(CASE WHEN can_view_legal = true THEN 1 END) as legal_access,
    COUNT(CASE WHEN can_view_operational = true THEN 1 END) as operational_access,
    COUNT(CASE WHEN can_download_documents = true THEN 1 END) as download_access,
    COUNT(CASE WHEN nda_signed = true THEN 1 END) as nda_signed,
    MAX(granted_at) as latest_grant,
    COUNT(CASE WHEN revoked_at IS NULL THEN 1 END) as active_users
FROM data_room_access_control
GROUP BY business_account_id, access_role;

-- Data Room Activity Summary
CREATE MATERIALIZED VIEW data_room_activity_summary AS
SELECT 
    business_account_id,
    DATE_TRUNC('day', performed_at) as activity_date,
    activity_type,
    COUNT(*) as activity_count,
    COUNT(DISTINCT performed_by) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    SUM(activity_duration_ms) as total_duration_ms,
    SUM(data_volume_bytes) as total_data_volume,
    COUNT(CASE WHEN access_granted = false THEN 1 END) as denied_access
FROM data_room_activity_log
GROUP BY business_account_id, DATE_TRUNC('day', performed_at), activity_type;

-- Functions for Data Room Mode

-- Generate Data Room Structure Function
CREATE OR REPLACE FUNCTION generate_data_room_structure(
    p_business_account_id UUID,
    p_created_by UUID
) RETURNS VOID AS $$
DECLARE
    v_root_folder_id UUID;
    v_financial_folder_id UUID;
    v_legal_folder_id UUID;
    v_operational_folder_id UUID;
    v_governance_folder_id UUID;
    v_contracts_folder_id UUID;
    v_tax_folder_id UUID;
    v_risk_folder_id UUID;
    v_kpi_folder_id UUID;
BEGIN
    -- Create root folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        'Data Room',
        '/',
        'governance',
        'Main Data Room folder',
        true,
        p_created_by
    ) RETURNING id INTO v_root_folder_id;
    
    -- Create Financial folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_root_folder_id,
        'Financial',
        '/Financial',
        'financial',
        'Financial statements, reports, and analysis',
        true,
        p_created_by
    ) RETURNING id INTO v_financial_folder_id;
    
    -- Create Legal folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_root_folder_id,
        'Legal',
        '/Legal',
        'legal',
        'Legal documents, contracts, and compliance',
        true,
        p_created_by
    ) RETURNING id INTO v_legal_folder_id;
    
    -- Create Operational folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_root_folder_id,
        'Operational',
        '/Operational',
        'operational',
        'Operational documents and processes',
        true,
        p_created_by
    ) RETURNING id INTO v_operational_folder_id;
    
    -- Create Governance folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_root_folder_id,
        'Governance',
        '/Governance',
        'governance',
        'Governance documents and policies',
        true,
        p_created_by
    ) RETURNING id INTO v_governance_folder_id;
    
    -- Create Contracts folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_legal_folder_id,
        'Contracts',
        '/Legal/Contracts',
        'contracts',
        'Key contracts and agreements',
        true,
        p_created_by
    ) RETURNING id INTO v_contracts_folder_id;
    
    -- Create Tax folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_root_folder_id,
        'Tax',
        '/Financial/Tax',
        'tax',
        'Tax documents and summaries',
        true,
        p_created_by
    ) RETURNING id INTO v_tax_folder_id;
    
    -- Create Risk folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_governance_folder_id,
        'Risk',
        '/Governance/Risk',
        'risk',
        'Risk register and mitigation strategies',
        true,
        p_created_by
    ) RETURNING id INTO v_risk_folder_id;
    
    -- Create KPI folder
    INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        is_system_folder,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        p_business_account_id,
        v_governance_folder_id,
        'KPI',
        '/Governance/KPI',
        'kpi',
        'Key performance indicators and metrics',
        true,
        p_created_by
    ) RETURNING id INTO v_kpi_folder_id;
END;
$$ LANGUAGE plpgsql;

-- Generate Evidence Pack Function
CREATE OR REPLACE FUNCTION generate_evidence_pack(
    p_business_account_id UUID,
    p_pack_name VARCHAR(200),
    p_pack_type VARCHAR(30),
    p_folder_ids TEXT[],
    p_document_ids UUID[],
    p_access_level VARCHAR(20),
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_pack_id UUID;
    v_total_documents INTEGER := 0;
    v_total_size_bytes BIGINT := 0;
BEGIN
    -- Generate pack ID
    v_pack_id := uuid_generate_v4();
    
    -- Calculate total documents and size
    SELECT 
        COUNT(*),
        COALESCE(SUM(file_size_bytes), 0)
    INTO v_total_documents, v_total_size_bytes
    FROM data_room_documents
    WHERE folder_id = ANY(p_folder_ids)
       OR id = ANY(p_document_ids);
    
    -- Create evidence pack
    INSERT INTO data_room_evidence_packs (
        id,
        business_account_id,
        pack_name,
        pack_type,
        included_folders,
        included_documents,
        total_documents,
        total_size_bytes,
        access_level,
        generated_by
    ) VALUES (
        v_pack_id,
        p_business_account_id,
        p_pack_name,
        p_pack_type,
        p_folder_ids,
        p_document_ids,
        v_total_documents,
        v_total_size_bytes,
        p_access_level,
        p_created_by
    );
    
    RETURN v_pack_id;
END;
$$ LANGUAGE plpgsql;

-- Generate External Access Token Function
CREATE OR REPLACE FUNCTION generate_data_room_access_token(
    p_business_account_id UUID,
    p_folder_id UUID,
    p_document_id UUID,
    p_access_level VARCHAR(20),
    p_expires_hours INTEGER,
    p_access_title VARCHAR(200),
    p_created_by UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_access_token VARCHAR(128);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique access token
    v_access_token := encode(sha256(
        p_business_account_id::TEXT || 
        p_folder_id::TEXT || 
        p_document_id::TEXT ||
        CURRENT_TIMESTAMP::TEXT ||
        random()::TEXT
    ), 'hex');
    
    -- Calculate expiration
    v_expires_at := CURRENT_TIMESTAMP + (p_expires_hours || ' hours')::INTERVAL;
    
    -- Create external access
    INSERT INTO data_room_external_access (
        business_account_id,
        folder_id,
        document_id,
        access_token,
        access_title,
        access_level,
        expires_at,
        created_by
    ) VALUES (
        p_business_account_id,
        p_folder_id,
        p_document_id,
        v_access_token,
        p_access_title,
        p_access_level,
        v_expires_at,
        p_created_by
    );
    
    RETURN v_access_token;
END;
$$ LANGUAGE plpgsql;

-- Refresh Data Room Materialized Views Function
CREATE OR REPLACE FUNCTION refresh_data_room_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY data_room_document_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY data_room_access_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY data_room_activity_summary;
END;
$$ LANGUAGE plpgsql;

-- Audit Trigger for Data Room Documents
CREATE OR REPLACE FUNCTION data_room_document_audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO data_room_activity_log (
            business_account_id,
            activity_type,
            activity_description,
            entity_type,
            entity_id,
            entity_name,
            performed_by,
            data_volume_bytes
        ) VALUES (
            NEW.business_account_id,
            'document_uploaded',
            'Document uploaded: ' || NEW.document_name,
            'document',
            NEW.id,
            NEW.document_name,
            NEW.uploaded_by,
            NEW.file_size_bytes
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO data_room_activity_log (
            business_account_id,
            activity_type,
            activity_description,
            entity_type,
            entity_id,
            entity_name,
            performed_by,
            old_values,
            new_values
        ) VALUES (
            NEW.business_account_id,
            'document_updated',
            'Document updated: ' || NEW.document_name,
            'document',
            NEW.id,
            NEW.document_name,
            NEW.updated_by,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_room_document_audit
    AFTER INSERT OR UPDATE ON data_room_documents
    FOR EACH ROW EXECUTE FUNCTION data_room_document_audit_trigger();

-- Indexes for Performance
CREATE INDEX idx_data_room_folders_business_account ON data_room_folders(business_account_id);
CREATE INDEX idx_data_room_folders_parent ON data_room_folders(parent_folder_id);
CREATE INDEX idx_data_room_folders_type ON data_room_folders(folder_type);
CREATE INDEX idx_data_room_documents_folder ON data_room_documents(folder_id);
CREATE INDEX idx_data_room_documents_business ON data_room_documents(business_account_id);
CREATE INDEX idx_data_room_documents_type ON data_room_documents(document_type);
CREATE INDEX idx_data_room_documents_source ON data_room_documents(source_system, source_entity_id);
CREATE INDEX idx_data_room_documents_verification ON data_room_documents(verification_status);
CREATE INDEX idx_data_room_access_control_user ON data_room_access_control(user_id, business_account_id);
CREATE INDEX idx_data_room_external_access_token ON data_room_external_access(access_token);
CREATE INDEX idx_data_room_external_access_expires ON data_room_external_access(expires_at);
CREATE INDEX idx_data_room_activity_log_business ON data_room_activity_log(business_account_id, performed_at);
CREATE INDEX idx_data_room_activity_log_entity ON data_room_activity_log(entity_type, entity_id);
CREATE INDEX idx_data_room_search_index_document ON data_room_search_index(document_id);
CREATE INDEX idx_data_room_search_index_content ON data_room_search_index USING gin(to_tsvector('english', searchable_content));

-- Row Level Security Policies
ALTER TABLE data_room_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_external_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_evidence_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Data Room Access
CREATE POLICY data_room_folders_access ON data_room_folders
    FOR ALL TO authenticated_users
    USING (
        business_account_id IN (
            SELECT business_account_id FROM data_room_access_control 
            WHERE user_id = current_setting('app.current_user_id')::UUID
                AND (
                    (folder_type = 'financial' AND can_view_financial = true) OR
                    (folder_type = 'legal' AND can_view_legal = true) OR
                    (folder_type = 'operational' AND can_view_operational = true) OR
                    (folder_type = 'governance' AND can_view_governance = true) OR
                    (folder_type = 'contracts' AND can_view_legal = true) OR
                    (folder_type = 'tax' AND can_view_financial = true) OR
                    (folder_type = 'risk' AND can_view_risk = true) OR
                    (folder_type = 'kpi' AND can_view_kpi = true)
                )
                AND (revoked_at IS NULL)
                AND (access_end_date IS NULL OR access_end_date >= CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY data_room_documents_access ON data_room_documents
    FOR ALL TO authenticated_users
    USING (
        business_account_id IN (
            SELECT business_account_id FROM data_room_access_control 
            WHERE user_id = current_setting('app.current_user_id')::UUID
                AND (revoked_at IS NULL)
                AND (access_end_date IS NULL OR access_end_date >= CURRENT_TIMESTAMP)
        )
        AND folder_id IN (
            SELECT id FROM data_room_folders WHERE business_account_id = data_room_documents.business_account_id
        )
    );

-- Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON data_room_folders TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_room_documents TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_room_access_control TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_room_external_access TO authenticated_users;
GRANT SELECT, INSERT ON data_room_activity_log TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_room_evidence_packs TO authenticated_users;
GRANT SELECT, INSERT ON data_room_search_index TO authenticated_users;
GRANT SELECT, INSERT ON data_room_compliance_reports TO authenticated_users;

-- Grant Usage on Materialized Views
GRANT SELECT ON data_room_document_summary TO authenticated_users;
GRANT SELECT ON data_room_access_summary TO authenticated_users;
GRANT SELECT ON data_room_activity_summary TO authenticated_users;

COMMIT;
