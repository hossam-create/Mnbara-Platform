import { Router, Request, Response } from 'express';
import { MnaReadinessService } from '../services/mna/MnaReadinessService';
import { MnaPackGenerator } from '../services/mna/MnaPackGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const mnaService = new MnaReadinessService();
const mnaPackGenerator = new MnaPackGenerator();

// Middleware to check M&A access
const checkMnaAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has M&A access (would be implemented in MnaReadinessService)
    const hasAccess = await checkUserMnaAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No M&A access granted' });
    }
    
    next();
  } catch (error) {
    console.error('M&A access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check M&A access (placeholder)
async function checkUserMnaAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check the mna_access_control table
  // For now, return true for admin users
  return true;
}

// M&A Readiness Snapshot Routes
router.post('/snapshots', authenticateToken, requireRole(['admin', 'mna_admin']), checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await mnaService.createReadinessSnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    // Log activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'snapshot_created',
      activityDescription: `M&A readiness snapshot created: ${snapshot.snapshotName}`,
      entityType: 'mna_snapshot',
      entityId: snapshot.id,
      entityName: snapshot.snapshotName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Create M&A snapshot error:', error);
    res.status(500).json({ error: 'Failed to create M&A readiness snapshot' });
  }
});

router.get('/business-accounts/:businessAccountId/snapshots', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const snapshots = await mnaService.getReadinessSnapshots(req.params.businessAccountId, req.query);
    res.json(snapshots);
  } catch (error) {
    console.error('Get M&A snapshots error:', error);
    res.status(500).json({ error: 'Failed to get M&A readiness snapshots' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await mnaService.getReadinessSnapshot(req.params.snapshotId);
    res.json(snapshot);
  } catch (error) {
    console.error('Get M&A snapshot error:', error);
    res.status(500).json({ error: 'Failed to get M&A readiness snapshot' });
  }
});

// Normalized Financial Statements Routes
router.post('/normalized-statements', authenticateToken, requireRole(['admin', 'mna_admin', 'financial_analyst']), checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const statement = await mnaService.createNormalizedStatement({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    // Log activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'normalized_statement_created',
      activityDescription: `Normalized statement created: ${statement.statementType}`,
      entityType: 'normalized_statement',
      entityId: statement.id,
      entityName: statement.statementType,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role,
      accessMethod: 'direct'
    });
    
    res.status(201).json(statement);
  } catch (error) {
    console.error('Create normalized statement error:', error);
    res.status(500).json({ error: 'Failed to create normalized statement' });
  }
});

router.get('/snapshots/:snapshotId/normalized-statements', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const statements = await mnaService.getNormalizedStatements(req.params.snapshotId);
    res.json(statements);
  } catch (error) {
    console.error('Get normalized statements error:', error);
    res.status(500).json({ error: 'Failed to get normalized statements' });
  }
});

// Non-Recurring Items Routes
router.post('/non-recurring-items', authenticateToken, requireRole(['admin', 'mna_admin', 'financial_analyst']), checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const item = await mnaService.createNonRecurringItem({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    // Log activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'non_recurring_item_created',
      activityDescription: `Non-recurring item created: ${item.itemName}`,
      entityType: 'non_recurring_item',
      entityId: item.id,
      entityName: item.itemName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role,
      accessMethod: 'direct'
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Create non-recurring item error:', error);
    res.status(500).json({ error: 'Failed to create non-recurring item' });
  }
});

router.get('/snapshots/:snapshotId/non-recurring-items', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const items = await mnaService.getNonRecurringItems(req.params.snapshotId);
    res.json(items);
  } catch (error) {
    console.error('Get non-recurring items error:', error);
    res.status(500).json({ error: 'Failed to get non-recurring items' });
  }
});

// Scenario Analysis Routes
router.post('/scenarios', authenticateToken, requireRole(['admin', 'mna_admin', 'financial_analyst']), checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const scenario = await mnaService.createScenario({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    // Log activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'scenario_created',
      activityDescription: `M&A scenario created: ${scenario.scenarioName}`,
      entityType: 'mna_scenario',
      entityId: scenario.id,
      entityName: scenario.scenarioName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role,
      accessMethod: 'direct'
    });
    
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Create scenario error:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

router.get('/snapshots/:snapshotId/scenarios', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const scenarios = await mnaService.getScenarios(req.params.snapshotId);
    res.json(scenarios);
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({ error: 'Failed to get scenarios' });
  }
});

// Synergy Analysis Routes
router.post('/synergy-analysis', authenticateToken, requireRole(['admin', 'mna_admin', 'strategic_advisor']), checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const analysis = await mnaService.createSynergyAnalysis({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    // Log activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'synergy_analysis_created',
      activityDescription: `Synergy analysis created: ${analysis.analysisName}`,
      entityType: 'synergy_analysis',
      entityId: analysis.id,
      entityName: analysis.analysisName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role,
      accessMethod: 'direct'
    });
    
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Create synergy analysis error:', error);
    res.status(500).json({ error: 'Failed to create synergy analysis' });
  }
});

