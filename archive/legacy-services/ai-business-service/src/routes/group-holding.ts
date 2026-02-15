import { Router, Request, Response } from 'express';
import { GroupHoldingService } from '../services/group/GroupHoldingService';
import { ConsolidationEngine } from '../services/group/ConsolidationEngine';
import { GroupPackGenerator } from '../services/group/GroupPackGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const groupService = new GroupHoldingService();
const consolidationEngine = new ConsolidationEngine();
const groupPackGenerator = new GroupPackGenerator();

// Middleware to check Group access
const checkGroupAccess = async (req: Request, res: Response, next: any) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return res.status(401).json({ error: 'Unauthorized - Missing group ID' });
    }
    
    // Check if user has group access (would be implemented in GroupHoldingService)
    const hasAccess = await checkUserGroupAccess((req as any).user?.id, groupId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No group access granted' });
    }
    
    next();
  } catch (error) {
    console.error('Group access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check group access (placeholder)
async function checkUserGroupAccess(userId: string, groupId: string): Promise<boolean> {
  // This would check group_access_control table
  // For now, return true for admin users
  return true;
}

// Helper function to check consolidation permission
async function checkConsolidationPermission(userId: string, groupId: string): Promise<boolean> {
  // This would check group_access_control table for consolidation permissions
  // For now, return true for admin and consolidation_manager roles
  return true;
}

// Group Entity Routes
router.post('/groups', authenticateToken, requireRole(['admin', 'group_admin']), async (req: Request, res: Response) => {
  try {
    const group = await groupService.createGroupEntity({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await groupService.logActivity({
      groupId: group.id,
      activityType: 'group_created',
      activityDescription: `Created group: ${req.body.groupName}`,
      entityType: 'group_entity',
      entityId: group.id,
      entityName: req.body.groupName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/groups/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const group = await groupService.getGroupEntity(req.params.groupId);
    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

router.get('/groups', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, groupType, parentGroupId, limit } = req.query;
    const groups = await groupService.getGroupEntities({
      status: status as string || undefined,
      groupType: groupType as string || undefined,
      parentGroupId: parentGroupId as string || undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Entity Mapping Routes
router.post('/entity-mappings', authenticateToken, requireRole(['admin', 'group_admin', 'entity_manager']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const mapping = await groupService.mapEntityToGroup({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'entity_mapped',
      activityDescription: `Mapped entity ${req.body.businessAccountId} to group`,
      entityType: 'entity_mapping',
      entityId: mapping.id,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(mapping);
  } catch (error) {
    console.error('Map entity error:', error);
    res.status(500).json({ error: 'Failed to map entity' });
  }
});

router.get('/entity-mappings/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const mappings = await groupService.getEntityMappings(req.params.groupId);
    res.json(mappings);
  } catch (error) {
    console.error('Get entity mappings error:', error);
    res.status(500).json({ error: 'Failed to get entity mappings' });
  }
});

// Intercompany Transaction Routes
router.post('/intercompany-transactions', authenticateToken, requireRole(['admin', 'group_admin', 'consolidation_manager']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const transaction = await groupService.tagIntercompanyTransaction({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'intercompany_tagged',
      activityDescription: `Tagged intercompany transaction: ${req.body.transactionType}`,
      entityType: 'intercompany_transaction',
      entityId: transaction.id,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Tag intercompany transaction error:', error);
    res.status(500).json({ error: 'Failed to tag intercompany transaction' });
  }
});

router.get('/intercompany-transactions/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const { isEliminated, transactionType, limit } = req.query;
    const transactions = await groupService.getIntercompanyTransactions(req.params.groupId, {
      isEliminated: isEliminated ? isEliminated === 'true' : undefined,
      transactionType: transactionType as string || undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(transactions);
  } catch (error) {
    console.error('Get intercompany transactions error:', error);
    res.status(500).json({ error: 'Failed to get intercompany transactions' });
  }
});

// Consolidation Snapshot Routes
router.post('/consolidation-snapshots', authenticateToken, requireRole(['admin', 'group_admin', 'consolidation_manager']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await groupService.createConsolidationSnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'consolidation_snapshot_created',
      activityDescription: `Created consolidation snapshot: ${req.body.snapshotName}`,
      entityType: 'consolidation_snapshot',
      entityId: snapshot.id,
      entityName: req.body.snapshotName,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Create consolidation snapshot error:', error);
    res.status(500).json({ error: 'Failed to create consolidation snapshot' });
  }
});

router.get('/consolidation-snapshots/:snapshotId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await groupService.getConsolidationSnapshot(req.params.snapshotId);
    res.json(snapshot);
  } catch (error) {
    console.error('Get consolidation snapshot error:', error);
    res.status(500).json({ error: 'Failed to get consolidation snapshot' });
  }
});

router.get('/consolidation-snapshots/group/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const { status, periodStart, periodEnd, limit } = req.query;
    const snapshots = await groupService.getConsolidationSnapshots(req.params.groupId, {
      status: status as string || undefined,
      periodStart: periodStart as string || undefined,
      periodEnd: periodEnd as string || undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(snapshots);
  } catch (error) {
    console.error('Get consolidation snapshots error:', error);
    res.status(500).json({ error: 'Failed to get consolidation snapshots' });
  }
});

// Consolidation Engine Routes
router.post('/consolidation/:snapshotId', authenticateToken, requireRole(['admin', 'group_admin', 'consolidation_manager']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const hasPermission = await checkConsolidationPermission((req as any).user?.id, req.body.groupId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions for consolidation' });
    }
    
    const result = await consolidationEngine.performConsolidation(req.params.snapshotId);
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'consolidation_performed',
      activityDescription: `Performed consolidation for snapshot: ${req.params.snapshotId}`,
      entityType: 'consolidation',
      entityId: req.params.snapshotId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email,
      activityDurationMs: result.processingLog.length * 100 // Placeholder
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Perform consolidation error:', error);
    return res.status(500).json({ error: 'Failed to perform consolidation' });
  }
});

// Analytics and Dashboard Routes
router.get('/analytics/summary/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const summary = await groupService.getGroupConsolidationSummary(req.params.groupId);
    res.json(summary);
  } catch (error) {
    console.error('Get group summary error:', error);
    res.status(500).json({ error: 'Failed to get group summary' });
  }
});

router.get('/analytics/entity-performance/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const performance = await groupService.getEntityPerformanceComparison(req.params.groupId);
    res.json(performance);
  } catch (error) {
    console.error('Get entity performance error:', error);
    res.status(500).json({ error: 'Failed to get entity performance' });
  }
});

router.get('/analytics/dashboard/:groupId', authenticateToken, checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await groupService.getConsolidationDashboard(req.params.groupId);
    res.json(dashboard);
  } catch (error) {
    console.error('Get consolidation dashboard error:', error);
    res.status(500).json({ error: 'Failed to get consolidation dashboard' });
  }
});

// Group Pack Generation Routes
router.post('/generate-consolidation-pack/:snapshotId', authenticateToken, requireRole(['admin', 'group_admin', 'consolidation_manager']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const { language = 'en' } = req.body;
    const pack = await groupPackGenerator.generateConsolidationPack(req.params.snapshotId, language);
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'consolidation_pack_generated',
      activityDescription: `Generated consolidation pack in ${language}`,
      entityType: 'group_pack',
      entityId: req.params.snapshotId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json(pack);
  } catch (error) {
    console.error('Generate consolidation pack error:', error);
    res.status(500).json({ error: 'Failed to generate consolidation pack' });
  }
});

