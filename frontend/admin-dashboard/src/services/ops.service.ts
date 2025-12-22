/**
 * Ops Visibility Service
 * Sprint 3 Live Ops: Frontend service for READ-ONLY ops API calls
 *
 * CONSTRAINTS:
 * - All endpoints are GET only
 * - No mutations
 * - Display only
 */

import { CorridorHealthMetrics } from '../components/ops/CorridorHealthPanel';
import { IntentFlowFunnel } from '../components/ops/IntentFunnelPanel';
import { TrustFrictionAlert } from '../components/ops/TrustFrictionAlertsPanel';
import { RateLimitingStatus } from '../components/ops/RateLimitingStatusPanel';
import { KillSwitchStatus } from '../components/ops/KillSwitchStatusPanel';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

interface ApiResponse<T> {
  data: T;
  meta: {
    readOnly: boolean;
    timestamp?: string;
    [key: string]: unknown;
  };
}

class OpsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/crowdship/ops`;
  }

  private async fetchWithAuth<T>(endpoint: string): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET', // READ-ONLY: All ops endpoints are GET only
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  /**
   * Get complete ops snapshot
   * READ-ONLY
   */
  async getSnapshot(): Promise<OpsSnapshot> {
    return this.fetchWithAuth<OpsSnapshot>('/snapshot');
  }

  /**
   * Get corridor health metrics
   * READ-ONLY
   */
  async getCorridorHealth(): Promise<CorridorHealthMetrics[]> {
    return this.fetchWithAuth<CorridorHealthMetrics[]>('/corridors');
  }

  /**
   * Get intent flow funnel
   * READ-ONLY
   */
  async getIntentFunnel(period: '1h' | '24h' | '7d' = '24h'): Promise<IntentFlowFunnel> {
    return this.fetchWithAuth<IntentFlowFunnel>(`/funnel?period=${period}`);
  }

  /**
   * Get trust friction alerts
   * READ-ONLY
   */
  async getTrustAlerts(): Promise<TrustFrictionAlert[]> {
    return this.fetchWithAuth<TrustFrictionAlert[]>('/alerts');
  }

  /**
   * Get rate limiting status
   * READ-ONLY
   */
  async getRateLimitingStatus(): Promise<RateLimitingStatus[]> {
    return this.fetchWithAuth<RateLimitingStatus[]>('/rate-limits');
  }

  /**
   * Get kill switch status (state only, no controls)
   * READ-ONLY
   */
  async getKillSwitchStatus(): Promise<KillSwitchStatus> {
    return this.fetchWithAuth<KillSwitchStatus>('/kill-switch');
  }

  /**
   * Get constraints verification
   * READ-ONLY
   */
  async getConstraints(): Promise<{
    opsVisibility: {
      readOnly: boolean;
      noControls: boolean;
      noMutations: boolean;
      auditFriendly: boolean;
      noHiddenMetrics: boolean;
    };
    endpoints: Record<string, { method: string; mutates: boolean }>;
    verified: boolean;
  }> {
    return this.fetchWithAuth('/constraints');
  }
}

export const opsService = new OpsService();
export default opsService;
