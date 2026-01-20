-- Migration: Executive Views - Sprint 10
-- Purpose: CEO Dashboard, CFO Dashboard, Auto-generated Narrative Reports

-- ========================================
-- CEO DASHBOARD DATA
-- ========================================

-- CEO Dashboard Summary
CREATE TABLE ceo_dashboard_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    
    -- CEO Key Metrics
    revenue_growth_rate DECIMAL(10,2), -- YoY revenue growth %
    profit_margin DECIMAL(10,2), -- Net profit margin %
    cash_position DECIMAL(20,2), -- Current cash balance
    cash_burn_rate DECIMAL(20,2), -- Monthly cash burn
    
    -- Performance Indicators
    revenue_trend VARCHAR(20), -- INCREASING, DECREASING, STABLE
    profitability_trend VARCHAR(20), -- INCREASING, DECREASING, STABLE
    cash_trend VARCHAR(20), -- IMPROVING, DECLINING, STABLE
    
    -- Key Alerts Summary
    critical_alerts_count INTEGER DEFAULT 0,
    warning_alerts_count INTEGER DEFAULT 0,
    total_active_alerts INTEGER DEFAULT 0,
    
    -- Quick Stats
    monthly_revenue DECIMAL(20,2),
    monthly_expenses DECIMAL(20,2),
    monthly_profit DECIMAL(20,2),
    employee_count INTEGER DEFAULT 0,
    
    -- Growth Metrics
    customer_growth_rate DECIMAL(10,2),
    market_share DECIMAL(10,2),
    competitive_position VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- CEO KPI Trends
CREATE TABLE ceo_kpi_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    
    kpi_name VARCHAR(100) NOT NULL, -- revenue, profit, cash, customers, etc.
    kpi_value DECIMAL(20,2) NOT NULL,
    kpi_unit VARCHAR(20), -- USD, %, count, etc.
    trend_direction VARCHAR(20), -- UP, DOWN, FLAT
    trend_percentage DECIMAL(10,2), -- % change from previous period
    target_value DECIMAL(20,2), -- Target/benchmark value
    performance_status VARCHAR(20), -- EXCEEDING, MEETING, BELOW_TARGET
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CFO DASHBOARD DATA
-- ========================================

-- CFO Dashboard Summary
CREATE TABLE cfo_dashboard_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    
    -- Financial Statements Summary
    total_revenue DECIMAL(20,2),
    total_expenses DECIMAL(20,2),
    gross_profit DECIMAL(20,2),
    operating_income DECIMAL(20,2),
    net_income DECIMAL(20,2),
    
    -- Balance Sheet Summary
    total_assets DECIMAL(20,2),
    current_assets DECIMAL(20,2),
    total_liabilities DECIMAL(20,2),
    current_liabilities DECIMAL(20,2),
    equity DECIMAL(20,2),
    working_capital DECIMAL(20,2),
    
    -- Cash Flow Summary
    operating_cash_flow DECIMAL(20,2),
    investing_cash_flow DECIMAL(20,2),
    financing_cash_flow DECIMAL(20,2),
    net_cash_flow DECIMAL(20,2),
    cash_balance DECIMAL(20,2),
    
    -- Key Ratios
    current_ratio DECIMAL(10,2),
    quick_ratio DECIMAL(10,2),
    debt_to_equity DECIMAL(10,2),
    gross_margin DECIMAL(10,2),
    net_margin DECIMAL(10,2),
    roa DECIMAL(10,2),
    roe DECIMAL(10,2),
    
    -- Risk Indicators
    liquidity_risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    solvency_risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    profitability_risk_level VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Forecast vs Actual Comparison
CREATE TABLE cfo_forecast_vs_actual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    scenario_id UUID REFERENCES simulation_scenarios(id),
    
    comparison_type VARCHAR(50) NOT NULL, -- REVENUE, EXPENSES, PROFIT, CASH_FLOW
    forecast_value DECIMAL(20,2) NOT NULL,
    actual_value DECIMAL(20,2) NOT NULL,
    variance_amount DECIMAL(20,2), -- actual - forecast
    variance_percentage DECIMAL(10,2), -- (actual - forecast) / forecast * 100
    accuracy_rating VARCHAR(20), -- EXCELLENT, GOOD, FAIR, POOR
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- NARRATIVE REPORTS
-- ========================================

