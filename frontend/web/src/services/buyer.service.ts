// ============================================
// 🛒 Buyer Service - Trust & Advisory APIs
// ============================================

import { apiClient } from './api.service';
import type { ApiResponse, Product, SearchResult, ProductFilters } from '../types';

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
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number;
  factors: {
    type: 'seller_history' | 'product_category' | 'delivery_method' | 'payment_type';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
}

export interface AdvisoryRecommendation {
  type: 'safety' | 'cost' | 'convenience' | 'trust';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  icon: string;
}

export interface BuyerListing extends Product {
  trustScore: TrustScore;
  riskAssessment: RiskAssessment;
  recommendations: AdvisoryRecommendation[];
  sellerStats: {
    totalSales: number;
    responseRate: number;
    avgResponseTime: string;
    disputeRate: number;
  };
}

class BuyerService {
  private baseUrl = '/buyer';

  private ensureData<T>(response: ApiResponse<T>, context: string): T {
    if (!response.success || response.data === undefined || response.data === null) {
      throw new Error(response.message || `Failed to ${context}`);
    }
    return response.data;
  }

  // Search products with trust filters
  async searchProducts(
    query: string,
    filters: ProductFilters & {
      minTrustScore?: number;
      maxRiskLevel?: 'low' | 'medium' | 'high' | 'very_high';
      verifiedSellerOnly?: boolean;
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<SearchResult<BuyerListing>> {
    const response = await apiClient.get<ApiResponse<SearchResult<BuyerListing>>>(
      `${this.baseUrl}/search`,
      {
        params: {
          q: query,
          page,
          pageSize,
          ...filters,
        },
      }
    );
    return this.ensureData(response.data, 'search products');
  }

  // Get product details with trust assessment
  async getProductWithTrust(productId: string): Promise<BuyerListing> {
    const response = await apiClient.get<ApiResponse<BuyerListing>>(
      `${this.baseUrl}/products/${productId}/trust`
    );
    return this.ensureData(response.data, 'get product trust');
  }

  // Get trust explanation for a product
  async getTrustExplanation(productId: string): Promise<{
    trustScore: TrustScore;
    explanation: string;
    comparison: {
      categoryAverage: number;
      platformAverage: number;
    };
  }> {
    const response = await apiClient.get<ApiResponse<{
      trustScore: TrustScore;
      explanation: string;
      comparison: {
        categoryAverage: number;
        platformAverage: number;
      };
    }>>(
      `${this.baseUrl}/products/${productId}/trust-explanation`
    );
    return this.ensureData(response.data, 'get trust explanation');
  }

  // Get risk assessment
  async getRiskAssessment(productId: string): Promise<RiskAssessment> {
    const response = await apiClient.get<ApiResponse<RiskAssessment>>(
      `${this.baseUrl}/products/${productId}/risk`
    );
    return this.ensureData(response.data, 'get risk assessment');
  }

  // Get advisory recommendations
  async getAdvisoryRecommendations(productId: string): Promise<AdvisoryRecommendation[]> {
    const response = await apiClient.get<ApiResponse<AdvisoryRecommendation[]>>(
      `${this.baseUrl}/products/${productId}/recommendations`
    );
    return this.ensureData(response.data, 'get advisory recommendations');
  }

  // Compare trust scores across similar products
  async compareTrustScores(productIds: string[]): Promise<{
    products: Array<{
      id: string;
      title: string;
      price: number;
      trustScore: number;
      riskLevel: string;
    }>;
    comparison: {
      bestValue: string;
      safest: string;
      fastestDelivery: string;
    };
  }> {
    const response = await apiClient.post<ApiResponse<{
      products: Array<{
        id: string;
        title: string;
        price: number;
        trustScore: number;
        riskLevel: string;
      }>;
      comparison: {
        bestValue: string;
        safest: string;
        fastestDelivery: string;
      };
    }>>(
      `${this.baseUrl}/compare-trust`,
      { productIds }
    );
    return this.ensureData(response.data, 'compare trust scores');
  }

  // Mock data fallback for development
  private mockTrustScore: TrustScore = {
    overall: 87,
    seller: 92,
    product: 85,
    delivery: 78,
    breakdown: {
      sellerRating: 95,
      responseTime: 88,
      disputeRate: 92,
      verificationLevel: 100,
    },
  };

  private mockRiskAssessment: RiskAssessment = {
    level: 'low',
    score: 12,
    factors: [
      {
        type: 'seller_history',
        description: 'Seller has excellent rating with 200+ transactions',
        severity: 'low',
      },
      {
        type: 'product_category',
        description: 'Electronics category has moderate dispute rate',
        severity: 'medium',
      },
    ],
    recommendations: [
      'Consider using escrow payment for added protection',
      'Verify seller\'s return policy before purchasing',
    ],
  };

  private mockRecommendations: AdvisoryRecommendation[] = [
    {
      type: 'trust',
      priority: 'high',
      title: 'Highly Trusted Seller',
      description: 'This seller has 4.9/5 rating with 200+ successful transactions',
      icon: 'shield-check',
    },
    {
      type: 'safety',
      priority: 'medium',
      title: 'Escrow Recommended',
      description: 'Use escrow payment to protect your purchase',
      action: 'Learn about escrow',
      icon: 'lock',
    },
  ];

  // Fallback method for development
  getMockTrustData(): {
    trustScore: TrustScore;
    riskAssessment: RiskAssessment;
    recommendations: AdvisoryRecommendation[];
  } {
    return {
      trustScore: this.mockTrustScore,
      riskAssessment: this.mockRiskAssessment,
      recommendations: this.mockRecommendations,
    };
  }
}

export const buyerService = new BuyerService();
export default buyerService;