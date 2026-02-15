import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getSalesAnalytics(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const { startDate, endDate } = req.query;

      const analytics = await analyticsService.getSalesAnalytics(
        sellerId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProductPerformance(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      const { days } = req.query;

      const performance = await analyticsService.getProductPerformance(
        sellerId,
        productId,
        days ? parseInt(days as string) : 30
      );

      res.json(performance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getDashboard(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const metrics = await analyticsService.getDashboardMetrics(sellerId);
      res.json(metrics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
