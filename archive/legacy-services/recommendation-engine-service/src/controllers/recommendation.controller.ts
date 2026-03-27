import { Request, Response } from 'express';
import { RecommendationEngine } from '../services/recommendation-engine.service';
import { InteractionType } from '../types/recommendation.types';
import { logger } from '../utils/logger';

const engine = new RecommendationEngine();

export class RecommendationController {
  async getPersonalizedRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const excludeViewed = req.query.excludeViewed === 'true';

      const recommendations = await engine.getPersonalizedRecommendations(
        userId,
        limit,
        excludeViewed
      );

      res.json({ recommendations });
    } catch (error: any) {
      logger.error('Get personalized recommendations error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSimilarProducts(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const recommendations = await engine.getSimilarProducts(productId, limit);

      res.json({ recommendations });
    } catch (error: any) {
      logger.error('Get similar products error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTrendingProducts(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const timeWindow = parseInt(req.query.timeWindow as string) || 7; // days

      const recommendations = await engine.getTrendingProducts(
        limit,
        category,
        timeWindow
      );

      res.json({ recommendations });
    } catch (error: any) {
      logger.error('Get trending products error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getFrequentlyBoughtTogether(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const recommendations = await engine.getFrequentlyBoughtTogether(
        productId,
        limit
      );

      res.json({ recommendations });
    } catch (error: any) {
      logger.error('Get frequently bought together error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async trackInteraction(req: Request, res: Response) {
    try {
      const { userId, productId, type, metadata } = req.body;

      if (!userId || !productId || !type) {
        return res.status(400).json({
          error: 'userId, productId, and type are required'
        });
      }

      await engine.trackInteraction({
        userId,
        productId,
        type: type as InteractionType,
        metadata
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Track interaction error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUserProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const profile = await engine.getUserProfile(userId);

      res.json({ profile });
    } catch (error: any) {
      logger.error('Get user profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async rebuildModels(req: Request, res: Response) {
    try {
      await engine.rebuildRecommendationModels();

      res.json({ success: true, message: 'Models rebuilt successfully' });
    } catch (error: any) {
      logger.error('Rebuild models error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
