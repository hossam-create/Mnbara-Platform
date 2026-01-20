-- Migration: Financial Security and Closing Controls
-- Sprint 8: Enterprise-grade protection and financial close

-- Create financial period status table
CREATE TABLE IF NOT EXISTS financial_period_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    period_status VARCHAR(20) NOT NULL, -- OPEN, LOCKED, CLOSED, FINAL
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    final_at TIMESTAMP WITH TIME ZONE,
    finalized_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Closing metadata
    closing_notes TEXT,
    closing_adjustments JSONB DEFAULT '{}',
    audit_trail JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_period_status UNIQUE (business_account_id, fiscal_year, fiscal_quarter, fiscal_month),
    CONSTRAINT valid_period_status CHECK (period_status IN ('OPEN', 'LOCKED', 'CLOSED', 'FINAL')),
    CONSTRAINT valid_quarter CHECK (fiscal_quarter IS NULL OR (fiscal_quarter >= 1 AND fiscal_quarter <= 4)),
    CONSTRAINT valid_month CHECK (fiscal_month IS NULL OR (fiscal_month >= 1 AND fiscal_month <= 12))
);

-- Create financial assumption versions table
CREATE TABLE IF NOT EXISTS financial_assumption_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    assumption_key VARCHAR(100) NOT NULL,
    version_number INTEGER NOT NULL,
    version_status VARCHAR(20) NOT NULL, -- DRAFT, ACTIVE, SUPERSEDED, ARCHIVED
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Version data
    assumption_value DECIMAL(20,4),
    previous_value DECIMAL(20,4),
    change_reason TEXT,
    change_description TEXT,
    
    -- Approval workflow
    approval_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_assumption_version UNIQUE (business_account_id, assumption_key, version_number),
    CONSTRAINT valid_version_status CHECK (version_status IN ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED')),
    CONSTRAINT valid_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Create financial close events table
CREATE TABLE IF NOT EXISTS financial_close_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    close_type VARCHAR(50) NOT NULL, -- MONTHLY_CLOSE, QUARTERLY_CLOSE, YEARLY_CLOSE, ADJUSTING_ENTRY
    close_status VARCHAR(20) NOT NULL, -- INITIATED, IN_PROGRESS, COMPLETED, FAILED
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    
    -- Close details
    close_date DATE NOT NULL,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Close results
    total_revenue DECIMAL(20,4),
    total_expenses DECIMAL(20,4),
    net_income DECIMAL(20,4),
    total_assets DECIMAL(20,4),
    total_liabilities DECIMAL(20,4),
    total_equity DECIMAL(20,4),
    
    -- Adjustments and corrections
    adjusting_entries JSONB DEFAULT '[]',
    correction_notes TEXT,
    
    -- Audit information
    close_summary TEXT,
    audit_trail JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_close_type CHECK (close_type IN ('MONTHLY_CLOSE', 'QUARTERLY_CLOSE', 'YEARLY_CLOSE', 'ADJUSTING_ENTRY')),
    CONSTRAINT valid_close_status CHECK (close_status IN ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'))
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS financial_security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- DATA_ACCESS, PERMISSION_CHANGE, CLOSE_ATTEMPT, DATA_MODIFICATION, SYSTEM_CONFIG_CHANGE
    event_severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    event_description TEXT NOT NULL,
    
    -- Event details
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Event data
    old_value JSONB,
    new_value JSONB,
    affected_records JSONB DEFAULT '[]',
    
    -- System context
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    api_endpoint VARCHAR(200),
    
    -- Resolution
    resolution_status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_event_type CHECK (event_type IN ('DATA_ACCESS', 'PERMISSION_CHANGE', 'CLOSE_ATTEMPT', 'DATA_MODIFICATION', 'SYSTEM_CONFIG_CHANGE')),
    CONSTRAINT valid_event_severity CHECK (event_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT valid_resolution_status CHECK (resolution_status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'))
);

-- Create role-based financial permissions table
CREATE TABLE IF NOT EXISTS financial_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL, -- FINANCIAL_ADMIN, FINANCIAL_MANAGER, FINANCIAL_VIEWER, AUDITOR
    permissions JSONB NOT NULL, -- Array of permission strings
    
    -- Role configuration
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_role_permissions UNIQUE (business_account_id, role_name),
    CONSTRAINT valid_role_name CHECK (role_name IN ('FINANCIAL_ADMIN', 'FINANCIAL_MANAGER', 'FINANCIAL_VIEWER', 'AUDITOR'))
);

-- Create financial data change tracking table
CREATE TABLE IF NOT EXISTS financial_data_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL, -- financial_statements, financial_assumptions, forecast_scenarios, etc.
    record_id UUID NOT NULL, -- ID of the changed record
    operation_type VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    field_name VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    
    -- Change metadata
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    change_category VARCHAR(50), -- CORRECTION, ADJUSTMENT, SYSTEM_UPDATE, USER_ACTION
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_operation_type CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT valid_change_category CHECK (change_category IN ('CORRECTION', 'ADJUSTMENT', 'SYSTEM_UPDATE', 'USER_ACTION'))
);

-- Create financial close approvals table
CREATE TABLE IF NOT EXISTS financial_close_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    close_event_id UUID NOT NULL REFERENCES financial_close_events(id) ON DELETE CASCADE,
    
    -- Approval details
    approver_role VARCHAR(50) NOT NULL, -- PRIMARY_APPROVER, SECONDARY_APPROVER, FINAL_APPROVER
    approval_status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED
    approval_level INTEGER NOT NULL, -- 1, 2, 3 for multi-level approval
    approval_comments TEXT,
    
    -- User information
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delegated_by UUID REFERENCES users(id) ON DELETE SET NULL, -- If approved on behalf of someone
    
    approval_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT valid_approver_role CHECK (approver_role IN ('PRIMARY_APPROVER', 'SECONDARY_APPROVER', 'FINAL_APPROVER'))
);

