// ============================================================
// P2P Exchange API Client - Security & Trust Endpoints
// ============================================================

import { apiClient } from './base';
import type {
  SecurityDeposit,
  TrustLevel,
  ExternalEscrowProvider,
  AddDepositInput,
  ApiResponse,
} from '../../types/p2p-exchange.types';

// ============================================================
// SECURITY API
// ============================================================

export class SecurityAPI {
  /**
   * Get user's security deposit
   * GET /api/v1/exchange/security-deposit
   */
  static async getSecurityDeposit(): Promise<ApiResponse<SecurityDeposit>> {
    const response = await apiClient.get<ApiResponse<SecurityDeposit>>(
      '/security-deposit'
    );
    return response.data;
  }

  /**
   * Add to security deposit
   * POST /api/v1/exchange/security-deposit/add
   */
  static async addToSecurityDeposit(
    data: AddDepositInput
  ): Promise<ApiResponse<SecurityDeposit>> {
    const response = await apiClient.post<ApiResponse<SecurityDeposit>>(
      '/security-deposit/add',
      data
    );
    return response.data;
  }

  /**
   * Get user's trust level
   * GET /api/v1/exchange/trust-level
   */
  static async getTrustLevel(): Promise<ApiResponse<TrustLevel>> {
    const response = await apiClient.get<ApiResponse<TrustLevel>>(
      '/trust-level'
    );
    return response.data;
  }

  /**
   * Get available external escrow providers
   * GET /api/v1/exchange/external-escrow-providers
   */
  static async getExternalEscrowProviders(): Promise<
    ApiResponse<ExternalEscrowProvider[]>
  > {
    const response = await apiClient.get<ApiResponse<ExternalEscrowProvider[]>>(
      '/external-escrow-providers'
    );
    return response.data;
  }
}

export default SecurityAPI;
