/**
 * AI Advisory Service
 * Connects to ai-core microservice for trust scoring and recommendations
 * Feature-flagged, read-only, advisory only
 */

import { apiClient } from './api.service';
import { API_CONFIG, isFeatureEnabled } from '../config/api.config';
import type { ApiResponse } from '../types';

export interface TrustScore {
  overall: number;
  seller: number;
  product: number;
  delivery: number;
  breakdown: {
    sellerRating: number;
    responseTime: number;
    disputeRate: number;
    verificationLevel: number;
  };
  explanation?: string;
  timestamp?: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number;
  factors: Array<{
    type: 'seller_history' | 'product_category' | 'delivery_method' | 'payment_type' | 'location';
    description: string;
    severity: 'low' | 'medium' | 'high';
    impact: number;
  }>;
  recommendations: string[];
  timestamp?: string;
}

export interface AdvisoryRecommendation {
  type: 'safety' | 'cost' | 'convenience' | 'trust' | 'risk' | 'alternative';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    label: string;
    url?: string;
    handler?: string;
  };
  icon: string;
  confidence?: number;
}

export interface IntentClassification {
  intent: 'buy' | 'sell' | 'exchange' | 'transfer' | 'browse';
  confidence: number;
  subIntent?: string;
  context?: Record<string, unknown>;
}

export interface UserMatchScore {
  userId: string;
  score: number;
  reasons: string[];
  compatibility: number;
}

class AIAdvisoryService {
  private baseUrl = API_CONFIG.SERVICES.AI_CORE;
  private enabled = isFeatureEnabled('AI_ADVISORY');
  private loading = false;
  private error: string | null = null;
  private cache: Record<string, { data: unknown; timestamp: number }> = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if AI advisory is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get last error
   */
  getError(): string | null {
    return this.error;
  }

  /**
   * Clear cached data
   */
  clearCache(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }

  /**
   * Generate cache key from params
   */
  private generateCacheKey(prefix: string, params: Record<string, unknown>): string {
    return `${prefix}_${JSON.stringify(params)}`;
  }

  /**
   * Compute trust score for a product/seller
   */
  async computeTrustScore(params: {
    productId?: string;
    sellerId?: string;
    buyerId?: string;
    transactionContext?: Record<string, unknown>;
  }): Promise<TrustScore> {
    if (!this.enabled) {
      throw new Error('AI Advisory feature is disabled');
    }

    const cacheKey = this.generateCacheKey('trustScore', params);
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as TrustScore;
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<TrustScore>>(
        `${this.baseUrl}/trust-score`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Update cache
        this.cache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
        };
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to compute trust score');
    } catch (error: unknown) {
      console.error('Error computing trust score:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to compute trust score';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Assess risk for a transaction
   */
  async assessRisk(params: {
    productId?: string;
    sellerId?: string;
    buyerId?: string;
    amount?: number;
    paymentMethod?: string;
    deliveryMethod?: string;
  }): Promise<RiskAssessment> {
    if (!this.enabled) {
      throw new Error('AI Advisory feature is disabled');
    }

    const cacheKey = this.generateCacheKey('riskAssessment', params);
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as RiskAssessment;
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<RiskAssessment>>(
        `${this.baseUrl}/risk-assessment`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Update cache
        this.cache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
        };
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to assess risk');
    } catch (error: unknown) {
      console.error('Error assessing risk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assess risk';
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get advisory recommendations
   */
  async getRecommendations(params: {
    productId?: string;
    sellerId?: string;
    buyerId?: string;
    context?: string;
    intent?: string;
  }): Promise<AdvisoryRecommendation[]> {
    if (!this.enabled) {
      return [];
    }

    const cacheKey = this.generateCacheKey('recommendations', params);
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as AdvisoryRecommendation[];
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<AdvisoryRecommendation[]>>(
        `${this.baseUrl}/recommendations`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data) {
        // Update cache
        this.cache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
        };
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      console.error('Error getting recommendations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get recommendations';
      this.error = errorMessage;
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Classify user intent
   */
  async classifyIntent(params: {
    userId?: string;
    searchQuery?: string;
    context?: Record<string, unknown>;
  }): Promise<IntentClassification> {
    if (!this.enabled) {
      throw new Error('AI Advisory is disabled');
    }

    try {
      const response = await apiClient.post<ApiResponse<IntentClassification>>(
        `${this.baseUrl}/intent/classify`,
        params
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to classify intent');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('AI Advisory: Failed to classify intent:', error);
      throw new Error(err.response?.data?.message || 'Failed to classify intent');
    }
  }

  /**
   * Match users for transactions
   */
  async matchUsers(params: {
    userId: string;
    targetType: 'buyer' | 'seller' | 'traveler';
    context?: Record<string, unknown>;
  }): Promise<UserMatchScore[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await apiClient.post<ApiResponse<UserMatchScore[]>>(
        `${this.baseUrl}/match/users`,
        params
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('AI Advisory: Failed to match users:', error);
      return [];
    }
  }

  /**
   * Get audit logs (for transparency)
   */
  async getAuditLogs(params: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    timestamp: string;
    action: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    duration: number;
  }>> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await apiClient.get<ApiResponse<Array<{
        id: string;
        timestamp: string;
        action: string;
        input: Record<string, unknown>;
        output: Record<string, unknown>;
        duration: number;
      }>>>(
        `${this.baseUrl}/audit`,
        { params }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('AI Advisory: Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get comprehensive advisory for a product
   */
  async getProductAdvisory(productId: string, buyerId?: string): Promise<{
    trustScore: TrustScore;
    riskAssessment: RiskAssessment;
    recommendations: AdvisoryRecommendation[];
  }> {
    if (!this.enabled) {
      throw new Error('AI Advisory is disabled');
    }

    try {
      // Run all analyses in parallel
      const [trustScore, riskAssessment, recommendations] = await Promise.all([
        this.computeTrustScore({ productId, buyerId }).catch(() => null),
        this.assessRisk({ productId, buyerId }).catch(() => null),
        this.getRecommendations({ productId, buyerId, context: 'product_view' }),
      ]);

      if (!trustScore || !riskAssessment) {
        throw new Error('Failed to get complete advisory');
      }

      return {
        trustScore,
        riskAssessment,
        recommendations,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('AI Advisory: Failed to get product advisory:', error);
      throw new Error(err.response?.data?.message || 'Failed to get product advisory');
    }
  }
}

export const aiAdvisoryService = new AIAdvisoryService();
export default aiAdvisoryService;
