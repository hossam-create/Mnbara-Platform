-- Sprint 26: Central Bank / RegTech Mode Migration
-- Provides regulators and central banks with real-time, compliance-ready reporting and monitoring

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Regulatory Access Roles Table
CREATE TABLE IF NOT EXISTS regulatory_access_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    role_type VARCHAR(50) NOT NULL, -- 'central_bank', 'regulator', 'auditor', 'compliance_officer'
    jurisdiction_code VARCHAR(10) NOT NULL, -- ISO country codes
    permissions JSONB NOT NULL DEFAULT '{}',
    access_level VARCHAR(20) NOT NULL DEFAULT 'read_only', -- 'read_only', 'limited_write'
    data_scope JSONB NOT NULL DEFAULT '{}', -- What data they can access
    reporting_frequency VARCHAR(20) NOT NULL DEFAULT 'real_time', -- 'real_time', 'daily', 'weekly', 'monthly'
    is_active BOOLEAN NOT NULL DEFAULT true,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_count INTEGER NOT NULL DEFAULT 0,
    ip_restrictions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory Reports Table
CREATE TABLE IF NOT EXISTS regulatory_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'capital_adequacy', 'liquidity_coverage', 'large_exposures', 'risk_weighted_assets'
    jurisdiction_code VARCHAR(10) NOT NULL,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    report_template JSONB NOT NULL,
    generated_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    submission_reference VARCHAR(100),
    regulatory_comments TEXT,
    compliance_score DECIMAL(5,2),
    auto_generated BOOLEAN NOT NULL DEFAULT true,
    generation_time_ms INTEGER,
    file_path VARCHAR(500),
    file_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Thresholds Table
CREATE TABLE IF NOT EXISTS compliance_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    threshold_name VARCHAR(100) NOT NULL,
    threshold_type VARCHAR(50) NOT NULL, -- 'ratio', 'absolute', 'percentage', 'count'
    metric_name VARCHAR(100) NOT NULL, -- 'capital_ratio', 'liquidity_ratio', 'large_exposure_limit'
    jurisdiction_code VARCHAR(10) NOT NULL,
    minimum_value DECIMAL(20,8),
    maximum_value DECIMAL(20,8),
    target_value DECIMAL(20,8),
    warning_threshold DECIMAL(20,8),
    critical_threshold DECIMAL(20,8),
    calculation_method TEXT NOT NULL,
    data_sources JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    regulatory_reference VARCHAR(200),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Monitoring Table
CREATE TABLE IF NOT EXISTS compliance_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    threshold_id UUID NOT NULL REFERENCES compliance_thresholds(id) ON DELETE CASCADE,
    monitoring_date DATE NOT NULL,
    current_value DECIMAL(20,8) NOT NULL,
    threshold_value DECIMAL(20,8) NOT NULL,
    variance_amount DECIMAL(20,8) NOT NULL,
    variance_percentage DECIMAL(10,4) NOT NULL,
    compliance_status VARCHAR(20) NOT NULL, -- 'compliant', 'warning', 'critical', 'breach'
    trend_direction VARCHAR(10), -- 'improving', 'stable', 'deteriorating'
    calculation_details JSONB,
    data_points JSONB NOT NULL DEFAULT '[]',
    auto_calculated BOOLEAN NOT NULL DEFAULT true,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory Alerts Table
CREATE TABLE IF NOT EXISTS regulatory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold_breach', 'compliance_violation', 'reporting_deadline', 'data_anomaly'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    jurisdiction_code VARCHAR(10) NOT NULL,
    threshold_id UUID REFERENCES compliance_thresholds(id),
    metric_name VARCHAR(100),
    current_value DECIMAL(20,8),
    threshold_value DECIMAL(20,8),
    variance_amount DECIMAL(20,8),
    variance_percentage DECIMAL(10,4),
    alert_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'false_positive'
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN NOT NULL DEFAULT true,
    notification_sent BOOLEAN NOT NULL DEFAULT false,
    regulatory_notification_required BOOLEAN NOT NULL DEFAULT false,
    regulatory_notification_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory KPIs Table
