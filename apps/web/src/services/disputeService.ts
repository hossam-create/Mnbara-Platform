import { apiService } from './api.service';

// Dispute API Types
export interface DisputeTimeline {
  step: string;
  date: string;
}

export interface DisputeMessage {
  sender: 'BUYER' | 'SELLER' | 'ADMIN';
  message: string;
  createdAt: string;
}

export interface DisputeResolution {
  decidedBy: 'ADMIN';
  outcome: 'HOLD' | 'RELEASE_SELLER' | 'REFUND_BUYER';
  note: string;
  decidedAt?: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'AUTO_RESOLVED';
  openedBy: 'BUYER' | 'SELLER';
  reason: string;
  createdAt: string;
  updatedAt?: string;
  timeline: DisputeTimeline[];
  messages: DisputeMessage[];
  resolution?: DisputeResolution;
}

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Dispute Service - Read-only API for dispute information
 */
export const disputeService = {
  /**
   * Get dispute by order ID from backend API
   */
  async getDisputeByOrderId(orderId: string): Promise<Dispute | null> {
    try {
      const response = await apiService.dispute.getById(orderId);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch dispute:', error);
      // Return null if no dispute exists or API fails
      return null;
    }
  },

  /**
   * Get user disputes from backend API
   */
  async getUserDisputes(userId: string, params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<Dispute[]> {
    try {
      const response = await apiService.dispute.getUserDisputes(userId, params);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch user disputes:', error);
      return [];
    }
  },

  /**
   * Open a new dispute via backend API
   */
  async openDispute(data: {
    escrowId: string
    initiatedBy: string
    initiatorRole: 'BUYER' | 'SELLER' | 'ADMIN'
    reason: string
    description: string
    evidence?: any[]
  }): Promise<Dispute | null> {
    try {
      const response = await apiService.dispute.openDispute(data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to open dispute:', error);
      return null;
    }
  },

  /**
   * Add message to dispute via backend API
   */
  async addMessage(disputeId: string, data: {
    senderId: string
    senderRole: 'BUYER' | 'SELLER' | 'ADMIN'
    message: string
    attachments?: any[]
    isInternal?: boolean
  }): Promise<any> {
    try {
      const response = await apiService.dispute.addMessage(disputeId, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  },

  /**
   * Add evidence to dispute via backend API
   */
  async addEvidence(disputeId: string, evidence: any[]): Promise<Dispute | null> {
    try {
      const response = await apiService.dispute.addEvidence(disputeId, evidence);
      return response.data.data;
    } catch (error) {
      console.error('Failed to add evidence:', error);
      return null;
    }
  },

  /**
   * Escalate dispute via backend API
   */
  async escalateDispute(disputeId: string, reason: string): Promise<Dispute | null> {
    try {
      const response = await apiService.dispute.escalateDispute(disputeId, reason);
      return response.data.data;
    } catch (error) {
      console.error('Failed to escalate dispute:', error);
      return null;
    }
  },

  /**
   * Get dispute status badge color
   */
  getStatusColor(status: Dispute['status']): string {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'AUTO_RESOLVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Get status label
   */
  getStatusLabel(status: Dispute['status']): string {
    switch (status) {
      case 'OPEN':
        return 'Dispute Opened';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'ESCALATED':
        return 'Escalated';
      case 'RESOLVED':
        return 'Resolved';
      case 'AUTO_RESOLVED':
        return 'Auto-resolved';
      default:
        return 'Unknown';
    }
  },

  /**
   * Get resolution outcome label
   */
  getResolutionOutcomeLabel(outcome: DisputeResolution['outcome']): string {
    switch (outcome) {
      case 'HOLD':
        return 'Funds on Hold';
      case 'RELEASE_SELLER':
        return 'Released to Seller';
      case 'REFUND_BUYER':
        return 'Refunded to Buyer';
      default:
        return 'Pending';
    }
  },

  /**
   * Get resolution outcome color
   */
  getResolutionOutcomeColor(outcome: DisputeResolution['outcome']): string {
    switch (outcome) {
      case 'HOLD':
        return 'bg-gray-100 text-gray-800';
      case 'RELEASE_SELLER':
        return 'bg-green-100 text-green-800';
      case 'REFUND_BUYER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Get timeline step icon
   */
  getTimelineStepIcon(step: string): string {
    switch (step) {
      case 'ORDER_PLACED':
        return '🛒';
      case 'PAYMENT_CONFIRMED':
        return '💳';
      case 'ORDER_SHIPPED':
        return '📦';
      case 'DELIVERED':
        return '✅';
      case 'DISPUTE_OPENED':
        return '⚠️';
      case 'UNDER_REVIEW':
        return '👁️';
      case 'ESCALATED':
        return '⬆️';
      case 'RESOLVED':
        return '⚖️';
      case 'AUTO_RESOLVED':
        return '🤖';
      default:
        return '📋';
    }
  },

  /**
   * Get timeline step label
   */
  getTimelineStepLabel(step: string): string {
    switch (step) {
      case 'ORDER_PLACED':
        return 'Order Placed';
      case 'PAYMENT_CONFIRMED':
        return 'Payment Confirmed';
      case 'ORDER_SHIPPED':
        return 'Order Shipped';
      case 'DELIVERED':
        return 'Delivered';
      case 'DISPUTE_OPENED':
        return 'Dispute Opened';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'ESCALATED':
        return 'Escalated';
      case 'RESOLVED':
        return 'Resolved';
      case 'AUTO_RESOLVED':
        return 'Auto-resolved';
      default:
        return step.replace(/_/g, ' ').charAt(0).toUpperCase() + step.replace(/_/g, ' ').slice(1).toLowerCase();
    }
  },

  /**
   * Get sender badge color
   */
  getSenderBadgeColor(sender: DisputeMessage['sender']): string {
    switch (sender) {
      case 'BUYER':
        return 'bg-blue-100 text-blue-800';
      case 'SELLER':
        return 'bg-green-100 text-green-800';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Format message date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Check if dispute is active (not resolved)
   */
  isDisputeActive(dispute: Dispute): boolean {
    return dispute.status !== 'RESOLVED';
  },

  /**
   * Check if funds are on hold
   */
  areFundsOnHold(dispute: Dispute): boolean {
    if (!dispute.resolution) return true;
    return dispute.resolution.outcome === 'HOLD';
  },

  /**
   * Get dispute duration in days
   */
  getDisputeDuration(dispute: Dispute): number {
    const start = new Date(dispute.createdAt);
    const end = dispute.resolution?.decidedAt ? new Date(dispute.resolution.decidedAt) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
};

export default disputeService;
