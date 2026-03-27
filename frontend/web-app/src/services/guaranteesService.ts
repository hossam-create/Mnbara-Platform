import { apiService } from './api.service';

// Frontend Guarantees API Types
export interface EscrowConfig {
  enabled: boolean;
  holdPercentage: number;
  releaseCondition: 'DELIVERED' | 'CONFIRMED' | 'TIMEOUT';
  autoReleaseAfterDays: number;
  disputeWindowDays: number;
}

export interface GuaranteePolicy {
  title: string;
  description: string;
}

export interface GuaranteesSummary {
  escrow: EscrowConfig;
  policies: GuaranteePolicy[];
}

/**
 * Frontend Guarantees Service - Read-only API for displaying guarantee information
 */
export const guaranteesService = {
  /**
   * Get guarantees summary for display in UI from backend API
   */
  async getGuaranteesSummary(): Promise<GuaranteesSummary> {
    try {
      const response = await apiService.get<GuaranteesSummary>('/api/v1/guarantees/summary');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch guarantees summary:', error);
      // Return default fallback data to prevent UI breaking
      return {
        escrow: {
          enabled: false,
          holdPercentage: 0,
          releaseCondition: 'DELIVERED',
          autoReleaseAfterDays: 0,
          disputeWindowDays: 0
        },
        policies: []
      };
    }
  },

  /**
   * Get active escrow rules for specific transaction type
   */
  async getActiveEscrowRules(type: 'TRAVEL' | 'PASTE_LINK' | 'AUCTION'): Promise<EscrowConfig | null> {
    try {
      const response = await axios.get<EscrowConfig[]>(
        `${API_BASE_URL}/api/v1/guarantees/escrow-rules/active?type=${type}`
      );
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Failed to fetch escrow rules:', error);
      return null;
    }
  },

  /**
   * Get active policies for user type
   */
  async getActivePolicies(userType: 'BUYER' | 'SELLER'): Promise<GuaranteePolicy[]> {
    try {
      const response = await axios.get<GuaranteePolicy[]>(
        `${API_BASE_URL}/api/v1/guarantees/policies/active?userType=${userType}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch guarantee policies:', error);
      return [];
    }
  },

  /**
   * Get dispute reasons for order status
   */
  async getDisputeReasons(orderStatus: string): Promise<Array<{ reason: string; resolutionType: string }>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/guarantees/dispute-reasons?orderStatus=${orderStatus}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dispute reasons:', error);
      return [];
    }
  },

  /**
   * Check if guarantees are enabled for the platform
   */
  async isGuaranteesEnabled(): Promise<boolean> {
    try {
      const summary = await this.getGuaranteesSummary();
      return summary.escrow.enabled && summary.policies.length > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get formatted guarantee text for display
   */
  getGuaranteeText(escrow: EscrowConfig): string {
    if (!escrow.enabled) {
      return 'Standard purchase protection';
    }

    const parts = [];
    if (escrow.holdPercentage === 100) {
      parts.push('100% payment held in escrow');
    } else {
      parts.push(`${escrow.holdPercentage}% payment held in escrow`);
    }

    if (escrow.disputeWindowDays > 0) {
      parts.push(`${escrow.disputeWindowDays}-day dispute window`);
    }

    return parts.join(' • ');
  },

  /**
   * Get release condition text
   */
  getReleaseConditionText(condition: EscrowConfig['releaseCondition']): string {
    switch (condition) {
      case 'DELIVERED':
        return 'Released only after delivery confirmation';
      case 'CONFIRMED':
        return 'Released after buyer confirmation';
      case 'TIMEOUT':
        return 'Released automatically after specified time';
      default:
        return 'Released according to platform terms';
    }
  }
};

export default guaranteesService;
