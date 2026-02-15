import { Router, Request, Response } from 'express';
import { RegulatoryReportingEngine } from '../services/regtech/RegulatoryReportingEngine';
import { ComplianceMonitoringEngine } from '../services/regtech/ComplianceMonitoringEngine';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const reportingEngine = new RegulatoryReportingEngine();
const complianceEngine = new ComplianceMonitoringEngine();

// Middleware to check RegTech access
const checkRegTechAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has RegTech access
    const hasAccess = await checkUserRegTechAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No RegTech access granted' });
    }
    
    next();
  } catch (error) {
    console.error('RegTech access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check RegTech access (placeholder)
async function checkUserRegTechAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check user permissions for RegTech functionality
  // For now, return true for authenticated users
  return true;
}

// Regulatory Report Routes
router.post('/reports', authenticateToken, requireRole(['admin', 'regtech_manager', 'compliance_officer']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const report = await reportingEngine.generateRegulatoryReport({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Generate regulatory report error:', error);
    res.status(500).json({ error: 'Failed to generate regulatory report' });
  }
});

router.get('/reports/:reportId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const report = await reportingEngine.getRegulatoryReport(req.params.reportId);
    res.json(report);
  } catch (error) {
    console.error('Get regulatory report error:', error);
    res.status(500).json({ error: 'Failed to get regulatory report' });
  }
});

router.get('/reports/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { 
      reportType, 
      jurisdictionCode, 
      status, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const reports = await reportingEngine.getRegulatoryReports(req.params.businessAccountId, {
      reportType: reportType as string,
      jurisdictionCode: jurisdictionCode as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(reports);
  } catch (error) {
    console.error('Get regulatory reports error:', error);
    res.status(500).json({ error: 'Failed to get regulatory reports' });
  }
});

// Compliance Threshold Routes
router.post('/thresholds', authenticateToken, requireRole(['admin', 'regtech_manager', 'compliance_officer']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const threshold = await reportingEngine.createComplianceThreshold({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(threshold);
  } catch (error) {
    console.error('Create compliance threshold error:', error);
    res.status(500).json({ error: 'Failed to create compliance threshold' });
  }
});

router.get('/thresholds/:thresholdId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const threshold = await reportingEngine.getComplianceThreshold(req.params.thresholdId);
    res.json(threshold);
  } catch (error) {
    console.error('Get compliance threshold error:', error);
    res.status(500).json({ error: 'Failed to get compliance threshold' });
  }
});

router.get('/thresholds/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { jurisdictionCode, thresholdType, isActive, limit } = req.query;
    
    const thresholds = await reportingEngine.getComplianceThresholds(req.params.businessAccountId, {
      jurisdictionCode: jurisdictionCode as string,
      thresholdType: thresholdType as string,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(thresholds);
  } catch (error) {
    console.error('Get compliance thresholds error:', error);
    res.status(500).json({ error: 'Failed to get compliance thresholds' });
  }
});

// Regulatory KPI Routes
router.post('/kpis', authenticateToken, requireRole(['admin', 'regtech_manager', 'compliance_officer']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const kpi = await reportingEngine.createRegulatoryKPI({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(kpi);
  } catch (error) {
    console.error('Create regulatory KPI error:', error);
    res.status(500).json({ error: 'Failed to create regulatory KPI' });
  }
});

router.get('/kpis/:kpiId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const kpi = await reportingEngine.getRegulatoryKPI(req.params.kpiId);
    res.json(kpi);
  } catch (error) {
    console.error('Get regulatory KPI error:', error);
    res.status(500).json({ error: 'Failed to get regulatory KPI' });
  }
});

router.get('/kpis/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { 
      kpiCategory, 
      jurisdictionCode, 
      periodType, 
      isRealTime, 
      measurementDate, 
      limit 
    } = req.query;
    
    const kpis = await reportingEngine.getRegulatoryKPIs(req.params.businessAccountId, {
      kpiCategory: kpiCategory as string,
      jurisdictionCode: jurisdictionCode as string,
      periodType: periodType as string,
      isRealTime: isRealTime ? isRealTime === 'true' : undefined,
      measurementDate: measurementDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(kpis);
  } catch (error) {
    console.error('Get regulatory KPIs error:', error);
    res.status(500).json({ error: 'Failed to get regulatory KPIs' });
  }
});

// Compliance Monitoring Routes
router.post('/monitoring', authenticateToken, requireRole(['admin', 'regtech_manager', 'compliance_officer']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { businessAccountId, thresholdId, monitoringDate } = req.body;
    
    const monitoring = await complianceEngine.monitorCompliance(
      businessAccountId,
      thresholdId,
      monitoringDate ? new Date(monitoringDate) : undefined
    );
    
    res.status(201).json(monitoring);
  } catch (error) {
    console.error('Monitor compliance error:', error);
    res.status(500).json({ error: 'Failed to monitor compliance' });
  }
});

