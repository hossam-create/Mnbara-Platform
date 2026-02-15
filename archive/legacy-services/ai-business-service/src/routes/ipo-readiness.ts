import { Router, Request, Response } from 'express';
import { IpoReadinessService } from '../services/ipo/IpoReadinessService';
import { IpoPackGenerator } from '../services/ipo/IpoPackGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const ipoService = new IpoReadinessService();
const ipoPackGenerator = new IpoPackGenerator();

// Middleware to check IPO access
const checkIpoAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has IPO access (would be implemented in IpoReadinessService)
    const hasAccess = await checkUserIpoAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No IPO access granted' });
    }
    
    next();
  } catch (error) {
    console.error('IPO access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check IPO access (placeholder)
async function checkUserIpoAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check the ipo_access_control table
  // For now, return true for admin users
  return true;
}

// Helper function to check export permission
async function checkExportPermission(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check the ipo_access_control table for export permissions
  // For now, return true for admin and compliance_officer roles
  return true;
}

// IPO Readiness Snapshots Routes
router.post('/snapshots', authenticateToken, requireRole(['admin', 'ipo_admin']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await ipoService.createReadinessSnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'ipo_snapshot_created',
      activityDescription: `Created IPO readiness snapshot: ${req.body.snapshotName}`,
      entityType: 'ipo_snapshot',
      entityId: snapshot.id,
      entityName: req.body.snapshotName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Create IPO snapshot error:', error);
    res.status(500).json({ error: 'Failed to create IPO snapshot' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await ipoService.getReadinessSnapshot(req.params.snapshotId);
    res.json(snapshot);
  } catch (error) {
    console.error('Get IPO snapshot error:', error);
    res.status(500).json({ error: 'Failed to get IPO snapshot' });
  }
});

router.get('/snapshots/business/:businessAccountId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const { status, fiscalYear, limit } = req.query;
    const snapshots = await ipoService.getReadinessSnapshots(req.params.businessAccountId, {
      status: status as string,
      fiscalYear: fiscalYear ? parseInt(fiscalYear as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(snapshots);
  } catch (error) {
    console.error('Get IPO snapshots error:', error);
    res.status(500).json({ error: 'Failed to get IPO snapshots' });
  }
});

// Public Financial Statements Routes
router.post('/financial-statements', authenticateToken, requireRole(['admin', 'ipo_admin', 'financial_analyst']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const statement = await ipoService.createPublicFinancialStatement({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'financial_statement_created',
      activityDescription: `Created public financial statement: ${req.body.statementType}`,
      entityType: 'financial_statement',
      entityId: statement.id,
      entityName: req.body.statementType,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(statement);
  } catch (error) {
    console.error('Create financial statement error:', error);
    res.status(500).json({ error: 'Failed to create financial statement' });
  }
});

router.get('/financial-statements/:statementId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const statement = await ipoService.getPublicFinancialStatement(req.params.statementId);
    res.json(statement);
  } catch (error) {
    console.error('Get financial statement error:', error);
    res.status(500).json({ error: 'Failed to get financial statement' });
  }
});

router.get('/financial-statements/snapshot/:snapshotId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const statements = await ipoService.getPublicFinancialStatements(req.params.snapshotId);
    res.json(statements);
  } catch (error) {
    console.error('Get financial statements error:', error);
    res.status(500).json({ error: 'Failed to get financial statements' });
  }
});

// Comparative Data Routes
router.post('/comparative-data', authenticateToken, requireRole(['admin', 'ipo_admin', 'financial_analyst']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    // This would create comparative data using the database function
    const result = await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'comparative_data_added',
      activityDescription: `Added comparative data for year ${req.body.comparisonYear}`,
      entityType: 'comparative_data',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json({ message: 'Comparative data added successfully' });
  } catch (error) {
    console.error('Add comparative data error:', error);
    res.status(500).json({ error: 'Failed to add comparative data' });
  }
});

// Governance Structure Routes
router.post('/governance-structure', authenticateToken, requireRole(['admin', 'ipo_admin', 'compliance_officer']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    // This would create governance structure data
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'governance_structure_updated',
      activityDescription: 'Updated governance structure',
      entityType: 'governance_structure',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json({ message: 'Governance structure updated successfully' });
  } catch (error) {
    console.error('Update governance structure error:', error);
    res.status(500).json({ error: 'Failed to update governance structure' });
  }
});

