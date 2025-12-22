import { Router } from 'express';
import { AIOpsMonitoringController } from '../controllers/ai-ops-monitoring.controller';

const router = Router();
const aiOpsMonitoringController = new AIOpsMonitoringController();

// ==================== SYSTEM HEALTH & OPERATIONAL STATUS ====================

/**
 * @route   GET /api/ai/ops/health
 * @desc    Get AI monitoring system health and operational status
 * @access  Internal (Admin/Monitoring)
 * @returns {Object} System health status including database connectivity, error rates, and operational metrics
 */
router.get('/health', (req, res, next) => 
    aiOpsMonitoringController.getSystemHealth(req, res, next)
);

// ==================== DRIFT DETECTION & MONITORING ====================

/**
 * @route   GET /api/ai/ops/drift
 * @desc    Get drift detection metrics for AI decision system
 * @access  Internal (Admin/Monitoring)
 * @query   {string} [period=7d] - Analysis period (1d, 7d, 30d)
 * @query   {string} [baseline=last_week] - Baseline for comparison (last_week, historical_average)
 * @returns {Object} Drift metrics including score distribution, risk level, and decision pattern changes
 */
router.get('/drift', (req, res, next) => 
    aiOpsMonitoringController.getDriftMetrics(req, res, next)
);

/**
 * @route   GET /api/ai/ops/metrics
 * @desc    Get general AI performance metrics
 * @access  Internal (Admin/Monitoring)
 * @query   {string} [period=30d] - Analysis period
 * @returns {Object} Comprehensive AI performance metrics including decision volume, confidence levels, and processing times
 */
router.get('/metrics', (req, res, next) => 
    aiOpsMonitoringController.getAIMetrics(req, res, next)
);

// ==================== ACCURACY & OUTCOME ANALYSIS ====================

/**
 * @route   GET /api/ai/ops/accuracy
 * @desc    Analyze AI decision accuracy with post-facto outcome classification
 * @access  Internal (Admin/Monitoring)
 * @query   {string} [period=30d] - Analysis period
 * @query   {number} [sellerId] - Filter by specific seller
 * @query   {string} [riskBand] - Filter by risk band (0.0-0.3, 0.3-0.6, 0.6-0.8, 0.8-1.0)
 * @query   {string} [recommendationType] - Filter by recommendation type
 * @query   {string} [decisionRule] - Filter by decision rule
 * @returns {Object} Accuracy metrics including false positives, false negatives, precision, recall, and F1-score
 */
router.get('/accuracy', (req, res, next) => 
    aiOpsMonitoringController.getAccuracyAnalysis(req, res, next)
);

/**
 * @route   GET /api/ai/ops/rules/performance
 * @desc    Get performance metrics for individual decision rules
 * @access  Internal (Admin/Monitoring)
 * @query   {string} [period=30d] - Analysis period
 * @returns {Object} Rule performance metrics including trigger frequency, accuracy, and impact on decisions
 */
router.get('/rules/performance', (req, res, next) => 
    aiOpsMonitoringController.getRulesPerformance(req, res, next)
);

// ==================== SELLER DECISION TIMELINE & EXPLAINABILITY ====================

/**
 * @route   GET /api/ai/ops/sellers/:sellerId/timeline
 * @desc    Get chronological AI decision timeline for a specific seller
 * @access  Internal (Admin/Monitoring)
 * @param   {number} sellerId - Seller ID
 * @query   {string} [period=90d] - Timeline period
 * @query   {number} [limit=50] - Maximum number of decisions to return
 * @query   {number} [offset=0] - Pagination offset
 * @returns {Object} Chronological decision history with input snapshots, escalation levels, and triggered rules
 */
router.get('/sellers/:sellerId/timeline', (req, res, next) => 
    aiOpsMonitoringController.getSellerTimeline(req, res, next)
);

/**
 * @route   GET /api/ai/ops/sellers/:sellerId/compare
 * @desc    Compare AI decisions between two timestamps for a specific seller
 * @access  Internal (Admin/Monitoring)
 * @param   {number} sellerId - Seller ID
 * @query   {string} from - Start timestamp (ISO format)
 * @query   {string} to - End timestamp (ISO format)
 * @returns {Object} Side-by-side comparison with change explanations and decision evolution analysis
 */
router.get('/sellers/:sellerId/compare', (req, res, next) => 
    aiOpsMonitoringController.compareSellerDecisions(req, res, next)
);

// ==================== AI HEALTH SCORE ====================

/**
 * @route   GET /api/ai/ops/health/score
 * @desc    Get AI system health score and diagnostic metrics
 * @access  Internal (Admin/Monitoring)
 * @query   {string} [period=7d] - Analysis period
 * @returns {Object} AI health score (0-100), health level, and contributing factors with recommendations
 */
router.get('/health/score', (req, res, next) => 
    aiOpsMonitoringController.getAIHealthScore(req, res, next)
);

export default router;