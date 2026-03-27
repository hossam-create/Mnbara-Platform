// AI Recommendation Controller
// Handles HTTP requests for product recommendations

import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { logger } from '../utils/logger';
import { RecommendationRequest } from '../types/recommendation.types';

export class RecommendationController {
  private service: RecommendationService;

  constructor() {
    this.service = new RecommendationService();
  }

  /**
   * GET /api/v1/recommendations/:userId
   * Get product recommendations for a user
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const context = req.body;

      logger.info(`Recommendation request for user: ${userId}`);

      const request: RecommendationRequest = {
        userId,
        context
      };

      const response = await this.service.getRecommendations(request);

      res.json(response);
    } catch (error) {
      logger.error('Error in getRecommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/recommendations/batch
   * Get recommendations for multiple users
   */
  async getBatchRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, context } = req.body;

      if (!Array.isArray(userIds)) {
        res.status(400).json({
          success: false,
          error: 'userIds must be an array'
        });
        return;
      }

      logger.info(`Batch recommendation request for ${userIds.length} users`);

      const results = await Promise.all(
        userIds.map(userId =>
          this.service.getRecommendations({ userId, context })
        )
      );

      res.json({
        success: true,
        results
      });
    } catch (error) {
      logger.error('Error in getBatchRecommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate batch recommendations'
      });
    }
  }

  /**
   * GET /api/v1/recommendations/health
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      service: 'ai-recommendations',
      timestamp: new Date().toISOString()
    });
  }
}
