import { Router, Request, Response } from 'express';
import { CrossBorderPaymentsEngine } from '../services/payments/CrossBorderPaymentsEngine';
import { FXAnalysisEngine } from '../services/payments/FXAnalysisEngine';
import { ComplianceRiskEngine } from '../services/payments/ComplianceRiskEngine';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const paymentsEngine = new CrossBorderPaymentsEngine();
const fxEngine = new FXAnalysisEngine();
const complianceEngine = new ComplianceRiskEngine();

// Middleware to check payments access
const checkPaymentsAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has payments access
    const hasAccess = await checkUserPaymentsAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No payments access granted' });
    }
    
    next();
  } catch (error) {
    console.error('Payments access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check payments access (placeholder)
async function checkUserPaymentsAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check user permissions for payments functionality
  // For now, return true for authenticated users
  return true;
}

// Cross-Border Payments Routes
router.post('/payments', authenticateToken, requireRole(['admin', 'treasury_manager', 'payments_manager']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const payment = await paymentsEngine.createPayment({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.get('/payments/:paymentId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const payment = await paymentsEngine.getPayment(req.params.paymentId);
    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

router.get('/payments/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { 
      paymentDirection, 
      sourceCountry, 
      destinationCountry, 
      currencyPair, 
      status, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const payments = await paymentsEngine.getPayments(req.params.businessAccountId, {
      paymentDirection: paymentDirection as string,
      sourceCountry: sourceCountry as string,
      destinationCountry: destinationCountry as string,
      currencyPair: currencyPair as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// FX Rate Intelligence Routes
router.post('/fx-rates/analyze', authenticateToken, requireRole(['admin', 'treasury_manager', 'fx_analyst']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const fxAnalysis = await fxEngine.analyzeFXRate({
      ...req.body
    });
    
    res.status(201).json(fxAnalysis);
  } catch (error) {
    console.error('FX rate analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze FX rate' });
  }
});

router.get('/fx-rates/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { currencyPair, startDate, endDate, limit } = req.query;
    
    const fxRates = await fxEngine.getFXRateAnalyses(req.params.businessAccountId, {
      currencyPair: currencyPair as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(fxRates);
  } catch (error) {
    console.error('Get FX rates error:', error);
    res.status(500).json({ error: 'Failed to get FX rates' });
  }
});

router.get('/fx-rates/:businessAccountId/spreads/:currencyPair', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const spreadAnalysis = await fxEngine.analyzeFXSpreads(
      req.params.businessAccountId,
      req.params.currencyPair,
      req.query.periodDays ? parseInt(req.query.periodDays as string) : undefined
    );
    
    res.json(spreadAnalysis);
  } catch (error) {
    console.error('FX spread analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze FX spreads' });
  }
});

router.get('/fx-rates/:businessAccountId/hidden-fees/:paymentId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const hiddenFeeDetection = await fxEngine.detectHiddenFees(
      req.params.businessAccountId,
      req.params.paymentId
    );
    
    res.json(hiddenFeeDetection);
  } catch (error) {
    console.error('Hidden fee detection error:', error);
    res.status(500).json({ error: 'Failed to detect hidden fees' });
  }
});

router.get('/fx-rates/:businessAccountId/exposure/:currency', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const fxExposure = await fxEngine.analyzeFXExposure(
      req.params.businessAccountId,
      req.params.currency,
      req.query.baseCurrency as string
    );
    
    res.json(fxExposure);
  } catch (error) {
    console.error('FX exposure analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze FX exposure' });
  }
});

router.get('/fx-rates/:businessAccountId/optimization-report', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const optimizationReport = await fxEngine.generateFXOptimizationReport(
      req.params.businessAccountId,
      req.query.language as 'en' | 'ar'
    );
    
    res.json(optimizationReport);
  } catch (error) {
    console.error('FX optimization report error:', error);
    res.status(500).json({ error: 'Failed to generate FX optimization report' });
  }
});

// Payment Routes Analysis
router.post('/routes', authenticateToken, requireRole(['admin', 'treasury_manager', 'payments_manager']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const route = await paymentsEngine.createPaymentRoute({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(route);
  } catch (error) {
    console.error('Create payment route error:', error);
    res.status(500).json({ error: 'Failed to create payment route' });
  }
});

router.get('/routes/:routeId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const route = await paymentsEngine.getPaymentRoute(req.params.routeId);
    res.json(route);
  } catch (error) {
    console.error('Get payment route error:', error);
    res.status(500).json({ error: 'Failed to get payment route' });
  }
});

router.get('/routes/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { 
      sourceCountry, 
      destinationCountry, 
      currencyPair, 
      paymentMethod, 
      riskLevel, 
      limit 
    } = req.query;
    
    const routes = await paymentsEngine.getPaymentRoutes(req.params.businessAccountId, {
      sourceCountry: sourceCountry as string,
      destinationCountry: destinationCountry as string,
      currencyPair: currencyPair as string,
      paymentMethod: paymentMethod as string,
      riskLevel: riskLevel as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(routes);
  } catch (error) {
    console.error('Get payment routes error:', error);
    res.status(500).json({ error: 'Failed to get payment routes' });
  }
});

