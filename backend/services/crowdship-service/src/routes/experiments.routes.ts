/**
 * Experiments Routes
 * Non-Regulated Growth Experiments Only
 *
 * HARD RULES:
 * - ALL ENDPOINTS ARE READ-ONLY
 * - No experiment can affect: payments, escrow, trust, risk, ranking, or enforcement
 * - No long-term storage of experiment decisions
 * - Feature flags OFF by default
 */

import { Router, Request, Response } from 'express';
import { experimentsService } from '../services/experiments.service';
import { getFeatureFlags } from '../config/feature-flags';
import {
  ALLOWED_EXPERIMENT_TYPES,
  BLOCKED_EXPERIMENT_TYPES,
  DEFAULT_EXPOSURE_PERCENT,
  MAX_EXPOSURE_PERCENT,
} from '../config/experiments.config';

const router = Router();

// ===========================================
// Constraints Endpoint (Always Available)
// ===========================================

/**
 * GET /api/experiments/constraints
 * Returns hard constraints for experiments
 * Always available regardless of feature flags
 */
router.get('/constraints', (_req: Request, res: Response) => {
  res.json({
    constraints: {
      allowedTypes: ALLOWED_EXPERIMENT_TYPES,
      blockedTypes: BLOCKED_EXPERIMENT_TYPES,
      defaultExposurePercent: DEFAULT_EXPOSURE_PERCENT,
      maxExposurePercent: MAX_EXPOSURE_PERCENT,
      rules: [
        'Experiments MUST be isolated',
        'Feature flags OFF by default',
        'No shared state mutation',
        'No experiment can affect: payments, escrow, trust, risk, ranking, or enforcement',
        'No long-term storage of experiment decisions',
        'No auto-enrollment without visibility',
        'Max 5% exposure by default, 20% hard cap',
        'Auto-disable on error spike (>5%)',
        'Automatic expiration enforced',
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

// ===========================================
// Feature Flag Check Middleware
// ===========================================

function checkExperimentsEnabled(req: Request, res: Response, next: Function) {
  const flags = getFeatureFlags();

  if (flags.EMERGENCY_DISABLE_ALL) {
    return res.status(503).json({
      error: 'Service disabled',
      reason: 'Emergency kill switch active',
      timestamp: new Date().toISOString(),
    });
  }

  if (!flags.EXPERIMENTS_ENABLED) {
    return res.status(503).json({
      error: 'Experiments disabled',
      reason: 'FF_EXPERIMENTS_ENABLED is false',
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

// ===========================================
// Active Experiments Endpoint
// ===========================================

/**
 * GET /api/experiments/active
 * Returns active experiments for user/market/corridor
 * READ-ONLY - No side effects
 */
router.get('/active', checkExperimentsEnabled, (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'anonymous';
  const market = req.query.market as string || 'MARKET_0';
  const corridor = req.query.corridor as string | undefined;

  const result = experimentsService.getActiveExperiments(userId, market, corridor);

  res.json({
    ...result,
    _meta: {
      endpoint: 'GET /api/experiments/active',
      readOnly: true,
      noSideEffects: true,
    },
  });
});

// ===========================================
// Health Endpoint
// ===========================================

/**
 * GET /api/experiments/health
 * Returns experiments system health
 * READ-ONLY
 */
router.get('/health', checkExperimentsEnabled, (_req: Request, res: Response) => {
  const health = experimentsService.getHealth();

  res.json({
    ...health,
    _meta: {
      endpoint: 'GET /api/experiments/health',
      readOnly: true,
    },
  });
});

// ===========================================
// Metrics Endpoint
// ===========================================

/**
 * GET /api/experiments/metrics
 * Returns aggregated experiment metrics
 * READ-ONLY - No individual user data
 */
router.get('/metrics', checkExperimentsEnabled, (req: Request, res: Response) => {
  const experimentId = req.query.experimentId as string | undefined;

  if (experimentId) {
    const metrics = experimentsService.getExperimentMetrics(experimentId);
    return res.json({
      metrics,
      _meta: {
        endpoint: 'GET /api/experiments/metrics',
        readOnly: true,
        aggregatedOnly: true,
      },
    });
  }

  const allMetrics = experimentsService.getAllMetrics();

  res.json({
    metrics: allMetrics,
    total: allMetrics.length,
    timestamp: new Date().toISOString(),
    _meta: {
      endpoint: 'GET /api/experiments/metrics',
      readOnly: true,
      aggregatedOnly: true,
    },
  });
});

// ===========================================
// Audit Log Endpoint (Debug Only)
// ===========================================

/**
 * GET /api/experiments/audit
 * Returns in-memory audit log
 * READ-ONLY - For debugging only
 */
router.get('/audit', checkExperimentsEnabled, (req: Request, res: Response) => {
  const experimentId = req.query.experimentId as string | undefined;
  const auditLog = experimentsService.getAuditLog(experimentId);

  res.json({
    auditLog,
    count: auditLog.length,
    timestamp: new Date().toISOString(),
    _meta: {
      endpoint: 'GET /api/experiments/audit',
      readOnly: true,
      inMemoryOnly: true,
      note: 'Audit log is in-memory and capped at 1000 entries',
    },
  });
});

// ===========================================
// Assignment Preview Endpoint
// ===========================================

/**
 * GET /api/experiments/assignment
 * Preview experiment assignment for a user
 * READ-ONLY - Does not record exposure
 */
router.get('/assignment', checkExperimentsEnabled, (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const experimentId = req.query.experimentId as string;

  if (!userId || !experimentId) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['userId', 'experimentId'],
    });
  }

  const result = experimentsService.getActiveExperiments(userId, 'MARKET_0');
  const assignment = result.userAssignments.find((a) => a.experimentId === experimentId);

  if (!assignment) {
    return res.status(404).json({
      error: 'Experiment not found or not active',
      experimentId,
    });
  }

  res.json({
    assignment,
    disclaimer: result.disclaimer,
    _meta: {
      endpoint: 'GET /api/experiments/assignment',
      readOnly: true,
      previewOnly: true,
      note: 'This is a preview - no exposure recorded',
    },
  });
});

export default router;
