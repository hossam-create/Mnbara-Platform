import { Router, Request, Response } from 'express';
import { MultiCountryTaxService } from '../services/tax/MultiCountryTaxService';
import { TaxRuleEngine } from '../services/tax/TaxRuleEngine';
import { TaxComplianceReportsService } from '../services/tax/TaxComplianceReportsService';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const taxService = new MultiCountryTaxService();
const taxRuleEngine = new TaxRuleEngine();
const complianceReportsService = new TaxComplianceReportsService();

// Middleware to check tax access
const checkTaxAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has tax access (would be implemented in MultiCountryTaxService)
    const hasAccess = await checkUserTaxAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No tax access granted' });
    }
    
    next();
  } catch (error) {
    console.error('Tax access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check tax access (placeholder)
async function checkUserTaxAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check user permissions for tax functionality
  // For now, return true for authenticated users
  return true;
}

// Country Tax Configuration Routes
router.post('/country-configs', authenticateToken, requireRole(['admin', 'tax_manager']), async (req: Request, res: Response) => {
  try {
    const config = await taxService.createCountryTaxConfig({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: config.id,
      activityType: 'tax_config_created',
      activityDescription: `Created tax configuration for ${req.body.countryCode}`,
      entityType: 'country_tax_config',
      entityId: config.id,
      entityName: req.body.countryName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(config);
  } catch (error) {
    console.error('Create tax config error:', error);
    res.status(500).json({ error: 'Failed to create tax configuration' });
  }
});

router.get('/country-configs/:configId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const config = await taxService.getCountryTaxConfig(req.params.configId);
    res.json(config);
  } catch (error) {
    console.error('Get tax config error:', error);
    res.status(500).json({ error: 'Failed to get tax configuration' });
  }
});

router.get('/country-configs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { countryCode, status, limit } = req.query;
    const configs = await taxService.getCountryTaxConfigs({
      countryCode: countryCode as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(configs);
  } catch (error) {
    console.error('Get tax configs error:', error);
    res.status(500).json({ error: 'Failed to get tax configurations' });
  }
});

// Tax Rules Management Routes
router.post('/tax-rules', authenticateToken, requireRole(['admin', 'tax_manager']), async (req: Request, res: Response) => {
  try {
    const rule = await taxService.createTaxRule({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'tax_rule_created',
      activityDescription: `Created tax rule: ${req.body.ruleName}`,
      entityType: 'tax_rule',
      entityId: rule.id,
      entityName: req.body.ruleName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(rule);
  } catch (error) {
    console.error('Create tax rule error:', error);
    res.status(500).json({ error: 'Failed to create tax rule' });
  }
});

router.get('/tax-rules/:ruleId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const rule = await taxService.getTaxRule(req.params.ruleId);
    res.json(rule);
  } catch (error) {
    console.error('Get tax rule error:', error);
    res.status(500).json({ error: 'Failed to get tax rule' });
  }
});

router.get('/tax-rules/country/:countryId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { ruleType, isActive, limit } = req.query;
    const rules = await taxService.getTaxRules(req.params.countryId, {
      ruleType: ruleType as string,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(rules);
  } catch (error) {
    console.error('Get tax rules error:', error);
    res.status(500).json({ error: 'Failed to get tax rules' });
  }
});

// Transaction Tax Mapping Routes
router.post('/calculate-tax', authenticateToken, requireRole(['admin', 'tax_manager', 'accountant']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const result = await taxService.calculateTransactionTax({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'tax_calculated',
      activityDescription: `Calculated tax for transaction ${req.body.transactionId}`,
      entityType: 'transaction_tax_mapping',
      entityId: result.id,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json(result);
  } catch (error) {
    console.error('Calculate tax error:', error);
    res.status(500).json({ error: 'Failed to calculate tax' });
  }
});

router.get('/tax-mappings/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { countryId, taxType, isCrossBorder, status, limit } = req.query;
    const mappings = await taxService.getTransactionTaxMappings(req.params.businessAccountId, {
      countryId: countryId as string,
      taxType: taxType as string,
      isCrossBorder: isCrossBorder ? isCrossBorder === 'true' : undefined,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(mappings);
  } catch (error) {
    console.error('Get tax mappings error:', error);
    res.status(500).json({ error: 'Failed to get tax mappings' });
  }
});

// Cross-Border Revenue Allocation Routes
router.post('/cross-border-allocation', authenticateToken, requireRole(['admin', 'tax_manager', 'accountant']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const allocation = await taxService.allocateCrossBorderRevenue({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'cross_border_allocation',
      activityDescription: `Allocated cross-border revenue for transaction ${req.body.transactionId}`,
      entityType: 'cross_border_revenue_allocation',
      entityId: allocation.id,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(allocation);
  } catch (error) {
    console.error('Cross-border allocation error:', error);
    res.status(500).json({ error: 'Failed to allocate cross-border revenue' });
  }
});

router.get('/cross-border-allocations/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { sourceCountry, destinationCountry, allocationDate, limit } = req.query;
    const allocations = await taxService.getCrossBorderRevenueAllocations(req.params.businessAccountId, {
      sourceCountry: sourceCountry as string,
      destinationCountry: destinationCountry as string,
      allocationDate: allocationDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(allocations);
  } catch (error) {
    console.error('Get cross-border allocations error:', error);
    res.status(500).json({ error: 'Failed to get cross-border allocations' });
  }
});

// Tax Exposure Analysis Routes
router.post('/tax-exposure-analysis', authenticateToken, requireRole(['admin', 'tax_manager', 'risk_analyst']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const analysis = await taxService.analyzeTaxExposure({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'tax_exposure_analyzed',
      activityDescription: `Analyzed tax exposure for period ${req.body.analysisPeriodStart} to ${req.body.analysisPeriodEnd}`,
      entityType: 'tax_exposure_analysis',
      entityId: analysis.id,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Tax exposure analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze tax exposure' });
  }
});

router.get('/tax-exposure-analyses/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { countryId, riskLevel, limit } = req.query;
    const analyses = await taxService.getTaxExposureAnalyses(req.params.businessAccountId, {
      countryId: countryId as string,
      riskLevel: riskLevel as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(analyses);
  } catch (error) {
    console.error('Get tax exposure analyses error:', error);
    res.status(500).json({ error: 'Failed to get tax exposure analyses' });
  }
});

// Tax Compliance Reports Routes
router.post('/compliance-reports', authenticateToken, requireRole(['admin', 'tax_manager', 'compliance_officer']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const report = await complianceReportsService.createComplianceReport({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'compliance_report_created',
      activityDescription: `Created compliance report: ${req.body.reportType}`,
      entityType: 'tax_compliance_report',
      entityId: report.id,
      entityName: req.body.reportType,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Create compliance report error:', error);
    res.status(500).json({ error: 'Failed to create compliance report' });
  }
});

router.get('/compliance-reports/:reportId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const report = await complianceReportsService.getComplianceReport(req.params.reportId);
    res.json(report);
  } catch (error) {
    console.error('Get compliance report error:', error);
    res.status(500).json({ error: 'Failed to get compliance report' });
  }
});

router.get('/compliance-reports/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { countryId, reportType, status, dueDate, limit } = req.query;
    const reports = await complianceReportsService.getComplianceReports(req.params.businessAccountId, {
      countryId: countryId as string,
      reportType: reportType as string,
      status: status as string,
      dueDate: dueDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(reports);
  } catch (error) {
    console.error('Get compliance reports error:', error);
    res.status(500).json({ error: 'Failed to get compliance reports' });
  }
});

// Tax Report Generation Routes
router.post('/generate-report', authenticateToken, requireRole(['admin', 'tax_manager', 'compliance_officer']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { businessAccountId, countryId, reportType, periodStart, periodEnd, language, format } = req.body;
    
    const report = await complianceReportsService.generateTaxReport(
      businessAccountId,
      countryId,
      reportType,
      periodStart,
      periodEnd,
      language || 'en',
      format || 'json'
    );
    
    await taxService.logActivity({
      businessAccountId,
      countryId,
      activityType: 'tax_report_generated',
      activityDescription: `Generated ${reportType} report`,
      entityType: 'tax_report',
      entityId: report.reportId,
      entityName: reportType,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json(report);
  } catch (error) {
    console.error('Generate tax report error:', error);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
});

// Tax Rule Engine Routes
router.post('/engine/calculate', authenticateToken, requireRole(['admin', 'tax_manager', 'accountant']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const result = await taxRuleEngine.calculateTax({
      ...req.body
    });
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'tax_engine_calculation',
      activityDescription: `Engine calculated tax for transaction ${req.body.transactionId}`,
      entityType: 'tax_calculation',
      entityId: req.body.transactionId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json(result);
  } catch (error) {
    console.error('Tax engine calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate tax using engine' });
  }
});

router.post('/engine/exposure-analysis', authenticateToken, requireRole(['admin', 'tax_manager', 'risk_analyst']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const result = await taxRuleEngine.calculateTaxExposure(
      req.body.businessAccountId,
      req.body.countryId,
      new Date(req.body.periodStart),
      new Date(req.body.periodEnd)
    );
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'tax_exposure_engine_analysis',
      activityDescription: `Engine analyzed tax exposure for period ${req.body.periodStart} to ${req.body.periodEnd}`,
      entityType: 'tax_exposure_analysis',
      entityId: result.countryId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json(result);
  } catch (error) {
    console.error('Tax engine exposure analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze tax exposure using engine' });
  }
});

// Analytics and Dashboard Routes
router.get('/analytics/compliance-dashboard/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await taxService.getTaxComplianceDashboard(req.params.businessAccountId);
    res.json(dashboard);
  } catch (error) {
    console.error('Get compliance dashboard error:', error);
    res.status(500).json({ error: 'Failed to get compliance dashboard' });
  }
});

