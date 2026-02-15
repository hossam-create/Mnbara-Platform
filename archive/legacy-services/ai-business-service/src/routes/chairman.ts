import { Router, Request, Response } from 'express';
import { ChairmanService } from '../services/chairman/ChairmanService';
import { ChairmanBriefingGenerator } from '../services/chairman/ChairmanBriefingGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const chairmanService = new ChairmanService();
const chairmanBriefingGenerator = new ChairmanBriefingGenerator();

// Middleware to check chairman access
const checkChairmanAccess = async (req: Request, res: Response, next: any) => {
  try {
    const userId = (req as any).user?.id;
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!userId || !businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing user or business account' });
    }
    
    const access = await chairmanService.getChairmanAccess(userId, businessAccountId);
    
    if (!access) {
      return res.status(403).json({ error: 'Forbidden - No chairman access granted' });
    }
    
    // Update last accessed timestamp
    await chairmanService.updateLastAccessed(userId, businessAccountId);
    
    // Attach access to request for later use
    (req as any).chairmanAccess = access;
    next();
  } catch (error) {
    console.error('Chairman access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Chairman Strategic Snapshot Routes
router.post('/snapshots', authenticateToken, requireRole(['admin', 'chairman']), checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewStrategicDashboard) {
      return res.status(403).json({ error: 'Forbidden - No strategic dashboard access' });
    }
    
    const snapshot = await chairmanService.generateStrategicSnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Generate strategic snapshot error:', error);
    res.status(500).json({ error: 'Failed to generate strategic snapshot' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewStrategicDashboard) {
      return res.status(403).json({ error: 'Forbidden - No strategic dashboard access' });
    }
    
    const snapshot = await chairmanService.getStrategicSnapshotById(req.params.snapshotId);
    
    if (!snapshot) {
      return res.status(404).json({ error: 'Strategic snapshot not found' });
    }
    
    res.json(snapshot);
  } catch (error) {
    console.error('Get strategic snapshot error:', error);
    res.status(500).json({ error: 'Failed to get strategic snapshot' });
  }
});

router.get('/business-accounts/:businessAccountId/snapshots', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewStrategicDashboard) {
      return res.status(403).json({ error: 'Forbidden - No strategic dashboard access' });
    }
    
    const snapshots = await chairmanService.getStrategicSnapshots(req.params.businessAccountId, req.query);
    res.json(snapshots);
  } catch (error) {
    console.error('Get strategic snapshots error:', error);
    res.status(500).json({ error: 'Failed to get strategic snapshots' });
  }
});

// Chairman Strategic Risk Routes
router.post('/strategic-risks', authenticateToken, requireRole(['admin', 'chairman']), checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewRiskHeatmap) {
      return res.status(403).json({ error: 'Forbidden - No risk heatmap access' });
    }
    
    const risk = await chairmanService.createStrategicRisk({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(risk);
  } catch (error) {
    console.error('Create strategic risk error:', error);
    res.status(500).json({ error: 'Failed to create strategic risk' });
  }
});

router.get('/snapshots/:snapshotId/strategic-risks', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewRiskHeatmap) {
      return res.status(403).json({ error: 'Forbidden - No risk heatmap access' });
    }
    
    const risks = await chairmanService.getStrategicRisks(req.params.snapshotId);
    res.json(risks);
  } catch (error) {
    console.error('Get strategic risks error:', error);
    res.status(500).json({ error: 'Failed to get strategic risks' });
  }
});

// Chairman Strategic Opportunity Routes
router.post('/strategic-opportunities', authenticateToken, requireRole(['admin', 'chairman']), checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewOpportunities) {
      return res.status(403).json({ error: 'Forbidden - No opportunities access' });
    }
    
    const opportunity = await chairmanService.createStrategicOpportunity({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Create strategic opportunity error:', error);
    res.status(500).json({ error: 'Failed to create strategic opportunity' });
  }
});

