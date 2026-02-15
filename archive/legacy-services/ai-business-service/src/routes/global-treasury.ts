import { Router, Request, Response } from 'express';
import { GlobalTreasuryEngine } from '../services/treasury/GlobalTreasuryEngine';
import { LiquidityForecastingEngine } from '../services/treasury/LiquidityForecastingEngine';
import { FXRiskMonitoringEngine } from '../services/treasury/FXRiskMonitoringEngine';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const treasuryEngine = new GlobalTreasuryEngine();
const liquidityEngine = new LiquidityForecastingEngine();
const fxEngine = new FXRiskMonitoringEngine();

// Middleware to check treasury access
const checkTreasuryAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has treasury access
    const hasAccess = await checkUserTreasuryAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No treasury access granted' });
    }
    
    next();
  } catch (error) {
    console.error('Treasury access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check treasury access (placeholder)
async function checkUserTreasuryAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check user permissions for treasury functionality
  // For now, return true for authenticated users
  return true;
}

// Global Cash Positions Routes
router.post('/cash-positions', authenticateToken, requireRole(['admin', 'treasury_manager', 'cash_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const position = await treasuryEngine.updateGlobalCashPosition({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(position);
  } catch (error) {
    console.error('Update global cash position error:', error);
    res.status(500).json({ error: 'Failed to update global cash position' });
  }
});

router.get('/cash-positions/:positionId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const position = await treasuryEngine.getGlobalCashPosition(req.params.positionId);
    res.json(position);
  } catch (error) {
    console.error('Get global cash position error:', error);
    res.status(500).json({ error: 'Failed to get global cash position' });
  }
});

router.get('/cash-positions/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { 
      entityId, 
      countryCode, 
      currency, 
      balanceDate, 
      limit 
    } = req.query;
    
    const positions = await treasuryEngine.getGlobalCashPositions(req.params.businessAccountId, {
      entityId: entityId as string,
      countryCode: countryCode as string,
      currency: currency as string,
      balanceDate: balanceDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(positions);
  } catch (error) {
    console.error('Get global cash positions error:', error);
    res.status(500).json({ error: 'Failed to get global cash positions' });
  }
});

// Multi-Currency Cash Positioning Routes
router.post('/multi-currency-positions', authenticateToken, requireRole(['admin', 'treasury_manager', 'cash_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const position = await treasuryEngine.createMultiCurrencyPosition({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(position);
  } catch (error) {
    console.error('Create multi-currency position error:', error);
    res.status(500).json({ error: 'Failed to create multi-currency position' });
  }
});

router.get('/multi-currency-positions/:positionId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const position = await treasuryEngine.getMultiCurrencyPosition(req.params.positionId);
    res.json(position);
  } catch (error) {
    console.error('Get multi-currency position error:', error);
    res.status(500).json({ error: 'Failed to get multi-currency position' });
  }
});

router.get('/multi-currency-positions/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, currency, positionDate, limit } = req.query;
    
    const positions = await treasuryEngine.getMultiCurrencyPositions(req.params.businessAccountId, {
      entityId: entityId as string,
      currency: currency as string,
      positionDate: positionDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(positions);
  } catch (error) {
    console.error('Get multi-currency positions error:', error);
    res.status(500).json({ error: 'Failed to get multi-currency positions' });
  }
});

// Liquidity Forecasting Routes
router.post('/liquidity-forecasts', authenticateToken, requireRole(['admin', 'treasury_manager', 'cash_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const forecast = await liquidityEngine.calculateLiquidityForecast({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(forecast);
  } catch (error) {
    console.error('Create liquidity forecast error:', error);
    res.status(500).json({ error: 'Failed to create liquidity forecast' });
  }
});

router.get('/liquidity-forecasts/:forecastId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const forecast = await liquidityEngine.getLiquidityForecast(req.params.forecastId);
    res.json(forecast);
  } catch (error) {
    console.error('Get liquidity forecast error:', error);
    res.status(500).json({ error: 'Failed to get liquidity forecast' });
  }
});

