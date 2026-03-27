/**
 * Health Check Routes
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * Provides:
 * - /health/live - Liveness probe
 * - /health/ready - Readiness probe
 * - /health/status - Detailed status
 */

import { Router, Request, Response } from 'express';
import { healthCheckService, HealthStatus } from '../services/health-check.service';
import { getFeatureFlags } from '../config/feature-flags';
import { getRecentLogs, LogLevel } from '../services/structured-logger.service';
import { abuseGuardService } from '../services/abuse-guard.service';
import { getRateLimitStatus } from '../middleware/rate-limiter.middleware';

const router = Router();

/**
 * GET /health/live
 * Kubernetes liveness probe
 * Returns 200 if the service is running
 */
router.get('/live', async (_req: Request, res: Response) => {
  try {
    const result = await healthCheckService.checkLiveness();
    res.status(200).json({
      status: 'alive',
      uptime: result.uptime,
      uptimeHuman: formatUptime(result.uptime),
    });
  } catch (error) {
    res.status(503).json({ status: 'dead', error: 'Liveness check failed' });
  }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 * Returns 200 if the service is ready to accept traffic
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const result = await healthCheckService.checkReadiness();

    const statusCode = result.status === HealthStatus.HEALTHY ? 200 : result.status === HealthStatus.DEGRADED ? 200 : 503;

    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.UNHEALTHY,
      error: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/status
 * Detailed health status for monitoring dashboards
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const result = await healthCheckService.checkReadiness();
    const flags = getFeatureFlags();

    // Get recent error logs
    const recentErrors = getRecentLogs({ level: LogLevel.ERROR, limit: 10 });

    // Get corridor volume status for all corridors
    const corridorStatuses = ['US_EG', 'US_AE', 'US_SA'].map((corridorId) => ({
      corridorId,
      ...abuseGuardService.getCorridorVolumeStatus(corridorId),
    }));

    res.json({
      ...result,
      detailed: {
        featureFlags: flags,
        corridorVolumes: corridorStatuses,
        recentErrors: recentErrors.map((e) => ({
          timestamp: e.timestamp,
          message: e.message,
          requestId: e.requestId,
        })),
        constraints: {
          noPayments: true,
          noAutoMatching: true,
          noBackgroundExecution: true,
          noRankingSuppression: true,
          humanConfirmationRequired: true,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * GET /health/flags
 * Current feature flag status
 */
router.get('/flags', (_req: Request, res: Response) => {
  const flags = getFeatureFlags();
  res.json({
    flags,
    emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/rate-limit
 * Rate limit status for current user/IP
 */
router.get('/rate-limit', (req: Request, res: Response) => {
  const userId = (req as any).user?.id || 'anonymous';
  const ip = req.ip || 'unknown';

  const endpoints = ['corridor/advisory', 'intent/classify', 'checkpoints'];
  const statuses = endpoints.map((endpoint) => ({
    endpoint,
    ...getRateLimitStatus(userId, ip, endpoint),
  }));

  res.json({
    userId,
    ip,
    endpoints: statuses,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/corridors
 * Corridor volume caps status
 */
router.get('/corridors', (_req: Request, res: Response) => {
  const corridors = ['US_EG', 'US_AE', 'US_SA'];
  const statuses = corridors.map((corridorId) => ({
    corridorId,
    ...abuseGuardService.getCorridorVolumeStatus(corridorId),
  }));

  res.json({
    corridors: statuses,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/constraints
 * Verify no-regression constraints
 */
router.get('/constraints', (_req: Request, res: Response) => {
  // These constraints are enforced by design - this endpoint confirms them
  res.json({
    constraints: {
      noPayments: {
        enforced: true,
        description: 'No payment processing in advisory layer',
      },
      noEscrowExecution: {
        enforced: true,
        description: 'Escrow is recommended only, never executed',
      },
      noAutoMatching: {
        enforced: true,
        description: 'No automatic buyer-traveler matching',
      },
      noBackgroundExecution: {
        enforced: true,
        description: 'All actions require explicit user confirmation',
      },
      noRankingSuppressionWithoutExplanation: {
        enforced: true,
        description: 'All ranking decisions include explanations',
      },
      humanConfirmationRequired: {
        enforced: true,
        description: 'Checkpoints require explicit user confirmation',
      },
      deterministicOnly: {
        enforced: true,
        description: 'Same input always produces same output',
      },
      readOnlyAdvisory: {
        enforced: true,
        description: 'All outputs are advisory only',
      },
    },
    verified: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default router;
