// Recommendation Controller - Gen 10 AI
// متحكم التوصيات - الجيل العاشر

import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendation.service';

export class RecommendationController {
  // Get personalized recommendations
  async getPersonalized(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const recommendations = await recommendationService.getPersonalizedRecommendations(
        userId,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء جلب التوصيات'
      });
    }
  }

  // Get similar products
  async getSimilar(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      const similar = await recommendationService.getSimilarProducts(
        productId,
        limit ? parseInt(limit as string) : 10
      );

      res.json({
        success: true,
        data: similar
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get complementary products
  async getComplementary(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      const complementary = await recommendationService.getComplementaryProducts(
        productId,
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: complementary
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get trending products
  async getTrending(req: Request, res: Response) {
    try {
      const { category, region, limit } = req.query;

      const trending = await recommendationService.getTrendingProducts(
        category as string,
        region as string,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: trending
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get deals
  async getDeals(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const deals = await recommendationService.getDeals(
        userId,
        limit ? parseInt(limit as string) : 10
      );

      res.json({
        success: true,
        data: deals
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const behavior = req.body;

      const profile = await recommendationService.updateUserProfile(userId, behavior);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        messageAr: 'تم تحديث الملف الشخصي بنجاح',
        data: profile
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Track interaction
  async trackInteraction(req: Request, res: Response) {
    try {
      const { recommendationId } = req.params;
      const { action } = req.body;

      if (!['view', 'click', 'purchase'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be view, click, or purchase',
          messageAr: 'إجراء غير صالح'
        });
      }

      const result = await recommendationService.trackInteraction(recommendationId, action);

      res.json({
        success: true,
        message: 'Interaction tracked',
        messageAr: 'تم تسجيل التفاعل',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get analytics
  async getAnalytics(req: Request, res: Response) {
    try {
      const { userId, days } = req.query;

      const analytics = await recommendationService.getRecommendationAnalytics(
        userId as string,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const recommendationController = new RecommendationController();
