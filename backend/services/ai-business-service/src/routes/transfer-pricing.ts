import { Router, Request, Response } from 'express';
import { TransferPricingEngine } from '../services/transfer-pricing/TransferPricingEngine';
import { OECDMethodologyEngine } from '../services/transfer-pricing/OECDMethodologyEngine';
import { ComplianceDocumentationEngine } from '../services/transfer-pricing/ComplianceDocumentationEngine';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const transferPricingEngine = new TransferPricingEngine();
const oecdEngine = new OECDMethodologyEngine();
const documentationEngine = new ComplianceDocumentationEngine();

// Middleware to check transfer pricing access
const checkTransferPricingAccess = async (req: Request, res: Response, next: any) => {
  try {
    const businessAccountId = req.params.businessAccountId || req.body.businessAccountId;
    
    if (!businessAccountId) {
      return res.status(401).json({ error: 'Unauthorized - Missing business account' });
    }
    
    // Check if user has transfer pricing access
    const hasAccess = await checkUserTransferPricingAccess((req as any).user?.id, businessAccountId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No transfer pricing access granted' });
    }
    
    next();
  } catch (error) {
    console.error('Transfer pricing access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check transfer pricing access (placeholder)
async function checkUserTransferPricingAccess(userId: string, businessAccountId: string): Promise<boolean> {
  // This would check user permissions for transfer pricing functionality
  // For now, return true for authenticated users
  return true;
}

// Intercompany Transactions Routes
router.post('/transactions', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const transaction = await transferPricingEngine.createIntercompanyTransaction({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create intercompany transaction error:', error);
    res.status(500).json({ error: 'Failed to create intercompany transaction' });
  }
});

router.get('/transactions/:transactionId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const transaction = await transferPricingEngine.getIntercompanyTransaction(req.params.transactionId);
    res.json(transaction);
  } catch (error) {
    console.error('Get intercompany transaction error:', error);
    res.status(500).json({ error: 'Failed to get intercompany transaction' });
  }
});

router.get('/transactions/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { 
      sourceEntityId, 
      destinationEntityId, 
      transactionType, 
      pricingMethod, 
      status, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const transactions = await transferPricingEngine.getIntercompanyTransactions(req.params.businessAccountId, {
      sourceEntityId: sourceEntityId as string,
      destinationEntityId: destinationEntityId as string,
      transactionType: transactionType as string,
      pricingMethod: pricingMethod as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get intercompany transactions error:', error);
    res.status(500).json({ error: 'Failed to get intercompany transactions' });
  }
});

// Transfer Pricing Methods Routes
router.post('/methods', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const method = await transferPricingEngine.createTransferPricingMethod({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(method);
  } catch (error) {
    console.error('Create transfer pricing method error:', error);
    res.status(500).json({ error: 'Failed to create transfer pricing method' });
  }
});

router.get('/methods/:methodId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const method = await transferPricingEngine.getTransferPricingMethod(req.params.methodId);
    res.json(method);
  } catch (error) {
    console.error('Get transfer pricing method error:', error);
    res.status(500).json({ error: 'Failed to get transfer pricing method' });
  }
});

router.get('/methods/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { methodType, isActive, limit } = req.query;
    
    const methods = await transferPricingEngine.getTransferPricingMethods(req.params.businessAccountId, {
      methodType: methodType as string,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(methods);
  } catch (error) {
    console.error('Get transfer pricing methods error:', error);
    res.status(500).json({ error: 'Failed to get transfer pricing methods' });
  }
});

// Arms Length Benchmarks Routes
router.post('/benchmarks', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const benchmark = await transferPricingEngine.createArmsLengthBenchmark({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(benchmark);
  } catch (error) {
    console.error('Create arms length benchmark error:', error);
    res.status(500).json({ error: 'Failed to create arms length benchmark' });
  }
});

router.get('/benchmarks/:benchmarkId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const benchmark = await transferPricingEngine.getArmsLengthBenchmark(req.params.benchmarkId);
    res.json(benchmark);
  } catch (error) {
    console.error('Get arms length benchmark error:', error);
    res.status(500).json({ error: 'Failed to get arms length benchmark' });
  }
});

router.get('/benchmarks/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { 
      transactionType, 
      industryCode, 
      countryCode, 
      currency, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const benchmarks = await transferPricingEngine.getArmsLengthBenchmarks(req.params.businessAccountId, {
      transactionType: transactionType as string,
      industryCode: industryCode as string,
      countryCode: countryCode as string,
      currency: currency as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(benchmarks);
  } catch (error) {
    console.error('Get arms length benchmarks error:', error);
    res.status(500).json({ error: 'Failed to get arms length benchmarks' });
  }
});

// Transfer Pricing Adjustments Routes
router.post('/adjustments', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const adjustment = await transferPricingEngine.createTransferPricingAdjustment({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(adjustment);
  } catch (error) {
    console.error('Create transfer pricing adjustment error:', error);
    res.status(500).json({ error: 'Failed to create transfer pricing adjustment' });
  }
});