-- Create materialized view for financial period status
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_period_status AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    fps.fiscal_year,
    fps.fiscal_quarter,
    fps.fiscal_month,
    COALESCE(fps.period_status, 'OPEN') as period_status,
    fps.locked_at,
    fps.closed_at,
    fps.final_at,
    CASE 
        WHEN fps.locked_by IS NOT NULL THEN u1.email
        ELSE NULL
    END as locked_by_email,
    CASE 
        WHEN fps.closed_by IS NOT NULL THEN u2.email
        ELSE NULL
    END as closed_by_email,
    CASE 
        WHEN fps.finalized_by IS NOT NULL THEN u3.email
        ELSE NULL
    END as finalized_by_email,
    fps.closing_notes,
    fps.closing_adjustments,
    fps.created_at as period_created_at,
    fps.updated_at as period_updated_at
    
FROM business_accounts ba
JOIN financial_period_status fps ON ba.id = fps.business_account_id
LEFT JOIN users u1 ON fps.locked_by = u1.id
LEFT JOIN users u2 ON fps.closed_by = u2.id
LEFT JOIN users u3 ON fps.finalized_by = u3.id
LEFT JOIN fiscal_periods fp ON fps.fiscal_year = fp.fiscal_year 
    AND COALESCE(fps.fiscal_quarter, 0) = COALESCE(fp.fiscal_quarter, 0)
    AND COALESCE(fps.fiscal_month, 0) = COALESCE(fp.fiscal_month, 0);

-- Create materialized view for assumption versioning
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_assumption_versions AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    fav.assumption_key,
    fav.version_number,
    fav.version_status,
    fav.effective_from,
    fav.effective_to,
    fav.assumption_value,
    fav.change_reason,
    CASE 
        WHEN fav.created_by IS NOT NULL THEN u1.email
        ELSE NULL
    END as created_by_email,
    CASE 
        WHEN fav.approved_by IS NOT NULL THEN u2.email
        ELSE NULL
    END as approved_by_email,
    fav.approval_status,
    fav.approved_at,
    fav.approval_notes,
    fav.created_at,
    fav.updated_at
    