-- Executive Narrative Reports
CREATE TABLE executive_narrative_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- CEO_SUMMARY, CFO_REPORT, MONTHLY, QUARTERLY
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    language VARCHAR(10) NOT NULL DEFAULT 'en', -- en, ar
    
    -- Report Content
    executive_summary TEXT,
    financial_performance TEXT,
    key_highlights TEXT,
    challenges_and_risks TEXT,
    strategic_recommendations TEXT,
    outlook TEXT,
    
    -- Report Metadata
    report_period VARCHAR(50), -- "Q1 2024", "January 2024"
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    -- AI Generation Data
    ai_model_version VARCHAR(50),
    data_sources JSONB, -- Sources used for report generation
    confidence_score DECIMAL(5,2), -- AI confidence in report quality
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Sections (for structured narrative)
CREATE TABLE narrative_report_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES executive_narrative_reports(id) ON DELETE CASCADE,
    
    section_name VARCHAR(100) NOT NULL, -- OVERVIEW, PERFORMANCE, RISKS, OUTLOOK
    section_title VARCHAR(255) NOT NULL,
    section_content TEXT NOT NULL,
    section_order INTEGER NOT NULL,
    
    -- Section Metadata
    data_points JSONB, -- Key data points referenced in section
    insights JSONB, -- AI-generated insights
    recommendations JSONB, -- Actionable recommendations
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Templates
CREATE TABLE narrative_report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL UNIQUE,
    report_type VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL,
    
    -- Template Structure
    sections JSONB NOT NULL, -- Array of section definitions
    tone VARCHAR(50), -- FORMAL, CASUAL, TECHNICAL
    audience VARCHAR(50), -- CEO, CFO, BOARD, INVESTORS
    
    -- Content Guidelines
    length_guidelines JSONB, -- Min/max words per section
    focus_areas JSONB, -- Key areas to emphasize
    style_preferences JSONB, -- Writing style preferences
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- EXECUTIVE ALERTS AND NOTIFICATIONS
-- ========================================

-- Executive Alert Summary
CREATE TABLE executive_alert_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    
    -- Alert Categories
    financial_alerts_count INTEGER DEFAULT 0,
    operational_alerts_count INTEGER DEFAULT 0,
    strategic_alerts_count INTEGER DEFAULT 0,
    compliance_alerts_count INTEGER DEFAULT 0,
    
    -- Alert Severity Breakdown
    critical_alerts_count INTEGER DEFAULT 0,
    high_priority_alerts_count INTEGER DEFAULT 0,
    medium_priority_alerts_count INTEGER DEFAULT 0,
    low_priority_alerts_count INTEGER DEFAULT 0,
    
    -- Alert Trends
    new_alerts_this_period INTEGER DEFAULT 0,
    resolved_alerts_this_period INTEGER DEFAULT 0,
    overdue_alerts_count INTEGER DEFAULT 0,
    
    -- Top Issues
    top_critical_alerts JSONB, -- Array of top 5 critical alerts
    top_trending_issues JSONB, -- Array of emerging issues
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executive Action Items
CREATE TABLE executive_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    category VARCHAR(50), -- FINANCIAL, OPERATIONAL, STRATEGIC, COMPLIANCE
    
    -- Assignment and Timeline
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    estimated_effort_hours INTEGER,
    
    -- Status and Progress
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    progress_percentage INTEGER DEFAULT 0, -- 0-100
    completion_date DATE,
    
    -- Source and Context
    source_type VARCHAR(50), -- ALERT, RECOMMENDATION, AUDIT, MANUAL
    source_id UUID, -- Reference to source record
    context_data JSONB, -- Additional context
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PERFORMANCE BENCHMARKS
-- ========================================

-- Industry Benchmarks
CREATE TABLE industry_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_code VARCHAR(50) NOT NULL,
    industry_name VARCHAR(100) NOT NULL,
    company_size VARCHAR(50), -- SMALL, MEDIUM, LARGE, ENTERPRISE
    
    -- Benchmark Metrics
    avg_revenue_growth_rate DECIMAL(10,2),
    avg_profit_margin DECIMAL(10,2),
    avg_current_ratio DECIMAL(10,2),
    avg_debt_to_equity DECIMAL(10,2),
    avg_roa DECIMAL(10,2),
    avg_roe DECIMAL(10,2),
    
    -- Performance Ranges
    revenue_growth_range JSONB, -- {min: 0, max: 50, median: 15}
    profit_margin_range JSONB,
    current_ratio_range JSONB,
    
    data_period VARCHAR(50), -- "2023", "Q1 2024"
    data_source VARCHAR(100),
    sample_size INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Performance vs Benchmarks
