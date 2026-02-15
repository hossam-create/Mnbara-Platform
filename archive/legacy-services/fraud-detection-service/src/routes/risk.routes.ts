// Risk Assessment Routes
// مسارات تقييم المخاطر - API routes for fraud detection endpoints

import { Router } from 'express';
import {
  assessTransactionRisk,
  getUserRiskSummary,
  analyzeBehavior,
  getBehaviorProfile,
  registerDevice,
  markDeviceTrusted,
  markDeviceSuspicious,
  getUserDevices,
  checkVelocity,
  recordVelocityEvent,
  getUserVelocitySummary,
  detectAnomaly,
  createCase,
  getCase,
  updateCase,
  resolveCase,
  getReviewQueue,
  getCaseNotes,
  addCaseNote,
  getCaseStatistics,
  escalateCase
} from '../controllers/risk.controller';

const router = Router();

// ==========================================
// Risk Assessment Routes
// ==========================================

// POST /api/risk/assess - Assess transaction risk
router.post('/assess', assessTransactionRisk);

// GET /api/risk/user/:userId - Get user risk summary
router.get('/user/:userId', getUserRiskSummary);

// ==========================================
// Behavioral Analysis Routes
// ==========================================

// POST /api/risk/behavior - Analyze behavior
router.post('/behavior', analyzeBehavior);

// GET /api/risk/behavior/:userId - Get behavior profile
router.get('/behavior/:userId', getBehaviorProfile);

// ==========================================
// Device Fingerprinting Routes
// ==========================================

// POST /api/risk/device - Register device fingerprint
router.post('/device', registerDevice);

// PUT /api/risk/device/trust - Mark device as trusted
router.put('/device/trust', markDeviceTrusted);

// PUT /api/risk/device/suspicious - Mark device as suspicious
router.put('/device/suspicious', markDeviceSuspicious);

// GET /api/risk/device/user/:userId - Get user devices
router.get('/device/user/:userId', getUserDevices);

// ==========================================
// Velocity Tracking Routes
// ==========================================

// POST /api/risk/velocity/check - Check velocity limits
router.post('/velocity/check', checkVelocity);

// POST /api/risk/velocity/record - Record velocity event
router.post('/velocity/record', recordVelocityEvent);

// GET /api/risk/velocity/user/:userId - Get user velocity summary
router.get('/velocity/user/:userId', getUserVelocitySummary);

// ==========================================
// Anomaly Detection Routes
// ==========================================

// POST /api/risk/anomaly/detect - Detect anomalies
router.post('/anomaly/detect', detectAnomaly);

// ==========================================
// Case Management Routes
// ==========================================

// POST /api/risk/cases - Create new case
router.post('/cases', createCase);

// GET /api/risk/cases/:caseId - Get case by ID
router.get('/cases/:caseId', getCase);

// PUT /api/risk/cases/:caseId - Update case
router.put('/cases/:caseId', updateCase);

// POST /api/risk/cases/:caseId/resolve - Resolve case
router.post('/cases/:caseId/resolve', resolveCase);

// POST /api/risk/cases/:caseId/escalate - Escalate case
router.post('/cases/:caseId/escalate', escalateCase);

// GET /api/risk/cases/:caseId/notes - Get case notes
router.get('/cases/:caseId/notes', getCaseNotes);

// POST /api/risk/cases/:caseId/notes - Add case note
router.post('/cases/:caseId/notes', addCaseNote);

// GET /api/risk/cases/queue/review - Get review queue
router.get('/cases/queue/review', getReviewQueue);

// GET /api/risk/cases/statistics - Get case statistics
router.get('/cases/statistics', getCaseStatistics);

export default router;