router.get('/snapshots/:snapshotId/strategic-opportunities', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewOpportunities) {
      return res.status(403).json({ error: 'Forbidden - No opportunities access' });
    }
    
    const opportunities = await chairmanService.getStrategicOpportunities(req.params.snapshotId);
    res.json(opportunities);
  } catch (error) {
    console.error('Get strategic opportunities error:', error);
    res.status(500).json({ error: 'Failed to get strategic opportunities' });
  }
});

// Chairman Briefing Document Routes
router.post('/briefing-documents', authenticateToken, requireRole(['admin', 'chairman']), checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canDownloadBriefings) {
      return res.status(403).json({ error: 'Forbidden - No briefing download access' });
    }
    
    const briefingDocument = await chairmanService.createBriefingDocument({
      ...req.body,
      generatedBy: (req as any).user.id
    });
    
    res.status(201).json(briefingDocument);
  } catch (error) {
    console.error('Create briefing document error:', error);
    res.status(500).json({ error: 'Failed to create briefing document' });
  }
});

router.get('/business-accounts/:businessAccountId/briefing-documents', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canDownloadBriefings) {
      return res.status(403).json({ error: 'Forbidden - No briefing download access' });
    }
    
    const briefingDocuments = await chairmanService.getBriefingDocuments(req.params.businessAccountId, req.query);
    res.json(briefingDocuments);
  } catch (error) {
    console.error('Get briefing documents error:', error);
    res.status(500).json({ error: 'Failed to get briefing documents' });
  }
});

// Generate Chairman Briefing (One-click briefing mode)
router.post('/generate-briefing', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canDownloadBriefings) {
      return res.status(403).json({ error: 'Forbidden - No briefing generation access' });
    }
    
    const { snapshotId, language = 'en' } = req.body;
    
    // Generate briefing content
    const briefingContent = await chairmanBriefingGenerator.generateBriefingContent(
      snapshotId,
      req.params.businessAccountId || req.body.businessAccountId,
      language
    );
    
    // Create briefing document
    const briefingDocument = await chairmanService.createBriefingDocument({
      snapshotId,
      businessAccountId: req.params.businessAccountId || req.body.businessAccountId,
      briefingType: 'strategic_snapshot',
      title: `Chairman Briefing - ${new Date().toLocaleDateString()} (${language.toUpperCase()})`,
      executiveSummary: briefingContent.executiveSummary,
      keyInsights: briefingContent.keyInsights,
      strategicRecommendations: briefingContent.strategicRecommendations,
      confidenceSignals: briefingContent.confidenceSignals,
      riskSignals: briefingContent.riskSignals,
      opportunitySignals: briefingContent.opportunitySignals,
      language,
      generatedBy: (req as any).user.id
    });
    
    res.status(201).json({
      briefingDocument,
      content: briefingContent
    });
  } catch (error) {
    console.error('Generate chairman briefing error:', error);
    res.status(500).json({ error: 'Failed to generate chairman briefing' });
  }
});

// Chairman Analytics Routes
router.get('/business-accounts/:businessAccountId/strategic-trends', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewStrategicDashboard) {
      return res.status(403).json({ error: 'Forbidden - No strategic dashboard access' });
    }
    
    const trends = await chairmanService.getStrategicTrends(
      req.params.businessAccountId,
      req.query.periodType as string
    );
    res.json(trends);
  } catch (error) {
    console.error('Get strategic trends error:', error);
    res.status(500).json({ error: 'Failed to get strategic trends' });
  }
});

router.get('/business-accounts/:businessAccountId/risk-heatmap', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewRiskHeatmap) {
      return res.status(403).json({ error: 'Forbidden - No risk heatmap access' });
    }
    
    const riskHeatmap = await chairmanService.getRiskHeatmap(req.params.businessAccountId);
    res.json(riskHeatmap);
  } catch (error) {
    console.error('Get risk heatmap error:', error);
    res.status(500).json({ error: 'Failed to get risk heatmap' });
  }
});

