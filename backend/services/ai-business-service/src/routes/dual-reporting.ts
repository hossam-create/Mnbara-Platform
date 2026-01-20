import { Router } from 'express';
import { DualReportingEngine } from '../services/dual-reporting/DualReportingEngine';
import { FinancialStatementEngine } from '../services/dual-reporting/FinancialStatementEngine';
import { ReconciliationEngine } from '../services/dual-reporting/ReconciliationEngine';
import { authenticateToken } from '../middleware/auth';
import { requireBusinessAccount } from '../middleware/businessAccount';
import { requireRole } from '../middleware/rbac';

const router = Router();
const dualReportingEngine = new DualReportingEngine();
const financialStatementEngine = new FinancialStatementEngine();
const reconciliationEngine = new ReconciliationEngine();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireBusinessAccount);

// Dual Ledger Mapping Routes
router.post('/mappings', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const mapping = await dualReportingEngine.createDualLedgerMapping({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: mapping });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/mappings', async (req, res) => {
  try {
    const mappings = await dualReportingEngine.getDualLedgerMappings(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: mappings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/mappings/:id', async (req, res) => {
  try {
    const mapping = await dualReportingEngine.getDualLedgerMapping(req.params.id);
    res.json({ success: true, data: mapping });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// IFRS Transaction Routes
router.post('/ifrs-translations', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const translation = await dualReportingEngine.translateTransactionToIFRS({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: translation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/ifrs-translations', async (req, res) => {
  try {
    const translations = await dualReportingEngine.getIFRSTransactions(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: translations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/ifrs-translations/:id', async (req, res) => {
  try {
    const translation = await dualReportingEngine.getIFRSTransaction(req.params.id);
    res.json({ success: true, data: translation });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// GAAP Transaction Routes
router.post('/gaap-translations', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const translation = await dualReportingEngine.translateTransactionToGAAP({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: translation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/gaap-translations', async (req, res) => {
  try {
    const translations = await dualReportingEngine.getGAAPTransactions(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: translations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/gaap-translations/:id', async (req, res) => {
  try {
    const translation = await dualReportingEngine.getGAAPTransaction(req.params.id);
    res.json({ success: true, data: translation });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Standard Reconciliation Routes
router.post('/reconciliations', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const reconciliation = await dualReportingEngine.reconcileStandards(
      req.businessAccountId,
      req.body.periodStart,
      req.body.periodEnd,
      req.body.reconciliationType,
      req.user.id
    );
    res.json({ success: true, data: reconciliation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reconciliations', async (req, res) => {
  try {
    const reconciliations = await dualReportingEngine.getStandardReconciliations(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: reconciliations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reconciliations/:id', async (req, res) => {
  try {
    const reconciliation = await dualReportingEngine.getStandardReconciliation(req.params.id);
    res.json({ success: true, data: reconciliation });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Batch Translation Routes
router.post('/batch-translate', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const result = await dualReportingEngine.translateAllTransactionsToStandards(
      req.businessAccountId,
      req.body.periodStart,
      req.body.periodEnd,
      req.user.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// IFRS Financial Statement Routes
router.post('/ifrs-statements', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const statement = await financialStatementEngine.generateIFRSStatement({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: statement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/ifrs-statements', async (req, res) => {
  try {
    const statements = await financialStatementEngine.getIFRSStatements(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: statements });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/ifrs-statements/:id', async (req, res) => {
  try {
    const statement = await financialStatementEngine.getIFRSStatement(req.params.id);
    res.json({ success: true, data: statement });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// GAAP Financial Statement Routes
router.post('/gaap-statements', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const statement = await financialStatementEngine.generateGAAPStatement({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: statement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/gaap-statements', async (req, res) => {
  try {
    const statements = await financialStatementEngine.getGAAPStatements(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: statements });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/gaap-statements/:id', async (req, res) => {
  try {
    const statement = await financialStatementEngine.getGAAPStatement(req.params.id);
    res.json({ success: true, data: statement });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Dual Snapshot Routes
router.post('/snapshots', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const snapshot = await financialStatementEngine.createDualSnapshot({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: snapshot });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/snapshots', async (req, res) => {
  try {
    const snapshots = await financialStatementEngine.getDualSnapshots(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: snapshots });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/snapshots/:id', async (req, res) => {
  try {
    const snapshot = await financialStatementEngine.getDualSnapshot(req.params.id);
    res.json({ success: true, data: snapshot });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Reconciliation Rule Routes
router.post('/reconciliation-rules', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const rule = await reconciliationEngine.createReconciliationRule({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation-rules', async (req, res) => {
  try {
    const rules = await reconciliationEngine.getReconciliationRules(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation-rules/:id', async (req, res) => {
  try {
    const rule = await reconciliationEngine.getReconciliationRule(req.params.id);
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Multi-Entity Consolidation Routes
router.post('/consolidations', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const consolidation = await reconciliationEngine.createMultiEntityConsolidation({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ success: true, data: consolidation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/consolidations', async (req, res) => {
  try {
    const consolidations = await reconciliationEngine.getMultiEntityConsolidations(
      req.businessAccountId,
      req.query
    );
    res.json({ success: true, data: consolidations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/consolidations/:id', async (req, res) => {
  try {
    const consolidation = await reconciliationEngine.getMultiEntityConsolidation(req.params.id);
    res.json({ success: true, data: consolidation });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Auto-Reconciliation Routes
router.post('/auto-reconcile', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const results = await reconciliationEngine.performAutoReconciliation(
      req.businessAccountId,
      req.body.periodStart,
      req.body.periodEnd,
      req.user.id
    );
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Analytics and Dashboard Routes
router.get('/dashboard', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ar' || 'en';
    const dashboard = await dualReportingEngine.getDualReportingSummary(
      req.businessAccountId,
      language
    );
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation-analytics', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ar' || 'en';
    const analytics = await reconciliationEngine.getReconciliationAnalytics(
      req.businessAccountId,
      language
    );
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Materialized View Refresh Routes
router.post('/refresh-views', requireRole(['admin']), async (req, res) => {
  try {
    await reconciliationEngine.refreshReconciliationViews();
    res.json({ success: true, message: 'Materialized views refreshed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Health Check Route
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        dualReporting: 'operational',
        financialStatements: 'operational',
        reconciliation: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
