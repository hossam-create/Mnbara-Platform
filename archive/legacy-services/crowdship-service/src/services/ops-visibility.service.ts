/**
 * Ops Visibility Service
 * Sprint 3 Live Ops: Internal, READ-ONLY operational visibility
 *
 * CONSTRAINTS:
 * - NO controls, NO buttons that change state
 * - Display only
 * - No production mutation
 * - No hidden metrics
 * - Audit-friendly
 */

import { getFeatureFlags } from '../config/feature-flags';
import { abuseGuardService } from './abuse-guard.service';
import { getRecentLogs, LogLevel } from './structured-logger.service';
import { CorridorAdvisoryService } from './corridor-advisory.service';
import { AICoreIntegrationService } from './ai-core-integration.service';

// ===========================================
// Types
// ===========================================

export interface CorridorHealthMetrics {
  corridorId: string;
  corridorName: string;
  status: 'healthy' | 'degraded' | 'at_capacity' | 'disabled';
  volumeUSD: number;
  transactionCount: number;
  capacityPercent: number;
  avgRiskScore: number;
  avgTrustScore: number;
  recentErrors: number;
  lastActivityAt: string | null;
}

export interface IntentFlowFunnel {
  timestamp: string;
  period: '1h' | '24h' | '7d';
  stages: {
    intentClassified: number;
    corridorAssessed: number;
    trustGatingPassed: number;
    trustGatingFailed: number;
    recommendationGenerated: number;
    confirmationRequested: number;
    confirmationCompleted: number;
    confirmationDeclined: number;
  };
  conversionRates: {
    classifiedToAssessed: number;
    assessedToTrustPassed: number;
    trustPassedToRecommended: number;
    recommendedToConfirmed: number;
    overallConversion: number;
  };
}

export interface TrustFrictionAlert {
  id: string;
  type: 'HIGH_REJECTION_RATE' | 'TRUST_GAP' | 'REPEATED_FAILURES' | 'CORRIDOR_BOTTLENECK';
  severity: 'low' | 'medium' | 'high' | 'critical';
  corridor?: string;
  message: string;
  metric: number;
  threshold: number;
  detectedAt: string;
  affectedUsers: number;
}

export interface RateLimitingStatus {
  endpoint: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationPercent: number;
  throttledRequests: number;
  blockedRequests: number;
  avgResponseTimeMs: number;
}

export interface KillSwitchStatus {
  emergencyDisableAll: boolean;
  aiCoreEnabled: boolean;
  corridorAdvisoryEnabled: boolean;
  trustGatingEnabled: boolean;
  rateLimitingEnabled: boolean;
  abuseGuardsEnabled: boolean;
  lastModified: string | null;
  modifiedBy: string | null;
}

export interface OpsSnapshot {
  timestamp: string;
  corridorHealth: CorridorHealthMetrics[];
  intentFunnel: IntentFlowFunnel;
  trustAlerts: TrustFrictionAlert[];
  rateLimiting: RateLimitingStatus[];
  killSwitch: KillSwitchStatus;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
  };
}

// ===========================================
// In-memory metrics stores (production: use time-series DB)
// ===========================================

interface MetricEntry {
  timestamp: number;
  corridor?: string;
  intent?: string;
  stage: string;
  success: boolean;
  riskScore?: number;
  trustScore?: number;
}

const metricsStore: MetricEntry[] = [];
const MAX_METRICS = 10000;

// Track funnel stages
const funnelCounters: Record<string, number> = {
  intentClassified: 0,
  corridorAssessed: 0,
  trustGatingPassed: 0,
  trustGatingFailed: 0,
  recommendationGenerated: 0,
  confirmationRequested: 0,
  confirmationCompleted: 0,
  confirmationDeclined: 0,
};

// Track rate limiting
const rateLimitMetrics: Map<string, { throttled: number; blocked: number; totalRequests: number; totalResponseTime: number }> = new Map();

/**
 * Ops Visibility Service
 * READ-ONLY - No mutations allowed
 */
