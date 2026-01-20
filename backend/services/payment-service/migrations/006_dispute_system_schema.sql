-- Integrated Dispute Resolution System Schema
-- This migration adds tables for comprehensive dispute management with ticketing and SLA engine

-- Dispute Categories and Types
CREATE TABLE dispute_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES dispute_categories(id),
    severity_level INTEGER DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    auto_escalation_threshold_hours INTEGER DEFAULT 72,
    resolution_sla_hours INTEGER DEFAULT 48,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Tickets
CREATE TABLE dispute_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    dispute_id UUID REFERENCES escrow_kenya_transactions(id),
    category_id UUID NOT NULL REFERENCES dispute_categories(id),
    
    -- Parties involved
    complainant_id UUID NOT NULL REFERENCES users(id),
    respondent_id UUID NOT NULL REFERENCES users(id),
    
    -- Ticket details
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('payment', 'delivery', 'quality', 'fraud', 'service', 'other')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    severity_score INTEGER DEFAULT 1 CHECK (severity_score BETWEEN 1 AND 10),
    
    -- Financial details
    disputed_amount DECIMAL(20,2),
    currency VARCHAR(10) DEFAULT 'USD',
    compensation_requested DECIMAL(20,2),
    
    -- Status and workflow
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mediating', 'escalated', 'resolved', 'closed', 'cancelled')),
    sub_status VARCHAR(50),
    resolution_type VARCHAR(50) CHECK (resolution_type IN ('refund', 'partial_refund', 'compensation', 'service_credit', 'no_action', 'other')),
    
    -- SLA tracking
    sla_deadline TIMESTAMP WITH TIME ZONE,
    sla_breached BOOLEAN DEFAULT false,
    first_response_due TIMESTAMP WITH TIME ZONE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Assignment and ownership
    assigned_agent_id UUID REFERENCES users(id),
    assigned_team_id UUID,
    escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Dispute Messages and Communications
CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES dispute_tickets(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('complainant', 'respondent', 'agent', 'system', 'mediator')),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('message', 'evidence', 'note', 'system_update', 'escalation')),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    is_visible_to_customer BOOLEAN DEFAULT true,
    attachments JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Evidence and Attachments
CREATE TABLE dispute_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES dispute_tickets(id),
    submitted_by_id UUID NOT NULL REFERENCES users(id),
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('document', 'image', 'video', 'audio', 'screenshot', 'chat_log', 'email', 'other')),
    file_name VARCHAR(500),
    file_path VARCHAR(1000),
    file_size BIGINT,
    file_type VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA Rules and Policies
CREATE TABLE sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('first_response', 'resolution', 'escalation', 'follow_up')),
    
    -- Applicability conditions
    dispute_category_id UUID REFERENCES dispute_categories(id),
    priority_level VARCHAR(20) CHECK (priority_level IN ('low', 'medium', 'high', 'critical', 'urgent')),
    amount_threshold DECIMAL(20,2),
    
    -- SLA targets
    target_hours INTEGER NOT NULL,
    warning_threshold_hours INTEGER,
    breach_threshold_hours INTEGER,
    
    -- Actions and consequences
    action_on_breach JSONB,
    escalation_on_breach BOOLEAN DEFAULT false,
    auto_escalation_level INTEGER,
    
    -- Business hours configuration
    business_hours_only BOOLEAN DEFAULT true,
    business_hours JSONB,
    holidays JSONB,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA Tracking and Monitoring