CREATE TABLE performance_vs_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    benchmark_id UUID NOT NULL REFERENCES industry_benchmarks(id),
    
    metric_name VARCHAR(100) NOT NULL,
    company_value DECIMAL(20,2) NOT NULL,
    benchmark_value DECIMAL(20,2) NOT NULL,
    performance_percentile DECIMAL(10,2), -- Company's percentile vs industry
    performance_rating VARCHAR(20), -- EXCELLENT, ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE, POOR
    
    variance_amount DECIMAL(20,2),
    variance_percentage DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ========================================

-- CEO Dashboard View
CREATE MATERIALIZED VIEW mv_ceo_dashboard AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    fp.name as current_period,
    
    -- Latest CEO Summary
    cds.revenue_growth_rate,
    cds.profit_margin,
    cds.cash_position,
    cds.cash_burn_rate,
    cds.revenue_trend,
    cds.profitability_trend,
    cds.cash_trend,
    cds.critical_alerts_count,
    cds.warning_alerts_count,
    cds.total_active_alerts,
    
    -- Quick Stats
    cds.monthly_revenue,
    cds.monthly_expenses,
    cds.monthly_profit,
    cds.customer_growth_rate,
    
    -- Performance Status
    CASE 
        WHEN cds.critical_alerts_count > 0 THEN 'CRITICAL'
        WHEN cds.warning_alerts_count > 3 THEN 'WARNING'
        WHEN cds.profit_margin < 5 THEN 'CONCERN'
        ELSE 'HEALTHY'
    END as overall_health_status,
    
    cds.updated_at
FROM business_accounts ba
JOIN fiscal_periods fp ON fp.is_current = true
LEFT JOIN ceo_dashboard_summary cds ON ba.id = cds.business_account_id 
    AND cds.period_id = fp.id
WHERE ba.is_active = true;

-- CFO Dashboard View
CREATE MATERIALIZED VIEW mv_cfo_dashboard AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    fp.name as current_period,
    
    -- Financial Summary
    cfs.total_revenue,
    cfs.total_expenses,
    cfs.gross_profit,
    cfs.operating_income,
    cfs.net_income,
    cfs.total_assets,
    cfs.total_liabilities,
    cfs.equity,
    cfs.working_capital,
    cfs.cash_balance,
    
    -- Key Ratios
    cfs.current_ratio,
    cfs.quick_ratio,
    cfs.debt_to_equity,
    cfs.gross_margin,
    cfs.net_margin,
    cfs.roa,
    cfs.roe,
    
    -- Risk Levels
    cfs.liquidity_risk_level,
    cfs.solvency_risk_level,
    cfs.profitability_risk_level,
    
    -- Forecast Accuracy
    AVG(cfv.variance_percentage) as avg_forecast_variance,
    COUNT(cfv.id) as forecast_comparisons_count,
    
    -- Overall Financial Health
    CASE 
        WHEN cfs.liquidity_risk_level = 'CRITICAL' OR cfs.solvency_risk_level = 'CRITICAL' THEN 'CRITICAL'
        WHEN cfs.liquidity_risk_level = 'HIGH' OR cfs.solvency_risk_level = 'HIGH' THEN 'HIGH_RISK'
        WHEN cfs.net_margin < 0 THEN 'LOSS_MAKING'
        WHEN cfs.net_margin < 5 THEN 'LOW_PROFITABILITY'
        ELSE 'HEALTHY'
    END as financial_health_status,
    
    cfs.updated_at
FROM business_accounts ba
JOIN fiscal_periods fp ON fp.is_current = true
LEFT JOIN cfo_dashboard_summary cfs ON ba.id = cfs.business_account_id 
    AND cfs.period_id = fp.id
LEFT JOIN cfo_forecast_vs_actual cfv ON ba.id = cfv.business_account_id 
    AND cfv.period_id = fp.id
WHERE ba.is_active = true
GROUP BY ba.id, ba.name, fp.name, cfs.*;