router.get('/business-accounts/:businessAccountId/opportunity-pipeline', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).chairmanAccess;
    
    if (!access.canViewOpportunities) {
      return res.status(403).json({ error: 'Forbidden - No opportunities access' });
    }
    
    const opportunityPipeline = await chairmanService.getOpportunityPipeline(req.params.businessAccountId);
    res.json(opportunityPipeline);
  } catch (error) {
    console.error('Get opportunity pipeline error:', error);
    res.status(500).json({ error: 'Failed to get opportunity pipeline' });
  }
});

// Chairman Access Control Routes (Admin only)
router.post('/access-control', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const access = await chairmanService.grantChairmanAccess({
      ...req.body,
      grantedBy: (req as any).user.id
    });
    
    res.status(201).json(access);
  } catch (error) {
    console.error('Grant chairman access error:', error);
    res.status(500).json({ error: 'Failed to grant chairman access' });
  }
});

router.get('/access-control/:userId/:businessAccountId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const access = await chairmanService.getChairmanAccess(req.params.userId, req.params.businessAccountId);
    res.json(access);
  } catch (error) {
    console.error('Get chairman access error:', error);
    res.status(500).json({ error: 'Failed to get chairman access' });
  }
});

// Chairman Audit Log Routes (Admin only)
router.get('/business-accounts/:businessAccountId/audit-log', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const auditLog = await chairmanService.getChairmanAuditLog(req.params.businessAccountId, req.query);
    res.json(auditLog);
  } catch (error) {
    console.error('Get chairman audit log error:', error);
    res.status(500).json({ error: 'Failed to get chairman audit log' });
  }
});

// Refresh Materialized Views (Admin only)
router.post('/refresh-analytics', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await chairmanService.refreshChairmanAnalytics();
    res.json({ message: 'Chairman analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh chairman analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh chairman analytics' });
  }
});

// Chairman Dashboard Summary
router.get('/business-accounts/:businessAccountId/dashboard', authenticateToken, checkChairmanAccess, async (req: Request, res: Response) => {
  try {
    const businessAccountId = req.params.businessAccountId;
    const access = (req as any).chairmanAccess;
    
    // Get latest strategic snapshot
    const latestSnapshots = await chairmanService.getStrategicSnapshots(businessAccountId, { limit: 1 });
    const latestSnapshot = latestSnapshots[0];
    
    if (!latestSnapshot) {
      return res.status(404).json({ error: 'No strategic snapshots found' });
    }
    
    // Get dashboard data based on access permissions
    const dashboard: any = {
      strategicSnapshot: access.canViewStrategicDashboard ? latestSnapshot : null,
      strategicRisks: access.canViewRiskHeatmap ? await chairmanService.getStrategicRisks(latestSnapshot.id) : [],
      strategicOpportunities: access.canViewOpportunities ? await chairmanService.getStrategicOpportunities(latestSnapshot.id) : [],
      briefingDocuments: access.canDownloadBriefings ? await chairmanService.getBriefingDocuments(businessAccountId, { limit: 5 }) : []
    };
    
    // Add analytics if user has appropriate access
    if (access.canViewStrategicDashboard) {
      dashboard.strategicTrends = await chairmanService.getStrategicTrends(businessAccountId);
    }
    
    if (access.canViewRiskHeatmap) {
      dashboard.riskHeatmap = await chairmanService.getRiskHeatmap(businessAccountId);
    }
    
    if (access.canViewOpportunities) {
      dashboard.opportunityPipeline = await chairmanService.getOpportunityPipeline(businessAccountId);
    }
    
    if (access.canViewConfidenceIndicators) {
      dashboard.confidenceIndicators = {
        overallFinancialHealth: latestSnapshot.overallFinancialHealthScore,
        forecastReliability: latestSnapshot.forecastReliabilityScore * 100,
        managementExecution: latestSnapshot.managementExecutionConfidence * 100,
        strategicAlignment: latestSnapshot.strategicAlignmentScore * 100
      };
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Get chairman dashboard error:', error);
    res.status(500).json({ error: 'Failed to get chairman dashboard data' });
  }
});

export default router;
