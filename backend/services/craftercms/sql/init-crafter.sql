-- CrafterCMS Database Initialization Script
-- This script sets up the initial database schema for CrafterCMS

-- Create CrafterCMS specific schemas
CREATE SCHEMA IF NOT EXISTS crafter_authoring;
CREATE SCHEMA IF NOT EXISTS crafter_delivery;
CREATE SCHEMA IF NOT EXISTS crafter_audit;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- CrafterCMS Core Tables
CREATE TABLE IF NOT EXISTS crafter_authoring.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'CREATING',
    blueprint VARCHAR(255),
    created_by VARCHAR(255),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_commit_id VARCHAR(255),
    publishing_lock_owner VARCHAR(255),
    publishing_lock_heartbeat TIMESTAMP,
    state VARCHAR(50) DEFAULT 'READY',
    last_synced_gitlog_commit_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS crafter_authoring.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    externally_managed BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(255) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_date TIMESTAMP,
    expired BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    credentials_expired BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS crafter_authoring.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(255) UNIQUE NOT NULL,
    group_description TEXT,
    group_type INT DEFAULT 1,
    externally_managed BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crafter_authoring.user_groups (
    user_id UUID REFERENCES crafter_authoring.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES crafter_authoring.groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- Content Management Tables
CREATE TABLE IF NOT EXISTS crafter_authoring.content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES crafter_authoring.sites(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    preview_url TEXT,
    system_type VARCHAR(100),
    content_type VARCHAR(255),
    mime_type VARCHAR(100),
    locale VARCHAR(10) DEFAULT 'en',
    size BIGINT,
    encoding VARCHAR(50),
    created_by VARCHAR(255),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(255),
    last_modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_published_on TIMESTAMP,
    commit_id VARCHAR(255),
    state VARCHAR(50) DEFAULT 'NEW',
    locked_by VARCHAR(255),
    locked_on TIMESTAMP,
    submission_comment TEXT,
    label VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE,
    ignored BOOLEAN DEFAULT FALSE,
    in_flight BOOLEAN DEFAULT FALSE,
    publishing_package_id VARCHAR(255),
    UNIQUE(site_id, path)
);

CREATE TABLE IF NOT EXISTS crafter_authoring.content_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID REFERENCES crafter_authoring.content_items(id) ON DELETE CASCADE,
    metadata_key VARCHAR(255) NOT NULL,
    metadata_value TEXT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_item_id, metadata_key)
);

-- Workflow and Publishing Tables
CREATE TABLE IF NOT EXISTS crafter_authoring.workflow_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES crafter_authoring.sites(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES crafter_authoring.content_items(id) ON DELETE CASCADE,
    process_id VARCHAR(255),
    submitted_by VARCHAR(255),
    submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_for_deletion BOOLEAN DEFAULT FALSE,
    send_email_notification BOOLEAN DEFAULT TRUE,
    submission_comment TEXT,
    publishing_package_id VARCHAR(255),
    state VARCHAR(50) DEFAULT 'OPEN',
    publishing_status VARCHAR(50),
    label VARCHAR(255),
    endpoint VARCHAR(255),
    environment VARCHAR(255),
    scheduled_date TIMESTAMP,
    approver VARCHAR(255),
    approved_on TIMESTAMP,
    rejected_on TIMESTAMP,
    rejected_reason TEXT
);

CREATE TABLE IF NOT EXISTS crafter_authoring.publishing_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES crafter_authoring.sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(255) NOT NULL,
    server_url TEXT,
    username VARCHAR(255),
    password VARCHAR(255),
    token VARCHAR(255),
    private_key TEXT,
    bucket_name VARCHAR(255),
    bucket_region VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, name)
);

-- Audit Tables
CREATE TABLE IF NOT EXISTS crafter_audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id VARCHAR(255),
    site_id VARCHAR(255),
    operation VARCHAR(100) NOT NULL,
    operation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    origin VARCHAR(255),
    primary_target_value VARCHAR(255),
    primary_target_type VARCHAR(255),
    primary_target_subtype VARCHAR(255),
    actor_id VARCHAR(255),
    actor_details TEXT,
    cluster_node_id VARCHAR(255),
    request_id VARCHAR(255),
    request_details TEXT,
    result VARCHAR(50),
    result_details TEXT,
    parameters TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON crafter_authoring.sites(site_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON crafter_authoring.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON crafter_authoring.users(email);
CREATE INDEX IF NOT EXISTS idx_content_items_site_path ON crafter_authoring.content_items(site_id, path);
CREATE INDEX IF NOT EXISTS idx_content_items_state ON crafter_authoring.content_items(state);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON crafter_authoring.content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_workflow_items_site ON crafter_authoring.workflow_items(site_id);
CREATE INDEX IF NOT EXISTS idx_workflow_items_state ON crafter_authoring.workflow_items(state);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON crafter_audit.audit_log(operation_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON crafter_audit.audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_site ON crafter_audit.audit_log(site_id);

-- Insert default admin user (password: admin)
INSERT INTO crafter_authoring.users (username, password, first_name, last_name, email, enabled) 
VALUES ('admin', '$2a$10$vQ.jQD6x0rVlrX7U4x8pOuF1l2AjJdTgU3gJlXnYWNb5KxXbKj5yC', 'Admin', 'User', 'admin@mnbara.com', true)
ON CONFLICT (username) DO NOTHING;

-- Insert default groups
INSERT INTO crafter_authoring.groups (group_name, group_description, group_type) 
VALUES 
    ('system_admin', 'System Administrators', 2),
    ('site_admin', 'Site Administrators', 2),
    ('site_author', 'Content Authors', 2),
    ('site_publisher', 'Content Publishers', 2),
    ('site_developer', 'Site Developers', 2),
    ('site_reviewer', 'Content Reviewers', 2),
    ('site_guest', 'Guest Users', 2)
ON CONFLICT (group_name) DO NOTHING;

-- Assign admin to system_admin group
INSERT INTO crafter_authoring.user_groups (user_id, group_id)
SELECT u.id, g.id 
FROM crafter_authoring.users u, crafter_authoring.groups g 
WHERE u.username = 'admin' AND g.group_name = 'system_admin'
ON CONFLICT DO NOTHING;