router.get('/analytics/exposure-summary/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const summary = await taxService.getTaxExposureSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get exposure summary error:', error);
    res.status(500).json({ error: 'Failed to get exposure summary' });
  }
});

router.get('/analytics/cross-border-summary/:businessAccountId', authenticateToken, checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const summary = await taxService.getCrossBorderTaxSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get cross-border summary error:', error);
    res.status(500).json({ error: 'Failed to get cross-border summary' });
  }
});

// Export Routes
router.get('/export/compliance-report/:reportId', authenticateToken, requireRole(['admin', 'tax_manager', 'compliance_officer']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const report = await complianceReportsService.getComplianceReport(req.params.reportId);
    
    if (req.query.format === 'pdf') {
      // PDF export logic would go here
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${req.params.reportId}.pdf"`);
      // PDF generation logic
      res.send('PDF content placeholder');
    } else {
      res.json(report);
    }
  } catch (error) {
    console.error('Export compliance report error:', error);
    res.status(500).json({ error: 'Failed to export compliance report' });
  }
});

router.get('/export/tax-mappings/:businessAccountId', authenticateToken, requireRole(['admin', 'tax_manager']), checkTaxAccess, async (req: Request, res: Response) => {
  try {
    const { countryId, taxType, periodStart, periodEnd } = req.query;
    const mappings = await taxService.getTransactionTaxMappings(req.params.businessAccountId, {
      countryId: countryId as string,
      taxType: taxType as string
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tax-mappings-${req.params.businessAccountId}.json"`);
    res.json(mappings);
  } catch (error) {
    console.error('Export tax mappings error:', error);
    res.status(500).json({ error: 'Failed to export tax mappings' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'tax_manager']), async (req: Request, res: Response) => {
  try {
    await taxService.refreshTaxAnalytics();
    
    await taxService.logActivity({
      businessAccountId: req.body.businessAccountId,
      countryId: req.body.countryId,
      activityType: 'tax_analytics_refreshed',
      activityDescription: 'Refreshed tax analytics materialized views',
      entityType: 'system',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json({ message: 'Tax analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh tax analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh tax analytics' });
  }
});

export default router;