export class OpsVisibilityService {
  /**
   * Record a metric event (internal use only)
   */
  static recordMetric(entry: Omit<MetricEntry, 'timestamp'>): void {
    const flags = getFeatureFlags();
    if (!flags.OPS_VISIBILITY_ENABLED) return;

    metricsStore.push({ ...entry, timestamp: Date.now() });

    // Update funnel counters
    if (entry.stage in funnelCounters) {
      funnelCounters[entry.stage]++;
    }

    // Keep only recent metrics
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.splice(0, metricsStore.length - MAX_METRICS);
    }
  }

  /**
   * Record rate limit event
   */
  static recordRateLimitEvent(endpoint: string, throttled: boolean, blocked: boolean, responseTimeMs: number): void {
    const flags = getFeatureFlags();
    if (!flags.OPS_VISIBILITY_ENABLED) return;

    const existing = rateLimitMetrics.get(endpoint) || { throttled: 0, blocked: 0, totalRequests: 0, totalResponseTime: 0 };
    existing.totalRequests++;
    existing.totalResponseTime += responseTimeMs;
    if (throttled) existing.throttled++;
    if (blocked) existing.blocked++;
    rateLimitMetrics.set(endpoint, existing);
  }

  /**
   * Get corridor health metrics
   * READ-ONLY
   */
  getCorridorHealth(): CorridorHealthMetrics[] {
    const flags = getFeatureFlags();
    if (!flags.OPS_VISIBILITY_ENABLED) {
      return [];
    }

    const corridors = ['US_EG', 'US_AE', 'US_SA'];
    const corridorNames: Record<string, string> = {
      US_EG: 'United States → Egypt',
      US_AE: 'United States → UAE',
      US_SA: 'United States → Saudi Arabia',
    };

    return corridors.map((corridorId) => {
      const volumeStatus = abuseGuardService.getCorridorVolumeStatus(corridorId);
      const recentMetrics = metricsStore.filter((m) => m.corridor === corridorId && m.timestamp > Date.now() - 60 * 60 * 1000);

      const avgRiskScore = recentMetrics.filter((m) => m.riskScore !== undefined).reduce((sum, m) => sum + (m.riskScore || 0), 0) / Math.max(1, recentMetrics.length);

      const avgTrustScore = recentMetrics.filter((m) => m.trustScore !== undefined).reduce((sum, m) => sum + (m.trustScore || 0), 0) / Math.max(1, recentMetrics.length);

      const recentErrors = recentMetrics.filter((m) => !m.success).length;
      const lastActivity = recentMetrics.length > 0 ? new Date(Math.max(...recentMetrics.map((m) => m.timestamp))).toISOString() : null;

      let status: CorridorHealthMetrics['status'] = 'healthy';
      if (!flags.CORRIDOR_AI_ADVISORY) {
        status = 'disabled';
      } else if (volumeStatus.percentUsed >= 100) {
        status = 'at_capacity';
      } else if (volumeStatus.percentUsed >= 80 || recentErrors > 10) {
        status = 'degraded';
      }

      return {
        corridorId,
        corridorName: corridorNames[corridorId] || corridorId,
        status,
        volumeUSD: volumeStatus.volumeUSD,
        transactionCount: volumeStatus.transactionCount,
        capacityPercent: volumeStatus.percentUsed,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        avgTrustScore: Math.round(avgTrustScore * 10) / 10,
        recentErrors,
        lastActivityAt: lastActivity,
      };
    });
  }

  /**
   * Get intent flow funnel metrics
   * READ-ONLY
   */
  getIntentFunnel(period: '1h' | '24h' | '7d' = '24h'): IntentFlowFunnel {
    const flags = getFeatureFlags();
    if (!flags.OPS_VISIBILITY_ENABLED) {
      return this.emptyFunnel(period);
    }

    const periodMs = period === '1h' ? 60 * 60 * 1000 : period === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    const cutoff = Date.now() - periodMs;
    const periodMetrics = metricsStore.filter((m) => m.timestamp > cutoff);

    const stages = {
      intentClassified: periodMetrics.filter((m) => m.stage === 'intentClassified').length,
      corridorAssessed: periodMetrics.filter((m) => m.stage === 'corridorAssessed').length,
      trustGatingPassed: periodMetrics.filter((m) => m.stage === 'trustGatingPassed').length,
      trustGatingFailed: periodMetrics.filter((m) => m.stage === 'trustGatingFailed').length,
      recommendationGenerated: periodMetrics.filter((m) => m.stage === 'recommendationGenerated').length,
      confirmationRequested: periodMetrics.filter((m) => m.stage === 'confirmationRequested').length,
      confirmationCompleted: periodMetrics.filter((m) => m.stage === 'confirmationCompleted').length,
      confirmationDeclined: periodMetrics.filter((m) => m.stage === 'confirmationDeclined').length,
    };

    const safeDiv = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

    return {
      timestamp: new Date().toISOString(),
      period,
      stages,
      conversionRates: {
        classifiedToAssessed: safeDiv(stages.corridorAssessed, stages.intentClassified),
        assessedToTrustPassed: safeDiv(stages.trustGatingPassed, stages.corridorAssessed),
        trustPassedToRecommended: safeDiv(stages.recommendationGenerated, stages.trustGatingPassed),
        recommendedToConfirmed: safeDiv(stages.confirmationCompleted, stages.confirmationRequested),
        overallConversion: safeDiv(stages.confirmationCompleted, stages.intentClassified),
      },
    };
  }

  private emptyFunnel(period: '1h' | '24h' | '7d'): IntentFlowFunnel {
    return {
      timestamp: new Date().toISOString(),
      period,
      stages: {
        intentClassified: 0,
        corridorAssessed: 0,
        trustGatingPassed: 0,
        trustGatingFailed: 0,
        recommendationGenerated: 0,
        confirmationRequested: 0,
        confirmationCompleted: 0,
        confirmationDeclined: 0,
      },
      conversionRates: {
        classifiedToAssessed: 0,
        assessedToTrustPassed: 0,
        trustPassedToRecommended: 0,
        recommendedToConfirmed: 0,
        overallConversion: 0,
      },
    };
  }

  /**
   * Get trust friction alerts
   * READ-ONLY
   */
  getTrustFrictionAlerts(): TrustFrictionAlert[] {
    const flags = getFeatureFlags();
    if (!flags.OPS_VISIBILITY_ENABLED) {
      return [];
    }

    const alerts: TrustFrictionAlert[] = [];
    const now = new Date().toISOString();

    // Check trust gating rejection rate
    const recentMetrics = metricsStore.filter((m) => m.timestamp > Date.now() - 60 * 60 * 1000);
    const trustAttempts = recentMetrics.filter((m) => m.stage === 'trustGatingPassed' || m.stage === 'trustGatingFailed');
    const trustFailures = recentMetrics.filter((m) => m.stage === 'trustGatingFailed');

    if (trustAttempts.length > 10) {
      const rejectionRate = (trustFailures.length / trustAttempts.length) * 100;
      if (rejectionRate > 30) {
        alerts.push({
          id: `alert-rejection-${Date.now()}`,
          type: 'HIGH_REJECTION_RATE',
          severity: rejectionRate > 50 ? 'critical' : rejectionRate > 40 ? 'high' : 'medium',
          message: `Trust gating rejection rate is ${Math.round(rejectionRate)}% in the last hour`,
          metric: rejectionRate,
          threshold: 30,
          detectedAt: now,
          affectedUsers: trustFailures.length,
        });
      }
    }

    // Check corridor bottlenecks
    const corridorHealth = this.getCorridorHealth();
    for (const corridor of corridorHealth) {
      if (corridor.capacityPercent >= 90) {
        alerts.push({
          id: `alert-corridor-${corridor.corridorId}-${Date.now()}`,
          type: 'CORRIDOR_BOTTLENECK',
          severity: corridor.capacityPercent >= 100 ? 'critical' : 'high',
          corridor: corridor.corridorId,
          message: `${corridor.corridorName} is at ${corridor.capacityPercent}% capacity`,
          metric: corridor.capacityPercent,
          threshold: 90,
          detectedAt: now,
          affectedUsers: corridor.transactionCount,
        });
      }
    }

    // Check for repeated failures
    const errorLogs = getRecentLogs({ level: LogLevel.ERROR, limit: 100 });
    if (errorLogs.length > 20) {
      alerts.push({
        id: `alert-errors-${Date.now()}`,
        type: 'REPEATED_FAILURES',
        severity: errorLogs.length > 50 ? 'critical' : 'high',
        message: `${errorLogs.length} errors in the last hour`,
        metric: errorLogs.length,
        threshold: 20,
        detectedAt: now,
        affectedUsers: 0,
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get rate limiting status
   * READ-ONLY
   */
  getRateLimitingStatus(): RateLimitingStatus[] {
    const flags = getFeatureFlags();
    if (!flags.OPS_VISIBILITY_ENABLED) {
      return [];
    }

    const endpoints = ['corridor/advisory', 'intent/classify', 'checkpoints', 'default'];
    const limits: Record<string, number> = {
      'corridor/advisory': 30,
      'intent/classify': 60,
      checkpoints: 30,
      default: 100,
    };

    return endpoints.map((endpoint) => {
      const metrics = rateLimitMetrics.get(endpoint) || { throttled: 0, blocked: 0, totalRequests: 0, totalResponseTime: 0 };
      const maxCapacity = limits[endpoint] || 100;

      return {
        endpoint,
        currentLoad: metrics.totalRequests,
        maxCapacity,
        utilizationPercent: Math.min(100, Math.round((metrics.totalRequests / maxCapacity) * 100)),
        throttledRequests: metrics.throttled,
        blockedRequests: metrics.blocked,
        avgResponseTimeMs: metrics.totalRequests > 0 ? Math.round(metrics.totalResponseTime / metrics.totalRequests) : 0,
      };
    });
  }

  /**
   * Get kill switch status
   * READ-ONLY - State only, no controls
   */
  getKillSwitchStatus(): KillSwitchStatus {
    const flags = getFeatureFlags();

    return {
      emergencyDisableAll: flags.EMERGENCY_DISABLE_ALL,
      aiCoreEnabled: flags.AI_CORE_ENABLED,
      corridorAdvisoryEnabled: flags.CORRIDOR_AI_ADVISORY,
      trustGatingEnabled: flags.TRUST_GATING,
      rateLimitingEnabled: flags.RATE_LIMITING_ENABLED,
      abuseGuardsEnabled: flags.ABUSE_GUARDS_ENABLED,
      lastModified: null, // Would come from config management system
      modifiedBy: null,
    };
  }

  /**
   * Get complete ops snapshot
   * READ-ONLY
   */
  getOpsSnapshot(): OpsSnapshot {
    const flags = getFeatureFlags();

    return {
      timestamp: new Date().toISOString(),
      corridorHealth: this.getCorridorHealth(),
      intentFunnel: this.getIntentFunnel('24h'),
      trustAlerts: this.getTrustFrictionAlerts(),
      rateLimiting: this.getRateLimitingStatus(),
      killSwitch: this.getKillSwitchStatus(),
      systemHealth: {
        status: flags.EMERGENCY_DISABLE_ALL ? 'unhealthy' : 'healthy',
        uptime: process.uptime() * 1000,
        version: process.env.SERVICE_VERSION || '1.0.0',
      },
    };
  }

  /**
   * Reset metrics (for testing only)
   */
  static resetMetrics(): void {
    metricsStore.length = 0;
    rateLimitMetrics.clear();
    Object.keys(funnelCounters).forEach((key) => {
      funnelCounters[key] = 0;
    });
  }
}

export const opsVisibilityService = new OpsVisibilityService();
