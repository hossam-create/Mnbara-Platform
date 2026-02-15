import { Router, Request, Response } from 'express';
import { BoardReportingService } from '../services/board-reporting/BoardReportingService';
import { BoardPackGenerator } from '../services/board-reporting/BoardPackGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const boardReportingService = new BoardReportingService();
const boardPackGenerator = new BoardPackGenerator();

// Middleware to check board access
const checkBoardAccess = async (req: Request, res: Response, next: any) => {
  try {
    const userId = (req as any).user?.id;
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!userId || !businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing user or business account' });
    }
    
    const access = await boardReportingService.getBoardAccess(userId, businessAccountId);
    
    if (!access) {
      return res.status(403).json({ error: 'Forbidden - No board access granted' });
    }
    
    // Attach access to request for later use
    (req as any).boardAccess = access;
    next();
  } catch (error) {
    console.error('Board access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Board KPI Snapshot Routes
router.post('/snapshots', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewKpis) {
      return res.status(403).json({ error: 'Forbidden - No KPI access' });
    }
    
    const snapshot = await boardReportingService.generateKPISnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Generate KPI snapshot error:', error);
    res.status(500).json({ error: 'Failed to generate KPI snapshot' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewKpis) {
      return res.status(403).json({ error: 'Forbidden - No KPI access' });
    }
    
    const snapshot = await boardReportingService.getKPISnapshotById(req.params.snapshotId);
    
    if (!snapshot) {
      return res.status(404).json({ error: 'KPI snapshot not found' });
    }
    
    res.json(snapshot);
  } catch (error) {
    console.error('Get KPI snapshot error:', error);
    res.status(500).json({ error: 'Failed to get KPI snapshot' });
  }
});

router.get('/business-accounts/:businessAccountId/snapshots', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewKpis) {
      return res.status(403).json({ error: 'Forbidden - No KPI access' });
    }
    
    const snapshots = await boardReportingService.getKPISnapshots(req.params.businessAccountId, req.query);
    res.json(snapshots);
  } catch (error) {
    console.error('Get KPI snapshots error:', error);
    res.status(500).json({ error: 'Failed to get KPI snapshots' });
  }
});

// Board Risk Assessment Routes
router.post('/risk-assessments', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewRisks) {
      return res.status(403).json({ error: 'Forbidden - No risk access' });
    }
    
    const riskAssessment = await boardReportingService.createRiskAssessment({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(riskAssessment);
  } catch (error) {
    console.error('Create risk assessment error:', error);
    res.status(500).json({ error: 'Failed to create risk assessment' });
  }
});

router.get('/snapshots/:snapshotId/risk-assessments', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewRisks) {
      return res.status(403).json({ error: 'Forbidden - No risk access' });
    }
    
    const riskAssessments = await boardReportingService.getRiskAssessments(req.params.snapshotId);
    res.json(riskAssessments);
  } catch (error) {
    console.error('Get risk assessments error:', error);
    res.status(500).json({ error: 'Failed to get risk assessments' });
  }
});

// Board Strategic Alerts Routes
router.post('/strategic-alerts', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewAlerts) {
      return res.status(403).json({ error: 'Forbidden - No alerts access' });
    }
    
    const alert = await boardReportingService.createStrategicAlert({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Create strategic alert error:', error);
    res.status(500).json({ error: 'Failed to create strategic alert' });
  }
});

router.get('/business-accounts/:businessAccountId/strategic-alerts', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewAlerts) {
      return res.status(403).json({ error: 'Forbidden - No alerts access' });
    }
    
    const alerts = await boardReportingService.getStrategicAlerts(req.params.businessAccountId, req.query);
    res.json(alerts);
  } catch (error) {
    console.error('Get strategic alerts error:', error);
    res.status(500).json({ error: 'Failed to get strategic alerts' });
  }
});

// Board Pack Document Routes
router.post('/board-packs', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canGenerateReports) {
      return res.status(403).json({ error: 'Forbidden - No report generation access' });
    }
    
    const boardPack = await boardPackGenerator.generateBoardPackDocument(
      req.body.snapshotId,
      req.body.businessAccountId,
      req.body.documentType,
      req.body.language || 'en',
      (req as any).user.id
    );
    
    res.status(201).json(boardPack);
  } catch (error) {
    console.error('Generate board pack error:', error);
    res.status(500).json({ error: 'Failed to generate board pack' });
  }
});

router.get('/business-accounts/:businessAccountId/board-packs', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canDownloadReports) {
      return res.status(403).json({ error: 'Forbidden - No download access' });
    }
    
    const boardPacks = await boardReportingService.getBoardPackDocuments(req.params.businessAccountId, req.query);
    res.json(boardPacks);
  } catch (error) {
    console.error('Get board packs error:', error);
    res.status(500).json({ error: 'Failed to get board packs' });
  }
});

router.get('/board-packs/:packId/download', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canDownloadReports) {
      return res.status(403).json({ error: 'Forbidden - No download access' });
    }
    
    // Increment download count
    await prisma.$queryRaw`
      UPDATE board_pack_documents 
      SET download_count = download_count + 1
      WHERE id = ${req.params.packId}::uuid
    `;
    
    // In a real implementation, you would serve the actual file here
    res.json({ message: 'Download started', packId: req.params.packId });
  } catch (error) {
    console.error('Download board pack error:', error);
    res.status(500).json({ error: 'Failed to download board pack' });
  }
});