router.get('/snapshots/:snapshotId/synergy-analysis', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const analyses = await mnaService.getSynergyAnalysis(req.params.snapshotId);
    res.json(analyses);
  } catch (error) {
    console.error('Get synergy analyses error:', error);
    res.status(500).json({ error: 'Failed to get synergy analyses' });
  }
});

// Generate Buyer-Ready Pack
router.post('/generate-buyer-pack', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const { snapshotId, language = 'en' } = req.body;
    
    // Generate pack content
    const packContent = await mnaPackGenerator.generateBuyerPack(snapshotId, language);
    
    // Log activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'buyer_pack_generated',
      activityDescription: `Buyer-ready pack generated for snapshot: ${snapshotId}`,
      entityType: 'buyer_pack',
      entityId: snapshotId,
      entityName: 'Buyer Pack',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role,
      accessMethod: 'direct'
    });
    
    res.status(201).json({
      packContent,
      generatedAt: new Date().toISOString(),
      language,
      snapshotId,
      generatedBy: (req as any).user.id
    });
  } catch (error) {
    console.error('Generate buyer pack error:', error);
    res.status(500).json({ error: 'Failed to generate buyer-ready pack' });
  }
});

// Analytics and Summary Routes
router.get('/business-accounts/:businessAccountId/readiness-summary', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const summary = await mnaService.getReadinessSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get readiness summary error:', error);
    res.status(500).json({ error: 'Failed to get readiness summary' });
  }
});

router.get('/snapshots/:snapshotId/normalization-summary', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const summary = await mnaService.getNormalizationSummary(req.params.snapshotId);
    res.json(summary);
  } catch (error) {
    console.error('Get normalization summary error:', error);
    res.status(500).json({ error: 'Failed to get normalization summary' });
  }
});

router.get('/snapshots/:snapshotId/scenario-summary', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const summary = await mnaService.getScenarioSummary(req.params.snapshotId);
    res.json(summary);
  } catch (error) {
    console.error('Get scenario summary error:', error);
    res.status(500).json({ error: 'Failed to get scenario summary' });
  }
});

// M&A Dashboard
router.get('/business-accounts/:businessAccountId/dashboard', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const businessAccountId = req.params.businessAccountId;
    
    // Get dashboard data
    const readinessSummary = await mnaService.getReadinessSummary(businessAccountId);
    const snapshots = await mnaService.getReadinessSnapshots(businessAccountId, { limit: 5 });
    
    const dashboard: any = {
      readinessSummary,
      recentSnapshots: snapshots,
      totalSnapshots: readinessSummary[0]?.total_snapshots || 0,
      finalSnapshots: readinessSummary[0]?.final_snapshots || 0,
      avgAdjustedEbitda: readinessSummary[0]?.avg_adjusted_ebitda || 0,
      nonRecurringItemsCount: readinessSummary[0]?.non_recurring_items_count || 0,
      scenariosCount: readinessSummary[0]?.scenarios_count || 0,
      synergyAnalysesCount: readinessSummary[0]?.synergy_analyses_count || 0
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Get M&A dashboard error:', error);
    res.status(500).json({ error: 'Failed to get M&A dashboard data' });
  }
});

// Refresh Analytics (Admin only)
router.post('/refresh-analytics', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await mnaService.refreshMnaAnalytics();
    res.json({ message: 'M&A analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh M&A analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh M&A analytics' });
  }
});

// Export Data (with proper permissions)
router.post('/export-data', authenticateToken, checkMnaAccess, async (req: Request, res: Response) => {
  try {
    const { snapshotId, exportType, format = 'json' } = req.body;
    
    // Check export permissions
    const hasExportPermission = await checkExportPermission((req as any).user.id, req.body.businessAccountId);
    
    if (!hasExportPermission) {
      return res.status(403).json({ error: 'Forbidden - No export permission' });
    }
    
    let exportData: any = {};
    
    switch (exportType) {
      case 'normalized_statements':
        exportData = await mnaService.getNormalizedStatements(snapshotId);
        break;
      case 'scenarios':
        exportData = await mnaService.getScenarios(snapshotId);
        break;
      case 'synergy_analysis':
        exportData = await mnaService.getSynergyAnalysis(snapshotId);
        break;
      case 'non_recurring_items':
        exportData = await mnaService.getNonRecurringItems(snapshotId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    // Log export activity
    await mnaService.logActivity({
      businessAccountId: req.body.businessAccountId,
      activityType: 'data_exported',
      activityDescription: `Data exported: ${exportType}`,
      entityType: 'export',
      entityId: snapshotId,
      entityName: exportType,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.role,
      dataVolumeBytes: JSON.stringify(exportData).length,
      accessMethod: 'export'
    });
    
    res.json({
      exportData,
      exportedAt: new Date().toISOString(),
      format,
      exportType,
      snapshotId
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to check export permission
async function checkExportPermission(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check the mna_access_control table for export permissions
  // For now, return true for admin and financial_analyst roles
  return true;
}

export default router;
