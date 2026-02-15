import { Router, Request, Response } from 'express';
import { InvestorService } from '../services/investor/InvestorService';
import { InvestorPackGenerator } from '../services/investor/InvestorPackGenerator';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const investorService = new InvestorService();
const investorPackGenerator = new InvestorPackGenerator();

// Middleware to check investor access
const checkInvestorAccess = async (req: Request, res: Response, next: any) => {
  try {
    const userId = (req as any).user?.id;
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!userId || !businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing user or business account' });
    }
    
    const access = await investorService.getInvestorAccess(userId, businessAccountId);
    
    if (!access) {
      return res.status(403).json({ error: 'Forbidden - No investor access granted' });
    }
    
    // Update last accessed timestamp
    await investorService.updateLastAccessed(userId, businessAccountId);
    
    // Attach access to request for later use
    (req as any).investorAccess = access;
    next();
  } catch (error) {
    console.error('Investor access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Investor Snapshot Routes
router.post('/snapshots', authenticateToken, requireRole(['admin', 'investor']), checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewDashboard) {
      return res.status(403).json({ error: 'Forbidden - No dashboard access' });
    }
    
    const snapshot = await investorService.generateInvestorSnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Generate investor snapshot error:', error);
    res.status(500).json({ error: 'Failed to generate investor snapshot' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewDashboard) {
      return res.status(403).json({ error: 'Forbidden - No dashboard access' });
    }
    
    const snapshot = await investorService.getInvestorSnapshotById(req.params.snapshotId);
    
    if (!snapshot) {
      return res.status(404).json({ error: 'Investor snapshot not found' });
    }
    
    res.json(snapshot);
  } catch (error) {
    console.error('Get investor snapshot error:', error);
    res.status(500).json({ error: 'Failed to get investor snapshot' });
  }
});

router.get('/business-accounts/:businessAccountId/snapshots', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewDashboard) {
      return res.status(403).json({ error: 'Forbidden - No dashboard access' });
    }
    
    const snapshots = await investorService.getInvestorSnapshots(req.params.businessAccountId, req.query);
    res.json(snapshots);
  } catch (error) {
    console.error('Get investor snapshots error:', error);
    res.status(500).json({ error: 'Failed to get investor snapshots' });
  }
});

// Investor Risk Disclosure Routes
router.post('/risk-disclosures', authenticateToken, requireRole(['admin', 'investor']), checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewRiskDisclosures) {
      return res.status(403).json({ error: 'Forbidden - No risk disclosure access' });
    }
    
    const riskDisclosure = await investorService.createRiskDisclosure({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(riskDisclosure);
  } catch (error) {
    console.error('Create risk disclosure error:', error);
    res.status(500).json({ error: 'Failed to create risk disclosure' });
  }
});

router.get('/snapshots/:snapshotId/risk-disclosures', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewRiskDisclosures) {
      return res.status(403).json({ error: 'Forbidden - No risk disclosure access' });
    }
    
    const riskDisclosures = await investorService.getRiskDisclosures(req.params.snapshotId);
    res.json(riskDisclosures);
  } catch (error) {
    console.error('Get risk disclosures error:', error);
    res.status(500).json({ error: 'Failed to get risk disclosures' });
  }
});

// Investor Pack Generation Routes
router.post('/generate-pack', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canDownloadPacks) {
      return res.status(403).json({ error: 'Forbidden - No pack download access' });
    }
    
    const { snapshotId, language = 'en' } = req.body;
    
    // Generate pack content
    const packContent = await investorPackGenerator.generatePackContent(
      snapshotId,
      req.params.businessAccountId || req.body.businessAccountId,
      language
    );
    
    res.status(201).json({
      packContent,
      generatedAt: new Date().toISOString(),
      language,
      generatedBy: (req as any).user.id
    });
  } catch (error) {
    console.error('Generate investor pack error:', error);
    res.status(500).json({ error: 'Failed to generate investor pack' });
  }
});

// Share Link Routes
router.post('/share-links', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canShareExternally) {
      return res.status(403).json({ error: 'Forbidden - No external sharing access' });
    }
    
    const { snapshotId, packDocumentId, accessLevel, expiresHours } = req.body;
    
    const shareToken = await investorService.generateShareLink(
      req.params.businessAccountId || req.body.businessAccountId,
      snapshotId,
      packDocumentId,
      accessLevel,
      expiresHours,
      (req as any).user.id
    );
    
    const shareLink = `${process.env.BASE_URL || 'http://localhost:3000'}/investor/share/${shareToken}`;
    
    res.status(201).json({
      shareToken,
      shareLink,
      expiresAt: new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString(),
      accessLevel
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Public Share Link Access (no authentication required)
router.get('/share/:shareToken', async (req: Request, res: Response) => {
  try {
    const shareLink = await investorService.getShareLinkByToken(req.params.shareToken);
    
    if (!shareLink) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }
    
    // Check if expired
    if (new Date(shareLink.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Share link expired' });
    }
    
    // Update view count
    await investorService.updateShareLinkViewCount(req.params.shareToken);
    
    res.json({
      shareLink,
      accessLevel: shareLink.accessLevel,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    console.error('Access share link error:', error);
    res.status(500).json({ error: 'Failed to access share link' });
  }
});

// Investor Access Control Routes (Admin only)
router.post('/access-control', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const access = await investorService.grantInvestorAccess({
      ...req.body,
      grantedBy: (req as any).user.id
    });
    
    res.status(201).json(access);
  } catch (error) {
    console.error('Grant investor access error:', error);
    res.status(500).json({ error: 'Failed to grant investor access' });
  }
});

router.get('/access-control/:userId/:businessAccountId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const access = await investorService.getInvestorAccess(req.params.userId, req.params.businessAccountId);
    res.json(access);
  } catch (error) {
    console.error('Get investor access error:', error);
    res.status(500).json({ error: 'Failed to get investor access' });
  }
});