// Board Analytics Routes
router.get('/business-accounts/:businessAccountId/kpi-trends', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewKpis) {
      return res.status(403).json({ error: 'Forbidden - No KPI access' });
    }
    
    const trends = await boardReportingService.getBoardKPITrends(
      req.params.businessAccountId,
      req.query.periodType as string
    );
    res.json(trends);
  } catch (error) {
    console.error('Get KPI trends error:', error);
    res.status(500).json({ error: 'Failed to get KPI trends' });
  }
});

router.get('/business-accounts/:businessAccountId/risk-summary', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewRisks) {
      return res.status(403).json({ error: 'Forbidden - No risk access' });
    }
    
    const riskSummary = await boardReportingService.getBoardRiskSummary(req.params.businessAccountId);
    res.json(riskSummary);
  } catch (error) {
    console.error('Get risk summary error:', error);
    res.status(500).json({ error: 'Failed to get risk summary' });
  }
});

router.get('/business-accounts/:businessAccountId/alert-trends', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).boardAccess;
    
    if (!access.canViewAlerts) {
      return res.status(403).json({ error: 'Forbidden - No alerts access' });
    }
    
    const alertTrends = await boardReportingService.getBoardAlertTrends(req.params.businessAccountId);
    res.json(alertTrends);
  } catch (error) {
    console.error('Get alert trends error:', error);
    res.status(500).json({ error: 'Failed to get alert trends' });
  }
});

// Board Access Control Routes (Admin only)
router.post('/access-control', authenticateToken, requireRole(['admin', 'chairman']), async (req: Request, res: Response) => {
  try {
    const access = await boardReportingService.grantBoardAccess({
      ...req.body,
      grantedBy: (req as any).user.id
    });
    
    res.status(201).json(access);
  } catch (error) {
    console.error('Grant board access error:', error);
    res.status(500).json({ error: 'Failed to grant board access' });
  }
});

router.get('/access-control/:userId/:businessAccountId', authenticateToken, requireRole(['admin', 'chairman']), async (req: Request, res: Response) => {
  try {
    const access = await boardReportingService.getBoardAccess(req.params.userId, req.params.businessAccountId);
    res.json(access);
  } catch (error) {
    console.error('Get board access error:', error);
    res.status(500).json({ error: 'Failed to get board access' });
  }
});

// Board Audit Log Routes (Admin only)
router.get('/business-accounts/:businessAccountId/audit-log', authenticateToken, requireRole(['admin', 'chairman']), async (req: Request, res: Response) => {
  try {
    const auditLog = await boardReportingService.getBoardAuditLog(req.params.businessAccountId, req.query);
    res.json(auditLog);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// Refresh Materialized Views (Admin only)
router.post('/refresh-analytics', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await boardReportingService.refreshBoardAnalytics();
    res.json({ message: 'Board analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

// Narrative Templates Routes
router.get('/narrative-templates', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const templates = await boardPackGenerator.getNarrativeTemplates(
      req.query.templateType as string,
      req.query.language as 'en' | 'ar' || 'en'
    );
    res.json(templates);
  } catch (error) {
    console.error('Get narrative templates error:', error);
    res.status(500).json({ error: 'Failed to get narrative templates' });
  }
});

// Board Dashboard Summary
router.get('/business-accounts/:businessAccountId/dashboard', authenticateToken, checkBoardAccess, async (req: Request, res: Response) => {
  try {
    const businessAccountId = req.params.businessAccountId;
    const access = (req as any).boardAccess;
    
    // Get latest KPI snapshot
    const latestSnapshots = await boardReportingService.getKPISnapshots(businessAccountId, { limit: 1 });
    const latestSnapshot = latestSnapshots[0];
    
    if (!latestSnapshot) {
      return res.status(404).json({ error: 'No KPI snapshots found' });
    }
    
    // Get dashboard data based on access permissions
    const dashboard: any = {
      kpiSnapshot: access.canViewKpis ? latestSnapshot : null,
      riskAssessments: access.canViewRisks ? await boardReportingService.getRiskAssessments(latestSnapshot.id) : [],
      strategicAlerts: access.canViewAlerts ? await boardReportingService.getStrategicAlerts(businessAccountId, { limit: 10 }) : [],
      boardPacks: access.canDownloadReports ? await boardReportingService.getBoardPackDocuments(businessAccountId, { limit: 5 }) : []
    };
    
    // Add analytics if user has appropriate access
    if (access.canViewKpis) {
      dashboard.kpiTrends = await boardReportingService.getBoardKPITrends(businessAccountId);
    }
    
    if (access.canViewRisks) {
      dashboard.riskSummary = await boardReportingService.getBoardRiskSummary(businessAccountId);
    }
    
    if (access.canViewAlerts) {
      dashboard.alertTrends = await boardReportingService.getBoardAlertTrends(businessAccountId);
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

export default router;
