import axios from 'axios';

// Financial Guarantees API Types
export interface EscrowRule {
  id: string;
  name: string;
  type: 'TRAVEL' | 'PASTE_LINK' | 'AUCTION';
  holdPercentage: number;
  releaseCondition: 'DELIVERED' | 'CONFIRMED' | 'TIMEOUT';
  autoReleaseAfterDays: number;
  disputeWindowDays: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEscrowRuleData {
  name: string;
  type: 'TRAVEL' | 'PASTE_LINK' | 'AUCTION';
  holdPercentage: number;
  releaseCondition: 'DELIVERED' | 'CONFIRMED' | 'TIMEOUT';
  autoReleaseAfterDays: number;
  disputeWindowDays: number;
  enabled?: boolean;
}

export interface UpdateEscrowRuleData extends Partial<CreateEscrowRuleData> {}

export interface DisputeRule {
  id: string;
  reason: string;
  allowedAfterStatus: string;
  resolutionType: 'REFUND' | 'PARTIAL' | 'MANUAL';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeRuleData {
  reason: string;
  allowedAfterStatus: string;
  resolutionType: 'REFUND' | 'PARTIAL' | 'MANUAL';
  enabled?: boolean;
}

export interface UpdateDisputeRuleData extends Partial<CreateDisputeRuleData> {}

export interface GuaranteePolicy {
  id: string;
  title: string;
  description: string;
  appliesTo: 'BUYER' | 'SELLER';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuaranteePolicyData {
  title: string;
  description: string;
  appliesTo: 'BUYER' | 'SELLER';
  enabled?: boolean;
}

export interface UpdateGuaranteePolicyData extends Partial<CreateGuaranteePolicyData> {}

export interface GuaranteesSummary {
  escrowRules: EscrowRule[];
  disputeRules: DisputeRule[];
  policies: GuaranteePolicy[];
  activeEscrowRules: number;
  activeDisputeRules: number;
  activePolicies: number;
}

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Financial Guarantees Service - Manages escrow, disputes, and protection policies
 */
export const financialGuaranteesService = {
  // ============ ESCROW RULES ============

  /**
   * Get all escrow rules
   */
  async getEscrowRules(): Promise<EscrowRule[]> {
    const response = await axios.get<EscrowRule[]>(`${API_BASE_URL}/admin/guarantees/escrow-rules`);
    return response.data;
  },

  /**
   * Get escrow rule by ID
   */
  async getEscrowRuleById(id: string): Promise<EscrowRule> {
    const response = await axios.get<EscrowRule>(`${API_BASE_URL}/admin/guarantees/escrow-rules/${id}`);
    return response.data;
  },

  /**
   * Create a new escrow rule
   */
  async createEscrowRule(data: CreateEscrowRuleData): Promise<EscrowRule> {
    const response = await axios.post<EscrowRule>(`${API_BASE_URL}/admin/guarantees/escrow-rules`, data);
    return response.data;
  },

  /**
   * Update an existing escrow rule
   */
  async updateEscrowRule(id: string, data: UpdateEscrowRuleData): Promise<EscrowRule> {
    const response = await axios.put<EscrowRule>(`${API_BASE_URL}/admin/guarantees/escrow-rules/${id}`, data);
    return response.data;
  },

  /**
   * Delete an escrow rule
   */
  async deleteEscrowRule(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/guarantees/escrow-rules/${id}`);
  },

  /**
   * Toggle escrow rule enabled status
   */
  async toggleEscrowRule(id: string, enabled: boolean): Promise<EscrowRule> {
    return this.updateEscrowRule(id, { enabled });
  },

  // ============ DISPUTE RULES ============

  /**
   * Get all dispute rules
   */
  async getDisputeRules(): Promise<DisputeRule[]> {
    const response = await axios.get<DisputeRule[]>(`${API_BASE_URL}/admin/guarantees/dispute-rules`);
    return response.data;
  },

  /**
   * Get dispute rule by ID
   */
  async getDisputeRuleById(id: string): Promise<DisputeRule> {
    const response = await axios.get<DisputeRule>(`${API_BASE_URL}/admin/guarantees/dispute-rules/${id}`);
    return response.data;
  },

  /**
   * Create a new dispute rule
   */
  async createDisputeRule(data: CreateDisputeRuleData): Promise<DisputeRule> {
    const response = await axios.post<DisputeRule>(`${API_BASE_URL}/admin/guarantees/dispute-rules`, data);
    return response.data;
  },

  /**
   * Update an existing dispute rule
   */
  async updateDisputeRule(id: string, data: UpdateDisputeRuleData): Promise<DisputeRule> {
    const response = await axios.put<DisputeRule>(`${API_BASE_URL}/admin/guarantees/dispute-rules/${id}`, data);
    return response.data;
  },

  /**
   * Delete a dispute rule
   */
  async deleteDisputeRule(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/guarantees/dispute-rules/${id}`);
  },

