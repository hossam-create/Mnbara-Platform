import { Request, Response } from 'express';
import { SellerRatingService } from '../services/seller-rating.service';
import { logger } from '../utils/logger';

const sellerRatingService = new SellerRatingService();

export class SellerRatingController {
  // Create seller rating
  async createRating(req: Request, res: Response) {
    try {
      const buyerId = req.headers['x-user-id'] as string;
      const { sellerId, orderId, rating, categories, comment } = req.body;

      const sellerRating = await sellerRatingService.createRating({
        sellerId,
        buyerId,
        orderId,
        rating,
        categories,
        comment
      });

      res.status(201).json({ success: true, data: sellerRating });
    } catch (error: any) {
      logger.error('Create seller rating error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get seller ratings
  async getSellerRatings(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await sellerRatingService.getSellerRatings(sellerId, page, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Get seller ratings error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get seller rating summary
  async getSellerRatingSummary(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const summary = await sellerRatingService.getSellerRatingSummary(sellerId);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      logger.error('Get seller rating summary error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get buyer's rating for seller
  async getBuyerRatingForSeller(req: Request, res: Response) {
    try {
      const buyerId = req.headers['x-user-id'] as string;
      const { sellerId } = req.params;

      const rating = await sellerRatingService.getBuyerRatingForSeller(buyerId, sellerId);
      res.json({ success: true, data: rating });
    } catch (error: any) {
      logger.error('Get buyer rating error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
