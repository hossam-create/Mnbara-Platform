-- ============================================
-- Owner Account Setup Script
-- Run this to create owner accounts for both dashboards
-- ============================================

-- Admin Dashboard Owner Account
-- Database: mnbara_admin
INSERT INTO admin_users (
    id,
    email,
    password_hash,
    name,
    role,
    permissions,
    department,
    is_active,
    is_owner,
    email_verified,
    created_at,
    updated_at,
    last_login
) VALUES (
    'owner-admin-001',
    'owner@mnbarh.com',
    '$2b$12$LQv3c1yqBwlVHpPRrGNub.gDU4pPeGMRX.4WMRkHskxMc9q1a6S7.',  -- MnbaraOwner2026!
    'Project Owner',
    'SUPER_ADMIN',
    '["ALL_PERMISSIONS", "USER_MANAGEMENT", "ORDER_MANAGEMENT", "ANALYTICS", "FINANCIAL_MANAGEMENT", "SYSTEM_SETTINGS", "CONTENT_MANAGEMENT", "DISPUTE_RESOLUTION", "KYC_MANAGEMENT", "REPORT_GENERATION"]',
    'EXECUTIVE',
    true,
    true,
    true,
    NOW(),
    NOW(),
    NULL
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_owner = EXCLUDED.is_owner,
    updated_at = NOW();

-- System Control Owner Account  
-- Database: mnbara_system_control
INSERT INTO system_users (
    id,
    email,
    password_hash,
    name,
    role,
    clearance_level,
    department,
    permissions,
    mfa_enabled,
    mfa_secret,
    backup_codes,
    is_active,
    is_owner,
    session_timeout,
    ip_whitelist,
    emergency_access,
    created_at,
    updated_at,
    last_login
) VALUES (
    'sys-owner-001',
    'owner@mnbarh.com',
    '$2b$12$LQv3c1yqBwlVHpPRrGNub.gDU4pPeGMRX.4WMRkHskxMc9q1a6S7.',  -- SystemControl2026!
    'Project Owner',
    'SYSTEM_ADMIN',
    'L5',
    'EXECUTIVE',
    '["ALL_SYSTEM_PERMISSIONS", "SYSTEM_MONITORING", "PERFORMANCE_MONITORING", "SECURITY_MONITORING", "LOG_ACCESS", "AI_PROBLEM_SOLVER", "DEPARTMENT_ACCESS", "EMERGENCY_CONTROLS", "USER_MANAGEMENT", "AUDIT_ACCESS"]',
    true,
    'JBSWY3DPEHPK3PXP',  -- Base32 secret for MFA setup
    '["123456", "789012", "345678", "901234", "567890", "246810", "135792", "864209", "753951", "159357"]',
    true,
    true,
    3600,  -- 1 hour session timeout
    '["127.0.0.1", "::1", "192.168.1.0/24", "10.0.0.0/8"]',  -- Local network access
    true,
    NOW(),
    NOW(),
    NULL
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    clearance_level = EXCLUDED.clearance_level,
    permissions = EXCLUDED.permissions,
    is_owner = EXCLUDED.is_owner,
    emergency_access = EXCLUDED.emergency_access,
    updated_at = NOW();

-- Create additional admin roles for team members
INSERT INTO admin_roles (
    id,
    name,
    description,
    permissions,
    created_at
) VALUES 
    ('role-admin', 'Administrator', 'Full admin access except owner functions', '["USER_MANAGEMENT", "ORDER_MANAGEMENT", "ANALYTICS", "CONTENT_MANAGEMENT"]', NOW()),
    ('role-manager', 'Manager', 'Department management access', '["DEPARTMENT_MANAGEMENT", "REPORTS", "USER_SUPPORT"]', NOW()),
    ('role-support', 'Support', 'Customer support access', '["USER_SUPPORT", "DISPUTE_RESOLUTION", "ORDER_VIEW"]', NOW()),
    ('role-analyst', 'Analyst', 'Analytics and reporting access', '["ANALYTICS", "REPORTS", "DATA_EXPORT"]', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create system clearance levels
INSERT INTO system_clearance_levels (
    level,
    name,
    description,
    max_permissions,
    created_at
) VALUES
    ('L1', 'Basic Monitoring', 'Basic system monitoring access', '["SYSTEM_MONITORING"]', NOW()),
    ('L2', 'Advanced Monitoring', 'Advanced monitoring and analysis', '["SYSTEM_MONITORING", "PERFORMANCE_MONITORING", "AI_PROBLEM_SOLVER"]', NOW()),
    ('L3', 'Security Access', 'Security monitoring and controls', '["SYSTEM_MONITORING", "PERFORMANCE_MONITORING", "SECURITY_MONITORING", "LOG_ACCESS"]', NOW()),
    ('L4', 'Emergency Access', 'Emergency controls access', '["SYSTEM_MONITORING", "PERFORMANCE_MONITORING", "SECURITY_MONITORING", "LOG_ACCESS", "EMERGENCY_CONTROLS"]', NOW()),
    ('L5', 'Full Access', 'Complete system access', '["ALL_SYSTEM_PERMISSIONS"]', NOW())
ON CONFLICT (level) DO NOTHING;

-- Create audit log entry for owner account creation
INSERT INTO audit_logs (
    id,
    user_id,
    action,
    resource,
    details,
    ip_address,
    user_agent,
    timestamp
) VALUES (
    gen_random_uuid(),
    'system',
    'OWNER_ACCOUNT_CREATED',
    'USER_MANAGEMENT',
    '{"message": "Owner accounts created for both admin and system control dashboards", "email": "owner@mnbarh.com"}',
    '127.0.0.1',
    'Setup Script',
    NOW()
);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Owner accounts created successfully!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Admin Dashboard (Port 3000):';
    RAISE NOTICE 'Email: owner@mnbarh.com';
    RAISE NOTICE 'Password: MnbaraOwner2026!';
    RAISE NOTICE 'Role: SUPER_ADMIN';
    RAISE NOTICE '';
    RAISE NOTICE 'System Control Dashboard (Port 3001):';
    RAISE NOTICE 'Email: owner@mnbarh.com';
    RAISE NOTICE 'Password: SystemControl2026!';
    RAISE NOTICE 'Role: SYSTEM_ADMIN (L5 Clearance)';
    RAISE NOTICE 'MFA: Required (scan QR code on first login)';
    RAISE NOTICE '';
    RAISE NOTICE 'Backup MFA Codes: 123456, 789012, 345678, 901234, 567890';
    RAISE NOTICE '============================================';
END $$;