router.get('/adjustments/:adjustmentId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const adjustment = await transferPricingEngine.getTransferPricingAdjustment(req.params.adjustmentId);
    res.json(adjustment);
  } catch (error) {
    console.error('Get transfer pricing adjustment error:', error);
    res.status(500).json({ error: 'Failed to get transfer pricing adjustment' });
  }
});

router.get('/adjustments/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { 
      adjustmentType, 
      isSimulation, 
      startDate, 
      endDate, 
      limit 
    } = req.query;
    
    const adjustments = await transferPricingEngine.getTransferPricingAdjustments(req.params.businessAccountId, {
      adjustmentType: adjustmentType as string,
      isSimulation: isSimulation ? isSimulation === 'true' : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(adjustments);
  } catch (error) {
    console.error('Get transfer pricing adjustments error:', error);
    res.status(500).json({ error: 'Failed to get transfer pricing adjustments' });
  }
});

// OECD Methodology Routes
router.post('/oecd/cup-method', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transactionData, comparableData, language } = req.body;
    
    const cupAnalysis = await oecdEngine.applyCUPMethod(
      transactionData,
      comparableData,
      language
    );
    
    res.json(cupAnalysis);
  } catch (error) {
    console.error('CUP method analysis error:', error);
    res.status(500).json({ error: 'Failed to apply CUP method' });
  }
});

router.post('/oecd/cost-plus-method', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transactionData, costData, language } = req.body;
    
    const costPlusAnalysis = await oecdEngine.applyCostPlusMethod(
      transactionData,
      costData,
      language
    );
    
    res.json(costPlusAnalysis);
  } catch (error) {
    console.error('Cost plus method analysis error:', error);
    res.status(500).json({ error: 'Failed to apply cost plus method' });
  }
});

router.post('/oecd/tnmm-method', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transactionData, tnmmData, language } = req.body;
    
    const tnmmAnalysis = await oecdEngine.applyTNMMMethod(
      transactionData,
      tnmmData,
      language
    );
    
    res.json(tnmmAnalysis);
  } catch (error) {
    console.error('TNMM method analysis error:', error);
    res.status(500).json({ error: 'Failed to apply TNMM method' });
  }
});

router.post('/oecd/resale-minus-method', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transactionData, resaleData, language } = req.body;
    
    const resaleMinusAnalysis = await oecdEngine.applyResaleMinusMethod(
      transactionData,
      resaleData,
      language
    );
    
    res.json(resaleMinusAnalysis);
  } catch (error) {
    console.error('Resale minus method analysis error:', error);
    res.status(500).json({ error: 'Failed to apply resale minus method' });
  }
});

router.post('/oecd/profit-split-method', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transactionData, profitData, language } = req.body;
    
    const profitSplitAnalysis = await oecdEngine.applyProfitSplitMethod(
      transactionData,
      profitData,
      language
    );
    
    res.json(profitSplitAnalysis);
  } catch (error) {
    console.error('Profit split method analysis error:', error);
    res.status(500).json({ error: 'Failed to apply profit split method' });
  }
});

router.get('/oecd/compliance-assessment/:businessAccountId/:fiscalYear', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const complianceReport = await oecdEngine.assessOECDCompliance(
      req.params.businessAccountId,
      parseInt(req.params.fiscalYear),
      req.query.language as 'en' | 'ar'
    );
    
    res.json(complianceReport);
  } catch (error) {
    console.error('OECD compliance assessment error:', error);
    res.status(500).json({ error: 'Failed to assess OECD compliance' });
  }
});

// Documentation Routes
router.post('/documentation', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const documentation = await documentationEngine.createDocumentationPack({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(documentation);
  } catch (error) {
    console.error('Create documentation pack error:', error);
    res.status(500).json({ error: 'Failed to create documentation pack' });
  }
});

router.get('/documentation/:documentId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const documentation = await documentationEngine.getDocumentationPack(req.params.documentId);
    res.json(documentation);
  } catch (error) {
    console.error('Get documentation pack error:', error);
    res.status(500).json({ error: 'Failed to get documentation pack' });
  }
});

router.get('/documentation/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { 
      documentationType, 
      fiscalYear, 
      countryCode, 
      status, 
      language, 
      limit 
    } = req.query;
    
    const documents = await documentationEngine.getDocumentationPacks(req.params.businessAccountId, {
      documentationType: documentationType as string,
      fiscalYear: fiscalYear ? parseInt(fiscalYear as string) : undefined,
      countryCode: countryCode as string,
      status: status as string,
      language: language as 'en' | 'ar',
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(documents);
  } catch (error) {
    console.error('Get documentation packs error:', error);
    res.status(500).json({ error: 'Failed to get documentation packs' });
  }
});

router.post('/documentation/:businessAccountId/master-file/:fiscalYear', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const masterFile = await documentationEngine.generateMasterFile(
      req.params.businessAccountId,
      parseInt(req.params.fiscalYear),
      req.query.language as 'en' | 'ar'
    );
    
    res.status(201).json(masterFile);
  } catch (error) {
    console.error('Generate master file error:', error);
    res.status(500).json({ error: 'Failed to generate master file' });
  }
});