CREATE TABLE IF NOT EXISTS regulatory_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    kpi_name VARCHAR(100) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL, -- 'capital', 'liquidity', 'credit_risk', 'market_risk', 'operational_risk'
    jurisdiction_code VARCHAR(10) NOT NULL,
    kpi_value DECIMAL(20,8) NOT NULL,
    kpi_unit VARCHAR(20), -- 'percentage', 'ratio', 'currency', 'count'
    target_value DECIMAL(20,8),
    benchmark_value DECIMAL(20,8),
    variance_from_target DECIMAL(20,8),
    trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
    performance_rating VARCHAR(20), -- 'excellent', 'good', 'average', 'poor', 'critical'
    measurement_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    calculation_method TEXT NOT NULL,
    data_sources JSONB NOT NULL DEFAULT '[]',
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    is_real_time BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory Snapshots Table
CREATE TABLE IF NOT EXISTS regulatory_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL, -- 'compliance', 'reporting', 'audit', 'regulatory_inquiry'
    jurisdiction_code VARCHAR(10) NOT NULL,
    snapshot_data JSONB NOT NULL,
    includes_kpis BOOLEAN NOT NULL DEFAULT true,
    includes_reports BOOLEAN NOT NULL DEFAULT true,
    includes_alerts BOOLEAN NOT NULL DEFAULT true,
    includes_thresholds BOOLEAN NOT NULL DEFAULT true,
    is_read_only BOOLEAN NOT NULL DEFAULT true,
    is_immutable BOOLEAN NOT NULL DEFAULT true,
    retention_period_days INTEGER NOT NULL DEFAULT 2555, -- 7 years
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Feeds Table
CREATE TABLE IF NOT EXISTS regulatory_data_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    feed_name VARCHAR(100) NOT NULL,
    feed_type VARCHAR(50) NOT NULL, -- 'real_time_kpis', 'daily_reports', 'compliance_status', 'risk_metrics'
    target_system VARCHAR(100) NOT NULL, -- 'central_bank', 'regulatory_authority', 'supervisory_body'
    jurisdiction_code VARCHAR(10) NOT NULL,
    feed_format VARCHAR(20) NOT NULL, -- 'json', 'xml', 'csv', 'api'
    feed_frequency VARCHAR(20) NOT NULL, -- 'real_time', 'hourly', 'daily', 'weekly'
    data_schema JSONB NOT NULL,
    endpoint_url VARCHAR(500),
    authentication_method VARCHAR(50), -- 'api_key', 'oauth', 'certificate'
    authentication_config JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_transmission TIMESTAMP WITH TIME ZONE,
    transmission_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jurisdiction Configurations Table
CREATE TABLE IF NOT EXISTS jurisdiction_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_code VARCHAR(10) NOT NULL UNIQUE,
    jurisdiction_name VARCHAR(100) NOT NULL,
    regulatory_authority VARCHAR(200) NOT NULL,
    reporting_requirements JSONB NOT NULL DEFAULT '{}',
    compliance_standards JSONB NOT NULL DEFAULT '{}',
    data_format_standards JSONB NOT NULL DEFAULT '{}',
    submission_deadlines JSONB NOT NULL DEFAULT '{}',
    contact_information JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory Audit Log Table
