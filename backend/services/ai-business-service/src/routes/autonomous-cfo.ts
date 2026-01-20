import { Router } from 'express';
import { CFOInsightEngine } from '../services/autonomous-cfo/CFOInsightEngine';
import { ScenarioForecastEngine } from '../services/autonomous-cfo/ScenarioForecastEngine';
import { CFODashboardEngine } from '../services/autonomous-cfo/CFODashboardEngine';
import { authenticateToken } from '../middleware/auth';
import { requireBusinessAccount } from '../middleware/businessAccount';
import { requireRole } from '../middleware/rbac';

const router = Router();
const cfoInsightEngine = new CFOInsightEngine();
const scenarioForecastEngine = new ScenarioForecastEngine();
const cfoDashboardEngine = new CFODashboardEngine();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireBusinessAccount);

// Dashboard Configuration Routes
router.post('/dashboards', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const config = await cfoDashboardEngine.createDashboardConfig({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/dashboards', async (req, res) => {
  try {
    const configs = await cfoDashboardEngine.getDashboardConfigs(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/dashboards/:id', async (req, res) => {
  try {
    const config = await cfoDashboardEngine.getDashboardConfig(req.params.id);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Executive Summary Routes
router.get('/executive-summary', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ar' || 'en';
    const summary = await cfoDashboardEngine.getExecutiveSummary(
      req.businessAccountId,
      language
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Trend Analysis Routes
router.get('/trend-analysis', async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const trends = await cfoDashboardEngine.getTrendAnalysis(
      req.businessAccountId,
      months
    );
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// AI Insights Routes
router.post('/insights', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const insight = await cfoInsightEngine.generateInsight({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: insight });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/insights', async (req, res) => {
  try {
    const insights = await cfoInsightEngine.getInsights(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/insights/:id', async (req, res) => {
  try {
    const insight = await cfoInsightEngine.getInsight(req.params.id);
    res.json({ success: true, data: insight });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/insights/automated', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const insights = await cfoInsightEngine.generateAutomatedInsights(
      req.businessAccountId
    );
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/insights/analytics', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ar' || 'en';
    const analytics = await cfoInsightEngine.getInsightAnalytics(
      req.businessAccountId,
      language
    );
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// KPI Analysis Routes
router.post('/kpi-analyses', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const analysis = await cfoInsightEngine.analyzeKPI({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/kpi-analyses', async (req, res) => {
  try {
    const analyses = await cfoInsightEngine.getKPIAnalyses(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: analyses });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/kpi-analyses/:id', async (req, res) => {
  try {
    const analysis = await cfoInsightEngine.getKPIAnalysis(req.params.id);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Scenario Forecasting Routes
router.post('/scenarios', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const scenario = await scenarioForecastEngine.createScenarioForecast({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: scenario });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/scenarios', async (req, res) => {
  try {
    const scenarios = await scenarioForecastEngine.getScenarioForecasts(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: scenarios });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/scenarios/:id', async (req, res) => {
  try {
    const scenario = await scenarioForecastEngine.getScenarioForecast(req.params.id);
    res.json({ success: true, data: scenario });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/scenarios/standard', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const { periodStart, periodEnd, currency } = req.body;
    const scenarios = await scenarioForecastEngine.generateStandardScenarios(
      req.businessAccountId,
      periodStart,
      periodEnd,
      currency
    );
    res.json({ success: true, data: scenarios });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Executive Recommendations Routes
router.post('/recommendations', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const recommendation = await scenarioForecastEngine.createExecutiveRecommendation({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: recommendation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await scenarioForecastEngine.getExecutiveRecommendations(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/recommendations/:id', async (req, res) => {
  try {
    const recommendation = await scenarioForecastEngine.getExecutiveRecommendation(req.params.id);
    res.json({ success: true, data: recommendation });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/strategic', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const recommendations = await scenarioForecastEngine.generateStrategicRecommendations(
      req.businessAccountId
    );
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Narrative Reports Routes
router.post('/reports', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const report = await cfoDashboardEngine.generateNarrativeReport({
      ...req.body
    });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await cfoDashboardEngine.getNarrativeReports(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const report = await cfoDashboardEngine.getNarrativeReport(req.params.id);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/reports/automated', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const reports = await cfoDashboardEngine.generateAutomatedReports(
      req.businessAccountId
    );
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CFO Alerts Routes
router.post('/alerts', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const alert = await cfoDashboardEngine.createAlert({
      ...req.body
    });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await cfoDashboardEngine.getAlerts(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/alerts/:id', async (req, res) => {
  try {
    const alert = await cfoDashboardEngine.getAlert(req.params.id);
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Financial Aggregation Routes
router.post('/aggregations', requireRole(['admin', 'cfo']), async (req, res) => {
  try {
    const { businessAccountId, aggregationDate, aggregationPeriod, dataSource } = req.body;
    
    // This would typically call a database function
    const aggregationId = await prisma.$queryRaw`
      SELECT generate_cfo_financial_aggregation(
        ${businessAccountId}::uuid,
        ${aggregationDate}::date,
        ${aggregationPeriod}::varchar,
        ${dataSource}::varchar,
        ${req.user.id}::uuid
      ) as aggregation_id
    `;
    
    res.json({ success: true, data: { aggregationId } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Comprehensive Dashboard Data
router.get('/dashboard/comprehensive', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ar' || 'en';
    
    // Get all dashboard data in parallel
    const [executiveSummary, trendAnalysis, insights, alerts, recommendations] = await Promise.all([
      cfoDashboardEngine.getExecutiveSummary(req.businessAccountId, language),
      cfoDashboardEngine.getTrendAnalysis(req.businessAccountId),
      cfoInsightEngine.getInsights(req.businessAccountId, { limit: 10 }),
      cfoDashboardEngine.getAlerts(req.businessAccountId, { resolved: false, limit: 10 }),
      scenarioForecastEngine.getExecutiveRecommendations(req.businessAccountId, { limit: 10 })
    ]);
    
    const dashboardData = {
      summary: executiveSummary,
      trends: trendAnalysis,
      insights: insights,
      alerts: alerts,
      recommendations: recommendations,
      lastUpdated: new Date().toISOString(),
      language: language
    };
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Materialized View Refresh
router.post('/refresh-views', requireRole(['admin']), async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT refresh_cfo_materialized_views()`;
    res.json({ success: true, message: 'CFO materialized views refreshed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Health Check Route
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        insights: 'operational',
        forecasting: 'operational',
        dashboard: 'operational',
        alerts: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