-- Executive Reports Summary
CREATE MATERIALIZED VIEW mv_executive_reports AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    fp.name as current_period,
    
    -- Latest Reports
    COUNT(DISTINCT CASE WHEN enr.report_type = 'CEO_SUMMARY' THEN enr.id END) as ceo_reports_count,
    COUNT(DISTINCT CASE WHEN enr.report_type = 'CFO_REPORT' THEN enr.id END) as cfo_reports_count,
    COUNT(DISTINCT CASE WHEN enr.language = 'en' THEN enr.id END) as english_reports_count,
    COUNT(DISTINCT CASE WHEN enr.language = 'ar' THEN enr.id END) as arabic_reports_count,
    
    -- Latest Report Dates
    MAX(CASE WHEN enr.report_type = 'CEO_SUMMARY' THEN enr.generated_at END) as latest_ceo_report,
    MAX(CASE WHEN enr.report_type = 'CFO_REPORT' THEN enr.generated_at END) as latest_cfo_report,
    
    -- Report Quality
    AVG(enr.confidence_score) as avg_report_confidence,
    
    fp.end_date as period_end
FROM business_accounts ba
JOIN fiscal_periods fp ON fp.is_current = true
LEFT JOIN executive_narrative_reports enr ON ba.id = enr.business_account_id 
    AND enr.period_id = fp.id
WHERE ba.is_active = true
GROUP BY ba.id, ba.name, fp.name, fp.end_date;

-- ========================================
-- DATABASE FUNCTIONS
-- ========================================

