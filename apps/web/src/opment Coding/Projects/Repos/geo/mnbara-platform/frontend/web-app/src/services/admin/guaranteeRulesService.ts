import axios from 'axios';

// Define base URL - assuming admin service is proxied or directly accessible
// Adjust base URL as per environment config
const API_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:3002'; // Defaulting to likely admin service port or gateway

export interface GuaranteeRule {
  id: string;
  name: string;
  appliesTo: 'CATEGORY' | 'ORDER_TYPE' | 'TRAVELER' | 'ALL';
  coverage: number; 
  maxAmount: number;
  autoActions: {
    autoEscalate: boolean;
    autoRefund: boolean;
    autoRelease: boolean;
  };
  conditions: {
    minOrderAmount?: number;
    maxOrderAmount?: number;
    categories?: string[];
    orderTypes?: string[];
    travelerVerified?: boolean;
  };
  thresholds: {
    disputeThreshold: number;
    escalationThreshold: number;
    evidenceRequired: boolean;
  };
  escalation: {
    autoEscalateAfter: number; // days
    escalationLevel: 'TIER_1' | 'TIER_2' | 'TIER_3';
    requiresApproval: boolean;
  };
  priority: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const guaranteeRulesService = {
  async getAll(): Promise<GuaranteeRule[]> {
    const response = await axios.get(`${API_URL}/guarantee-rules`);
    return response.data;
  },

  async getOne(id: number): Promise<GuaranteeRule> {
    const response = await axios.get(`${API_URL}/guarantee-rules/${id}`);
    return response.data;
  },

  async create(rule: Omit<GuaranteeRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<GuaranteeRule> {
    const response = await axios.post(`${API_URL}/guarantee-rules`, rule);
    return response.data;
  },

  async update(id: string, rule: Partial<GuaranteeRule>): Promise<GuaranteeRule> {
    const response = await axios.put(`${API_URL}/guarantee-rules/${id}`, rule);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/guarantee-rules/${id}`);
  }
};