router.get('/liquidity-forecasts/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { 
      entityId, 
      currency, 
      forecastType, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const forecasts = await liquidityEngine.getLiquidityForecasts(req.params.businessAccountId, {
      entityId: entityId as string,
      currency: currency as string,
      forecastType: forecastType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(forecasts);
  } catch (error) {
    console.error('Get liquidity forecasts error:', error);
    res.status(500).json({ error: 'Failed to get liquidity forecasts' });
  }
});

router.post('/liquidity-forecasts/historical/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, currency, forecastType, periodStart, periodEnd, confidenceLevel } = req.body;
    
    const forecast = await liquidityEngine.generateHistoricalForecast(
      req.params.businessAccountId,
      entityId,
      currency,
      forecastType,
      new Date(periodStart),
      new Date(periodEnd),
      confidenceLevel
    );
    
    res.status(201).json(forecast);
  } catch (error) {
    console.error('Generate historical forecast error:', error);
    res.status(500).json({ error: 'Failed to generate historical forecast' });
  }
});

router.post('/liquidity-forecasts/trend/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, currency, forecastType, periodStart, periodEnd, confidenceLevel } = req.body;
    
    const forecast = await liquidityEngine.generateTrendForecast(
      req.params.businessAccountId,
      entityId,
      currency,
      forecastType,
      new Date(periodStart),
      new Date(periodEnd),
      confidenceLevel
    );
    
    res.status(201).json(forecast);
  } catch (error) {
    console.error('Generate trend forecast error:', error);
    res.status(500).json({ error: 'Failed to generate trend forecast' });
  }
});

router.post('/liquidity-forecasts/seasonal/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, currency, forecastType, periodStart, periodEnd, confidenceLevel } = req.body;
    
    const forecast = await liquidityEngine.generateSeasonalForecast(
      req.params.businessAccountId,
      entityId,
      currency,
      forecastType,
      new Date(periodStart),
      new Date(periodEnd),
      confidenceLevel
    );
    
    res.status(201).json(forecast);
  } catch (error) {
    console.error('Generate seasonal forecast error:', error);
    res.status(500).json({ error: 'Failed to generate seasonal forecast' });
  }
});

router.post('/liquidity-forecasts/runway/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, currency, forecastType, daysToAnalyze } = req.body;
    
    const runwayAnalysis = await liquidityEngine.analyzeCashRunway(
      req.params.businessAccountId,
      entityId,
      currency,
      forecastType,
      daysToAnalyze
    );
    
    res.json(runwayAnalysis);
  } catch (error) {
    console.error('Analyze cash runway error:', error);
    res.status(500).json({ error: 'Failed to analyze cash runway' });
  }
});

// Intercompany Funding Routes
router.post('/intercompany-funding', authenticateToken, requireRole(['admin', 'treasury_manager', 'cash_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const funding = await treasuryEngine.createIntercompanyFunding({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(funding);
  } catch (error) {
    console.error('Create intercompany funding error:', error);
    res.status(500).json({ error: 'Failed to create intercompany funding' });
  }
});

router.get('/intercompany-funding/:fundingId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const funding = await treasuryEngine.getIntercompanyFunding(req.params.fundingId);
    res.json(funding);
  } catch (error) {
    console.error('Get intercompany funding error:', error);
    res.status(500).json({ error: 'Failed to get intercompany funding' });
  }
});

router.get('/intercompany-funding/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { 
      sourceEntityId, 
      destinationEntityId, 
      fundingType, 
      status, 
      currency, 
      limit 
    } = req.query;
    
    const fundings = await treasuryEngine.getIntercompanyFundings(req.params.businessAccountId, {
      sourceEntityId: sourceEntityId as string,
      destinationEntityId: destinationEntityId as string,
      fundingType: fundingType as string,
      status: status as string,
      currency: currency as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(fundings);
  } catch (error) {
    console.error('Get intercompany fundings error:', error);
    res.status(500).json({ error: 'Failed to get intercompany fundings' });
  }
});

// Debt and Credit Facilities Routes
router.post('/debt-credit-facilities', authenticateToken, requireRole(['admin', 'treasury_manager', 'cash_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const facility = await treasuryEngine.createDebtCreditFacility({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(facility);
  } catch (error) {
    console.error('Create debt credit facility error:', error);
    res.status(500).json({ error: 'Failed to create debt credit facility' });
  }
});