// Investor Dashboard Summary
router.get('/business-accounts/:businessAccountId/dashboard', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const businessAccountId = req.params.businessAccountId;
    const access = (req as any).investorAccess;
    
    // Get latest investor snapshot
    const latestSnapshots = await investorService.getInvestorSnapshots(businessAccountId, { limit: 1 });
    const latestSnapshot = latestSnapshots[0];
    
    if (!latestSnapshot) {
      return res.status(404).json({ error: 'No investor snapshots found' });
    }
    
    // Get dashboard data based on access permissions
    const dashboard: any = {
      investorSnapshot: access.canViewDashboard ? latestSnapshot : null,
      riskDisclosures: access.canViewRiskDisclosures ? await investorService.getRiskDisclosures(latestSnapshot.id) : []
    };
    
    // Add detailed metrics if user has appropriate access
    if (access.canViewDetailedMetrics) {
      dashboard.financialHighlights = {
        currentPeriodRevenue: latestSnapshot.currentPeriodRevenue,
        revenueGrowthQoQ: latestSnapshot.revenueGrowthQoQ,
        revenueGrowthYoY: latestSnapshot.revenueGrowthYoY,
        grossMarginPercentage: latestSnapshot.grossMarginPercentage,
        ebitdaMarginPercentage: latestSnapshot.ebitdaMarginPercentage,
        netMarginPercentage: latestSnapshot.netMarginPercentage,
        cashPosition: latestSnapshot.cashPosition,
        runwayMonths: latestSnapshot.runwayMonths
      };
    }
    
    if (access.canViewUnitEconomics) {
      dashboard.unitEconomics = {
        customerAcquisitionCost: latestSnapshot.customerAcquisitionCost,
        lifetimeValue: latestSnapshot.lifetimeValue,
        ltvCacRatio: latestSnapshot.ltvCacRatio,
        paybackPeriodMonths: latestSnapshot.paybackPeriodMonths,
        unitEconomicsHealth: latestSnapshot.unitEconomicsHealth
      };
    }
    
    if (access.canViewGrowthScenarios) {
      dashboard.growthScenarios = {
        forecastRevenueNextPeriod: latestSnapshot.forecastRevenueNextPeriod,
        forecastGrowthRate: latestSnapshot.forecastGrowthRate,
        forecastConfidenceLevel: latestSnapshot.forecastConfidenceLevel,
        forecastScenario: latestSnapshot.forecastScenario
      };
    }
    
    if (access.canViewConfidentialData) {
      dashboard.capitalMetrics = {
        capitalRaised: latestSnapshot.capitalRaised,
        capitalDeployed: latestSnapshot.capitalDeployed,
        capitalEfficiencyRatio: latestSnapshot.capitalEfficiencyRatio,
        returnOnInvestedCapital: latestSnapshot.returnOnInvestedCapital
      };
    }
    
    res.json(dashboard);
  } catch (error) {
    console.error('Get investor dashboard error:', error);
    res.status(500).json({ error: 'Failed to get investor dashboard data' });
  }
});

// Investor Analytics Routes
router.get('/business-accounts/:businessAccountId/performance-trends', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewDashboard) {
      return res.status(403).json({ error: 'Forbidden - No dashboard access' });
    }
    
    const trends = await investorService.getPerformanceTrends(
      req.params.businessAccountId,
      req.query.periodType as string
    );
    res.json(trends);
  } catch (error) {
    console.error('Get performance trends error:', error);
    res.status(500).json({ error: 'Failed to get performance trends' });
  }
});

router.get('/business-accounts/:businessAccountId/risk-summary', authenticateToken, checkInvestorAccess, async (req: Request, res: Response) => {
  try {
    const access = (req as any).investorAccess;
    
    if (!access.canViewRiskDisclosures) {
      return res.status(403).json({ error: 'Forbidden - No risk disclosure access' });
    }
    
    const riskSummary = await investorService.getRiskSummary(req.params.businessAccountId);
    res.json(riskSummary);
  } catch (error) {
    console.error('Get risk summary error:', error);
    res.status(500).json({ error: 'Failed to get risk summary' });
  }
});

export default router;
