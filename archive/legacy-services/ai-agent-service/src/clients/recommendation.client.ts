/**
 * Recommendation Engine Client
 * 
 * Connects to recommendation-engine-service (Port 3020)
 */

import axios from 'axios';

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3020';

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  price: number;
  score: number;
  reason?: string;
  image?: string;
  rating?: number;
}

export interface UserProfile {
  userId: string;
  preferences: string[];
  categories: string[];
  priceRange: { min: number; max: number };
  interactions: number;
}

export class RecommendationClient {
  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/users/${userId}`,
        {
          params: { limit, excludeViewed: true },
          timeout: 5000
        }
      );

      return response.data.recommendations || [];
    } catch (error: any) {
      console.error('Failed to get personalized recommendations:', error.message);
      return [];
    }
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(
    productId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/products/${productId}/similar`,
        {
          params: { limit },
          timeout: 5000
        }
      );

      return response.data.recommendations || [];
    } catch (error: any) {
      console.error('Failed to get similar products:', error.message);
      return [];
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(
    category?: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/trending`,
        {
          params: { category, limit, timeWindow: 7 },
          timeout: 5000
        }
      );

      return response.data.recommendations || [];
    } catch (error: any) {
      console.error('Failed to get trending products:', error.message);
      return [];
    }
  }

  /**
   * Get frequently bought together
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/products/${productId}/bought-together`,
        {
          params: { limit },
          timeout: 5000
        }
      );

      return response.data.recommendations || [];
    } catch (error: any) {
      console.error('Failed to get frequently bought together:', error.message);
      return [];
    }
  }

  /**
   * Track user interaction
   */
  async trackInteraction(
    userId: string,
    productId: string,
    type: 'VIEW' | 'PURCHASE' | 'ADD_TO_CART' | 'LIKE',
    metadata?: any
  ): Promise<void> {
    try {
      await axios.post(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/interactions`,
        {
          userId,
          productId,
          type,
          metadata
        },
        { timeout: 3000 }
      );
    } catch (error: any) {
      console.error('Failed to track interaction:', error.message);
      // Don't throw - tracking is not critical
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/users/${userId}/profile`,
        { timeout: 5000 }
      );

      return response.data.profile;
    } catch (error: any) {
      console.error('Failed to get user profile:', error.message);
      return null;
    }
  }

  /**
   * Get recommendations by category and budget
   */
  async getRecommendationsByBudget(
    userId: string,
    budget: number,
    category?: string
  ): Promise<ProductRecommendation[]> {
    try {
      // Get personalized recommendations
      const recommendations = await this.getPersonalizedRecommendations(userId, 50);

      // Filter by budget and category
      let filtered = recommendations.filter(rec => rec.price <= budget);

      if (category) {
        filtered = filtered.filter(rec => 
          rec.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Sort by score and return top 10
      return filtered
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error: any) {
      console.error('Failed to get recommendations by budget:', error.message);
      return [];
    }
  }
}

export default new RecommendationClient();
