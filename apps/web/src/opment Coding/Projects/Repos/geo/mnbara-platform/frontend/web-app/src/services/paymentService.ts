/**
 * Payment Service - PRODUCTION VERSION
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO financial authority
 * - ALL data comes from backend API
 * - NO mock data, NO fake amounts, NO assumptions
 * - Backend is the ONLY source of truth
 * - Payments UI is INTENT + STATUS ONLY
 */

import { apiService } from './api.service';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentProvider,
  EscrowStatus,
  PaymentState,
  WalletBalance,
  EscrowHold,
  WalletTransaction,
  PaymentProviderConfig,
  PaymentMethodConfig,
  OrderPaymentSummary,
  ControlCenterFinanceSummary,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getEscrowStatusLabel,
  getEscrowStatusColor,
  getProviderDisplayName,
  getMethodDisplayName
} from '../types/payment.types';

/**
 * Custom error for missing backend endpoints
 */
class BackendEndpointMissingError extends Error {
  constructor(endpoint: string) {
    super(`BACKEND_ENDPOINT_MISSING: ${endpoint} - Backend implementation required`);
    this.name = 'BackendEndpointMissingError';
  }
}

export const paymentService = {
  /**
   * Get wallet balance for current user
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v2/wallets/owner/USER/{userId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('GET /api/v2/wallets/owner/USER/{userId}');
      
      // When backend is ready, uncomment:
      // const response = await apiService.walletV2.getByOwner('USER', userId);
      // return response.data.data || null;
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return null - NEVER return mock data
        return null;
      }
      
      console.error('Failed to fetch wallet balance:', error);
      // Return null on error - NEVER return mock data
      return null;
    }
  },

  /**
   * Get payment state by ID
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getPaymentState(paymentId: string): Promise<PaymentState | null> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/payments/state/{paymentId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError(`GET /api/v1/payments/state/${paymentId}`);
      
      // When backend is ready, uncomment:
      // const response = await apiService.payment.getStatus(paymentId);
      // return response.data.data?.paymentState || null;
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return null - NEVER return mock data
        return null;
      }
      
      console.error('Failed to fetch payment state:', error);
      // Return null on error - NEVER return mock data
      return null;
    }
  },

  /**
   * Get escrow holds for user
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getEscrowHolds(userId: string): Promise<EscrowHold[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/escrow/user/{userId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError(`GET /api/v1/escrow/user/${userId}`);
      
      // When backend is ready, uncomment:
      // const response = await apiService.escrow.getUserEscrows(userId);
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch escrow holds:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get wallet transactions for user
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v2/wallets/{walletId}/ledger
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError(`GET /api/v2/wallets/{walletId}/ledger`);
      
      // When backend is ready, uncomment:
      // First get wallet by user
      // const walletResponse = await apiService.walletV2.getByOwner('USER', userId);
      // const walletId = walletResponse.data.data?.id;
      // if (!walletId) return [];
      // 
      // const response = await apiService.walletV2.listLedger(walletId, { limit });
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch wallet transactions:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get payment providers configuration
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getPaymentProviders(): Promise<PaymentProviderConfig[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/payments/escrow/providers
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('GET /api/payments/escrow/providers');
      
      // When backend is ready, uncomment:
      // const response = await apiService.payment.getProviders();
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch payment providers:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get payment methods configuration
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getPaymentMethods(): Promise<PaymentMethodConfig[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/payments/methods
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('GET /api/v1/payments/methods');
      
      // When backend is ready, uncomment:
      // const response = await apiService.get('/api/v1/payments/methods');
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch payment methods:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get order payment summary
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getOrderPaymentSummary(orderId: string): Promise<OrderPaymentSummary | null> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/payments/order/{orderId}/summary
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError(`GET /api/v1/payments/order/${orderId}/summary`);
      
      // When backend is ready, uncomment:
      // const response = await apiService.payment.getStatus(orderId);
      // return response.data.data || null;
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return null - NEVER return mock data
        return null;
      }
      
      console.error('Failed to fetch order payment summary:', error);
      // Return null on error - NEVER return mock data
      return null;
    }
  },

  /**
   * Get control center finance summary (read-only)
   * BACKEND AUTHORITY ONLY - NO MOCK DATA ALLOWED
   */
  async getControlCenterFinanceSummary(
    startDate: string,
    endDate: string
  ): Promise<ControlCenterFinanceSummary | null> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/payments/control-center/summary
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('GET /api/v1/payments/control-center/summary');
      
      // When backend is ready, uncomment:
      // const response = await apiService.get('/api/v1/payments/control-center/summary', {
      //   params: { startDate, endDate }
      // });
      // return response.data.data || null;
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return null - NEVER return mock data
        return null;
      }
      
      console.error('Failed to fetch control center finance summary:', error);
      // Return null on error - NEVER return mock data
      return null;
    }
  },

  // UI Helper Functions
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getEscrowStatusLabel,
  getEscrowStatusColor,
  getProviderDisplayName,
  getMethodDisplayName,

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Calculate payment fees
   */
  calculatePaymentFee(amount: number, methodConfig: PaymentMethodConfig): number {
    const { fees } = methodConfig.config || {};
    if (!fees) return 0;

    let totalFee = 0;
    if (fees.fixed) totalFee += fees.fixed;
    if (fees.percentage) totalFee += (amount * fees.percentage) / 100;

    return totalFee;
  },

  /**
   * Check if payment method is available for amount
   */
  isMethodAvailableForAmount(methodConfig: PaymentMethodConfig, amount: number): boolean {
    const { config } = methodConfig;
    if (!config) return true;

    if (config.minAmount && amount < config.minAmount) return false;
    if (config.maxAmount && amount > config.maxAmount) return false;

    return true;
  }
};

export default paymentService;