// Compliance and Risk Management Routes
router.post('/compliance/screen', authenticateToken, requireRole(['admin', 'compliance_officer', 'risk_manager']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const screening = await complianceEngine.screenPayment({
      ...req.body
    });
    
    res.status(201).json(screening);
  } catch (error) {
    console.error('Compliance screening error:', error);
    res.status(500).json({ error: 'Failed to screen payment' });
  }
});

router.get('/compliance/screenings/:paymentId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const screenings = await complianceEngine.getComplianceScreenings(req.params.paymentId);
    res.json(screenings);
  } catch (error) {
    console.error('Get compliance screenings error:', error);
    res.status(500).json({ error: 'Failed to get compliance screenings' });
  }
});

router.get('/compliance/sanctions-check', authenticateToken, requireRole(['admin', 'compliance_officer']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { entityName, entityType, countries } = req.body;
    
    const sanctionsCheck = await complianceEngine.checkSanctions(
      entityName,
      entityType,
      countries
    );
    
    res.json(sanctionsCheck);
  } catch (error) {
    console.error('Sanctions check error:', error);
    res.status(500).json({ error: 'Failed to check sanctions' });
  }
});

router.get('/compliance/risk-corridor/:sourceCountry/:destinationCountry', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const riskCorridor = await complianceEngine.analyzeRiskCorridor(
      req.params.sourceCountry,
      req.params.destinationCountry
    );
    
    res.json(riskCorridor);
  } catch (error) {
    console.error('Risk corridor analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze risk corridor' });
  }
});

router.post('/compliance/aml-assessment', authenticateToken, requireRole(['admin', 'compliance_officer', 'risk_manager']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { paymentId, paymentAmount, sourceCountry, destinationCountry, entityHistory } = req.body;
    
    const amlAssessment = await complianceEngine.assessAMLRisk(
      paymentId,
      paymentAmount,
      sourceCountry,
      destinationCountry,
      entityHistory
    );
    
    res.json(amlAssessment);
  } catch (error) {
    console.error('AML risk assessment error:', error);
    res.status(500).json({ error: 'Failed to assess AML risk' });
  }
});

// Payment Anomaly Detection Routes
router.post('/anomalies/detect', authenticateToken, requireRole(['admin', 'risk_manager', 'payments_manager']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { businessAccountId, paymentId, anomalyType, anomalySeverity, description, detectedValue, expectedValue, variancePercentage, detectionRules } = req.body;
    
    const anomaly = await paymentsEngine.detectAnomaly(
      businessAccountId,
      paymentId,
      anomalyType,
      anomalySeverity,
      description,
      detectedValue,
      expectedValue,
      variancePercentage,
      detectionRules
    );
    
    res.status(201).json(anomaly);
  } catch (error) {
    console.error('Detect payment anomaly error:', error);
    res.status(500).json({ error: 'Failed to detect payment anomaly' });
  }
});

router.get('/anomalies/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { 
      anomalyType, 
      anomalySeverity, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const anomalies = await paymentsEngine.getPaymentAnomalies(req.params.businessAccountId, {
      anomalyType: anomalyType as string,
      anomalySeverity: anomalySeverity as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(anomalies);
  } catch (error) {
    console.error('Get payment anomalies error:', error);
    res.status(500).json({ error: 'Failed to get payment anomalies' });
  }
});

router.get('/anomalies/:businessAccountId/delays', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const delays = await paymentsEngine.detectPaymentDelays(req.params.businessAccountId);
    res.json(delays);
  } catch (error) {
    console.error('Detect payment delays error:', error);
    res.status(500).json({ error: 'Failed to detect payment delays' });
  }
});

// Analytics and Dashboard Routes
router.get('/analytics/payment-summary/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const summary = await paymentsEngine.getPaymentSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ error: 'Failed to get payment summary' });
  }
});

router.get('/analytics/fx-efficiency/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const efficiency = await fxEngine.getFXEfficiencyDashboard(req.params.businessAccountId);
    res.json(efficiency);
  } catch (error) {
    console.error('Get FX efficiency error:', error);
    res.status(500).json({ error: 'Failed to get FX efficiency' });
  }
});

router.get('/analytics/route-performance/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const performance = await paymentsEngine.getPaymentRoutePerformance(req.params.businessAccountId);
    res.json(performance);
  } catch (error) {
    console.error('Get route performance error:', error);
    res.status(500).json({ error: 'Failed to get route performance' });
  }
});

router.get('/analytics/compliance-dashboard/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await complianceEngine.getComplianceDashboard(req.params.businessAccountId);
    res.json(dashboard);
  } catch (error) {
    console.error('Get compliance dashboard error:', error);
    res.status(500).json({ error: 'Failed to get compliance dashboard' });
  }
});