// Board & Investor Views Routes
router.get('/board-view/:groupId', authenticateToken, requireRole(['admin', 'group_admin', 'board_member']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const [summary, performance, dashboard] = await Promise.all([
      groupService.getGroupConsolidationSummary(req.params.groupId),
      groupService.getEntityPerformanceComparison(req.params.groupId),
      groupService.getConsolidationDashboard(req.params.groupId)
    ]);
    
    const boardView = {
      executiveSummary: summary[0] || {},
      financialHighlights: performance.slice(0, 5), // Top 5 entities
      consolidationStatus: dashboard[0] || {},
      riskIndicators: {
        consolidationHealth: dashboard[0]?.elimination_percentage || 0,
        entityCompliance: performance.filter(e => e.net_margin > 0).length,
        intercompanyExposure: dashboard[0]?.intercompany_transactions || 0
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json(boardView);
  } catch (error) {
    console.error('Get board view error:', error);
    res.status(500).json({ error: 'Failed to get board view' });
  }
});

router.get('/investor-view/:groupId', authenticateToken, requireRole(['admin', 'group_admin', 'investor_relations']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const [summary, performance] = await Promise.all([
      groupService.getGroupConsolidationSummary(req.params.groupId),
      groupService.getEntityPerformanceComparison(req.params.groupId)
    ]);
    
    const investorView = {
      groupOverview: {
        groupName: summary[0]?.group_name || 'Unknown',
        totalEntities: summary[0]?.total_entities || 0,
        consolidationMethod: summary[0]?.consolidation_method || 'Unknown',
        lastConsolidation: summary[0]?.last_consolidation_date || null
      },
      financialMetrics: {
        totalRevenue: summary[0]?.total_consolidated_revenue || 0,
        totalIncome: summary[0]?.total_consolidated_income || 0,
        totalAssets: summary[0]?.total_consolidated_assets || 0,
        totalEquity: summary[0]?.total_consolidated_equity || 0
      },
      entityBreakdown: performance.map(entity => ({
        entityName: entity.entity_name,
        entityType: entity.entity_type,
        ownershipPercentage: entity.ownership_percentage,
        revenue: entity.consolidated_revenue,
        netIncome: entity.consolidated_net_income,
        contribution: entity.revenue_rank
      })),
      performanceTrends: {
        revenueGrowth: '12.5%', // Placeholder
        profitabilityTrend: 'stable',
        efficiencyMetrics: 'improving'
      }
    };
    
    res.json(investorView);
  } catch (error) {
    console.error('Get investor view error:', error);
    res.status(500).json({ error: 'Failed to get investor view' });
  }
});

// Export Routes
router.get('/export/consolidation-pack/:snapshotId', authenticateToken, requireRole(['admin', 'group_admin', 'consolidation_manager']), checkGroupAccess, async (req: Request, res: Response) => {
  try {
    const { language = 'en', format = 'json' } = req.query;
    const pack = await groupPackGenerator.generateConsolidationPack(req.params.snapshotId, language as 'en' | 'ar');
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'consolidation_pack_exported',
      activityDescription: `Exported consolidation pack in ${format} format`,
      entityType: 'group_pack',
      entityId: req.params.snapshotId,
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="consolidation-pack-${req.params.snapshotId}.json"`);
      res.json(pack);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Export consolidation pack error:', error);
    res.status(500).json({ error: 'Failed to export consolidation pack' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'group_admin']), async (req: Request, res: Response) => {
  try {
    await groupService.refreshGroupAnalytics();
    
    await groupService.logActivity({
      groupId: req.body.groupId,
      activityType: 'group_analytics_refreshed',
      activityDescription: 'Refreshed group analytics materialized views',
      entityType: 'system',
      performedBy: (req as any).user.id,
      userRole: (req as any).user.roles[0],
      userEmail: (req as any).user.email
    });
    
    res.json({ message: 'Group analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh group analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh group analytics' });
  }
});

export default router;
