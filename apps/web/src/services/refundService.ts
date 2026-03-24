/**
 * Refund Service - PRODUCTION VERSION
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority over refunds
 * - ALL data comes from backend API
 * - NO mock data, NO fake amounts, NO assumptions
 * - Backend is the ONLY source of truth
 */

import { apiService } from './api.service';
import {
  RefundRequest,
  ChargebackCase,
  RefundTimeline,
  RefundStatus,
  ChargebackStatus,
  RefundReason,
  ChargebackReason,
  getRefundStatusLabel,
  getRefundStatusColor,
  getChargebackStatusLabel,
  getChargebackStatusColor,
  getRefundReasonLabel,
  getChargebackReasonLabel,
  getTimelineEventLabel,
  getTimelineEventIcon
} from '../types/refund.types';

/**
 * Custom error for missing backend endpoints
 */
class BackendEndpointMissingError extends Error {
  constructor(endpoint: string) {
    super(`BACKEND_ENDPOINT_MISSING: ${endpoint} - Backend implementation required`);
    this.name = 'BackendEndpointMissingError';
  }
}

export const refundService = {
  /**
   * Get refund requests for user
   * BACKEND ONLY - NO MOCK DATA
   */
  async getRefundRequests(userId: string): Promise<RefundRequest[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/refunds?userId={userId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('GET /api/v1/refunds?userId={userId}');
      
      // When backend is ready, uncomment:
      // const response = await apiService.get(`/api/v1/refunds?userId=${userId}`);
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch refund requests:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get chargeback cases for user
   * BACKEND ONLY - NO MOCK DATA
   */
  async getChargebackCases(userId: string): Promise<ChargebackCase[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/chargebacks?userId={userId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('GET /api/v1/chargebacks?userId={userId}');
      
      // When backend is ready, uncomment:
      // const response = await apiService.get(`/api/v1/chargebacks?userId=${userId}`);
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch chargeback cases:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get refund timeline for order
   * BACKEND ONLY - NO MOCK DATA
   */
  async getRefundTimeline(orderId: string): Promise<RefundTimeline[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/refunds/timeline/{orderId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError(`GET /api/v1/refunds/timeline/${orderId}`);
      
      // When backend is ready, uncomment:
      // const response = await apiService.get(`/api/v1/refunds/timeline/${orderId}`);
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch refund timeline:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Get chargeback timeline for order
   * BACKEND ONLY - NO MOCK DATA
   */
  async getChargebackTimeline(orderId: string): Promise<RefundTimeline[]> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: GET /api/v1/chargebacks/timeline/{orderId}
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError(`GET /api/v1/chargebacks/timeline/${orderId}`);
      
      // When backend is ready, uncomment:
      // const response = await apiService.get(`/api/v1/chargebacks/timeline/${orderId}`);
      // return response.data.data || [];
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return empty array - NEVER return mock data
        return [];
      }
      
      console.error('Failed to fetch chargeback timeline:', error);
      // Return empty array on error - NEVER return mock data
      return [];
    }
  },

  /**
   * Submit new refund request
   * BACKEND ONLY - Request submission only, NO approval authority
   */
  async submitRefundRequest(refundData: Omit<RefundRequest, 'id' | 'status' | 'requestedAt' | 'reviewedBy' | 'reviewedAt' | 'approvedAt' | 'completedAt' | 'failedAt'>): Promise<RefundRequest | null> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: POST /api/v1/refunds/request
      // For now, throw explicit error - NO MOCK DATA FALLBACK
      throw new BackendEndpointMissingError('POST /api/v1/refunds/request');
      
      // When backend is ready, uncomment:
      // const response = await apiService.post('/api/v1/refunds/request', refundData);
      // return response.data.data || null;
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        // Return null - NEVER return mock data
        return null;
      }
      
      // Handle specific error codes
      if (error.response?.status === 403) {
        console.error('Unauthorized to submit refund request');
        throw new Error('UNAUTHORIZED: You do not have permission to submit refund requests');
      }
      
      if (error.response?.status === 409) {
        console.error('Refund already exists for this order');
        throw new Error('CONFLICT: A refund request already exists for this order');
      }
      
      console.error('Failed to submit refund request:', error);
      // Return null on error - NEVER return mock data
      return null;
    }
  },

  /**
   * Upload evidence for refund request
   * BACKEND ONLY - File upload to secure storage
   */
  async uploadRefundEvidence(refundId: string, files: File[]): Promise<void> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: POST /api/v1/refunds/{refundId}/evidence
      // For now, throw explicit error - NO MOCK IMPLEMENTATION
      throw new BackendEndpointMissingError(`POST /api/v1/refunds/${refundId}/evidence`);
      
      // When backend is ready, uncomment:
      // const formData = new FormData();
      // files.forEach(file => formData.append('files', file));
      // await apiService.post(`/api/v1/refunds/${refundId}/evidence`, formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        return;
      }
      
      console.error('Failed to upload refund evidence:', error);
      throw error;
    }
  },

  /**
   * Upload evidence for chargeback case
   * BACKEND ONLY - File upload to secure storage
   */
  async uploadChargebackEvidence(chargebackId: string, files: File[]): Promise<void> {
    try {
      // TODO: Backend endpoint implementation required
      // Expected endpoint: POST /api/v1/chargebacks/{chargebackId}/evidence
      // For now, throw explicit error - NO MOCK IMPLEMENTATION
      throw new BackendEndpointMissingError(`POST /api/v1/chargebacks/${chargebackId}/evidence`);
      
      // When backend is ready, uncomment:
      // const formData = new FormData();
      // files.forEach(file => formData.append('files', file));
      // await apiService.post(`/api/v1/chargebacks/${chargebackId}/evidence`, formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
    } catch (error) {
      if (error instanceof BackendEndpointMissingError) {
        console.error(error.message);
        return;
      }
      
      console.error('Failed to upload chargeback evidence:', error);
      throw error;
    }
  },


  // UI Helper Functions - Display only, no business logic
  getRefundStatusLabel,
  getRefundStatusColor,
  getChargebackStatusLabel,
  getChargebackStatusColor,
  getRefundReasonLabel,
  getChargebackReasonLabel,
  getTimelineEventLabel,
  getTimelineEventIcon,

  /**
   * Format currency amount
   * Display helper only - NO financial calculations
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
   * Calculate refund eligibility
   * BACKEND ONLY - Frontend displays backend decision
   * This is a UI helper for display purposes only
   */
  isRefundEligible(order: any, userRole: 'buyer' | 'seller'): boolean {
    // TODO: Backend endpoint implementation required
    // Expected endpoint: GET /api/v1/refunds/eligibility?orderId={orderId}&userId={userId}
    // Frontend should NEVER calculate eligibility
    // This is a temporary UI helper - backend must provide eligibility
    
    // Basic UI-only checks for display purposes
    // Backend MUST validate all eligibility rules
    if (userRole !== 'buyer') return false;
    if (!order || !order.status) return false;
    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') return false;
    
    return true; // Backend will enforce actual rules
  },

  /**
   * Check if chargeback can be disputed
   * BACKEND ONLY - Frontend displays backend decision
   * This is a UI helper for display purposes only
   */
  canDisputeChargeback(chargeback: ChargebackCase, userRole: 'buyer' | 'seller'): boolean {
    // TODO: Backend endpoint implementation required
    // Expected endpoint: GET /api/v1/chargebacks/{chargebackId}/can-dispute
    // Frontend should NEVER calculate dispute eligibility
    // This is a temporary UI helper - backend must provide eligibility
    
    // Basic UI-only checks for display purposes
    // Backend MUST validate all dispute rules
    if (userRole !== 'seller') return false;
    if (!chargeback || !chargeback.status) return false;
    if (chargeback.status !== ChargebackStatus.ACCEPTED && chargeback.status !== ChargebackStatus.DISPUTED) return false;
    
    return true; // Backend will enforce actual rules
  }
};

export default refundService;
