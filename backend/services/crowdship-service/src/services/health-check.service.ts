/**
 * Health Check Service
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * Provides:
 * - Liveness probe (is the service running?)
 * - Readiness probe (is the service ready to accept traffic?)
 * - Graceful degradation when AI Core is unavailable
 */

import { getFeatureFlags } from '../config/feature-flags';
import { structuredLog, LogLevel } from './structured-logger.service';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  responseTimeMs?: number;
  message?: string;
  lastChecked: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  components: ComponentHealth[];
  flags: {
    aiCoreEnabled: boolean;
    corridorAdvisoryEnabled: boolean;
    emergencyDisabled: boolean;
  };
}

// Service start time
const SERVICE_START_TIME = Date.now();
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

// Component health cache
const componentHealthCache: Map<string, ComponentHealth> = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Health Check Service
 */
export class HealthCheckService {
  /**
   * Liveness probe - is the service running?
   * Returns true if the process is alive
   */
  async checkLiveness(): Promise<{ alive: boolean; uptime: number }> {
    return {
      alive: true,
      uptime: Date.now() - SERVICE_START_TIME,
    };
  }

  /**
   * Readiness probe - is the service ready to accept traffic?
   * Checks all critical dependencies
   */
  async checkReadiness(): Promise<HealthCheckResult> {
    const flags = getFeatureFlags();
    const components: ComponentHealth[] = [];

    // Check emergency kill switch
    if (flags.EMERGENCY_DISABLE_ALL) {
      return {
        status: HealthStatus.UNHEALTHY,
        version: SERVICE_VERSION,
        uptime: Date.now() - SERVICE_START_TIME,
        timestamp: new Date().toISOString(),
        components: [
          {
            name: 'emergency_switch',
            status: HealthStatus.UNHEALTHY,
            message: 'Emergency disable flag is active',
            lastChecked: new Date().toISOString(),
          },
        ],
        flags: {
          aiCoreEnabled: flags.AI_CORE_ENABLED,
          corridorAdvisoryEnabled: flags.CORRIDOR_AI_ADVISORY,
          emergencyDisabled: true,
        },
      };
    }

    // Check AI Core availability
    const aiCoreHealth = await this.checkAICore();
    components.push(aiCoreHealth);

    // Check feature flags service
    const flagsHealth = this.checkFeatureFlags();
    components.push(flagsHealth);

    // Check rate limiter
    const rateLimiterHealth = this.checkRateLimiter();
    components.push(rateLimiterHealth);

    // Determine overall status
    const hasUnhealthy = components.some((c) => c.status === HealthStatus.UNHEALTHY);
    const hasDegraded = components.some((c) => c.status === HealthStatus.DEGRADED);

    let overallStatus = HealthStatus.HEALTHY;
    if (hasUnhealthy) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (hasDegraded) {
      overallStatus = HealthStatus.DEGRADED;
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      version: SERVICE_VERSION,
      uptime: Date.now() - SERVICE_START_TIME,
      timestamp: new Date().toISOString(),
      components,
      flags: {
        aiCoreEnabled: flags.AI_CORE_ENABLED,
        corridorAdvisoryEnabled: flags.CORRIDOR_AI_ADVISORY,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
    };

    // Log health check result
    if (overallStatus !== HealthStatus.HEALTHY) {
      structuredLog(LogLevel.WARN, 'Health check degraded', {
        metadata: {
          status: overallStatus,
          unhealthyComponents: components.filter((c) => c.status !== HealthStatus.HEALTHY).map((c) => c.name),
        },
      });
    }

    return result;
  }

  /**
   * Check AI Core availability
   * Graceful degradation if unavailable
   */
  private async checkAICore(): Promise<ComponentHealth> {
    const cached = componentHealthCache.get('ai_core');
    if (cached && Date.now() - new Date(cached.lastChecked).getTime() < CACHE_TTL_MS) {
      return cached;
    }

    const flags = getFeatureFlags();
    const startTime = Date.now();

    // If AI Core is disabled, it's not unhealthy, just disabled
    if (!flags.AI_CORE_ENABLED) {
      const health: ComponentHealth = {
        name: 'ai_core',
        status: HealthStatus.HEALTHY,
        message: 'AI Core is disabled by feature flag',
        lastChecked: new Date().toISOString(),
      };
      componentHealthCache.set('ai_core', health);
      return health;
    }

    try {
      // In production, this would ping the AI Core service
      // For now, we simulate a health check
      const aiCoreUrl = process.env.AI_CORE_URL || 'http://localhost:3001';

      // Simulate health check (replace with actual HTTP call in production)
      const isAvailable = true; // await fetch(`${aiCoreUrl}/health`).then(r => r.ok).catch(() => false);

      const health: ComponentHealth = {
        name: 'ai_core',
        status: isAvailable ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        responseTimeMs: Date.now() - startTime,
        message: isAvailable ? 'AI Core is available' : 'AI Core is unavailable - operating in degraded mode',
        lastChecked: new Date().toISOString(),
      };

      componentHealthCache.set('ai_core', health);
      return health;
    } catch (error) {
      const health: ComponentHealth = {
        name: 'ai_core',
        status: HealthStatus.DEGRADED,
        responseTimeMs: Date.now() - startTime,
        message: 'AI Core health check failed - operating in degraded mode',
        lastChecked: new Date().toISOString(),
      };

      componentHealthCache.set('ai_core', health);
      return health;
    }
  }

  /**
   * Check feature flags service
   */
  private checkFeatureFlags(): ComponentHealth {
    try {
      const flags = getFeatureFlags();
      return {
        name: 'feature_flags',
        status: HealthStatus.HEALTHY,
        message: `Feature flags loaded (AI Core: ${flags.AI_CORE_ENABLED ? 'ON' : 'OFF'})`,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'feature_flags',
        status: HealthStatus.UNHEALTHY,
        message: 'Failed to load feature flags',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check rate limiter
   */
  private checkRateLimiter(): ComponentHealth {
    const flags = getFeatureFlags();
    return {
      name: 'rate_limiter',
      status: HealthStatus.HEALTHY,
      message: flags.RATE_LIMITING_ENABLED ? 'Rate limiting is active' : 'Rate limiting is disabled',
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Check if service should operate in degraded mode
   */
  isDegraded(): boolean {
    const flags = getFeatureFlags();
    if (flags.EMERGENCY_DISABLE_ALL) return true;

    const aiCoreHealth = componentHealthCache.get('ai_core');
    return aiCoreHealth?.status === HealthStatus.DEGRADED;
  }

  /**
   * Get degraded mode response
   */
  getDegradedResponse(): { message: string; advisory: boolean; degraded: boolean } {
    return {
      message: 'Service is operating in degraded mode. AI advisory features may be limited.',
      advisory: true,
      degraded: true,
    };
  }
}

export const healthCheckService = new HealthCheckService();