-- Generate CEO Dashboard Data
CREATE OR REPLACE FUNCTION generate_ceo_dashboard_data(
    p_business_account_id UUID,
    p_period_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_period_id UUID;
    v_result JSONB;
    v_financial_data JSONB;
    v_alerts_data JSONB;
    v_kpi_data JSONB;
BEGIN
    -- Get current period if not provided
    v_period_id := COALESCE(p_period_id, (
        SELECT id FROM fiscal_periods 
        WHERE business_account_id = p_business_account_id 
        AND is_current = true
        LIMIT 1
    ));
    
    -- Get latest financial data
    SELECT jsonb_build_object(
        'revenue', COALESCE(fs.revenue, 0),
        'expenses', COALESCE(fs.expenses, 0),
        'profit', COALESCE(fs.profit, 0),
        'cash_flow', COALESCE(fs.cash_flow, 0)
    ) INTO v_financial_data
    FROM financial_statements fs
    WHERE fs.business_account_id = p_business_account_id
    AND fs.fiscal_period_id = v_period_id
    LIMIT 1;
    
    -- Get alerts summary
    SELECT jsonb_build_object(
        'critical_alerts', COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND resolved_at IS NULL),
        'warning_alerts', COUNT(*) FILTER (WHERE severity = 'WARNING' AND resolved_at IS NULL),
        'total_active', COUNT(*) FILTER (WHERE resolved_at IS NULL)
    ) INTO v_alerts_data
    FROM alert_notifications an
    WHERE an.business_account_id = p_business_account_id
    AND an.created_at >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Calculate KPIs
    SELECT jsonb_build_object(
        'revenue_growth_rate', COALESCE(
            (SELECT 
                CASE 
                    WHEN LAG(fs.revenue) OVER (ORDER BY fp.end_date) > 0 THEN
                        ((fs.revenue - LAG(fs.revenue) OVER (ORDER BY fp.end_date)) / 
                         LAG(fs.revenue) OVER (ORDER BY fp.end_date)) * 100
                    ELSE 0
                END
            FROM financial_statements fs
            JOIN fiscal_periods fp ON fs.fiscal_period_id = fp.id
            WHERE fs.business_account_id = p_business_account_id
            ORDER BY fp.end_date DESC
            LIMIT 2
        ), 0),
        'profit_margin', CASE 
            WHEN (v_financial_data->>'revenue')::DECIMAL > 0 THEN
                ((v_financial_data->>'profit')::DECIMAL / (v_financial_data->>'revenue')::DECIMAL) * 100
            ELSE 0
        END,
        'cash_position', COALESCE((v_financial_data->>'cash_flow')::DECIMAL, 0)
    ) INTO v_kpi_data;
    
    -- Build result
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'period_id', v_period_id,
        'financial_data', v_financial_data,
        'alerts_summary', v_alerts_data,
        'kpi_metrics', v_kpi_data,
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Generate CFO Dashboard Data
CREATE OR REPLACE FUNCTION generate_cfo_dashboard_data(
    p_business_account_id UUID,
    p_period_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_period_id UUID;
    v_result JSONB;
    v_financial_statements JSONB;
    v_ratios JSONB;
    v_forecast_comparison JSONB;
BEGIN
    -- Get current period if not provided
    v_period_id := COALESCE(p_period_id, (
        SELECT id FROM fiscal_periods 
        WHERE business_account_id = p_business_account_id 
        AND is_current = true
        LIMIT 1
    ));
    
    -- Get financial statements
    SELECT jsonb_build_object(
        'income_statement', jsonb_build_object(
            'revenue', COALESCE(fs.revenue, 0),
            'expenses', COALESCE(fs.expenses, 0),
            'gross_profit', COALESCE(fs.gross_profit, 0),
            'operating_income', COALESCE(fs.operating_income, 0),
            'net_income', COALESCE(fs.profit, 0)
        ),
        'balance_sheet', jsonb_build_object(
            'total_assets', COALESCE(fs.total_assets, 0),
            'current_assets', COALESCE(fs.current_assets, 0),
            'total_liabilities', COALESCE(fs.total_liabilities, 0),
            'current_liabilities', COALESCE(fs.current_liabilities, 0),
            'equity', COALESCE(fs.equity, 0)
        ),
        'cash_flow', jsonb_build_object(
            'operating_cash_flow', COALESCE(fs.operating_cash_flow, 0),
            'investing_cash_flow', COALESCE(fs.investing_cash_flow, 0),
            'financing_cash_flow', COALESCE(fs.financing_cash_flow, 0),
            'net_cash_flow', COALESCE(fs.cash_flow, 0)
        )
    ) INTO v_financial_statements
    FROM financial_statements fs
    WHERE fs.business_account_id = p_business_account_id
    AND fs.fiscal_period_id = v_period_id
    LIMIT 1;
    
    -- Get financial ratios
    SELECT jsonb_agg(
        jsonb_build_object(
            'ratio_name', fr.ratio_name,
            'ratio_value', fr.ratio_value,
            'ratio_type', fr.ratio_type
        )
    ) INTO v_ratios
    FROM financial_ratios fr
    WHERE fr.business_account_id = p_business_account_id
    AND fr.fiscal_period_id = v_period_id;
    
    -- Get forecast vs actual comparison
    SELECT jsonb_agg(
        jsonb_build_object(
            'metric', cfv.comparison_type,
            'forecast', cfv.forecast_value,
            'actual', cfv.actual_value,
            'variance_percentage', cfv.variance_percentage,
            'accuracy', cfv.accuracy_rating
        )
    ) INTO v_forecast_comparison
    FROM cfo_forecast_vs_actual cfv
    WHERE cfv.business_account_id = p_business_account_id
    AND cfv.period_id = v_period_id;
    
    -- Build result
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'period_id', v_period_id,
        'financial_statements', v_financial_statements,
        'ratios', COALESCE(v_ratios, '[]'::jsonb),
        'forecast_comparison', COALESCE(v_forecast_comparison, '[]'::jsonb),
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Generate Narrative Report
CREATE OR REPLACE FUNCTION generate_narrative_report(
    p_business_account_id UUID,
    p_report_type VARCHAR(50),
    p_period_id UUID DEFAULT NULL,
    p_language VARCHAR(10) DEFAULT 'en'
) RETURNS JSONB AS $$
DECLARE
    v_period_id UUID;
    v_result JSONB;
    v_ceo_data JSONB;
    v_cfo_data JSONB;
    v_narrative_content JSONB;
BEGIN
    -- Get current period if not provided
    v_period_id := COALESCE(p_period_id, (
        SELECT id FROM fiscal_periods 
        WHERE business_account_id = p_business_account_id 
        AND is_current = true
        LIMIT 1
    ));
    
    -- Get CEO and CFO data
    v_ceo_data := generate_ceo_dashboard_data(p_business_account_id, v_period_id);
    v_cfo_data := generate_cfo_dashboard_data(p_business_account_id, v_period_id);
    
    -- Generate narrative content (simplified version - would use AI in production)
    v_narrative_content := jsonb_build_object(
        'executive_summary', CASE p_language
            WHEN 'ar' THEN 'أداء الشركة خلال الفترة المالية كان إيجابياً مع نمو في الإيرادات وتحسين في هوامش الربح.'
            ELSE 'Company performance during the financial period was positive with revenue growth and improved profit margins.'
        END,
        'financial_performance', CASE p_language
            WHEN 'ar' THEN 'حققت الشركة نمواً في الإيرادات بنسبة ' || 
                ROUND((v_ceo_data->'kpi_metrics'->>'revenue_growth_rate')::DECIMAL, 2) || '%' ||
                ' مع هوامش ربح صافي قدره ' ||
                ROUND((v_ceo_data->'kpi_metrics'->>'profit_margin')::DECIMAL, 2) || '%.'
            ELSE 'The company achieved revenue growth of ' ||
                ROUND((v_ceo_data->'kpi_metrics'->>'revenue_growth_rate')::DECIMAL, 2) || '%' ||
                ' with a net profit margin of ' ||
                ROUND((v_ceo_data->'kpi_metrics'->>'profit_margin')::DECIMAL, 2) || '%.'
        END,
        'key_highlights', CASE p_language
            WHEN 'ar' THEN 'النمو القوي في الإيرادات، تحسين هوامش الربح، المركز النقدي المستقر'
            ELSE 'Strong revenue growth, improved profit margins, stable cash position'
        END,
        'challenges_and_risks', CASE p_language
            WHEN 'ar' THEN 'تحديات في سلسلة التوريد، ضغوط التكاليف التشغيلية'
            ELSE 'Supply chain challenges, operating cost pressures'
        END,
        'strategic_recommendations', CASE p_language
            WHEN 'ar' THEN 'الاستمرار في تحسين الكفاءة التشغيلية، استكشاف فرص نمو جديدة'
            ELSE 'Continue operational efficiency improvements, explore new growth opportunities'
        END,
        'outlook', CASE p_language
            WHEN 'ar' THEN 'التوقعات إيجابية للفترة القادمة مع استمرار النمو المتوقع'
            ELSE 'Positive outlook for the next period with expected continued growth'
        END
    );
    
    -- Build result
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'period_id', v_period_id,
        'report_type', p_report_type,
        'language', p_language,
        'data_sources', jsonb_build_array('ceo_dashboard', 'cfo_dashboard', 'financial_statements'),
        'narrative_content', v_narrative_content,
        'confidence_score', 85.5,
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Refresh Executive Views Function
CREATE OR REPLACE FUNCTION refresh_executive_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ceo_dashboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cfo_dashboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_executive_reports;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- CEO Dashboard Indexes
CREATE INDEX idx_ceo_dashboard_summary_business_account ON ceo_dashboard_summary(business_account_id);
CREATE INDEX idx_ceo_dashboard_summary_period ON ceo_dashboard_summary(period_id);
CREATE INDEX idx_ceo_kpi_trends_business_account ON ceo_kpi_trends(business_account_id);
CREATE INDEX idx_ceo_kpi_trends_period_kpi ON ceo_kpi_trends(period_id, kpi_name);

-- CFO Dashboard Indexes
CREATE INDEX idx_cfo_dashboard_summary_business_account ON cfo_dashboard_summary(business_account_id);
CREATE INDEX idx_cfo_dashboard_summary_period ON cfo_dashboard_summary(period_id);
CREATE INDEX idx_cfo_forecast_vs_actual_business_account ON cfo_forecast_vs_actual(business_account_id);
CREATE INDEX idx_cfo_forecast_vs_actual_period ON cfo_forecast_vs_actual(period_id);

-- Narrative Reports Indexes
CREATE INDEX idx_executive_narrative_reports_business_account ON executive_narrative_reports(business_account_id);
CREATE INDEX idx_executive_narrative_reports_period_type ON executive_narrative_reports(period_id, report_type);
CREATE INDEX idx_narrative_report_sections_report_id ON narrative_report_sections(report_id);

-- Executive Alerts Indexes
CREATE INDEX idx_executive_alert_summary_business_account ON executive_alert_summary(business_account_id);
CREATE INDEX idx_executive_action_items_business_account ON executive_action_items(business_account_id);
CREATE INDEX idx_executive_action_items_status ON executive_action_items(status);

-- Performance Benchmarks Indexes
CREATE INDEX idx_performance_vs_benchmarks_business_account ON performance_vs_benchmarks(business_account_id);
CREATE INDEX idx_industry_benchmarks_industry_code ON industry_benchmarks(industry_code);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at timestamp for executive tables
CREATE TRIGGER update_ceo_dashboard_summary_updated_at 
    BEFORE UPDATE ON ceo_dashboard_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cfo_dashboard_summary_updated_at 
    BEFORE UPDATE ON cfo_dashboard_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executive_narrative_reports_updated_at 
    BEFORE UPDATE ON executive_narrative_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executive_action_items_updated_at 
    BEFORE UPDATE ON executive_action_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DEFAULT DATA
-- ========================================

-- Default Narrative Report Templates
INSERT INTO narrative_report_templates (template_name, report_type, language, sections, tone, audience) VALUES
('CEO Monthly Summary', 'CEO_SUMMARY', 'en', 
    '[{"name": "executive_summary", "title": "Executive Summary", "order": 1}, 
     {"name": "key_metrics", "title": "Key Performance Indicators", "order": 2},
     {"name": "highlights", "title": "Key Highlights", "order": 3},
     {"name": "concerns", "title": "Areas of Concern", "order": 4},
     {"name": "recommendations", "title": "Strategic Recommendations", "order": 5}]',
    'FORMAL', 'CEO'),
    