FROM business_accounts ba
JOIN financial_assumption_versions fav ON ba.id = fav.business_account_id
LEFT JOIN users u1 ON fav.created_by = u1.id
LEFT JOIN users u2 ON fav.approved_by = u2.id;

-- Create materialized view for security audit summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_security_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(*) FILTER (WHERE fsa.event_severity = 'CRITICAL') as critical_events,
    COUNT(*) FILTER (WHERE fsa.event_severity = 'HIGH') as high_events,
    COUNT(*) FILTER (WHERE fsa.event_severity = 'MEDIUM') as medium_events,
    COUNT(*) FILTER (WHERE fsa.event_severity = 'LOW') as low_events,
    COUNT(*) FILTER (WHERE fsa.resolution_status = 'OPEN') as open_investigations,
    COUNT(*) FILTER (WHERE fsa.event_type = 'CLOSE_ATTEMPT') as close_attempts,
    MAX(fsa.created_at) as last_event_date,
    COUNT(DISTINCT fsa.user_id) as affected_users
    
FROM business_accounts ba
LEFT JOIN financial_security_audit fsa ON ba.id = fsa.business_account_id
GROUP BY ba.id, ba.name;

-- Database Functions

-- Function to lock financial period
CREATE OR REPLACE FUNCTION lock_financial_period(
    p_business_account_id UUID,
    p_fiscal_year INTEGER,
    p_fiscal_quarter INTEGER DEFAULT NULL,
    p_fiscal_month INTEGER DEFAULT NULL,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_period_id UUID;
    v_is_locked BOOLEAN := false;
BEGIN
    -- Check if period is already locked
    SELECT id INTO v_period_id, is_locked
    FROM financial_period_status
    WHERE business_account_id = p_business_account_id
    AND fiscal_year = p_fiscal_year
    AND COALESCE(fiscal_quarter, 0) = COALESCE(p_fiscal_quarter, 0)
    AND COALESCE(fiscal_month, 0) = COALESCE(p_fiscal_month, 0);
    
    IF v_is_locked THEN
        RAISE EXCEPTION 'Period is already locked';
    END IF;
    
    -- Check if any dependent periods are still open
    IF EXISTS (
        SELECT 1 FROM financial_period_status
        WHERE business_account_id = p_business_account_id
        AND fiscal_year = p_fiscal_year
        AND period_status IN ('OPEN', 'LOCKED')
        AND (
            (p_fiscal_quarter IS NOT NULL AND fiscal_quarter > p_fiscal_quarter) OR
            (p_fiscal_month IS NOT NULL AND fiscal_month > p_fiscal_month)
        )
    ) THEN
        RAISE EXCEPTION 'Cannot lock period - dependent periods must be closed first';
    END IF;
    
    -- Lock the period
    UPDATE financial_period_status
    SET 
        period_status = 'LOCKED',
        locked_at = CURRENT_TIMESTAMP,
        locked_by = p_user_id,
        closing_notes = COALESCE(p_reason, 'Period locked for processing')
    WHERE business_account_id = p_business_account_id
    AND fiscal_year = p_fiscal_year
    AND COALESCE(fiscal_quarter, 0) = COALESCE(p_fiscal_quarter, 0)
    AND COALESCE(fiscal_month, 0) = COALESCE(p_fiscal_month, 0)
    RETURNING id INTO v_period_id;
    
    -- Log the lock event
    INSERT INTO financial_security_audit (
        business_account_id,
        event_type: 'CLOSE_ATTEMPT',
        event_severity: 'MEDIUM',
        event_description: 'Financial period locked',
        user_id: p_user_id,
        new_value: jsonb_build_object(
            'period_id', v_period_id,
            'fiscal_year', p_fiscal_year,
            'fiscal_quarter', p_fiscal_quarter,
            'fiscal_month', p_fiscal_month,
            'reason', p_reason
        )
    );
    
    RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function to close financial period
CREATE OR REPLACE FUNCTION close_financial_period(
    p_business_account_id UUID,
    p_fiscal_year INTEGER,
    p_fiscal_quarter INTEGER DEFAULT NULL,
    p_fiscal_month INTEGER DEFAULT NULL,
    p_user_id UUID,
    p_closing_data JSONB DEFAULT '{}',
    p_final_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_period_id UUID;
    v_close_event_id UUID;
BEGIN
    -- Get the period to close
    SELECT id INTO v_period_id
    FROM financial_period_status
    WHERE business_account_id = p_business_account_id
    AND fiscal_year = p_fiscal_year
    AND COALESCE(fiscal_quarter, 0) = COALESCE(p_fiscal_quarter, 0)
    AND COALESCE(fiscal_month, 0) = COALESCE(piscal_month, 0)
    AND period_status = 'LOCKED';
    
    IF v_period_id IS NULL THEN
        RAISE EXCEPTION 'Period not found or not locked';
    END IF;
    
    -- Create close event
    INSERT INTO financial_close_events (
        business_account_id,
        close_type: CASE 
            WHEN p_fiscal_month IS NOT NULL THEN 'MONTHLY_CLOSE'
            WHEN p_fiscal_quarter IS NOT NULL THEN 'QUARTERLY_CLOSE'
            ELSE 'YEARLY_CLOSE'
        END,
        close_status: 'INITIATED',
        fiscal_year: p_fiscal_year,
        fiscal_quarter: p_fiscal_quarter,
        fiscal_month: p_fiscal_month,
        close_date: CURRENT_DATE,
        initiated_by: p_user_id
    ) RETURNING id INTO v_close_event_id;
    
    -- Update period status
    UPDATE financial_period_status
    SET 
        period_status = 'CLOSED',
        closed_at = CURRENT_TIMESTAMP,
        closed_by = p_user_id,
        closing_notes = p_final_notes,
        closing_adjustments = p_closing_data
    WHERE id = v_period_id;
    
    -- Log the close event
    INSERT INTO financial_security_audit (
        business_account_id,
        event_type: 'CLOSE_ATTEMPT',
        event_severity: 'HIGH',
        event_description: 'Financial period closed',
        user_id: p_user_id,
        new_value: jsonb_build_object(
            'period_id', v_period_id,
            'close_event_id', v_close_event_id,
            'fiscal_year', p_fiscal_year,
            'fiscal_quarter', p_fiscal_quarter,
            'fiscal_month', p_fiscal_month,
            'closing_data', p_closing_data
        )
    );
    
    RETURN v_close_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize financial period
CREATE OR REPLACE FUNCTION finalize_financial_period(
    p_business_account_id UUID,
    p_fiscal_year INTEGER,
    p_fiscal_quarter INTEGER DEFAULT NULL,
    p_fiscal_month INTEGER DEFAULT NULL,
    p_user_id UUID,
    p_final_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_period_id UUID;
    v_close_event_id UUID;
BEGIN
    -- Get the period to finalize
    SELECT id INTO v_period_id
    FROM financial_period_status
    WHERE business_account_id = p_business_account_id
    AND fiscal_year = p_fiscal_year
    AND COALESCE(fiscal_quarter, 0) = COALESCE(p_fiscal_quarter, 0)
    AND COALESCE(fiscal_month, 0) = COALESCE(p_fiscal_month, 0)
    AND period_status = 'CLOSED';
    
    IF v_period_id IS NULL THEN
        RAISE EXCEPTION 'Period not found or not closed';
    END IF;
    
    -- Get the close event
    SELECT id INTO v_close_event_id
    FROM financial_close_events
    WHERE business_account_id = p_business_account_id
    AND fiscal_year = p_fiscal_year
    AND COALESCE(fiscal_quarter, 0) = COALESCE(p_fiscal_quarter, 0)
    AND COALESCE(fiscal_month, 0) = COALESCE(p_fiscal_month, 0)
    AND close_status = 'COMPLETED';
    
    -- Update period to final
    UPDATE financial_period_status
    SET 
        period_status = 'FINAL',
        final_at = CURRENT_TIMESTAMP,
        finalized_by = p_user_id,
        closing_notes = p_final_notes
    WHERE id = v_period_id;
    
    -- Update close event
    UPDATE financial_close_events
    SET 
        close_status = 'COMPLETED',
        completed_by = p_user_id,
        close_summary = COALESCE(p_final_notes, 'Period finalized successfully')
    WHERE id = v_close_event_id;
    
    -- Log the finalization
    INSERT INTO financial_security_audit (
        business_account_id,
        event_type: 'CLOSE_ATTEMPT',
        event_severity: 'HIGH',
        event_description: 'Financial period finalized',
        user_id: p_user_id,
        new_value: jsonb_build_object(
            'period_id', v_period_id,
            'close_event_id', v_close_event_id,
            'fiscal_year', p_fiscal_year,
            'fiscal_quarter', p_fiscal_quarter,
            'fiscal_month', p_fiscal_month,
            'final_notes', p_final_notes
        )
    );
    
    RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create assumption version
CREATE OR REPLACE FUNCTION create_assumption_version(
    p_business_account_id UUID,
    p_assumption_key VARCHAR(100),
    p_version_number INTEGER,
    p_assumption_value DECIMAL(20,4),
    p_change_reason TEXT,
    p_user_id UUID,
    p_approval_required BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
    v_previous_value DECIMAL(20,4);
BEGIN
    -- Get previous value
    SELECT assumption_value INTO v_previous_value
    FROM financial_assumption_versions
    WHERE business_account_id = p_business_account_id
    AND assumption_key = p_assumption_key
    AND version_status = 'ACTIVE'
    ORDER BY version_number DESC
    LIMIT 1;
    
    -- Create new version
    INSERT INTO financial_assumption_versions (
        business_account_id,
        assumption_key,
        version_number,
        version_status: CASE WHEN p_approval_required THEN 'PENDING' ELSE 'ACTIVE' END,
        effective_from: CURRENT_TIMESTAMP,
        assumption_value: p_assumption_value,
        previous_value: v_previous_value,
        change_reason: p_change_reason,
        created_by: p_user_id
    ) RETURNING id INTO v_version_id;
    
    -- If approval required, create pending record
    IF p_approval_required THEN
        -- Update previous version to SUPERSEDED
        UPDATE financial_assumption_versions
        SET version_status = 'SUPERSEDED',
            effective_to: CURRENT_TIMESTAMP
        WHERE business_account_id = p_business_account_id
        AND assumption_key = p_assumption_key
        AND version_status = 'ACTIVE';
    END IF;
    
    -- Log the version creation
    INSERT INTO financial_security_audit (
        business_account_id,
        event_type: 'DATA_MODIFICATION',
        event_severity: 'MEDIUM',
        event_description: 'Financial assumption version created',
        user_id: p_user_id,
        new_value: jsonb_build_object(
            'version_id', v_version_id,
            'assumption_key', p_assumption_key,
            'version_number', p_version_number,
            'assumption_value', p_assumption_value,
            'change_reason', p_change_reason,
            'approval_required', p_approval_required
        )
    );
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve assumption version
CREATE OR REPLACE FUNCTION approve_assumption_version(
    p_business_account_id UUID,
    p_version_id UUID,
    p_user_id UUID,
    p_approval_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_assumption_key VARCHAR(100);
BEGIN
    -- Get assumption key for logging
    SELECT assumption_key INTO v_assumption_key
    FROM financial_assumption_versions
    WHERE id = p_version_id;
    
    -- Approve the version
    UPDATE financial_assumption_versions
    SET 
        version_status = 'ACTIVE',
        approved_at = CURRENT_TIMESTAMP,
        approved_by = p_user_id,
        approval_notes = p_approval_notes
    WHERE id = p_version_id;
    
    -- Archive other pending versions
    UPDATE financial_assumption_versions
    SET version_status = 'ARCHIVED'
    WHERE business_account_id = p_business_account_id
    AND assumption_key = v_assumption_key
    AND version_status = 'PENDING'
    AND id != p_version_id;
    
    -- Log the approval
    INSERT INTO financial_security_audit (
        business_account_id,
        event_type: 'DATA_MODIFICATION',
        event_severity: 'MEDIUM',
        event_description: 'Financial assumption version approved',
        user_id: p_user_id,
        new_value: jsonb_build_object(
            'version_id', p_version_id,
            'assumption_key', v_assumption_key,
            'approval_notes', p_approval_notes
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check financial permissions
CREATE OR REPLACE FUNCTION check_financial_permission(
    p_user_id UUID,
    p_business_account_id UUID,
    p_required_permission VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role VARCHAR(50);
    v_permissions JSONB;
BEGIN
    -- Get user role for this business account
    SELECT frp.permissions INTO v_permissions
    FROM financial_role_permissions frp
    JOIN users u ON frp.created_by = u.id
    WHERE frp.business_account_id = p_business_account_id
    AND frp.is_active = true
    AND EXISTS (
        SELECT 1 FROM business_account_users bau
        WHERE bau.business_account_id = p_business_account_id
        AND bau.user_id = p_user_id
        AND bau.is_active = true
    )
    ORDER BY frp.created_at DESC
    LIMIT 1;
    
    -- Check if user has financial admin role
    IF EXISTS (
        SELECT 1 FROM financial_role_permissions frp
        WHERE frp.business_account_id = p_business_account_id
        AND frp.role_name = 'FINANCIAL_ADMIN'
        AND frp.is_active = true
        AND EXISTS (
            SELECT 1 FROM business_account_users bau
            WHERE bau.business_account_id = p_business_account_id
            AND bau.user_id = p_user_id
            AND bau.is_active = true
        )
    ) THEN
        RETURN true; -- Admin has all permissions
    END IF;
    
    -- Check specific permission
    IF v_permissions @> jsonb_build_array(p_required_permission) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to log data changes
CREATE OR REPLACE FUNCTION log_financial_data_change(
    p_business_account_id UUID,
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_operation_type VARCHAR(20),
    p_field_name VARCHAR(100),
    p_old_value JSONB,
    p_new_value JSONB,
    p_user_id UUID,
    p_change_reason TEXT,
    p_requires_approval BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_change_id UUID;
BEGIN
    -- Create change record
    INSERT INTO financial_data_changes (
        business_account_id,
        table_name: p_table_name,
        record_id: p_record_id,
        operation_type: p_operation_type,
        field_name: p_field_name,
        old_value: p_old_value,
        new_value: p_new_value,
        changed_by: p_user_id,
        change_reason: p_change_reason,
        requires_approval: p_requires_approval
    ) RETURNING id INTO v_change_id;
    
    -- Log the change
    INSERT INTO financial_security_audit (
        business_account_id,
        event_type: 'DATA_MODIFICATION',
        event_severity: CASE 
            WHEN p_operation_type = 'DELETE' THEN 'HIGH'
            WHEN p_requires_approval THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        event_description: 'Financial data change: ' || p_operation_type || ' on ' || p_table_name,
        user_id: p_user_id,
        new_value: jsonb_build_object(
            'change_id', v_change_id,
            'table_name', p_table_name,
            'record_id', p_record_id,
            'operation_type', p_operation_type,
            'field_name', p_field_name,
            'change_reason', p_change_reason,
            'requires_approval', p_requires_approval
        )
    );
    
    RETURN v_change_id;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh financial security views
CREATE OR REPLACE FUNCTION refresh_financial_security_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_period_status;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_assumption_versions;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_security_summary;
END;
$$ LANGUAGE plpgsql;

-- Insert default financial roles
INSERT INTO financial_role_permissions (
    business_account_id,
    role_name,
    permissions,
    description,
    created_by
) SELECT 
    gen_random_uuid(),
    'FINANCIAL_ADMIN',
    '["*"]', -- All permissions
    'Full administrative access to all financial operations',
    gen_random_uuid()
UNION ALL
SELECT 
    gen_random_uuid(),
    'FINANCIAL_MANAGER',
    '["VIEW_BALANCE", "VIEW_REPORTS", "CREATE_INVOICE", "EDIT_ASSUMPTIONS", "VIEW_ANALYTICS", "INITIATE_CLOSE"]',
    'Managerial access to financial operations and reporting',
    gen_random_uuid()
UNION ALL
SELECT 
    gen_random_uuid(),
    'FINANCIAL_VIEWER',
    '["VIEW_BALANCE", "VIEW_REPORTS"]',
    'Read-only access to financial reports and balances',
    gen_random_uuid()
UNION ALL
SELECT 
    gen_random_uuid(),
    'AUDITOR',
    '["VIEW_BALANCE", "VIEW_REPORTS", "VIEW_AUDIT_LOG", "VIEW_DATA_CHANGES", "VIEW_SECURITY_AUDIT"]',
    'Audit access to all financial activities and logs',
    gen_random_uuid();

-- Triggers for updated_at columns
CREATE TRIGGER update_financial_period_status_updated_at
    BEFORE UPDATE ON financial_period_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_assumption_versions_updated_at
    BEFORE UPDATE ON financial_assumption_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_close_events_updated_at
    BEFORE UPDATE ON financial_close_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_security_audit_updated_at
    BEFORE UPDATE ON financial_security_audit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_data_changes_updated_at
    BEFORE UPDATE ON financial_data_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_close_approvals_updated_at
    BEFORE UPDATE ON financial_close_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_period_status_business_account ON financial_period_status(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_period_status_fiscal ON financial_period_status(fiscal_year, fiscal_quarter, fiscal_month);
CREATE INDEX IF NOT EXISTS idx_financial_period_status_status ON financial_period_status(period_status);
CREATE INDEX IF NOT EXISTS idx_financial_assumption_versions_business_account ON financial_assumption_versions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_assumption_versions_key ON financial_assumption_versions(assumption_key);
CREATE INDEX IF NOT EXISTS idx_financial_assumption_versions_status ON financial_assumption_versions(version_status);
CREATE INDEX IF NOT EXISTS idx_financial_close_events_business_account ON financial_close_events(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_close_events_fiscal ON financial_close_events(fiscal_year, fiscal_quarter, fiscal_month);
CREATE INDEX IF NOT EXISTS idx_financial_close_events_status ON financial_close_events(close_status);
CREATE INDEX IF NOT EXISTS idx_financial_security_audit_business_account ON financial_security_audit(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_security_audit_event_type ON financial_security_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_financial_security_audit_created_at ON financial_security_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_data_changes_business_account ON financial_data_changes(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_changes_table_record ON financial_data_changes(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_changes_created_at ON financial_data_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_role_permissions_business_account ON financial_role_permissions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_close_approvals_business_account ON financial_close_approvals(business_account_id);

-- Set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_period_status TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_assumption_versions TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_close_events TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_security_audit TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_role_permissions TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_data_changes TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_close_approvals TO ai_business_service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION lock_financial_period TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION close_financial_period TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION finalize_financial_period TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION create_assumption_version TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION approve_assumption_version TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION check_financial_permission TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION log_financial_data_change TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION refresh_financial_security_views TO ai_business_service_role;
