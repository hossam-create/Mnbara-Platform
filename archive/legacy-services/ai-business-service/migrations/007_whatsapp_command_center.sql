-- Migration: WhatsApp Command Center
-- Sprint 7: WhatsApp Cloud API integration for system operation

-- Create WhatsApp configurations table
CREATE TABLE IF NOT EXISTS whatsapp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    display_name VARCHAR(200),
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(500),
    access_token TEXT,
    verify_token VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    webhook_version INTEGER DEFAULT 1,
    
    -- Rate limiting
    daily_message_limit INTEGER DEFAULT 1000,
    messages_sent_today INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Configuration
    auto_reply_enabled BOOLEAN DEFAULT false,
    business_hours_only BOOLEAN DEFAULT false,
    timezone VARCHAR(100) DEFAULT 'UTC',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_phone_number UNIQUE (phone_number)
);

-- Create WhatsApp contacts table
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    whatsapp_phone_number VARCHAR(50) NOT NULL,
    contact_name VARCHAR(200),
    display_name VARCHAR(200),
    profile_pic_url TEXT,
    is_business BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    
    -- Permission levels
    permissions JSONB DEFAULT '[]', -- Array of permission strings
    role VARCHAR(50) DEFAULT 'USER', -- ADMIN, MANAGER, USER
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_whatsapp_contact UNIQUE (business_account_id, whatsapp_phone_number)
);

-- Create WhatsApp messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR(100) NOT NULL,
    contact_phone_number VARCHAR(50) NOT NULL,
    message_type VARCHAR(20) NOT NULL, -- TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, LOCATION, CONTACT
    direction VARCHAR(10) NOT NULL, -- INBOUND, OUTBOUND
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    media_size INTEGER,
    caption TEXT,
    
    -- Message status
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, READ, FAILED
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Command processing
    is_command BOOLEAN DEFAULT false,
    command_type VARCHAR(100),
    command_parameters JSONB,
    processing_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    processing_result JSONB,
    
    timestamps JSONB DEFAULT '{}', -- Various timestamps from WhatsApp
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create WhatsApp commands table
CREATE TABLE IF NOT EXISTS whatsapp_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    command_name VARCHAR(100) NOT NULL,
    command_pattern TEXT NOT NULL, -- Regex pattern for matching
    description TEXT,
    category VARCHAR(50), -- FINANCIAL, REPORTS, SYSTEM, WORKFLOW
    required_permissions JSONB DEFAULT '[]', -- Array of required permissions
    n8n_workflow_id VARCHAR(200), -- n8n workflow ID to trigger
    n8n_webhook_url TEXT,
    
    -- Command configuration
    is_active BOOLEAN DEFAULT true,
    requires_confirmation BOOLEAN DEFAULT false,
    timeout_seconds INTEGER DEFAULT 300,
    max_executions_per_hour INTEGER DEFAULT 10,
    
    -- Response templates
    success_template TEXT,
    error_template TEXT,
    confirmation_template TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_command_name UNIQUE (business_account_id, command_name)
);

-- Create WhatsApp command executions table
CREATE TABLE IF NOT EXISTS whatsapp_command_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    command_id UUID REFERENCES whatsapp_commands(id) ON DELETE SET NULL,
    message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
    contact_phone_number VARCHAR(50) NOT NULL,
    
    -- Execution details
    execution_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, TIMEOUT
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- n8n integration
    n8n_execution_id VARCHAR(200),
    n8n_webhook_response JSONB,
    n8n_status_code INTEGER,
    
    -- Results
    result_data JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create WhatsApp sessions table for conversation tracking
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    contact_phone_number VARCHAR(50) NOT NULL,
    session_state JSONB DEFAULT '{}',
    last_command_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Session context
    context_variables JSONB DEFAULT '{}',
    pending_confirmation JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_active_session UNIQUE (business_account_id, contact_phone_number, is_active) 
    WHERE is_active = true
);

-- Create WhatsApp analytics table
CREATE TABLE IF NOT EXISTS whatsapp_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Message statistics
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_received INTEGER DEFAULT 0,
    unique_contacts INTEGER DEFAULT 0,
    
    -- Command statistics
    total_commands_executed INTEGER DEFAULT 0,
    successful_commands INTEGER DEFAULT 0,
    failed_commands INTEGER DEFAULT 0,
    
    -- Popular commands
    top_commands JSONB DEFAULT '[]', -- Array of {command, count} objects
    
    -- Response times
    avg_response_time_seconds DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_daily_analytics UNIQUE (business_account_id, date)
);

