/**
 * Trust & Reputation Routes
 * ADVISORY ONLY - No Score Mutation
 *
 * HARD RULES:
 * - No enforcement
 * - No auto-ranking
 * - No hidden penalties
 * - Deterministic only
 * - Read-only snapshots
 * - All signals visible
 */

import { Router, Request, Response } from 'express';
import { trustReputationService } from '../services/trust-reputation.service';
import { getFeatureFlags } from '../config/feature-flags';

const router = Router();

// ===========================================
// Middleware: Feature Flag Check
// ===========================================

function checkFeatureEnabled(req: Request, res: Response, next: Function): void {
  const flags = getFeatureFlags();

  if (flags.EMERGENCY_DISABLE_ALL) {
    res.status(503).json({
      error: 'Service temporarily disabled',
      code: 'EMERGENCY_DISABLED',
      advisory: true,
    });
    return;
  }

  if (!flags.TRUST_REPUTATION_ENABLED) {
    res.status(503).json({
      error: 'Trust & Reputation advisory is not enabled',
      code: 'FEATURE_DISABLED',
      advisory: true,
    });
    return;
  }

  next();
}

// ===========================================
// GET /api/trust/reputation/:userId
// Get reputation snapshot for a user
// ===========================================

router.get('/reputation/:userId', checkFeatureEnabled, (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestId = req.headers['x-request-id'] as string;

    if (!userId) {
      res.status(400).json({
        error: 'userId is required',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    const snapshot = trustReputationService.getReputationSnapshot(userId, requestId);

    if (!snapshot) {
      res.status(503).json({
        error: 'Trust service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        advisory: true,
      });
      return;
    }

    res.json({
      success: true,
      data: snapshot,
      advisory: true,
      disclaimer: 'This is advisory information only. No enforcement or auto-ranking applied.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/trust/reputation/history
// Get trust history for a user
// ===========================================

router.get('/history', checkFeatureEnabled, (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const days = parseInt(req.query.days as string) || 30;
    const requestId = req.headers['x-request-id'] as string;

    if (!userId) {
      res.status(400).json({
        error: 'userId query parameter is required',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    if (days < 1 || days > 90) {
      res.status(400).json({
        error: 'days must be between 1 and 90',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    const history = trustReputationService.getTrustHistory(userId, days, requestId);

    if (!history) {
      res.status(503).json({
        error: 'Trust service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        advisory: true,
      });
      return;
    }

    res.json({
      success: true,
      data: history,
      advisory: true,
      disclaimer: 'Historical snapshots are read-only. No score mutation occurs.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/trust/portability
// Check cross-market trust portability
// ===========================================

router.get('/portability', checkFeatureEnabled, (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const sourceMarket = req.query.sourceMarket as string;
    const targetMarketsParam = req.query.targetMarkets as string;
    const requestId = req.headers['x-request-id'] as string;

    if (!userId || !sourceMarket || !targetMarketsParam) {
      res.status(400).json({
        error: 'userId, sourceMarket, and targetMarkets are required',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    const targetMarkets = targetMarketsParam.split(',').map((m) => m.trim());

    if (targetMarkets.length === 0 || targetMarkets.length > 5) {
      res.status(400).json({
        error: 'targetMarkets must contain 1-5 markets',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    const portability = trustReputationService.checkPortability(
      userId,
      sourceMarket,
      targetMarkets,
      requestId
    );

    if (!portability) {
      res.status(503).json({
        error: 'Trust service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        advisory: true,
      });
      return;
    }

    res.json({
      success: true,
      data: portability,
      advisory: true,
      disclaimer: 'Portability check is advisory only. No automatic trust transfer occurs.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/trust/health
// Service health check
// ===========================================

router.get('/health', (req: Request, res: Response) => {
  try {
    const health = trustReputationService.getHealth();

    res.json({
      success: true,
      data: health,
      advisory: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/trust/constraints
// Get service constraints and rules
// ===========================================

router.get('/constraints', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      hardRules: {
        noEnforcement: true,
        noAutoRanking: true,
        noHiddenPenalties: true,
        deterministicOnly: true,
        readOnlySnapshots: true,
        allSignalsVisible: true,
      },
      capabilities: {
        reputationSnapshots: 'Read-only trust score snapshots',
        trustHistory: 'Time-based historical snapshots (up to 90 days)',
        crossMarketPortability: 'Advisory portability checks between markets',
        decayIndicators: 'Visible trust decay warnings',
        explanations: 'Explainable trust signals with factors',
      },
      limitations: {
        noScoreMutation: 'Trust scores cannot be modified through this API',
        noRankingChanges: 'User rankings are not affected',
        noPenalties: 'No penalties are applied automatically',
        noEnforcementActions: 'No enforcement actions are triggered',
      },
      auditLogging: {
        enabled: true,
        logged: ['snapshotId', 'userId', 'action', 'timestamp'],
        notLogged: ['raw scores', 'internal calculations'],
      },
    },
    advisory: true,
    disclaimer: 'This service provides advisory information only.',
  });
});

export default router;
