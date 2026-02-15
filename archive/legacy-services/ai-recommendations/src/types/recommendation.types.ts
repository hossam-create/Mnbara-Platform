// Types for AI Recommendations Service

export interface UserBehavior {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  searchQueries: string[];
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  lastActivity: Date;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  price: number;
  score: number; // 0-1
  reason: string;
  confidence: number; // 0-1
}

export interface RecommendationRequest {
  userId: string;
  context?: {
    category?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    limit?: number;
  };
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: ProductRecommendation[];
  metadata: {
    model: string;
    timestamp: Date;
    processingTime: number;
  };
}

export interface AIConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature: number;
  maxTokens: number;
}
