export interface UserInteraction {
  userId: string;
  productId: string;
  type: InteractionType;
  weight: number;
  timestamp: Date;
}

export enum InteractionType {
  VIEW = 'VIEW',
  CLICK = 'CLICK',
  ADD_TO_CART = 'ADD_TO_CART',
  PURCHASE = 'PURCHASE',
  LIKE = 'LIKE',
  SEARCH = 'SEARCH'
}

export interface ProductRecommendation {
  productId: string;
  score: number;
  reason: RecommendationReason;
  metadata?: Record<string, any>;
}

export enum RecommendationReason {
  COLLABORATIVE_FILTERING = 'COLLABORATIVE_FILTERING',
  CONTENT_BASED = 'CONTENT_BASED',
  TRENDING = 'TRENDING',
  SIMILAR_USERS = 'SIMILAR_USERS',
  FREQUENTLY_BOUGHT_TOGETHER = 'FREQUENTLY_BOUGHT_TOGETHER',
  PERSONALIZED = 'PERSONALIZED'
}

export interface RecommendationRequest {
  userId?: string;
  productId?: string;
  category?: string;
  limit?: number;
  excludeViewed?: boolean;
}

export interface UserProfile {
  userId: string;
  preferences: Record<string, number>;
  categories: string[];
  priceRange: { min: number; max: number };
  brands: string[];
}

export interface SimilarityScore {
  userId: string;
  score: number;
}