router.get('/debt-credit-facilities/:facilityId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const facility = await treasuryEngine.getDebtCreditFacility(req.params.facilityId);
    res.json(facility);
  } catch (error) {
    console.error('Get debt credit facility error:', error);
    res.status(500).json({ error: 'Failed to get debt credit facility' });
  }
});

router.get('/debt-credit-facilities/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, facilityType, status, currency, limit } = req.query;
    
    const facilities = await treasuryEngine.getDebtCreditFacilities(req.params.businessAccountId, {
      entityId: entityId as string,
      facilityType: facilityType as string,
      status: status as string,
      currency: currency as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(facilities);
  } catch (error) {
    console.error('Get debt credit facilities error:', error);
    res.status(500).json({ error: 'Failed to get debt credit facilities' });
  }
});

// FX Risk Monitoring Routes
router.post('/fx-risk-exposures', authenticateToken, requireRole(['admin', 'treasury_manager', 'fx_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const exposure = await fxEngine.createFXRiskExposure({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(exposure);
  } catch (error) {
    console.error('Create FX risk exposure error:', error);
    res.status(500).json({ error: 'Failed to create FX risk exposure' });
  }
});

router.get('/fx-risk-exposures/:exposureId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const exposure = await fxEngine.getFXRiskExposure(req.params.exposureId);
    res.json(exposure);
  } catch (error) {
    console.error('Get FX risk exposure error:', error);
    res.status(500).json({ error: 'Failed to get FX risk exposure' });
  }
});

router.get('/fx-risk-exposures/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { 
      entityId, 
      currency, 
      exposureType, 
      riskLevel, 
      exposureDate, 
      limit 
    } = req.query;
    
    const exposures = await fxEngine.getFXRiskExposures(req.params.businessAccountId, {
      entityId: entityId as string,
      currency: currency as string,
      exposureType: exposureType as string,
      riskLevel: riskLevel as string,
      exposureDate: exposureDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(exposures);
  } catch (error) {
    console.error('Get FX risk exposures error:', error);
    res.status(500).json({ error: 'Failed to get FX risk exposures' });
  }
});

router.post('/fx-hedges', authenticateToken, requireRole(['admin', 'treasury_manager', 'fx_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const hedge = await fxEngine.createFXHedge({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(hedge);
  } catch (error) {
    console.error('Create FX hedge error:', error);
    res.status(500).json({ error: 'Failed to create FX hedge' });
  }
});

router.get('/fx-hedges/:hedgeId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const hedge = await fxEngine.getFXHedge(req.params.hedgeId);
    res.json(hedge);
  } catch (error) {
    console.error('Get FX hedge error:', error);
    res.status(500).json({ error: 'Failed to get FX hedge' });
  }
});

router.get('/fx-hedges/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { entityId, currency, hedgeType, status, limit } = req.query;
    
    const hedges = await fxEngine.getFXHedges(req.params.businessAccountId, {
      entityId: entityId as string,
      currency: currency as string,
      hedgeType: hedgeType as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(hedges);
  } catch (error) {
    console.error('Get FX hedges error:', error);
    res.status(500).json({ error: 'Failed to get FX hedges' });
  }
});

router.get('/fx-risk-metrics/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const metrics = await fxEngine.calculateFXRiskMetrics(req.params.businessAccountId);
    res.json(metrics);
  } catch (error) {
    console.error('Calculate FX risk metrics error:', error);
    res.status(500).json({ error: 'Failed to calculate FX risk metrics' });
  }
});

router.get('/fx-position-report/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const report = await fxEngine.generateFXPositionReport(req.params.businessAccountId);
    res.json(report);
  } catch (error) {
    console.error('Generate FX position report error:', error);
    res.status(500).json({ error: 'Failed to generate FX position report' });
  }
});

router.post('/fx-scenario-analysis/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { scenarioName, parameters } = req.body;
    
    const analysis = await fxEngine.runFXScenarioAnalysis(
      req.params.businessAccountId,
      scenarioName,
      parameters
    );
    
    res.json(analysis);
  } catch (error) {
    console.error('Run FX scenario analysis error:', error);
    res.status(500).json({ error: 'Failed to run FX scenario analysis' });
  }
});

