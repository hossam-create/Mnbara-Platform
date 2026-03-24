/**
 * Decision Authority API Service
 * Client for interacting with decision-authority-service endpoints
 */

import axios, { AxiosInstance } from 'axios';
import {
  AssetDecisionRecord,
  DecisionFilters,
  DecisionListResponse,
  DecisionAuditLogResponse,
  DecisionOverrideRequest,
  DecisionOverrideResponse,
  AssetType
} from '../types/decision.types';

/**
 * Decision Service Class
 * Provides methods for decision-related API calls
 */
class DecisionService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api/v1') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get decision by ID
   */
  async getDecision(id: string): Promise<AssetDecisionRecord> {
    try {
      const response = await this.api.get<AssetDecisionRecord>(`/decisions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get decision:', error);
      throw error;
    }
  }

  /**
   * Get decision by external decision ID
   */
  async getDecisionByDecisionId(decisionId: string): Promise<AssetDecisionRecord> {
    try {
      const response = await this.api.get<AssetDecisionRecord>(
        `/decisions/by-decision-id/${decisionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get decision by decision ID:', error);
      throw error;
    }
  }

  /**
   * Get all decisions for an asset
   */
  async getDecisionsByAsset(
    assetType: AssetType | string,
    assetId: string
  ): Promise<AssetDecisionRecord[]> {
    try {
      const response = await this.api.get<AssetDecisionRecord[]>(
        `/decisions/asset/${assetType}/${assetId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get decisions for asset:', error);
      throw error;
    }
  }

  /**
   * Get latest decision for an asset
   */
  async getLatestDecisionForAsset(
    assetType: AssetType | string,
    assetId: string
  ): Promise<AssetDecisionRecord | null> {
    try {
      const decisions = await this.getDecisionsByAsset(assetType, assetId);
      if (decisions.length === 0) {
        return null;
      }
      // Return most recent decision
      return decisions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    } catch (error) {
      console.error('Failed to get latest decision for asset:', error);
      throw error;
    }
  }

  /**
   * List decisions with filters
   */
  async listDecisions(filters?: DecisionFilters): Promise<DecisionListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.status) params.append('status', filters.status);
        if (filters.source) params.append('source', filters.source);
        if (filters.assetType) params.append('assetType', filters.assetType);
        if (filters.assetId) params.append('assetId', filters.assetId);
        if (filters.authority) params.append('authority', filters.authority);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());
      }

      const response = await this.api.get<DecisionListResponse>(
        `/decisions?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to list decisions:', error);
      throw error;
    }
  }

  /**
   * Get audit log for a decision
   */
  async getAuditLog(decisionId: string): Promise<DecisionAuditLogResponse> {
    try {
      const response = await this.api.get<DecisionAuditLogResponse>(
        `/audit-logs/decision/${decisionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get audit log:', error);
      throw error;
    }
  }

  /**
   * Query audit logs (admin only)
   */
  async queryAuditLogs(filters?: DecisionFilters): Promise<DecisionAuditLogResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());
      }

      const response = await this.api.get<DecisionAuditLogResponse>(
        `/audit-logs?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw error;
    }
  }

  /**
   * Override a decision (admin only)
   */
  async overrideDecision(
    decisionId: string,
    override: DecisionOverrideRequest
  ): Promise<DecisionOverrideResponse> {
    try {
      const response = await this.api.patch<DecisionOverrideResponse>(
        `/decisions/${decisionId}`,
        override
      );
      return response.data;
    } catch (error) {
      console.error('Failed to override decision:', error);
      throw error;
    }
  }

  /**
   * Check if decision is approved
   */
  async isDecisionApproved(
    assetType: AssetType | string,
    assetId: string
  ): Promise<boolean> {
    try {
      const decision = await this.getLatestDecisionForAsset(assetType, assetId);
      if (!decision) {
        return false;
      }
      return decision.status === 'APPROVED';
    } catch (error) {
      console.error('Failed to check if decision is approved:', error);
      return false;
    }
  }

  /**
   * Check if decision is pending
   */
  async isDecisionPending(
    assetType: AssetType | string,
    assetId: string
  ): Promise<boolean> {
    try {
      const decision = await this.getLatestDecisionForAsset(assetType, assetId);
      if (!decision) {
        return false;
      }
      return decision.status === 'PENDING';
    } catch (error) {
      console.error('Failed to check if decision is pending:', error);
      return false;
    }
  }

  /**
   * Check if decision is rejected
   */
  async isDecisionRejected(
    assetType: AssetType | string,
    assetId: string
  ): Promise<boolean> {
    try {
      const decision = await this.getLatestDecisionForAsset(assetType, assetId);
      if (!decision) {
        return false;
      }
      return decision.status === 'REJECTED';
    } catch (error) {
      console.error('Failed to check if decision is rejected:', error);
      return false;
    }
  }
}

// Export singleton instance
export const decisionService = new DecisionService();

// Export class for testing
export default DecisionService;