router.get('/analytics/fx-exposure-summary/:businessAccountId', authenticateToken, checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const summary = await fxEngine.getFXExposureSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get FX exposure summary error:', error);
    res.status(500).json({ error: 'Failed to get FX exposure summary' });
  }
});

// Executive Dashboard Routes (Read-only)
router.get('/executive-dashboard/:businessAccountId', authenticateToken, requireRole(['admin', 'executive', 'board_member']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        dashboard_name as "dashboardName",
        dashboard_config as "dashboardConfig",
        dashboard_data as "dashboardData",
        last_updated as "lastUpdated",
        is_read_only as "isReadOnly",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cross_border_executive_dashboards
      WHERE business_account_id = ${req.params.businessAccountId}::uuid
      ORDER BY last_updated DESC
      LIMIT 1
    `;
    
    const dashboard = (result as any)[0];
    
    if (!dashboard) {
      // Create default executive dashboard
      const defaultDashboard = await createDefaultExecutiveDashboard(req.params.businessAccountId, (req as any).user.id);
      res.json(defaultDashboard);
    } else {
      res.json(dashboard);
    }
  } catch (error) {
    console.error('Get executive dashboard error:', error);
    res.status(500).json({ error: 'Failed to get executive dashboard' });
  }
});

router.post('/executive-dashboard/:businessAccountId', authenticateToken, requireRole(['admin', 'executive']), checkPaymentsAccess, async (req: Request, res: Response) => {
  try {
    const { dashboardName, dashboardConfig } = req.body;
    
    const result = await prisma.$queryRaw`
      INSERT INTO cross_border_executive_dashboards (
        id,
        business_account_id,
        dashboard_name,
        dashboard_config,
        dashboard_data,
        is_read_only,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${req.params.businessAccountId}::uuid,
        ${dashboardName}::varchar,
        ${JSON.stringify(dashboardConfig)}::jsonb,
        ${JSON.stringify({})}::jsonb,
        true::boolean,
        ${(req as any).user.id}::uuid
      ) RETURNING id
    `;
    
    const dashboardId = (result as any)[0]?.id;
    
    // Get the created dashboard
    const dashboardResult = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        dashboard_name as "dashboardName",
        dashboard_config as "dashboardConfig",
        dashboard_data as "dashboardData",
        last_updated as "lastUpdated",
        is_read_only as "isReadOnly",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cross_border_executive_dashboards
      WHERE id = ${dashboardId}::uuid
    `;
    
    const dashboard = (dashboardResult as any)[0];
    res.status(201).json(dashboard);
  } catch (error) {
    console.error('Create executive dashboard error:', error);
    res.status(500).json({ error: 'Failed to create executive dashboard' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'treasury_manager']), async (req: Request, res: Response) => {
  try {
    await paymentsEngine.refreshMaterializedViews();
    res.json({ message: 'Cross-border payments analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

// Helper function to create default executive dashboard
async function createDefaultExecutiveDashboard(businessAccountId: string, userId: string): Promise<any> {
  const paymentSummary = await paymentsEngine.getPaymentSummary(businessAccountId);
  const fxEfficiency = await fxEngine.getFXEfficiencyDashboard(businessAccountId);
  const complianceDashboard = await complianceEngine.getComplianceDashboard(businessAccountId);
  
  const defaultConfig = {
    widgets: [
      {
        type: 'payment_summary',
        title: 'Payment Summary',
        position: { x: 0, y: 0, width: 6, height: 4 }
      },
      {
        type: 'fx_efficiency',
        title: 'FX Efficiency',
        position: { x: 6, y: 0, width: 6, height: 4 }
      },
      {
        type: 'compliance_status',
        title: 'Compliance Status',
        position: { x: 0, y: 4, width: 12, height: 4 }
      }
    ]
  };
  
  const defaultData = {
    paymentSummary: paymentSummary[0] || {},
    fxEfficiency: fxEfficiency,
    complianceDashboard: complianceDashboard,
    lastUpdated: new Date().toISOString()
  };
  
  const result = await prisma.$queryRaw`
    INSERT INTO cross_border_executive_dashboards (
      id,
      business_account_id,
      dashboard_name,
      dashboard_config,
      dashboard_data,
      is_read_only,
      created_by
    ) VALUES (
      ${uuidv4()}::uuid,
      ${businessAccountId}::uuid,
      'Default Executive Dashboard'::varchar,
      ${JSON.stringify(defaultConfig)}::jsonb,
      ${JSON.stringify(defaultData)}::jsonb,
      true::boolean,
      ${userId}::uuid
    ) RETURNING id
  `;
  
  const dashboardId = (result as any)[0]?.id;
  
  return {
    id: dashboardId,
    businessAccountId,
    dashboardName: 'Default Executive Dashboard',
    dashboardConfig: defaultConfig,
    dashboardData: defaultData,
    lastUpdated: new Date(),
    isReadOnly: true,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export default router;