-- Create materialized view for WhatsApp command center summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_whatsapp_command_center_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    wc.phone_number,
    wc.is_active as whatsapp_active,
    wc.is_verified as whatsapp_verified,
    
    -- Message statistics
    COALESCE(wa.total_messages_sent, 0) as messages_sent_today,
    COALESCE(wa.daily_message_limit, 1000) as daily_message_limit,
    
    -- Contact statistics
    (SELECT COUNT(*) FROM whatsapp_contacts wct 
     WHERE wct.business_account_id = ba.id AND wct.is_blocked = false) as active_contacts,
    
    -- Command statistics
    (SELECT COUNT(*) FROM whatsapp_command_executions wce 
     WHERE wce.business_account_id = ba.id 
     AND DATE(wce.created_at) = CURRENT_DATE) as commands_executed_today,
    
    -- Recent activity
    (SELECT MAX(wm.created_at) FROM whatsapp_messages wm 
     WHERE wm.business_account_id = ba.id) as last_message_at,
    
    wc.updated_at as last_configuration_update
    
FROM business_accounts ba
LEFT JOIN whatsapp_configurations wc ON ba.id = wc.business_account_id
LEFT JOIN whatsapp_analytics wa ON ba.id = wa.business_account_id AND wa.date = CURRENT_DATE;

-- Create materialized view for WhatsApp command performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_whatsapp_command_performance AS
SELECT 
    wcmd.business_account_id,
    wcmd.command_name,
    wcmd.category,
    COUNT(wce.id) as total_executions,
    COUNT(CASE WHEN wce.execution_status = 'COMPLETED' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN wce.execution_status = 'FAILED' THEN 1 END) as failed_executions,
    AVG(wce.duration_seconds) as avg_duration_seconds,
    MAX(wce.created_at) as last_execution,
    
    -- Success rate
    CASE 
        WHEN COUNT(wce.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN wce.execution_status = 'COMPLETED' THEN 1 END)::DECIMAL / COUNT(wce.id)) * 100, 2)
        ELSE 0 
    END as success_rate_percentage
    
FROM whatsapp_commands wcmd
LEFT JOIN whatsapp_command_executions wce ON wcmd.id = wce.command_id
GROUP BY wcmd.business_account_id, wcmd.command_name, wcmd.category;

-- Database functions

-- Function to register WhatsApp configuration
CREATE OR REPLACE FUNCTION register_whatsapp_configuration(
    p_business_account_id UUID,
    p_phone_number_id VARCHAR(100),
    p_phone_number VARCHAR(50),
    p_display_name VARCHAR(200),
    p_webhook_url VARCHAR(500),
    p_webhook_secret VARCHAR(500),
    p_access_token TEXT,
    p_verify_token VARCHAR(500)
) RETURNS UUID AS $$
DECLARE
    v_config_id UUID;
BEGIN
    INSERT INTO whatsapp_configurations (
        business_account_id,
        phone_number_id,
        phone_number,
        display_name,
        webhook_url,
        webhook_secret,
        access_token,
        verify_token
    ) VALUES (
        p_business_account_id,
        p_phone_number_id,
        p_phone_number,
        p_display_name,
        p_webhook_url,
        p_webhook_secret,
        p_access_token,
        p_verify_token
    ) RETURNING id INTO v_config_id;
    
    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process WhatsApp command
CREATE OR REPLACE FUNCTION process_whatsapp_command(
    p_business_account_id UUID,
    p_contact_phone_number VARCHAR(50),
    p_message_content TEXT,
    p_message_id VARCHAR(100)
) RETURNS JSONB AS $$
DECLARE
    v_command_id UUID;
    v_execution_id UUID;
    v_matched_command JSONB;
    v_permissions JSONB;
    v_has_permission BOOLEAN := false;
