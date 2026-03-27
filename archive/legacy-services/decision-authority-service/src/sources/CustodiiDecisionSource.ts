import axios, { AxiosInstance, AxiosError } from 'axios';
import { IDecisionSource, DecisionRequest, DecisionResponse, DecisionStatus, AssetType } from '../interfaces/IDecisionSource';
import config from '../config/config';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { RetryStrategy } from '../utils/RetryStrategy';

/**
 * CustodiiDecisionSource - External decision authority plugin
 * 
 * CRITICAL RULES (Phase 3.0 Design Gate):
 * - Custodii = Untrusted External Actor
 * - Never touch DB directly
 * - Translate requests/responses only
 * - Map status codes
 * - Validate all responses
 * - Fail gracefully
 * 
 * This is a PLUGIN, not a dependency.
 */

interface CustodiiDecisionRequest {
  asset_type: string;
  asset_id: string;
  metadata: Record<string, any>;
}

interface CustodiiDecisionResponse {
  decision_id: string;
  status: 'APPROVE' | 'DENY' | 'PENDING' | 'UNKNOWN';
  reference?: string;
  reason?: string;
  decided_at?: string;
  expires_at?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms?: number;
  error?: string;
}

export class CustodiiDecisionSource implements IDecisionSource {
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private circuitBreaker: CircuitBreaker;
  private retryStrategy: RetryStrategy;