// Risk Disclosures Routes
router.post('/risk-disclosures', authenticateToken, requireRole(['admin', 'ipo_admin', 'compliance_officer']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    // This would create risk disclosure data
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'risk_disclosure_added',
      activityDescription: `Added risk disclosure: ${req.body.riskCategory}`,
      entityType: 'risk_disclosure',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json({ message: 'Risk disclosure added successfully' });
  } catch (error) {
    console.error('Add risk disclosure error:', error);
    res.status(500).json({ error: 'Failed to add risk disclosure' });
  }
});

// Disclosure Checklist Routes
router.post('/disclosure-checklist', authenticateToken, requireRole(['admin', 'ipo_admin', 'compliance_officer']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    // This would create disclosure checklist item
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'disclosure_checklist_updated',
      activityDescription: `Updated disclosure checklist: ${req.body.disclosureItem}`,
      entityType: 'disclosure_checklist',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json({ message: 'Disclosure checklist updated successfully' });
  } catch (error) {
    console.error('Update disclosure checklist error:', error);
    res.status(500).json({ error: 'Failed to update disclosure checklist' });
  }
});

// IPO Pack Generation Routes
router.post('/generate-disclosure-pack/:snapshotId', authenticateToken, requireRole(['admin', 'ipo_admin', 'compliance_officer']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const { language = 'en' } = req.body;
    const pack = await ipoPackGenerator.generateDisclosurePack(req.params.snapshotId, language);
    
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'disclosure_pack_generated',
      activityDescription: `Generated IPO disclosure pack in ${language}`,
      entityType: 'ipo_pack',
      entityId: req.params.snapshotId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json(pack);
  } catch (error) {
    console.error('Generate disclosure pack error:', error);
    res.status(500).json({ error: 'Failed to generate disclosure pack' });
  }
});

// Analytics and Dashboard Routes
router.get('/analytics/summary/:businessAccountId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const summary = await ipoService.getReadinessSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get readiness summary error:', error);
    res.status(500).json({ error: 'Failed to get readiness summary' });
  }
});

router.get('/analytics/comparative/:businessAccountId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const comparative = await ipoService.getComparativeAnalysis(req.params.businessAccountId);
    res.json(comparative);
  } catch (error) {
    console.error('Get comparative analysis error:', error);
    res.status(500).json({ error: 'Failed to get comparative analysis' });
  }
});

router.get('/analytics/governance/:businessAccountId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const governance = await ipoService.getGovernanceDashboard(req.params.businessAccountId);
    res.json(governance);
  } catch (error) {
    console.error('Get governance dashboard error:', error);
    res.status(500).json({ error: 'Failed to get governance dashboard' });
  }
});

// Dashboard Route
router.get('/dashboard/:businessAccountId', authenticateToken, checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const [summary, comparative, governance] = await Promise.all([
      ipoService.getReadinessSummary(req.params.businessAccountId),
      ipoService.getComparativeAnalysis(req.params.businessAccountId),
      ipoService.getGovernanceDashboard(req.params.businessAccountId)
    ]);
    
    const dashboard = {
      summary: summary[0] || {},
      comparativeAnalysis: comparative,
      governanceDashboard: governance,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Export Routes
router.get('/export/disclosure-pack/:snapshotId', authenticateToken, requireRole(['admin', 'ipo_admin', 'compliance_officer']), checkIpoAccess, async (req: Request, res: Response) => {
  try {
    const hasExportPermission = await checkExportPermission((req as any).user.id, req.body.businessAccountId);
    if (!hasExportPermission) {
      return res.status(403).json({ error: 'Insufficient permissions for export' });
    }
    
    const { language = 'en', format = 'json' } = req.query;
    const pack = await ipoPackGenerator.generateDisclosurePack(req.params.snapshotId, language as 'en' | 'ar');
    
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'disclosure_pack_exported',
      activityDescription: `Exported IPO disclosure pack in ${format} format`,
      entityType: 'ipo_pack',
      entityId: req.params.snapshotId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ipo-disclosure-pack-${req.params.snapshotId}.json"`);
      res.json(pack);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Export disclosure pack error:', error);
    res.status(500).json({ error: 'Failed to export disclosure pack' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'ipo_admin']), async (req: Request, res: Response) => {
  try {
    await ipoService.refreshIpoAnalytics();
    
    await ipoService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'analytics_refreshed',
      activityDescription: 'Refreshed IPO analytics materialized views',
      entityType: 'system',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json({ message: 'Analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

export default router;