('CEO Monthly Summary', 'CEO_SUMMARY', 'ar',
    '[{"name": "executive_summary", "title": "ملخص تنفيذي", "order": 1},
     {"name": "key_metrics", "title": "مؤشرات الأداء الرئيسية", "order": 2},
     {"name": "highlights", "title": "أبرز النقاط", "order": 3},
     {"name": "concerns", "title": "مجالات القلق", "order": 4},
     {"name": "recommendations", "title": "التوصيات الاستراتيجية", "order": 5}]',
    'FORMAL', 'CEO'),
    
('CFO Financial Report', 'CFO_REPORT', 'en',
    '[{"name": "financial_overview", "title": "Financial Overview", "order": 1},
     {"name": "income_statement", "title": "Income Statement Analysis", "order": 2},
     {"name": "balance_sheet", "title": "Balance Sheet Analysis", "order": 3},
     {"name": "cash_flow", "title": "Cash Flow Analysis", "order": 4},
     {"name": "ratios_analysis", "title": "Financial Ratios", "order": 5},
     {"name": "forecast_comparison", "title": "Forecast vs Actual", "order": 6},
     {"name": "risk_assessment", "Title": "Risk Assessment", "order": 7}]',
    'TECHNICAL', 'CFO'),

('CFO Financial Report', 'CFO_REPORT', 'ar',
    '[{"name": "financial_overview", "title": "نظرة مالية عامة", "order": 1},
     {"name": "income_statement", "title": "تحليل قائمة الدخل", "order": 2},
     {"name": "balance_sheet", "title": "تحليل الميزانية العمومية", "order": 3},
     {"name": "cash_flow", "title": "تحليل التدفق النقدي", "order": 4},
     {"name": "ratios_analysis", "title": "النسب المالية", "order": 5},
     {"name": "forecast_comparison", "title": "التوقعات مقابل الفعلي", "order": 6},
     {"name": "risk_assessment", "title": "تقييم المخاطر", "order": 7}]',
    'TECHNICAL', 'CFO');

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ceo_dashboard_summary TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ceo_kpi_trends TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON cfo_dashboard_summary TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON cfo_forecast_vs_actual TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON executive_narrative_reports TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON narrative_report_sections TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON narrative_report_templates TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON executive_alert_summary TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON executive_action_items TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON industry_benchmarks TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON performance_vs_benchmarks TO app_user;

-- Grant permissions on materialized views
GRANT SELECT ON mv_ceo_dashboard TO app_user;
GRANT SELECT ON mv_cfo_dashboard TO app_user;
GRANT SELECT ON mv_executive_reports TO app_user;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION generate_ceo_dashboard_data TO app_user;
GRANT EXECUTE ON FUNCTION generate_cfo_dashboard_data TO app_user;
GRANT EXECUTE ON FUNCTION generate_narrative_report TO app_user;
GRANT EXECUTE ON FUNCTION refresh_executive_views TO app_user;

COMMIT;
