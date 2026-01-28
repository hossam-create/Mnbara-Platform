import { BaseAPI } from './base';
import type {
  ExchangeRequest,
  ExchangeMatch,
  ProofOfPayment,
  VerificationStatus,
} from '../../types/p2p-exchange.types';

interface AdminStatistics {
  totalRequests: number;
  activeMatches: number;
  pendingProofs: number;
  completedToday: number;
  totalVolume: number;
  averageMatchTime: number;
}

interface VerifyProofRequest {
  status: VerificationStatus;
  reason?: string;
  notes?: string;
}

class AdminExchangeAPI extends BaseAPI {
  /**
   * Get exchange statistics
   */
  async getStatistics(
    timeRange: 'today' | 'week' | 'month' = 'today'
  ): Promise<AdminStatistics> {
    return this.get<AdminStatistics>(`/admin/exchange/statistics?range=${timeRange}`);
  }

  /**
   * Get recent exchange requests
   */
  async getRecentRequests(limit: number = 10): Promise<ExchangeRequest[]> {
    return this.get<ExchangeRequest[]>(`/admin/exchange/requests?limit=${limit}`);
  }

  /**
   * Get all active matches
   */
  async getActiveMatches(): Promise<ExchangeMatch[]> {
    return this.get<ExchangeMatch[]>('/admin/exchange/matches/active');
  }

  /**
   * Get pending proofs for verification
   */
  async getPendingProofs(): Promise<ProofOfPayment[]> {
    return this.get<ProofOfPayment[]>('/admin/exchange/proofs/pending');
  }

  /**
   * Verify a proof of payment
   */
  async verifyProof(proofId: string, data: VerifyProofRequest): Promise<ProofOfPayment> {
    return this.post<ProofOfPayment>(`/admin/exchange/proofs/${proofId}/verify`, data);
  }

  /**
   * Get all exchange requests with filters
   */
  async getAllRequests(params?: {
    status?: string;
    fromCurrency?: string;
    toCurrency?: string;
    page?: number;
    limit?: number;
  }): Promise<{ requests: ExchangeRequest[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.fromCurrency) queryParams.append('fromCurrency', params.fromCurrency);
    if (params?.toCurrency) queryParams.append('toCurrency', params.toCurrency);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.get<{ requests: ExchangeRequest[]; total: number }>(
      `/admin/exchange/requests?${queryParams.toString()}`
    );
  }

  /**
   * Get match details
   */
  async getMatchDetails(matchId: string): Promise<ExchangeMatch> {
    return this.get<ExchangeMatch>(`/admin/exchange/matches/${matchId}`);
  }

  /**
   * Retry failed settlement
   */
  async retrySettlement(settlementId: string): Promise<void> {
    return this.post<void>(`/admin/exchange/settlements/${settlementId}/retry`, {});
  }

  /**
   * Freeze user's security deposit
   */
  async freezeSecurityDeposit(
    userId: string,
    reason: string
  ): Promise<void> {
    return this.post<void>(`/admin/exchange/security-deposit/${userId}/freeze`, {
      reason,
    });
  }

  /**
   * Unfreeze user's security deposit
   */
  async unfreezeSecurityDeposit(userId: string): Promise<void> {
    return this.post<void>(`/admin/exchange/security-deposit/${userId}/unfreeze`, {});
  }

  /**
   * Deduct from security deposit
   */
  async deductSecurityDeposit(
    userId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    return this.post<void>(`/admin/exchange/security-deposit/${userId}/deduct`, {
      amount,
      reason,
    });
  }

  /**
   * Get flagged messages
   */
  async getFlaggedMessages(): Promise<any[]> {
    return this.get<any[]>('/admin/exchange/messages/flagged');
  }

  /**
   * Cancel a match (admin override)
   */
  async cancelMatch(matchId: string, reason: string): Promise<void> {
    return this.post<void>(`/admin/exchange/matches/${matchId}/cancel`, { reason });
  }

  /**
   * Get user exchange history
   */
  async getUserExchangeHistory(userId: string): Promise<{
    requests: ExchangeRequest[];
    matches: ExchangeMatch[];
    totalVolume: number;
    successRate: number;
  }> {
    return this.get<{
      requests: ExchangeRequest[];
      matches: ExchangeMatch[];
      totalVolume: number;
      successRate: number;
    }>(`/admin/exchange/users/${userId}/history`);
  }
}

export const adminExchangeApi = new AdminExchangeAPI();