CREATE TABLE sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES dispute_tickets(id),
    sla_rule_id UUID NOT NULL REFERENCES sla_rules(id),
    
    -- SLA details
    sla_type VARCHAR(50) NOT NULL,
    target_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'met', 'breached', 'paused', 'cancelled')),
    
    -- Timing metrics
    hours_to_target DECIMAL(10,2),
    hours_to_completion DECIMAL(10,2),
    breach_duration_hours DECIMAL(10,2),
    
    -- Events and triggers
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    breached_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Resolution Actions
CREATE TABLE dispute_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES dispute_tickets(id),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('refund', 'partial_refund', 'compensation', 'warning', 'suspension', 'ban', 'mediation', 'escalation', 'note')),
    action_details JSONB NOT NULL,
    
    -- Financial impact
    refund_amount DECIMAL(20,2),
    compensation_amount DECIMAL(20,2),
    fee_waiver_amount DECIMAL(20,2),
    
    -- Action metadata
    performed_by_id UUID NOT NULL REFERENCES users(id),
    performed_by_role VARCHAR(50),
    reason TEXT,
    is_reversible BOOLEAN DEFAULT false,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Resolution Templates
CREATE TABLE resolution_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES dispute_categories(id),
    dispute_type VARCHAR(50),
    priority_level VARCHAR(20),
    
    -- Template content
    description TEXT,
    recommended_actions JSONB,
    compensation_guidelines JSONB,
    communication_templates JSONB,
    
    -- Conditions for auto-approval
    auto_approve_conditions JSONB,
    requires_manager_approval BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Analytics and Metrics
CREATE TABLE dispute_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_bucket DATE NOT NULL,
    
    -- Volume metrics
    total_disputes INTEGER DEFAULT 0,
    new_disputes INTEGER DEFAULT 0,
    resolved_disputes INTEGER DEFAULT 0,
    escalated_disputes INTEGER DEFAULT 0,
    
    -- Time-based metrics
    avg_resolution_time_hours DECIMAL(10,2),
    avg_first_response_time_hours DECIMAL(10,2),
    median_resolution_time_hours DECIMAL(10,2),
    
    -- SLA metrics
    sla_compliance_rate DECIMAL(5,2),
    first_response_sla_rate DECIMAL(5,2),
    resolution_sla_rate DECIMAL(5,2),
    
    -- Financial metrics
    total_disputed_amount DECIMAL(20,2) DEFAULT 0,
    total_refunded_amount DECIMAL(20,2) DEFAULT 0,
    total_compensation_amount DECIMAL(20,2) DEFAULT 0,
    
    -- Quality metrics
    customer_satisfaction_score DECIMAL(5,2),
    repeat_dispute_rate DECIMAL(5,2),
    escalation_rate DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Performance Tracking
CREATE TABLE agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id),
    date_bucket DATE NOT NULL,
    
    -- Productivity metrics
    tickets_handled INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    avg_resolution_time_hours DECIMAL(10,2),
    avg_first_response_time_hours DECIMAL(10,2),
    
    -- Quality metrics
    customer_satisfaction_score DECIMAL(5,2),
    sla_compliance_rate DECIMAL(5,2),
    escalation_rate DECIMAL(5,2),
    
    -- Financial impact
    total_refunded_amount DECIMAL(20,2) DEFAULT 0,
    cost_per_resolution DECIMAL(10,2),
    
    -- Performance indicators
    tickets_per_hour DECIMAL(5,2),
    resolution_rate DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_dispute_categories_active ON dispute_categories(is_active);
CREATE INDEX idx_dispute_categories_parent ON dispute_categories(parent_category_id);

CREATE INDEX idx_dispute_tickets_number ON dispute_tickets(ticket_number);
CREATE INDEX idx_dispute_tickets_dispute_id ON dispute_tickets(dispute_id);
CREATE INDEX idx_dispute_tickets_complainant ON dispute_tickets(complainant_id);
CREATE INDEX idx_dispute_tickets_respondent ON dispute_tickets(respondent_id);
CREATE INDEX idx_dispute_tickets_status ON dispute_tickets(status);
CREATE INDEX idx_dispute_tickets_priority ON dispute_tickets(priority);
CREATE INDEX idx_dispute_tickets_agent ON dispute_tickets(assigned_agent_id);
CREATE INDEX idx_dispute_tickets_created_at ON dispute_tickets(created_at);
CREATE INDEX idx_dispute_tickets_sla_deadline ON dispute_tickets(sla_deadline);