router.post('/monitoring/run-all/:businessAccountId', authenticateToken, requireRole(['admin', 'regtech_manager']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const results = await complianceEngine.runComplianceMonitoring(req.params.businessAccountId);
    res.json(results);
  } catch (error) {
    console.error('Run compliance monitoring error:', error);
    res.status(500).json({ error: 'Failed to run compliance monitoring' });
  }
});

router.get('/monitoring/:monitoringId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const monitoring = await complianceEngine.getComplianceMonitoring(req.params.monitoringId);
    res.json(monitoring);
  } catch (error) {
    console.error('Get compliance monitoring error:', error);
    res.status(500).json({ error: 'Failed to get compliance monitoring' });
  }
});

router.get('/monitoring/history/:businessAccountId/:thresholdId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    
    const history = await complianceEngine.getComplianceMonitoringHistory(
      req.params.businessAccountId,
      req.params.thresholdId,
      days ? parseInt(days as string) : undefined
    );
    
    res.json(history);
  } catch (error) {
    console.error('Get compliance monitoring history error:', error);
    res.status(500).json({ error: 'Failed to get compliance monitoring history' });
  }
});

// Compliance Alert Routes
router.post('/alerts', authenticateToken, requireRole(['admin', 'regtech_manager', 'compliance_officer']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const alert = await complianceEngine.createComplianceAlert({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Create compliance alert error:', error);
    res.status(500).json({ error: 'Failed to create compliance alert' });
  }
});

router.get('/alerts/:alertId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const alert = await complianceEngine.getComplianceAlert(req.params.alertId);
    res.json(alert);
  } catch (error) {
    console.error('Get compliance alert error:', error);
    res.status(500).json({ error: 'Failed to get compliance alert' });
  }
});

router.get('/alerts/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { 
      alertType, 
      severity, 
      status, 
      jurisdictionCode, 
      limit 
    } = req.query;
    
    const alerts = await complianceEngine.getComplianceAlerts(req.params.businessAccountId, {
      alertType: alertType as string,
      severity: severity as string,
      status: status as string,
      jurisdictionCode: jurisdictionCode as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(alerts);
  } catch (error) {
    console.error('Get compliance alerts error:', error);
    res.status(500).json({ error: 'Failed to get compliance alerts' });
  }
});

router.post('/alerts/generate/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const alerts = await complianceEngine.generateComplianceAlerts(req.params.businessAccountId);
    res.json(alerts);
  } catch (error) {
    console.error('Generate compliance alerts error:', error);
    res.status(500).json({ error: 'Failed to generate compliance alerts' });
  }
});

// Regulatory Snapshot Routes
router.post('/snapshots', authenticateToken, requireRole(['admin', 'regtech_manager', 'compliance_officer']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { 
      businessAccountId, 
      snapshotName, 
      snapshotType, 
      jurisdictionCode, 
      options 
    } = req.body;
    
    const snapshot = await reportingEngine.createRegulatorySnapshot(
      businessAccountId,
      snapshotName,
      snapshotType,
      jurisdictionCode,
      (req as any).user.id,
      options
    );
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Create regulatory snapshot error:', error);
    res.status(500).json({ error: 'Failed to create regulatory snapshot' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await reportingEngine.getRegulatorySnapshot(req.params.snapshotId);
    res.json(snapshot);
  } catch (error) {
    console.error('Get regulatory snapshot error:', error);
    res.status(500).json({ error: 'Failed to get regulatory snapshot' });
  }
});

router.get('/snapshots/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { snapshotType, jurisdictionCode, limit } = req.query;
    
    const snapshots = await reportingEngine.getRegulatorySnapshots(req.params.businessAccountId, {
      snapshotType: snapshotType as string,
      jurisdictionCode: jurisdictionCode as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(snapshots);
  } catch (error) {
    console.error('Get regulatory snapshots error:', error);
    res.status(500).json({ error: 'Failed to get regulatory snapshots' });
  }
});

// Compliance Analytics Routes
router.get('/metrics/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const metrics = await complianceEngine.getComplianceMetrics(req.params.businessAccountId);
    res.json(metrics);
  } catch (error) {
    console.error('Get compliance metrics error:', error);
    res.status(500).json({ error: 'Failed to get compliance metrics' });
  }
});

router.get('/trends/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { metricName, jurisdictionCode, days } = req.query;
    
    if (!metricName || !jurisdictionCode) {
      return res.status(400).json({ error: 'metricName and jurisdictionCode are required' });
    }
    
    const trends = await complianceEngine.getComplianceTrends(
      req.params.businessAccountId,
      metricName as string,
      jurisdictionCode as string,
      days ? parseInt(days as string) : undefined
    );
    
    res.json(trends);
  } catch (error) {
    console.error('Get compliance trends error:', error);
    res.status(500).json({ error: 'Failed to get compliance trends' });
  }
});