BEGIN
    -- Parse command from message
    SELECT * INTO v_matched_command
    FROM parse_whatsapp_command(p_message_content, p_business_account_id);
    
    IF v_matched_command IS NULL THEN
        RETURN jsonb_build_object('status', 'NO_COMMAND_MATCHED');
    END IF;
    
    -- Get command details
    SELECT id, required_permissions INTO v_command_id, v_permissions
    FROM whatsapp_commands 
    WHERE business_account_id = p_business_account_id 
    AND command_name = v_matched_command->>'command_name'
    AND is_active = true;
    
    IF v_command_id IS NULL THEN
        RETURN jsonb_build_object('status', 'COMMAND_NOT_FOUND');
    END IF;
    
    -- Check permissions
    SELECT check_whatsapp_permissions(p_contact_phone_number, p_business_account_id, v_permissions) INTO v_has_permission;
    
    IF NOT v_has_permission THEN
        RETURN jsonb_build_object('status', 'PERMISSION_DENIED');
    END IF;
    
    -- Create command execution record
    INSERT INTO whatsapp_command_executions (
        business_account_id,
        command_id,
        contact_phone_number,
        execution_status,
        started_at
    ) VALUES (
        p_business_account_id,
        v_command_id,
        p_contact_phone_number,
        'PENDING',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_execution_id;
    
    -- Trigger n8n workflow if configured
    IF EXISTS (SELECT 1 FROM whatsapp_commands WHERE id = v_command_id AND n8n_workflow_id IS NOT NULL) THEN
        PERFORM trigger_n8n_workflow(v_command_id, v_execution_id, v_matched_command->>'parameters');
    END IF;
    
    RETURN jsonb_build_object(
        'status', 'COMMAND_ACCEPTED',
        'execution_id', v_execution_id,
        'command', v_matched_command
    );
END;
$$ LANGUAGE plpgsql;

-- Function to parse WhatsApp command
CREATE OR REPLACE FUNCTION parse_whatsapp_command(
    p_message_content TEXT,
    p_business_account_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_commands JSONB;
    v_matched_command JSONB;
BEGIN
    -- Get active commands for the business
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', command_name,
            'pattern', command_pattern,
            'category', category
        )
    ) INTO v_commands
    FROM whatsapp_commands 
    WHERE business_account_id = p_business_account_id 
    AND is_active = true;
    
    -- Try to match command patterns
    FOR v_matched_command IN SELECT * FROM jsonb_array_elements(v_commands)
    LOOP
        -- Simple pattern matching (can be enhanced with regex)
        IF LOWER(p_message_content) ~* (v_matched_command->>'pattern') THEN
            RETURN jsonb_build_object(
                'command_name', v_matched_command->>'name',
                'category', v_matched_command->>'category',
                'parameters', jsonb_build_object('raw_message', p_message_content)
            );
        END IF;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check WhatsApp permissions
CREATE OR REPLACE FUNCTION check_whatsapp_permissions(
    p_contact_phone_number VARCHAR(50),
    p_business_account_id UUID,
    p_required_permissions JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    v_contact_permissions JSONB;
    v_required_perm JSONB;
    v_has_all_permissions BOOLEAN := true;
BEGIN
    -- Get contact permissions
    SELECT permissions INTO v_contact_permissions
    FROM whatsapp_contacts 
    WHERE business_account_id = p_business_account_id 
    AND whatsapp_phone_number = p_contact_phone_number;
    
    -- Check if contact has all required permissions
    FOR v_required_perm IN SELECT value FROM jsonb_array_elements(p_required_permissions)
    LOOP
        IF NOT (v_contact_permissions @> jsonb_build_array(v_required_perm)) THEN
            v_has_all_permissions := false;
            EXIT;
        END IF;
    END LOOP;
    
    -- Admin users have all permissions
    IF EXISTS (SELECT 1 FROM whatsapp_contacts 
               WHERE business_account_id = p_business_account_id 
               AND whatsapp_phone_number = p_contact_phone_number 
               AND role = 'ADMIN') THEN
        v_has_all_permissions := true;
    END IF;
    
    RETURN v_has_all_permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger n8n workflow
CREATE OR REPLACE FUNCTION trigger_n8n_workflow(
    p_command_id UUID,
    p_execution_id UUID,
    p_parameters JSONB
) RETURNS VOID AS $$
DECLARE
    v_workflow_id VARCHAR(200);
    v_webhook_url TEXT;
    v_payload JSONB;
BEGIN
    -- Get n8n workflow details
    SELECT n8n_workflow_id, n8n_webhook_url INTO v_workflow_id, v_webhook_url
    FROM whatsapp_commands 
    WHERE id = p_command_id;
    
    -- Prepare webhook payload
    v_payload := jsonb_build_object(
        'command_id', p_command_id,
        'execution_id', p_execution_id,
        'parameters', p_parameters,
        'timestamp', CURRENT_TIMESTAMP,
        'source', 'whatsapp_command_center'
    );
    
    -- Make HTTP request to n8n webhook (simplified - in production use proper HTTP client)
    -- This would typically use pg_http extension or external service
    
    -- Log the trigger attempt
    INSERT INTO whatsapp_command_executions (
        id,
        n8n_execution_id,
        n8n_status_code,
        result_data
    ) VALUES (
        p_execution_id,
        v_workflow_id,
        200, -- Placeholder
        jsonb_build_object('webhook_triggered', true, 'url', v_webhook_url)
    );
    
    -- Update execution status
    UPDATE whatsapp_command_executions 
    SET execution_status = 'RUNNING',
        started_at = CURRENT_TIMESTAMP
    WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update WhatsApp analytics
CREATE OR REPLACE FUNCTION update_whatsapp_analytics(
    p_business_account_id UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO whatsapp_analytics (
        business_account_id,
        date,
        total_messages_sent,
        total_messages_received,
        unique_contacts,
        total_commands_executed,
        successful_commands,
        failed_commands,
        avg_response_time_seconds
    ) SELECT 
        p_business_account_id,
        CURRENT_DATE,
        COUNT(CASE WHEN direction = 'OUTBOUND' THEN 1 END),
        COUNT(CASE WHEN direction = 'INBOUND' THEN 1 END),
        COUNT(DISTINCT contact_phone_number),
        COUNT(CASE WHEN is_command = true THEN 1 END),
        COUNT(CASE WHEN processing_status = 'COMPLETED' AND is_command = true THEN 1 END),
        COUNT(CASE WHEN processing_status = 'FAILED' AND is_command = true THEN 1 END),
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))
    FROM whatsapp_messages 
    WHERE business_account_id = p_business_account_id 
    AND DATE(created_at) = CURRENT_DATE
    ON CONFLICT (business_account_id, date) 
    DO UPDATE SET
        total_messages_sent = EXCLUDED.total_messages_sent,
        total_messages_received = EXCLUDED.total_messages_received,
        unique_contacts = EXCLUDED.unique_contacts,
        total_commands_executed = EXCLUDED.total_commands_executed,
        successful_commands = EXCLUDED.successful_commands,
        failed_commands = EXCLUDED.failed_commands,
        avg_response_time_seconds = EXCLUDED.avg_response_time_seconds;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh WhatsApp views
