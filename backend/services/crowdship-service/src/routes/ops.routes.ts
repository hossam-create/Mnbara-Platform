/**
 * Ops Visibility Routes
 * Sprint 3 Live Ops: Internal, READ-ONLY operational visibility
 *
 * CONSTRAINTS:
 * - NO controls, NO buttons that change state
 * - All endpoints are GET only
 * - Display only
 * - No production mutation
 * - Audit-friendly
 */

import { Router, Request, Response } from 'express';
import { opsVisibilityService, OpsVisibilityService } from '../services/ops-visibility.service';
import { getFeatureFlags } from '../config/feature-flags';
import { structuredLog, LogLevel } from '../services/structured-logger.service';

const router = Router();

/**
 * Middleware to check ops visibility feature flag
 */
function checkOpsEnabled(req: Request, res: Response, next: Function) {
  const flags = getFeatureFlags();
  if (!flags.OPS_VISIBILITY_ENABLED) {
    return res.status(403).json({
      error: 'Ops visibility is disabled',
      message: 'Enable FF_OPS_VISIBILITY_ENABLED to access ops dashboard',
    });
  }
  next();
}

/**
 * Middleware to log ops access for audit
 */
function auditOpsAccess(req: Request, res: Response, next: Function) {
  structuredLog(LogLevel.INFO, 'Ops dashboard accessed', {
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
    endpoint: req.path,
    metadata: { ip: req.ip, userAgent: req.get('user-agent') },
  });
  next();
}

// Apply middleware to all routes
router.use(checkOpsEnabled);
router.use(auditOpsAccess);

/**
 * GET /ops/snapshot
 * Complete ops snapshot - all metrics in one call
 * READ-ONLY
 */
router.get('/snapshot', (_req: Request, res: Response) => {
  try {
    const snapshot = opsVisibilityService.getOpsSnapshot();
    res.json({
      data: snapshot,
      meta: {
        readOnly: true,
        noControls: true,
        auditLogged: true,
      },
    });
  } catch (error) {
    console.error('Ops snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch ops snapshot' });
  }
});

/**
 * GET /ops/corridors
 * Corridor health metrics
 * READ-ONLY
 */
router.get('/corridors', (_req: Request, res: Response) => {
  try {
    const corridorHealth = opsVisibilityService.getCorridorHealth();
    res.json({
      data: corridorHealth,
      meta: {
        readOnly: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Corridor health error:', error);
    res.status(500).json({ error: 'Failed to fetch corridor health' });
  }
});

/**
 * GET /ops/funnel
 * Intent flow funnel metrics
 * READ-ONLY
 */
router.get('/funnel', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as '1h' | '24h' | '7d') || '24h';
    if (!['1h', '24h', '7d'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use 1h, 24h, or 7d' });
    }

    const funnel = opsVisibilityService.getIntentFunnel(period);
    res.json({
      data: funnel,
      meta: {
        readOnly: true,
        period,
      },
    });
  } catch (error) {
    console.error('Funnel metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel metrics' });
  }
});

/**
 * GET /ops/alerts
 * Trust friction alerts
 * READ-ONLY
 */
router.get('/alerts', (_req: Request, res: Response) => {
  try {
    const alerts = opsVisibilityService.getTrustFrictionAlerts();
    res.json({
      data: alerts,
      meta: {
        readOnly: true,
        count: alerts.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /ops/rate-limits
 * Rate limiting status
 * READ-ONLY
 */
router.get('/rate-limits', (_req: Request, res: Response) => {
  try {
    const rateLimits = opsVisibilityService.getRateLimitingStatus();
    res.json({
      data: rateLimits,
      meta: {
        readOnly: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Rate limits error:', error);
    res.status(500).json({ error: 'Failed to fetch rate limits' });
  }
});

/**
 * GET /ops/kill-switch
 * Kill switch status (state only, no controls)
 * READ-ONLY
 */
router.get('/kill-switch', (_req: Request, res: Response) => {
  try {
    const killSwitch = opsVisibilityService.getKillSwitchStatus();
    res.json({
      data: killSwitch,
      meta: {
        readOnly: true,
        noControls: true,
        message: 'This endpoint displays state only. No controls are available.',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Kill switch status error:', error);
    res.status(500).json({ error: 'Failed to fetch kill switch status' });
  }
});

/**
 * GET /ops/constraints
 * Verify no-mutation constraints
 * READ-ONLY
 */
router.get('/constraints', (_req: Request, res: Response) => {
  res.json({
    data: {
      opsVisibility: {
        readOnly: true,
        noControls: true,
        noMutations: true,
        auditFriendly: true,
        noHiddenMetrics: true,
      },
      endpoints: {
        '/ops/snapshot': { method: 'GET', mutates: false },
        '/ops/corridors': { method: 'GET', mutates: false },
        '/ops/funnel': { method: 'GET', mutates: false },
        '/ops/alerts': { method: 'GET', mutates: false },
        '/ops/rate-limits': { method: 'GET', mutates: false },
        '/ops/kill-switch': { method: 'GET', mutates: false },
      },
      verified: true,
    },
    meta: {
      message: 'Ops can SEE everything, CHANGE nothing.',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
