-- Phase 5: Security & Authentication - Database Migration
-- Creates tables for RBAC, audit logging, and MFA

-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. ROLE-PERMISSION MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- 4. USER-ROLE MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER REFERENCES users(id),
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

-- ============================================
-- 5. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,
  request_body JSONB,
  response_status INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. MFA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_mfa (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  secret VARCHAR(255) NOT NULL,
  backup_codes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  replaced_by_token VARCHAR(500)
);

-- ============================================
-- 8. FAILED LOGIN ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_time ON failed_login_attempts(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ============================================
-- SEED DEFAULT ROLES
-- ============================================
INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin', 'Super Administrator with full access', true),
  ('admin', 'Administrator with management access', true),
  ('manager', 'Manager with limited access', true),
  ('viewer', 'Read-only access', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DEFAULT PERMISSIONS
-- ============================================
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Users
  ('users.read', 'users', 'read', 'View users'),
  ('users.create', 'users', 'create', 'Create users'),
  ('users.update', 'users', 'update', 'Update users'),
  ('users.delete', 'users', 'delete', 'Delete users'),
  
  -- Analytics
  ('analytics.read', 'analytics', 'read', 'View analytics'),
  
  -- KYC
  ('kyc.read', 'kyc', 'read', 'View KYC verifications'),
  ('kyc.approve', 'kyc', 'approve', 'Approve KYC'),
  ('kyc.reject', 'kyc', 'reject', 'Reject KYC'),
  
  -- Flights
  ('flights.read', 'flights', 'read', 'View flights'),
  ('flights.update', 'flights', 'update', 'Update flights'),
  
  -- Orders
  ('orders.read', 'orders', 'read', 'View orders'),
  ('orders.update', 'orders', 'update', 'Update orders'),
  
  -- Roles
  ('roles.read', 'roles', 'read', 'View roles'),
  ('roles.manage', 'roles', 'manage', 'Manage roles'),
  
  -- Audit
  ('audit.read', 'audit', 'read', 'View audit logs'),
  
  -- System
  ('system.manage', 'system', 'manage', 'Manage system settings')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin: Most permissions except system management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name NOT IN ('system.manage', 'roles.manage')
ON CONFLICT DO NOTHING;

-- Manager: Limited permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN (
    'analytics.read',
    'orders.read',
    'orders.update',
    'flights.read',
    'users.read'
  )
ON CONFLICT DO NOTHING;

-- Viewer: Read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- ============================================
-- ADD PASSWORD RESET FIELDS TO USERS
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mfa_updated_at
  BEFORE UPDATE ON user_mfa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE roles IS 'User roles for RBAC';
COMMENT ON TABLE permissions IS 'System permissions';
COMMENT ON TABLE role_permissions IS 'Mapping between roles and permissions';
COMMENT ON TABLE user_roles IS 'User role assignments';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';
COMMENT ON TABLE user_mfa IS 'Multi-factor authentication settings';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens';
COMMENT ON TABLE failed_login_attempts IS 'Failed login tracking for security';