  constructor() {
    this.baseUrl = config.custodiiApiUrl;
    this.apiKey = config.custodiiApiKey;
    this.timeout = config.decisionTimeoutMs;

    this.circuitBreaker = new CircuitBreaker('CustodiiDecisionSource', config.circuitBreaker);
    this.retryStrategy = new RetryStrategy('CustodiiDecisionSource', config.retry);

    // Create HTTP client with security defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mnbarh-DecisionAuthority/1.0'
      }
    });

    console.log('[CustodiiDecisionSource] Initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout
    });
  }

  /**
   * Request a decision from Custodii
   * 
   * Flow:
   * 1. Translate request to Custodii format
   * 2. Send HTTP request
   * 3. Validate response
   * 4. Map status to internal format
   * 5. Return normalized response
   */
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    return this.circuitBreaker.execute(async () => {
      return this.retryStrategy.execute(
        async () => {
          try {
            console.log('[CustodiiDecisionSource] Requesting decision', { request });

            const custodiiRequest: CustodiiDecisionRequest = {
              asset_type: this.mapAssetType(request.assetType),
              asset_id: request.assetId,
              metadata: request.metadata
            };

            const response = await this.client.post<CustodiiDecisionResponse>(
              '/api/v1/decisions',
              custodiiRequest
            );

            this.validateResponse(response.data);
            const decisionResponse = this.mapResponse(response.data);

            console.log('[CustodiiDecisionSource] Decision received', {
              decisionId: decisionResponse.decisionId,
              status: decisionResponse.status
            });

            return decisionResponse;
          } catch (error) {
            return this.handleError(error, 'requestDecision');
          }
        },
        (error) => this.isRetryableError(error)
      );
    });
  }

  /**
   * Get decision status from Custodii
   */
  async getDecision(decisionId: string): Promise<DecisionResponse> {
    return this.circuitBreaker.execute(async () => {
      return this.retryStrategy.execute(
        async () => {
          try {
            console.log('[CustodiiDecisionSource] Getting decision', { decisionId });

            const response = await this.client.get<CustodiiDecisionResponse>(
              `/api/v1/decisions/${decisionId}`
            );

            this.validateResponse(response.data);
            return this.mapResponse(response.data);

          } catch (error) {
            return this.handleError(error, 'getDecision');
          }
        },
        (error) => this.isRetryableError(error)
      );
    });
  }

  /**
   * Poll for decision status
   * 
   * Note: Polling is the source of truth, not webhooks
   */
  async pollDecision(decisionId: string): Promise<DecisionResponse> {
    return this.getDecision(decisionId);
  }

  /**
   * Cancel a pending decision
   */
  async cancelDecision(decisionId: string): Promise<void> {
    try {
      console.log('[CustodiiDecisionSource] Cancelling decision', { decisionId });

      await this.client.post(`/api/v1/decisions/${decisionId}/cancel`);

      console.log('[CustodiiDecisionSource] Decision cancelled', { decisionId });

    } catch (error) {
      console.error('[CustodiiDecisionSource] Cancel failed', {
        decisionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw - cancellation is best-effort
    }
  }

  /**
   * Health check for Custodii API
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();

    try {
      await this.client.get('/health', { timeout: 5000 });

      const latency = Date.now() - startTime;

      return {
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency_ms: latency
      };

    } catch (error) {
      return {
        status: 'down',
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getSourceName(): string {
    return 'CUSTODII';
  }

  // ============================================================================
  // PRIVATE METHODS - Translation & Validation
  // ============================================================================

  /**
   * Map internal asset type to Custodii format
   */
  private mapAssetType(assetType: AssetType): string {
    const mapping: Record<AssetType, string> = {
      [AssetType.LISTING]: 'listing',
      [AssetType.AUCTION]: 'auction',
      [AssetType.ESCROW_RELEASE]: 'escrow_release'
    };

    return mapping[assetType] || assetType.toLowerCase();
  }

  /**
   * Map Custodii response to internal format
   * 
   * CRITICAL: This is the boundary translation layer
   */
  private mapResponse(custodiiResponse: CustodiiDecisionResponse): DecisionResponse {
    return {
      decisionId: custodiiResponse.decision_id,
      status: this.mapStatus(custodiiResponse.status),
      decisionRef: custodiiResponse.reference,
      reason: custodiiResponse.reason,
      decidedAt: custodiiResponse.decided_at ? new Date(custodiiResponse.decided_at) : undefined,
      expiresAt: custodiiResponse.expires_at ? new Date(custodiiResponse.expires_at) : undefined
    };
  }

  /**
   * Map Custodii status to internal status
   * 
   * Mapping:
   * - APPROVE → APPROVED
   * - DENY → REJECTED
   * - PENDING → PENDING
   * - UNKNOWN → ERROR (audit)
   */
  private mapStatus(custodiiStatus: string): DecisionStatus {
    const mapping: Record<string, DecisionStatus> = {
      'APPROVE': DecisionStatus.APPROVED,
      'DENY': DecisionStatus.REJECTED,
      'PENDING': DecisionStatus.PENDING,
      'UNKNOWN': DecisionStatus.PENDING // Treat unknown as pending, will be audited
    };

    const status = mapping[custodiiStatus];

    if (!status) {
      console.error('[CustodiiDecisionSource] Unknown status from Custodii', {
        custodiiStatus
      });
      return DecisionStatus.PENDING; // Safe default
    }

    return status;
  }

  /**
   * Validate Custodii response structure
   * 
   * Security: Never trust external responses
   */
  private validateResponse(response: any): void {
    if (!response) {
      throw new Error('Empty response from Custodii');
    }

    if (!response.decision_id) {
      throw new Error('Missing decision_id in Custodii response');
    }

    if (!response.status) {
      throw new Error('Missing status in Custodii response');
    }

    // Validate status is one of expected values
    const validStatuses = ['APPROVE', 'DENY', 'PENDING', 'UNKNOWN'];
    if (!validStatuses.includes(response.status)) {
      console.warn('[CustodiiDecisionSource] Invalid status from Custodii', {
        status: response.status
      });
    }
  }

  /**
   * Handle errors from Custodii
   * 
   * CRITICAL: Fail gracefully, never crash the system
   */
  private handleError(error: unknown, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Log structured error
      console.error('[CustodiiDecisionSource] HTTP error', {
        operation,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        message: axiosError.message,
        code: axiosError.code
      });

      // Map to appropriate error
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        throw new Error(`Custodii timeout: ${operation}`);
      }

      if (axiosError.response?.status === 404) {
        throw new Error(`Decision not found in Custodii: ${operation}`);
      }

      if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new Error(`Custodii server error: ${operation}`);
      }

      throw new Error(`Custodii API error: ${axiosError.message}`);
    }

    // Unknown error
    console.error('[CustodiiDecisionSource] Unknown error', {
      operation,
      error: error instanceof Error ? error.message : 'Unknown'
    });

    throw new Error(`Custodii error: ${operation}`);
  }

  /**
   * Determine if an error is retryable
   * 
   * Retryable errors:
   * - Timeout (ECONNABORTED, ETIMEDOUT)
   * - Server errors (500+)
   * - Network errors (ECONNREFUSED, ENOTFOUND)
   * 
   * Non-retryable errors:
   * - Client errors (400, 404)
   * - Authentication errors (401, 403)
   */
  private isRetryableError(error: Error): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Timeout errors are retryable
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return true;
      }

      // Network errors are retryable
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        return true;
      }

      // Server errors (500+) are retryable
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return true;
      }

      // Client errors (400, 404, 401, 403) are NOT retryable
      if (axiosError.response?.status && axiosError.response.status < 500) {
        return false;
      }
    }

    // Unknown errors are not retryable by default
    return false;
  }
}