router.post('/fx-alerts', authenticateToken, requireRole(['admin', 'treasury_manager', 'fx_manager']), checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const alert = await fxEngine.createFXAlert({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Create FX alert error:', error);
    res.status(500).json({ error: 'Failed to create FX alert' });
  }
});

router.get('/fx-alerts/:alertId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const alert = await fxEngine.getFXAlert(req.params.alertId);
    res.json(alert);
  } catch (error) {
    console.error('Get FX alert error:', error);
    res.status(500).json({ error: 'Failed to get FX alert' });
  }
});

router.get('/fx-alerts/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { 
      entityId, 
      currency, 
      alertType, 
      severity, 
      status, 
      limit 
    } = req.query;
    
    const alerts = await fxEngine.getFXAlerts(req.params.businessAccountId, {
      entityId: entityId as string,
      currency: currency as string,
      alertType: alertType as string,
      severity: severity as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(alerts);
  } catch (error) {
    console.error('Get FX alerts error:', error);
    res.status(500).json({ error: 'Failed to get FX alerts' });
  }
});

router.post('/fx-alerts/generate/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const alerts = await fxEngine.generateFXAlerts(req.params.businessAccountId);
    res.json(alerts);
  } catch (error) {
    console.error('Generate FX alerts error:', error);
    res.status(500).json({ error: 'Failed to generate FX alerts' });
  }
});

router.get('/fx-hedge-effectiveness/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const effectiveness = await fxEngine.analyzeHedgeEffectiveness(req.params.businessAccountId);
    res.json(effectiveness);
  } catch (error) {
    console.error('Analyze hedge effectiveness error:', error);
    res.status(500).json({ error: 'Failed to analyze hedge effectiveness' });
  }
});

// Analytics and Dashboard Routes
router.get('/analytics/global-cash-summary/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const summary = await treasuryEngine.getGlobalCashSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get global cash summary error:', error);
    res.status(500).json({ error: 'Failed to get global cash summary' });
  }
});

router.get('/analytics/liquidity-forecast-summary/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const summary = await treasuryEngine.getLiquidityForecastSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get liquidity forecast summary error:', error);
    res.status(500).json({ error: 'Failed to get liquidity forecast summary' });
  }
});

router.get('/analytics/debt-facility-summary/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const summary = await treasuryEngine.getDebtFacilitySummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get debt facility summary error:', error);
    res.status(500).json({ error: 'Failed to get debt facility summary' });
  }
});

router.get('/analytics/treasury-dashboard/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const dashboard = await treasuryEngine.generateTreasuryDashboard(
      req.params.businessAccountId,
      req.query.language as 'en' | 'ar'
    );
    res.json(dashboard);
  } catch (error) {
    console.error('Generate treasury dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate treasury dashboard' });
  }
});

router.get('/analytics/liquidity-runway/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const { currency, forecastType, daysToAnalyze } = req.query;
    
    const runway = await treasuryEngine.calculateLiquidityRunway(
      req.params.businessAccountId,
      currency as string,
      forecastType as string
    );
    
    res.json(runway);
  } catch (error) {
    console.error('Calculate liquidity runway error:', error);
    res.status(500).json({ error: 'Failed to calculate liquidity runway' });
  }
});

router.get('/analytics/fx-exposure/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const exposure = await treasuryEngine.calculateFXExposure(req.params.businessAccountId);
    res.json(exposure);
  } catch (error) {
    console.error('Calculate FX exposure error:', error);
    res.status(500).json({ error: 'Failed to calculate FX exposure' });
  }
});

router.get('/analytics/cash-concentration-risk/:businessAccountId', authenticateToken, checkTreasuryAccess, async (req: Request, res: Response) => {
  try {
    const risk = await treasuryEngine.calculateCashConcentrationRisk(req.params.businessAccountId);
    res.json({ concentrationRisk: risk });
  } catch (error) {
    console.error('Calculate cash concentration risk error:', error);
    res.status(500).json({ error: 'Failed to calculate cash concentration risk' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'treasury_manager']), async (req: Request, res: Response) => {
  try {
    await treasuryEngine.refreshMaterializedViews();
    res.json({ message: 'Treasury analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

export default router;