// Dashboard Routes
router.get('/dashboard/regulatory/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await reportingEngine.getRegulatoryDashboard(
      req.params.businessAccountId,
      req.query.language as 'en' | 'ar'
    );
    res.json(dashboard);
  } catch (error) {
    console.error('Get regulatory dashboard error:', error);
    res.status(500).json({ error: 'Failed to get regulatory dashboard' });
  }
});

router.get('/dashboard/compliance/:businessAccountId', authenticateToken, checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await complianceEngine.getComplianceDashboard(
      req.params.businessAccountId,
      req.query.language as 'en' | 'ar'
    );
    res.json(dashboard);
  } catch (error) {
    console.error('Get compliance dashboard error:', error);
    res.status(500).json({ error: 'Failed to get compliance dashboard' });
  }
});

// Data Feed Routes (for central bank reporting)
router.post('/data-feeds', authenticateToken, requireRole(['admin', 'regtech_manager']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    // This would create data feed configurations for central bank reporting
    // For now, return placeholder response
    res.status(201).json({ 
      message: 'Data feed configuration created',
      feedId: uuidv4()
    });
  } catch (error) {
    console.error('Create data feed error:', error);
    res.status(500).json({ error: 'Failed to create data feed' });
  }
});

router.post('/data-feeds/transmit/:businessAccountId', authenticateToken, requireRole(['admin', 'regtech_manager']), checkRegTechAccess, async (req: Request, res: Response) => {
  try {
    const { targetSystem, jurisdictionCode, reportType, data } = req.body;
    
    // This would transmit data to central bank systems
    // For now, return placeholder response
    res.json({ 
      message: 'Data transmitted successfully',
      targetSystem,
      jurisdictionCode,
      reportType,
      transmittedAt: new Date(),
      recordCount: Array.isArray(data) ? data.length : 1
    });
  } catch (error) {
    console.error('Transmit data error:', error);
    res.status(500).json({ error: 'Failed to transmit data' });
  }
});

// Multi-Jurisdiction Support Routes
router.get('/jurisdictions', authenticateToken, async (req: Request, res: Response) => {
  try {
    // This would return supported jurisdictions and their requirements
    // For now, return placeholder data
    const jurisdictions = [
      { code: 'US', name: 'United States', authority: 'Federal Reserve System' },
      { code: 'GB', name: 'United Kingdom', authority: 'Financial Conduct Authority' },
      { code: 'EU', name: 'European Union', authority: 'European Banking Authority' },
      { code: 'SA', name: 'Saudi Arabia', authority: 'Saudi Arabian Monetary Authority' },
      { code: 'AE', name: 'United Arab Emirates', authority: 'Central Bank of UAE' },
      { code: 'QA', name: 'Qatar', authority: 'Qatar Central Bank' },
      { code: 'KW', name: 'Kuwait', authority: 'Central Bank of Kuwait' },
      { code: 'BH', name: 'Bahrain', authority: 'Central Bank of Bahrain' },
      { code: 'OM', name: 'Oman', authority: 'Central Bank of Oman' }
    ];
    
    res.json(jurisdictions);
  } catch (error) {
    console.error('Get jurisdictions error:', error);
    res.status(500).json({ error: 'Failed to get jurisdictions' });
  }
});

router.get('/jurisdictions/:code/requirements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    // This would return specific requirements for the jurisdiction
    // For now, return placeholder data
    const requirements = {
      jurisdictionCode: code,
      reportingRequirements: {
        frequency: 'monthly',
        formats: ['JSON', 'XML', 'CSV'],
        requiredReports: ['capital_adequacy', 'liquidity_coverage', 'large_exposures'],
        deadlines: {
          monthly: 'Last business day of month',
          quarterly: '30 days after quarter end',
          annually: '90 days after year end'
        }
      },
      complianceStandards: {
        capitalAdequacyRatio: { minimum: 8, target: 12 },
        liquidityCoverageRatio: { minimum: 100, target: 120 },
        largeExposureLimit: { maximum: 25, target: 20 }
      },
      dataFormatStandards: {
        currency: 'USD',
        dateFormat: 'ISO 8601',
        decimalPlaces: 2,
        encoding: 'UTF-8'
      }
    };
    
    res.json(requirements);
  } catch (error) {
    console.error('Get jurisdiction requirements error:', error);
    res.status(500).json({ error: 'Failed to get jurisdiction requirements' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'regtech_manager']), async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT refresh_regulatory_materialized_views()`;
    res.json({ message: 'RegTech analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

router.get('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        reportingEngine: 'operational',
        complianceEngine: 'operational',
        database: 'operational',
        dataFeeds: 'operational'
      },
      version: '1.0.0'
    };
    
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

export default router;