CREATE TABLE IF NOT EXISTS regulatory_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    regulatory_role_id UUID REFERENCES regulatory_access_roles(id),
    action_type VARCHAR(50) NOT NULL, -- 'access_granted', 'report_generated', 'data_exported', 'alert_viewed'
    action_details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulatory_access_roles_business_account ON regulatory_access_roles(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_access_roles_jurisdiction ON regulatory_access_roles(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_regulatory_access_roles_active ON regulatory_access_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_regulatory_reports_business_account ON regulatory_reports(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_type_period ON regulatory_reports(report_type, reporting_period_start, reporting_period_end);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_jurisdiction ON regulatory_reports(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_regulatory_reports_status ON regulatory_reports(status);

CREATE INDEX IF NOT EXISTS idx_compliance_thresholds_business_account ON compliance_thresholds(business_account_id);
CREATE INDEX IF NOT EXISTS idx_compliance_thresholds_active ON compliance_thresholds(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_thresholds_jurisdiction ON compliance_thresholds(jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_threshold_date ON compliance_monitoring(threshold_id, monitoring_date);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_status ON compliance_monitoring(compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_business_account ON compliance_monitoring(business_account_id);

CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_business_account ON regulatory_alerts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_type_severity ON regulatory_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_status ON regulatory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_jurisdiction ON regulatory_alerts(jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_regulatory_kpis_business_account ON regulatory_kpis(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_kpis_category_date ON regulatory_kpis(kpi_category, measurement_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_kpis_jurisdiction ON regulatory_kpis(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_regulatory_kpis_real_time ON regulatory_kpis(is_real_time);

CREATE INDEX IF NOT EXISTS idx_regulatory_snapshots_business_account ON regulatory_snapshots(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_snapshots_type_date ON regulatory_snapshots(snapshot_type, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_snapshots_jurisdiction ON regulatory_snapshots(jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_regulatory_data_feeds_business_account ON regulatory_data_feeds(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_data_feeds_active ON regulatory_data_feeds(is_active);
CREATE INDEX IF NOT EXISTS idx_regulatory_data_feeds_target ON regulatory_data_feeds(target_system, jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_configurations_active ON jurisdiction_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_configurations_code ON jurisdiction_configurations(jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_regulatory_audit_logs_business_account ON regulatory_audit_logs(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_audit_logs_timestamp ON regulatory_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_regulatory_audit_logs_action ON regulatory_audit_logs(action_type);

-- Materialized Views for Regulatory Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS regulatory_compliance_summary AS
SELECT 
    ra.business_account_id,
    ra.jurisdiction_code,
    COUNT(DISTINCT ra.id) as total_alerts,
    COUNT(DISTINCT CASE WHEN ra.severity = 'critical' THEN ra.id END) as critical_alerts,
    COUNT(DISTINCT CASE WHEN ra.severity = 'high' THEN ra.id END) as high_alerts,
    COUNT(DISTINCT CASE WHEN ra.status = 'active' THEN ra.id END) as active_alerts,
    COUNT(DISTINCT CASE WHEN ra.regulatory_notification_required = true THEN ra.id END) as regulatory_notifications,
    MAX(ra.created_at) as last_alert_date,
    -- Compliance metrics
    (SELECT COUNT(*) FROM compliance_monitoring cm 
     WHERE cm.business_account_id = ra.business_account_id 
     AND cm.monitoring_date = CURRENT_DATE 
     AND cm.compliance_status = 'compliant') as compliant_metrics,
    (SELECT COUNT(*) FROM compliance_monitoring cm 
     WHERE cm.business_account_id = ra.business_account_id 
     AND cm.monitoring_date = CURRENT_DATE 
     AND cm.compliance_status IN ('warning', 'critical', 'breach')) as non_compliant_metrics
FROM regulatory_alerts ra
GROUP BY ra.business_account_id, ra.jurisdiction_code;

CREATE MATERIALIZED VIEW IF NOT EXISTS regulatory_kpi_summary AS
SELECT 
    rk.business_account_id,
    rk.jurisdiction_code,
    rk.kpi_category,
    COUNT(DISTINCT rk.id) as total_kpis,
    AVG(rk.kpi_value) as avg_kpi_value,
    MAX(rk.kpi_value) as max_kpi_value,
    MIN(rk.kpi_value) as min_kpi_value,
    COUNT(DISTINCT CASE WHEN rk.performance_rating = 'excellent' THEN rk.id END) as excellent_kpis,
    COUNT(DISTINCT CASE WHEN rk.performance_rating = 'good' THEN rk.id END) as good_kpis,
    COUNT(DISTINCT CASE WHEN rk.performance_rating = 'average' THEN rk.id END) as average_kpis,
    COUNT(DISTINCT CASE WHEN rk.performance_rating = 'poor' THEN rk.id END) as poor_kpis,
    COUNT(DISTINCT CASE WHEN rk.performance_rating = 'critical' THEN rk.id END) as critical_kpis,
    MAX(rk.measurement_date) as latest_measurement_date,
    COUNT(DISTINCT CASE WHEN rk.is_real_time = true THEN rk.id END) as real_time_kpis
FROM regulatory_kpis rk
GROUP BY rk.business_account_id, rk.jurisdiction_code, rk.kpi_category;

CREATE MATERIALIZED VIEW IF NOT EXISTS regulatory_reporting_status AS
SELECT 
    rr.business_account_id,
    rr.jurisdiction_code,
    rr.report_type,
    COUNT(DISTINCT rr.id) as total_reports,
    COUNT(DISTINCT CASE WHEN rr.status = 'submitted' THEN rr.id END) as submitted_reports,
    COUNT(DISTINCT CASE WHEN rr.status = 'approved' THEN rr.id END) as approved_reports,
    COUNT(DISTINCT CASE WHEN rr.status = 'rejected' THEN rr.id END) as rejected_reports,
    AVG(rr.compliance_score) as avg_compliance_score,
    MAX(rr.submitted_at) as last_submission_date,
    MIN(rr.reporting_period_start) as earliest_period,
    MAX(rr.reporting_period_end) as latest_period,
    -- Reports due in next 30 days
    (SELECT COUNT(*) FROM regulatory_reports rr2 
     WHERE rr2.business_account_id = rr.business_account_id 
     AND rr2.jurisdiction_code = rr.jurisdiction_code 
     AND rr2.report_type = rr.report_type 
     AND rr2.status = 'draft'
     AND rr2.reporting_period_end <= CURRENT_DATE + INTERVAL '30 days') as reports_due_soon
FROM regulatory_reports rr
GROUP BY rr.business_account_id, rr.jurisdiction_code, rr.report_type;

-- Database Functions
CREATE OR REPLACE FUNCTION create_regulatory_alert(
    p_business_account_id UUID,
    p_alert_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_title VARCHAR(200),
    p_description TEXT,
    p_jurisdiction_code VARCHAR(10),
    p_threshold_id UUID DEFAULT NULL,
    p_metric_name VARCHAR(100) DEFAULT NULL,
    p_current_value DECIMAL(20,8) DEFAULT NULL,
    p_threshold_value DECIMAL(20,8) DEFAULT NULL,
    p_alert_data JSONB DEFAULT '{}',
    p_auto_generated BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
    v_variance_amount DECIMAL(20,8) := 0;
    v_variance_percentage DECIMAL(10,4) := 0;
BEGIN
    -- Calculate variance if values provided
    IF p_current_value IS NOT NULL AND p_threshold_value IS NOT NULL THEN
        v_variance_amount := p_current_value - p_threshold_value;
        IF p_threshold_value != 0 THEN
            v_variance_percentage := (v_variance_amount / p_threshold_value) * 100;
        END IF;
    END IF;
    
    INSERT INTO regulatory_alerts (
        business_account_id,
        alert_type,
        severity,
        title,
        description,
        jurisdiction_code,
        threshold_id,
        metric_name,
        current_value,
        threshold_value,
        variance_amount,
        variance_percentage,
        alert_data,
        auto_generated
    ) VALUES (
        p_business_account_id,
        p_alert_type,
        p_severity,
        p_title,
        p_description,
        p_jurisdiction_code,
        p_threshold_id,
        p_metric_name,
        p_current_value,
        p_threshold_value,
        v_variance_amount,
        v_variance_percentage,
        p_alert_data,
        p_auto_generated
    ) RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_compliance_status(
    p_business_account_id UUID,
    p_threshold_id UUID,
    p_monitoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    v_threshold RECORD;
    v_current_value DECIMAL(20,8);
    v_variance_amount DECIMAL(20,8);
    v_variance_percentage DECIMAL(10,4);
    v_compliance_status VARCHAR(20);
    v_trend_direction VARCHAR(10);
BEGIN
    -- Get threshold details
    SELECT * INTO v_threshold 
    FROM compliance_thresholds 
    WHERE id = p_threshold_id AND business_account_id = p_business_account_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Threshold not found';
    END IF;
    
    -- Calculate current value based on threshold calculation method
    -- This would integrate with actual business data
    v_current_value := 0; -- Placeholder - would be calculated from actual data
    
    -- Calculate variance
    v_variance_amount := v_current_value - v_threshold.target_value;
    IF v_threshold.target_value != 0 THEN
        v_variance_percentage := (v_variance_amount / v_threshold.target_value) * 100;
    END IF;
    
    -- Determine compliance status
    IF v_current_value >= v_threshold.minimum_value AND v_current_value <= v_threshold.maximum_value THEN
        v_compliance_status := 'compliant';
    ELSIF v_current_value >= v_threshold.warning_threshold AND v_current_value <= v_threshold.critical_threshold THEN
        v_compliance_status := 'warning';
    ELSE
        v_compliance_status := 'critical';
    END IF;
    
    -- Insert compliance monitoring record
    INSERT INTO compliance_monitoring (
        business_account_id,
        threshold_id,
        monitoring_date,
        current_value,
        threshold_value,
        variance_amount,
        variance_percentage,
        compliance_status,
        trend_direction,
        auto_calculated
    ) VALUES (
        p_business_account_id,
        p_threshold_id,
        p_monitoring_date,
        v_current_value,
        v_threshold.target_value,
        v_variance_amount,
        v_variance_percentage,
        v_compliance_status,
        v_trend_direction,
        true
    );
    
    -- Create alert if non-compliant
    IF v_compliance_status IN ('warning', 'critical', 'breach') THEN
        PERFORM create_regulatory_alert(
            p_business_account_id,
            'threshold_breach',
            CASE WHEN v_compliance_status = 'critical' THEN 'critical' ELSE 'high' END,
            'Compliance Threshold Breach',
            format('%s threshold breached: Current value %s, Threshold %s', 
                   v_threshold.threshold_name, v_current_value, v_threshold.target_value),
            v_threshold.jurisdiction_code,
            p_threshold_id,
            v_threshold.metric_name,
            v_current_value,
            v_threshold.target_value,
            jsonb_build_object(
                'threshold_name', v_threshold.threshold_name,
                'calculation_method', v_threshold.calculation_method,
                'variance_amount', v_variance_amount,
                'variance_percentage', v_variance_percentage
            ),
            true
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_regulatory_report(
    p_business_account_id UUID,
    p_report_type VARCHAR(50),
    p_jurisdiction_code VARCHAR(10),
    p_period_start DATE,
    p_period_end DATE,
    p_auto_generated BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    v_report_id UUID;
    v_report_data JSONB;
    v_compliance_score DECIMAL(5,2);
BEGIN
    -- Generate report data based on type
    -- This would integrate with actual business data and regulatory requirements
    v_report_data := jsonb_build_object(
        'report_type', p_report_type,
        'jurisdiction', p_jurisdiction_code,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'generated_at', CURRENT_TIMESTAMP,
        'data', jsonb_build_object() -- Placeholder for actual report data
    );
    
    -- Calculate compliance score
    v_compliance_score := 85.5; -- Placeholder - would be calculated from actual data
    
    INSERT INTO regulatory_reports (
        business_account_id,
        report_type,
        jurisdiction_code,
        reporting_period_start,
        reporting_period_end,
        report_template,
        generated_data,
        compliance_score,
        auto_generated
    ) VALUES (
        p_business_account_id,
        p_report_type,
        p_jurisdiction_code,
        p_period_start,
        p_period_end,
        jsonb_build_object('template', 'regulatory_standard'), -- Placeholder
        v_report_data,
        v_compliance_score,
        p_auto_generated
    ) RETURNING id INTO v_report_id;
    
    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_regulatory_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY regulatory_compliance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY regulatory_kpi_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY regulatory_reporting_status;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies
ALTER TABLE regulatory_access_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_data_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business account isolation
CREATE POLICY regulatory_access_roles_isolation ON regulatory_access_roles
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY regulatory_reports_isolation ON regulatory_reports
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY compliance_thresholds_isolation ON compliance_thresholds
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY compliance_monitoring_isolation ON compliance_monitoring
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY regulatory_alerts_isolation ON regulatory_alerts
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY regulatory_kpis_isolation ON regulatory_kpis
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY regulatory_snapshots_isolation ON regulatory_snapshots
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY regulatory_data_feeds_isolation ON regulatory_data_feeds
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY regulatory_audit_logs_isolation ON regulatory_audit_logs
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_regulatory_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_regulatory_access_roles_updated_at
    BEFORE UPDATE ON regulatory_access_roles
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

CREATE TRIGGER update_regulatory_reports_updated_at
    BEFORE UPDATE ON regulatory_reports
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

CREATE TRIGGER update_compliance_thresholds_updated_at
    BEFORE UPDATE ON compliance_thresholds
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

CREATE TRIGGER update_regulatory_alerts_updated_at
    BEFORE UPDATE ON regulatory_alerts
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

CREATE TRIGGER update_regulatory_kpis_updated_at
    BEFORE UPDATE ON regulatory_kpis
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

CREATE TRIGGER update_regulatory_data_feeds_updated_at
    BEFORE UPDATE ON regulatory_data_feeds
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

CREATE TRIGGER update_jurisdiction_configurations_updated_at
    BEFORE UPDATE ON jurisdiction_configurations
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_updated_at_column();

-- Audit trigger for regulatory actions
CREATE OR REPLACE FUNCTION log_regulatory_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO regulatory_audit_logs (
            business_account_id,
            action_type,
            action_details,
            timestamp
        ) VALUES (
            NEW.business_account_id,
            TG_TABLE_NAME || '_created',
            jsonb_build_object('record_id', NEW.id, 'new_data', row_to_json(NEW)),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO regulatory_audit_logs (
            business_account_id,
            action_type,
            action_details,
            timestamp
        ) VALUES (
            NEW.business_account_id,
            TG_TABLE_NAME || '_updated',
            jsonb_build_object('record_id', NEW.id, 'old_data', row_to_json(OLD), 'new_data', row_to_json(NEW)),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO regulatory_audit_logs (
            business_account_id,
            action_type,
            action_details,
            timestamp
        ) VALUES (
            OLD.business_account_id,
            TG_TABLE_NAME || '_deleted',
            jsonb_build_object('record_id', OLD.id, 'deleted_data', row_to_json(OLD)),
            CURRENT_TIMESTAMP
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER regulatory_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON regulatory_access_roles
    FOR EACH ROW EXECUTE FUNCTION log_regulatory_audit();

CREATE TRIGGER regulatory_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON regulatory_reports
    FOR EACH ROW EXECUTE FUNCTION log_regulatory_audit();

CREATE TRIGGER regulatory_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON compliance_thresholds
    FOR EACH ROW EXECUTE FUNCTION log_regulatory_audit();

CREATE TRIGGER regulatory_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON regulatory_alerts
    FOR EACH ROW EXECUTE FUNCTION log_regulatory_audit();

CREATE TRIGGER regulatory_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON regulatory_kpis
    FOR EACH ROW EXECUTE FUNCTION log_regulatory_audit();

-- Insert default jurisdiction configurations
INSERT INTO jurisdiction_configurations (jurisdiction_code, jurisdiction_name, regulatory_authority) VALUES
('US', 'United States', 'Federal Reserve System'),
('GB', 'United Kingdom', 'Financial Conduct Authority'),
('EU', 'European Union', 'European Banking Authority'),
('SA', 'Saudi Arabia', 'Saudi Arabian Monetary Authority'),
('AE', 'United Arab Emirates', 'Central Bank of UAE'),
('QA', 'Qatar', 'Qatar Central Bank'),
('KW', 'Kuwait', 'Central Bank of Kuwait'),
('BH', 'Bahrain', 'Central Bank of Bahrain'),
('OM', 'Oman', 'Central Bank of Oman')
ON CONFLICT (jurisdiction_code) DO NOTHING;

-- Create indexes for materialized views
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_summary_business_account ON regulatory_compliance_summary(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_summary_jurisdiction ON regulatory_compliance_summary(jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_regulatory_kpi_summary_business_account ON regulatory_kpi_summary(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_kpi_summary_category ON regulatory_kpi_summary(kpi_category);

CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_status_business_account ON regulatory_reporting_status(business_account_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_status_type ON regulatory_reporting_status(report_type);

COMMENT ON TABLE regulatory_access_roles IS 'Manages access roles for regulatory and central bank users';
COMMENT ON TABLE regulatory_reports IS 'Stores regulatory reports generated for compliance';
COMMENT ON TABLE compliance_thresholds IS 'Defines compliance thresholds and regulatory limits';
COMMENT ON TABLE compliance_monitoring IS 'Tracks compliance monitoring against thresholds';
COMMENT ON TABLE regulatory_alerts IS 'Stores regulatory alerts and violations';
COMMENT ON TABLE regulatory_kpis IS 'Regulatory KPIs for real-time monitoring';
COMMENT ON TABLE regulatory_snapshots IS 'Immutable snapshots for audit purposes';
COMMENT ON TABLE regulatory_data_feeds IS 'Data feeds for central bank and regulatory reporting';
COMMENT ON TABLE jurisdiction_configurations IS 'Configuration for different jurisdictions';
COMMENT ON TABLE regulatory_audit_logs IS 'Audit trail for all regulatory actions';
