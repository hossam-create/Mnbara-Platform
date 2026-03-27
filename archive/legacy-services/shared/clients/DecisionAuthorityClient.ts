/**
 * DecisionAuthorityClient - Thin HTTP client for Decision Authority Service
 * 
 * RULES:
 * - NO business logic
 * - NO knowledge of Custodii
 * - NO shared databases
 * - Feature-flag driven (DECISION_AUTHORITY_ENABLED)
 * - Minimal, reversible integration
 */

import axios, { AxiosInstance } from 'axios';

export enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum AssetType {
  LISTING = 'LISTING',
  AUCTION = 'AUCTION',
  ESCROW_RELEASE = 'ESCROW_RELEASE'
}

export interface DecisionRequest {
  assetType: AssetType;
  assetId: string;
  metadata?: Record<string, any>;
}

export interface DecisionResponse {
  id: number;
  decisionId: string;
  assetType: AssetType;
  assetId: string;
  status: DecisionStatus;
  decisionSource: string;
  authority: string;
  decisionRef?: string;
  reason?: string;
  metadata: Record<string, any>;
  requestedAt: Date;
  decidedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionAuthorityConfig {
  baseUrl: string;
  timeout?: number;
  enabled: boolean;
}

export class DecisionAuthorityClient {
  private client: AxiosInstance;
  private enabled: boolean;

  constructor(config: DecisionAuthorityConfig) {
    this.enabled = config.enabled;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if Decision Authority integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Request a decision for an asset
   * Returns null if integration is disabled
   */
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.post<DecisionResponse>('/api/v1/decisions', request);
      return response.data;
    } catch (error) {
      // Log error but don't throw - allow fallback behavior
      console.error('[DecisionAuthorityClient] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get decision by ID
   * Returns null if integration is disabled
   */
  async getDecision(id: number): Promise<DecisionResponse | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get<DecisionResponse>(`/api/v1/decisions/${id}`);
      return response.data;
    } catch (error) {
      console.error('[DecisionAuthorityClient] Get decision failed:', error);
      throw error;
    }
  }

  /**
   * Get decision by decision ID (source decision ID)
   * Returns null if integration is disabled
   */
  async getDecisionByDecisionId(decisionId: string): Promise<DecisionResponse | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get<DecisionResponse>(`/api/v1/decisions/by-decision-id/${decisionId}`);
      return response.data;
    } catch (error) {
      console.error('[DecisionAuthorityClient] Get decision by decisionId failed:', error);
      throw error;
    }
  }

  /**
   * Get decisions for an asset
   * Returns empty array if integration is disabled
   */
  async getDecisionsByAsset(assetType: AssetType, assetId: string): Promise<DecisionResponse[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await this.client.get<DecisionResponse[]>(`/api/v1/decisions/asset/${assetType}/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('[DecisionAuthorityClient] Get decisions by asset failed:', error);
      throw error;
    }
  }
}
