// Tests for RecommendationService

import { RecommendationService } from '../recommendation.service';
import { RecommendationRequest } from '../../types/recommendation.types';

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(() => {
    service = new RecommendationService();
  });

  describe('getRecommendations', () => {
    it('should return recommendations for a user', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-123',
        context: {
          category: 'electronics',
          priceRange: { min: 100, max: 1000 },
          limit: 5
        }
      };

      const response = await service.getRecommendations(request);

      expect(response.success).toBe(true);
      expect(response.recommendations).toBeDefined();
      expect(Array.isArray(response.recommendations)).toBe(true);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.model).toBeDefined();
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should limit recommendations to specified count', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-123',
        context: {
          limit: 3
        }
      };

      const response = await service.getRecommendations(request);

      expect(response.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should include confidence scores', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-123'
      };

      const response = await service.getRecommendations(request);

      response.recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(1);
      });
    });

    it('should include reasons for recommendations', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-123'
      };

      const response = await service.getRecommendations(request);

      response.recommendations.forEach(rec => {
        expect(rec.reason).toBeDefined();
        expect(typeof rec.reason).toBe('string');
        expect(rec.reason.length).toBeGreaterThan(0);
      });
    });

    it('should handle errors gracefully', async () => {
      const request: RecommendationRequest = {
        userId: ''
      };

      await expect(service.getRecommendations(request)).rejects.toThrow();
    });
  });

  describe('analyzeUserBehavior', () => {
    it('should analyze user behavior', async () => {
      // This is a private method, test through getRecommendations
      const request: RecommendationRequest = {
        userId: 'test-user-123'
      };

      const response = await service.getRecommendations(request);
      
      // If we get recommendations, behavior analysis worked
      expect(response.success).toBe(true);
    });
  });

  describe('rankRecommendations', () => {
    it('should rank recommendations by score', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-123',
        context: { limit: 10 }
      };

      const response = await service.getRecommendations(request);

      // Check if sorted by score (descending)
      for (let i = 0; i < response.recommendations.length - 1; i++) {
        expect(response.recommendations[i].score)
          .toBeGreaterThanOrEqual(response.recommendations[i + 1].score);
      }
    });
  });
});