CREATE INDEX idx_dispute_messages_ticket ON dispute_messages(ticket_id);
CREATE INDEX idx_dispute_messages_sender ON dispute_messages(sender_id);
CREATE INDEX idx_dispute_messages_type ON dispute_messages(message_type);
CREATE INDEX idx_dispute_messages_created_at ON dispute_messages(created_at);

CREATE INDEX idx_dispute_evidence_ticket ON dispute_evidence(ticket_id);
CREATE INDEX idx_dispute_evidence_submitted_by ON dispute_evidence(submitted_by_id);
CREATE INDEX idx_dispute_evidence_type ON dispute_evidence(evidence_type);

CREATE INDEX idx_sla_rules_active ON sla_rules(is_active);
CREATE INDEX idx_sla_rules_type ON sla_rules(rule_type);
CREATE INDEX idx_sla_rules_category ON sla_rules(dispute_category_id);

CREATE INDEX idx_sla_tracking_ticket ON sla_tracking(ticket_id);
CREATE INDEX idx_sla_tracking_rule ON sla_tracking(sla_rule_id);
CREATE INDEX idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX idx_sla_tracking_target_time ON sla_tracking(target_time);

CREATE INDEX idx_dispute_actions_ticket ON dispute_actions(ticket_id);
CREATE INDEX idx_dispute_actions_performed_by ON dispute_actions(performed_by_id);
CREATE INDEX idx_dispute_actions_type ON dispute_actions(action_type);

CREATE INDEX idx_resolution_templates_active ON resolution_templates(is_active);
CREATE INDEX idx_resolution_templates_category ON resolution_templates(category_id);

CREATE INDEX idx_dispute_analytics_date ON dispute_analytics(date_bucket);
CREATE INDEX idx_agent_performance_agent ON agent_performance(agent_id);
CREATE INDEX idx_agent_performance_date ON agent_performance(date_bucket);

-- Create triggers for updated_at
CREATE TRIGGER update_dispute_categories_updated_at BEFORE UPDATE ON dispute_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispute_tickets_updated_at BEFORE UPDATE ON dispute_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_rules_updated_at BEFORE UPDATE ON sla_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resolution_templates_updated_at BEFORE UPDATE ON resolution_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispute_analytics_updated_at BEFORE UPDATE ON dispute_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_performance_updated_at BEFORE UPDATE ON agent_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for dispute management

-- Generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    ticket_num TEXT;
    date_prefix TEXT;
    sequence_num INTEGER;
BEGIN
    date_prefix := TO_CHAR(NOW(), 'YYMMDD');
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number, 7) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM dispute_tickets
    WHERE ticket_number LIKE date_prefix || '%';
    
    ticket_num := date_prefix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Calculate SLA deadline based on rules
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
    category_id UUID,
    priority_level VARCHAR,
    dispute_amount DECIMAL,
    sla_type VARCHAR
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    target_hours INTEGER;
    deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get appropriate SLA rule
    SELECT target_hours INTO target_hours
    FROM sla_rules
    WHERE is_active = true
      AND (dispute_category_id IS NULL OR dispute_category_id = category_id)
      AND (priority_level IS NULL OR priority_level = priority_level)
      AND (amount_threshold IS NULL OR dispute_amount >= amount_threshold)
      AND rule_type = sla_type
    ORDER BY 
        CASE WHEN dispute_category_id IS NOT NULL THEN 1 ELSE 2 END,
        CASE WHEN priority_level IS NOT NULL THEN 1 ELSE 2 END,
        amount_threshold DESC NULLS LAST
    LIMIT 1;
    
    -- Default to 48 hours if no rule found
    IF target_hours IS NULL THEN
        target_hours := 48;
    END IF;
    
    deadline := NOW() + (target_hours || ' hours')::INTERVAL;
    
    RETURN deadline;
END;
$$ LANGUAGE plpgsql;