router.post('/documentation/:businessAccountId/local-file/:fiscalYear/:countryCode/:entityId', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const localFile = await documentationEngine.generateLocalFile(
      req.params.businessAccountId,
      parseInt(req.params.fiscalYear),
      req.params.countryCode,
      req.params.entityId,
      req.query.language as 'en' | 'ar'
    );
    
    res.status(201).json(localFile);
  } catch (error) {
    console.error('Generate local file error:', error);
    res.status(500).json({ error: 'Failed to generate local file' });
  }
});

// Snapshots Routes
router.post('/snapshots', authenticateToken, requireRole(['admin', 'tax_manager', 'transfer_pricing_manager']), checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await documentationEngine.createSnapshot({
      ...req.body,
      createdBy: (req as any).user.id
    });
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Create snapshot error:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.get('/snapshots/:snapshotId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const snapshot = await documentationEngine.getSnapshot(req.params.snapshotId);
    res.json(snapshot);
  } catch (error) {
    console.error('Get snapshot error:', error);
    res.status(500).json({ error: 'Failed to get snapshot' });
  }
});

router.get('/snapshots/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { includesSimulations, startDate, endDate, limit } = req.query;
    
    const snapshots = await documentationEngine.getSnapshots(req.params.businessAccountId, {
      includesSimulations: includesSimulations ? includesSimulations === 'true' : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(snapshots);
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({ error: 'Failed to get snapshots' });
  }
});

// Analytics and Dashboard Routes
router.get('/analytics/summary/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const summary = await transferPricingEngine.getTransferPricingSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get transfer pricing summary error:', error);
    res.status(500).json({ error: 'Failed to get transfer pricing summary' });
  }
});

router.get('/analytics/method-analysis/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const analysis = await transferPricingEngine.getTransferPricingMethodAnalysis(req.params.businessAccountId);
    res.json(analysis);
  } catch (error) {
    console.error('Get method analysis error:', error);
    res.status(500).json({ error: 'Failed to get method analysis' });
  }
});

router.get('/analytics/cbc-summary/:businessAccountId', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const summary = await transferPricingEngine.getCBCProfitSummary(req.params.businessAccountId);
    res.json(summary);
  } catch (error) {
    console.error('Get CBC summary error:', error);
    res.status(500).json({ error: 'Failed to get CBC summary' });
  }
});

router.get('/analytics/compliance-report/:businessAccountId/:fiscalYear', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const report = await documentationEngine.generateComplianceReport(
      req.params.businessAccountId,
      parseInt(req.params.fiscalYear),
      req.query.language as 'en' | 'ar'
    );
    
    res.json(report);
  } catch (error) {
    console.error('Generate compliance report error:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

router.get('/analytics/transfer-pricing-report/:businessAccountId/:fiscalYear', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const report = await transferPricingEngine.generateTransferPricingReport(
      req.params.businessAccountId,
      parseInt(req.params.fiscalYear),
      req.query.language as 'en' | 'ar'
    );
    
    res.json(report);
  } catch (error) {
    console.error('Generate transfer pricing report error:', error);
    res.status(500).json({ error: 'Failed to generate transfer pricing report' });
  }
});

// Calculation Helper Routes
router.post('/calculate/arms-length-price', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { businessAccountId, transactionType, industryCode, countryCode, currency, transactionDate } = req.body;
    
    const armsLengthPrice = await transferPricingEngine.calculateArmsLengthPrice(
      businessAccountId,
      transactionType,
      industryCode,
      countryCode,
      currency,
      transactionDate
    );
    
    res.json({ armsLengthPrice });
  } catch (error) {
    console.error('Calculate arms length price error:', error);
    res.status(500).json({ error: 'Failed to calculate arms length price' });
  }
});

router.post('/apply/transfer-pricing-method', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transactionAmount, methodType, costBase, marginRange, markupRange } = req.body;
    
    const transferPrice = await transferPricingEngine.applyTransferPricingMethod(
      transactionAmount,
      methodType,
      costBase,
      marginRange,
      markupRange
    );
    
    res.json({ transferPrice });
  } catch (error) {
    console.error('Apply transfer pricing method error:', error);
    res.status(500).json({ error: 'Failed to apply transfer pricing method' });
  }
});

router.post('/calculate/compliance-score', authenticateToken, checkTransferPricingAccess, async (req: Request, res: Response) => {
  try {
    const { transaction } = req.body;
    
    const complianceScore = await transferPricingEngine.calculateComplianceScore(transaction);
    
    res.json({ complianceScore });
  } catch (error) {
    console.error('Calculate compliance score error:', error);
    res.status(500).json({ error: 'Failed to calculate compliance score' });
  }
});

// System Management Routes
router.post('/refresh-analytics', authenticateToken, requireRole(['admin', 'tax_manager']), async (req: Request, res: Response) => {
  try {
    await transferPricingEngine.refreshMaterializedViews();
    res.json({ message: 'Transfer pricing analytics refreshed successfully' });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

export default router;
