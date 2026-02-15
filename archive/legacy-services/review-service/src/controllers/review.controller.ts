import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { logger } from '../utils/logger';

const reviewService = new ReviewService();

export class ReviewController {
  // Create review
  async createReview(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { productId, orderId, rating, title, comment, images, verified } = req.body;

      const review = await reviewService.createReview(
        { productId, userId, orderId, rating, title, comment, images },
        verified || false
      );

      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      logger.error('Create review error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get reviews
  async getReviews(req: Request, res: Response) {
    try {
      const filters = {
        productId: req.query.productId as string,
        userId: req.query.userId as string,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        verified: req.query.verified === 'true',
        sortBy: req.query.sortBy as any,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await reviewService.getReviews(filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Get reviews error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get single review
  async getReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const review = await reviewService.getReview(id);
      res.json({ success: true, data: review });
    } catch (error: any) {
      logger.error('Get review error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // Update review
  async updateReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      const updates = req.body;

      const review = await reviewService.updateReview(id, userId, updates);
      res.json({ success: true, data: review });
    } catch (error: any) {
      logger.error('Update review error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Delete review
  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;

      await reviewService.deleteReview(id, userId);
      res.json({ success: true, message: 'Review deleted' });
    } catch (error: any) {
      logger.error('Delete review error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Vote helpful
  async voteHelpful(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;
      const { helpful } = req.body;

      await reviewService.voteHelpful(id, userId, helpful);
      res.json({ success: true, message: 'Vote recorded' });
    } catch (error: any) {
      logger.error('Vote helpful error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Report review
  async reportReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string;

      await reviewService.reportReview(id, userId);
      res.json({ success: true, message: 'Review reported' });
    } catch (error: any) {
      logger.error('Report review error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get product rating summary
  async getProductRatingSummary(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const summary = await reviewService.getProductRatingSummary(productId);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      logger.error('Get rating summary error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get user's review for product
  async getUserReviewForProduct(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { productId } = req.params;

      const review = await reviewService.getUserReviewForProduct(userId, productId);
      res.json({ success: true, data: review });
    } catch (error: any) {
      logger.error('Get user review error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