-- Check SLA compliance
CREATE OR REPLACE FUNCTION check_sla_compliance(ticket_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sla_breached BOOLEAN;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    sla_deadline_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get ticket SLA deadline
    SELECT sla_deadline INTO sla_deadline_time
    FROM dispute_tickets
    WHERE id = ticket_id;
    
    -- Check if SLA is breached
    sla_breached := (sla_deadline_time IS NOT NULL AND current_time > sla_deadline_time);
    
    -- Update SLA status
    UPDATE dispute_tickets
    SET sla_breached = sla_breached
    WHERE id = ticket_id;
    
    RETURN NOT sla_breached;
END;
$$ LANGUAGE plpgsql;

-- Update dispute analytics
CREATE OR REPLACE FUNCTION update_dispute_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO dispute_analytics (
        date_bucket,
        total_disputes,
        new_disputes,
        resolved_disputes,
        escalated_disputes,
        avg_resolution_time_hours,
        avg_first_response_time_hours,
        sla_compliance_rate,
        total_disputed_amount,
        total_refunded_amount,
        total_compensation_amount
    )
    SELECT 
        target_date,
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN DATE(created_at) = target_date THEN 1 END) as new_disputes,
        COUNT(CASE WHEN DATE(resolved_at) = target_date THEN 1 END) as resolved_disputes,
        COUNT(CASE WHEN escalation_level > 1 AND DATE(updated_at) = target_date THEN 1 END) as escalated_disputes,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 END) as avg_resolution_time_hours,
        AVG(CASE WHEN first_response_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (first_response_at - created_at))/3600 END) as avg_first_response_time_hours,
        (COUNT(CASE WHEN NOT sla_breached THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as sla_compliance_rate,
        COALESCE(SUM(disputed_amount), 0) as total_disputed_amount,
        COALESCE(SUM(
            COALESCE((SELECT refund_amount FROM dispute_actions da WHERE da.ticket_id = dt.id AND da.action_type = 'refund' LIMIT 1), 0) +
            COALESCE((SELECT refund_amount FROM dispute_actions da WHERE da.ticket_id = dt.id AND da.action_type = 'partial_refund' LIMIT 1), 0)
        ), 0) as total_refunded_amount,
        COALESCE(SUM(
            COALESCE((SELECT compensation_amount FROM dispute_actions da WHERE da.ticket_id = dt.id AND da.action_type = 'compensation' LIMIT 1), 0)
        ), 0) as total_compensation_amount
    FROM dispute_tickets dt
    WHERE DATE(created_at) <= target_date
    ON CONFLICT (date_bucket) DO UPDATE SET
        total_disputes = EXCLUDED.total_disputes,
        new_disputes = EXCLUDED.new_disputes,
        resolved_disputes = EXCLUDED.resolved_disputes,
        escalated_disputes = EXCLUDED.escalated_disputes,
        avg_resolution_time_hours = EXCLUDED.avg_resolution_time_hours,
        avg_first_response_time_hours = EXCLUDED.avg_first_response_time_hours,
        sla_compliance_rate = EXCLUDED.sla_compliance_rate,
        total_disputed_amount = EXCLUDED.total_disputed_amount,
        total_refunded_amount = EXCLUDED.total_refunded_amount,
        total_compensation_amount = EXCLUDED.total_compensation_amount,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Views for reporting

-- Dispute Dashboard View
CREATE VIEW dispute_dashboard AS
SELECT 
    DATE_TRUNC('day', dt.created_at) as date,
    COUNT(*) as total_disputes,
    COUNT(CASE WHEN dt.status = 'open' THEN 1 END) as open_disputes,
    COUNT(CASE WHEN dt.status = 'investigating' THEN 1 END) as investigating_disputes,
    COUNT(CASE WHEN dt.status = 'resolved' THEN 1 END) as resolved_disputes,
    COUNT(CASE WHEN dt.sla_breached = true THEN 1 END) as sla_breached,
    SUM(dt.disputed_amount) as total_disputed_amount,
    AVG(EXTRACT(EPOCH FROM (COALESCE(dt.first_response_at, NOW()) - dt.created_at))/3600) as avg_first_response_hours,
    AVG(EXTRACT(EPOCH FROM (COALESCE(dt.resolved_at, NOW()) - dt.created_at))/3600) as avg_resolution_hours
FROM dispute_tickets dt
GROUP BY DATE_TRUNC('day', dt.created_at)
ORDER BY date DESC;

-- Agent Performance Summary View
CREATE VIEW agent_performance_summary AS
SELECT 
    u.id as agent_id,
    u.name,
    u.email,
    COUNT(dt.id) as total_tickets,
    COUNT(CASE WHEN dt.status = 'resolved' THEN 1 END) as resolved_tickets,
    AVG(EXTRACT(EPOCH FROM (COALESCE(dt.resolved_at, NOW()) - dt.created_at))/3600) as avg_resolution_time,
    COUNT(CASE WHEN dt.sla_breached = false THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as sla_compliance_rate,
    COALESCE(SUM(da.refund_amount), 0) as total_refunded
FROM users u
LEFT JOIN dispute_tickets dt ON u.id = dt.assigned_agent_id
LEFT JOIN dispute_actions da ON dt.id = da.ticket_id AND da.action_type IN ('refund', 'partial_refund')
WHERE u.role IN ('agent', 'manager', 'admin')
GROUP BY u.id, u.name, u.email
ORDER BY resolved_tickets DESC;

-- Insert default dispute categories
INSERT INTO dispute_categories (name, description, severity_level, resolution_sla_hours) VALUES
('Payment Issues', 'Problems related to payments, charges, and refunds', 2, 24),
('Delivery Problems', 'Issues with product delivery and shipping', 3, 48),
('Quality Concerns', 'Product quality and functionality issues', 2, 72),
('Fraud Reports', 'Suspected fraudulent activity', 5, 12),
('Service Disputes', 'Issues with service quality and delivery', 3, 48),
('Account Issues', 'Problems with user accounts and access', 1, 12),
('Policy Violations', 'Violations of platform policies and terms', 4, 24),
('Technical Issues', 'Platform technical problems and bugs', 2, 8);

-- Insert default SLA rules
INSERT INTO sla_rules (name, rule_type, target_hours, warning_threshold_hours, breach_threshold_hours, priority_level, escalation_on_breach) VALUES
('First Response - Critical', 'first_response', 2, 1, 4, 'critical', true),
('First Response - High', 'first_response', 4, 2, 8, 'high', true),
('First Response - Medium', 'first_response', 8, 4, 16, 'medium', false),
('First Response - Low', 'first_response', 24, 12, 48, 'low', false),
('Resolution - Critical', 'resolution', 24, 12, 48, 'critical', true),
('Resolution - High', 'resolution', 48, 24, 96, 'high', true),
('Resolution - Medium', 'resolution', 72, 48, 144, 'medium', false),
('Resolution - Low', 'resolution', 168, 120, 240, 'low', false);

-- Insert default resolution templates
INSERT INTO resolution_templates (name, dispute_type, description, recommended_actions, compensation_guidelines) VALUES
('Full Refund - Delivery Issue', 'delivery', 'Complete refund for delivery problems', 
 '{"actions": ["full_refund", "shipping_label"], "auto_approve": true}',
 '{"max_refund": "full_amount", "additional_compensation": "shipping_cost"}'),
('Partial Refund - Quality Issue', 'quality', 'Partial refund for quality concerns',
 '{"actions": ["partial_refund", "return_processing"], "requires_approval": true}',
 '{"max_refund": "80_percent", "return_required": true}'),
('Compensation - Service Issue', 'service', 'Compensation for service problems',
 '{"actions": ["compensation", "credit"], "auto_approve": false}',
 '{"max_compensation": "20_percent", "credit_validity": "90_days"}');

COMMIT;
