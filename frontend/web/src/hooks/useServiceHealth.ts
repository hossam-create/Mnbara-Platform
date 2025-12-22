/**
 * useServiceHealth Hook
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * Monitors service health and provides status for UI guardrails
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkServiceHealth,
  getRateLimitStatus,
  getCorridorVolumeStatus,
  isEmergencyMode,
  getFeatureFlags,
} from '../services/crowdship-ai.service';
import type { HealthCheckResult, RateLimitStatus, CorridorVolumeStatus } from '../services/crowdship-ai.service';

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'emergency' | 'unknown';

interface UseServiceHealthResult {
  // Status
  status: ServiceStatus;
  isLoading: boolean;
  error: string | null;

  // Health data
  healthCheck: HealthCheckResult | null;
  rateLimits: RateLimitStatus[];
  corridorVolumes: CorridorVolumeStatus[];

  // Warnings
  rateLimitWarning: string | null;
  corridorCapWarning: string | null;

  // Flags
  isEmergencyMode: boolean;
  flags: ReturnType<typeof getFeatureFlags>;

  // Actions
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30000; // 30 seconds

export function useServiceHealth(enablePolling = true): UseServiceHealthResult {
  const [status, setStatus] = useState<ServiceStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitStatus[]>([]);
  const [corridorVolumes, setCorridorVolumes] = useState<CorridorVolumeStatus[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const flags = getFeatureFlags();

  const fetchHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check emergency mode first
      const emergency = await isEmergencyMode();
      setEmergencyMode(emergency);

      if (emergency) {
        setStatus('emergency');
        setIsLoading(false);
        return;
      }

      // Fetch health check
      const health = await checkServiceHealth();
      setHealthCheck(health);

      if (health) {
        setStatus(health.status as ServiceStatus);
      } else {
        setStatus('unknown');
      }

      // Fetch rate limits
      const rateLimitData = await getRateLimitStatus();
      if (rateLimitData) {
        setRateLimits(rateLimitData.endpoints);
      }

      // Fetch corridor volumes
      const corridorData = await getCorridorVolumeStatus();
      if (corridorData) {
        setCorridorVolumes(corridorData.corridors);
      }
    } catch (err) {
      setError('Failed to fetch service health');
      setStatus('unknown');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Polling
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(fetchHealth, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enablePolling, fetchHealth]);

  // Calculate warnings
  const rateLimitWarning = rateLimits.find((rl) => {
    const percentUsed = ((rl.limit - rl.remaining) / rl.limit) * 100;
    return percentUsed >= 80;
  })
    ? 'Approaching rate limit on some endpoints'
    : null;

  const corridorCapWarning = corridorVolumes.find((cv) => cv.percentUsed >= 80)
    ? 'Some corridors are approaching daily volume caps'
    : null;

  return {
    status,
    isLoading,
    error,
    healthCheck,
    rateLimits,
    corridorVolumes,
    rateLimitWarning,
    corridorCapWarning,
    isEmergencyMode: emergencyMode,
    flags,
    refresh: fetchHealth,
  };
}

/**
 * Hook for monitoring a specific corridor's volume
 */
export function useCorridorVolume(corridorId: string): {
  volume: CorridorVolumeStatus | null;
  isApproachingCap: boolean;
  isAtCap: boolean;
  refresh: () => Promise<void>;
} {
  const [volume, setVolume] = useState<CorridorVolumeStatus | null>(null);

  const fetchVolume = useCallback(async () => {
    const data = await getCorridorVolumeStatus();
    if (data) {
      const corridorVolume = data.corridors.find((c) => c.corridorId === corridorId);
      setVolume(corridorVolume || null);
    }
  }, [corridorId]);

  useEffect(() => {
    fetchVolume();
  }, [fetchVolume]);

  return {
    volume,
    isApproachingCap: volume ? volume.percentUsed >= 80 : false,
    isAtCap: volume ? volume.percentUsed >= 100 : false,
    refresh: fetchVolume,
  };
}

export default useServiceHealth;