CREATE OR REPLACE FUNCTION refresh_whatsapp_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_whatsapp_command_center_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_whatsapp_command_performance;
END;
$$ LANGUAGE plpgsql;

-- Insert default WhatsApp commands
INSERT INTO whatsapp_commands (
    business_account_id,
    command_name,
    command_pattern,
    description,
    category,
    required_permissions,
    n8n_workflow_id,
    success_template,
    error_template
) VALUES 
-- Financial commands
(
    gen_random_uuid(),
    'balance',
    '^(balance|account|حساب)',
    'Get current account balance',
    'FINANCIAL',
    '["VIEW_BALANCE"]',
    'get_balance_report',
    'Your current balance is: {{balance}}',
    'Sorry, I couldn''t retrieve your balance information.'
),
(
    gen_random_uuid(),
    'report',
    '^(report|تقرير)',
    'Generate financial report',
    'FINANCIAL',
    '["VIEW_REPORTS"]',
    'generate_financial_report',
    'Financial report has been generated and sent to your email.',
    'Failed to generate financial report. Please try again later.'
),
(
    gen_random_uuid(),
    'invoice',
    '^(invoice|فاتورة)',
    'Create or send invoice',
    'FINANCIAL',
    '["CREATE_INVOICE"]',
    'create_invoice_workflow',
    'Invoice {{invoice_number}} has been created successfully.',
    'Failed to create invoice. Please check the details and try again.'
),
-- System commands
(
    gen_random_uuid(),
    'help',
    '^(help|مساعدة)',
    'Show available commands',
    'SYSTEM',
    '[]',
    'show_help_menu',
    'Available commands: balance, report, invoice, status, help',
    'Command not recognized. Type "help" for available commands.'
),
(
    gen_random_uuid(),
    'status',
    '^(status|حالة)',
    'Get system status',
    'SYSTEM',
    '["VIEW_STATUS"]',
    'get_system_status',
    'System is running normally. All services operational.',
    'System status check failed. Please contact support.'
)
ON CONFLICT DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_configurations_updated_at
    BEFORE UPDATE ON whatsapp_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_commands_updated_at
    BEFORE UPDATE ON whatsapp_commands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_configurations_business_account ON whatsapp_configurations(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_business_account ON whatsapp_contacts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(whatsapp_phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_business_account ON whatsapp_messages(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_command ON whatsapp_messages(is_command);
CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_business_account ON whatsapp_commands(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_active ON whatsapp_commands(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_command_executions_business_account ON whatsapp_command_executions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_command_executions_status ON whatsapp_command_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_business_account ON whatsapp_sessions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_contact ON whatsapp_sessions(contact_phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_business_account ON whatsapp_analytics(business_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_date ON whatsapp_analytics(date);

-- Set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_configurations TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_contacts TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_messages TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_commands TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_command_executions TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_sessions TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_analytics TO ai_business_service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION register_whatsapp_configuration TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION process_whatsapp_command TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION parse_whatsapp_command TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION check_whatsapp_permissions TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION trigger_n8n_workflow TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION update_whatsapp_analytics TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION refresh_whatsapp_views TO ai_business_service_role;