  /**
   * Toggle dispute rule enabled status
   */
  async toggleDisputeRule(id: string, enabled: boolean): Promise<DisputeRule> {
    return this.updateDisputeRule(id, { enabled });
  },

  // ============ GUARANTEE POLICIES ============

  /**
   * Get all guarantee policies
   */
  async getGuaranteePolicies(): Promise<GuaranteePolicy[]> {
    const response = await axios.get<GuaranteePolicy[]>(`${API_BASE_URL}/admin/guarantees/policies`);
    return response.data;
  },

  /**
   * Get guarantee policy by ID
   */
  async getGuaranteePolicyById(id: string): Promise<GuaranteePolicy> {
    const response = await axios.get<GuaranteePolicy>(`${API_BASE_URL}/admin/guarantees/policies/${id}`);
    return response.data;
  },

  /**
   * Create a new guarantee policy
   */
  async createGuaranteePolicy(data: CreateGuaranteePolicyData): Promise<GuaranteePolicy> {
    const response = await axios.post<GuaranteePolicy>(`${API_BASE_URL}/admin/guarantees/policies`, data);
    return response.data;
  },

  /**
   * Update an existing guarantee policy
   */
  async updateGuaranteePolicy(id: string, data: UpdateGuaranteePolicyData): Promise<GuaranteePolicy> {
    const response = await axios.put<GuaranteePolicy>(`${API_BASE_URL}/admin/guarantees/policies/${id}`, data);
    return response.data;
  },

  /**
   * Delete a guarantee policy
   */
  async deleteGuaranteePolicy(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/guarantees/policies/${id}`);
  },

  /**
   * Toggle guarantee policy enabled status
   */
  async toggleGuaranteePolicy(id: string, enabled: boolean): Promise<GuaranteePolicy> {
    return this.updateGuaranteePolicy(id, { enabled });
  },

  // ============ PUBLIC API ============

  /**
   * Get guarantees summary for public consumption
   */
  async getGuaranteesSummary(): Promise<GuaranteesSummary> {
    const response = await axios.get<GuaranteesSummary>(`${API_BASE_URL}/api/v1/guarantees/summary`);
    return response.data;
  },

  /**
   * Get active escrow rules for specific transaction type
   */
  async getActiveEscrowRules(type: 'TRAVEL' | 'PASTE_LINK' | 'AUCTION'): Promise<EscrowRule[]> {
    const response = await axios.get<EscrowRule[]>(
      `${API_BASE_URL}/api/v1/guarantees/escrow-rules/active?type=${type}`
    );
    return response.data;
  },

  /**
   * Get active guarantee policies for user type
   */
  async getActivePolicies(userType: 'BUYER' | 'SELLER'): Promise<GuaranteePolicy[]> {
    const response = await axios.get<GuaranteePolicy[]>(
      `${API_BASE_URL}/api/v1/guarantees/policies/active?userType=${userType}`
    );
    return response.data;
  },

  /**
   * Get available dispute reasons for order status
   */
  async getDisputeReasons(orderStatus: string): Promise<DisputeRule[]> {
    const response = await axios.get<DisputeRule[]>(
      `${API_BASE_URL}/api/v1/guarantees/dispute-reasons?orderStatus=${orderStatus}`
    );
    return response.data;
  },

  // ============ ADMIN STATS ============

  /**
   * Get financial guarantees statistics
   */
  async getGuaranteesStats(): Promise<{
    totalEscrowRules: number;
    activeEscrowRules: number;
    totalDisputeRules: number;
    activeDisputeRules: number;
    totalPolicies: number;
    activePolicies: number;
    rulesByType: Record<string, number>;
    resolutionsByType: Record<string, number>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/admin/guarantees/stats`);
    return response.data;
  },
};

export default financialGuaranteesService;
