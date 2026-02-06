import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  // Track event
  async trackEvent(req: Request, res: Response) {
    try {
      const { userId, sessionId, eventName, properties, url, referrer } = req.body;

      await analyticsService.trackEvent({
        userId,
        sessionId,
        eventName,
        properties,
        url,
        referrer
      });

      res.json({ success: true, message: 'Event tracked' });
    } catch (error: any) {
      logger.error('Track event error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Track page view
  async trackPageView(req: Request, res: Response) {
    try {
      const { userId, sessionId, url, referrer, userAgent, country, device, browser, os } = req.body;

      await analyticsService.trackPageView({
        userId,
        sessionId,
        url,
        referrer,
        userAgent,
        country,
        device,
        browser,
        os
      });

      res.json({ success: true, message: 'Page view tracked' });
    } catch (error: any) {
      logger.error('Track page view error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Identify user
  async identifyUser(req: Request, res: Response) {
    try {
      const { userId, properties } = req.body;

      await analyticsService.identifyUser(userId, properties);

      res.json({ success: true, message: 'User identified' });
    } catch (error: any) {
      logger.error('Identify user error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get event analytics
  async getEventAnalytics(req: Request, res: Response) {
    try {
      const { eventName } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const analytics = await analyticsService.getEventAnalytics(eventName, startDate, endDate);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      logger.error('Get event analytics error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get page view analytics
  async getPageViewAnalytics(req: Request, res: Response) {
    try {
      const url = req.query.url as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const analytics = await analyticsService.getPageViewAnalytics(url, startDate, endDate);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      logger.error('Get page view analytics error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Create funnel
  async createFunnel(req: Request, res: Response) {
    try {
      const { name, steps, description } = req.body;

      const funnel = await analyticsService.createFunnel(name, steps, description);

      res.json({ success: true, data: funnel });
    } catch (error: any) {
      logger.error('Create funnel error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Analyze funnel
  async analyzeFunnel(req: Request, res: Response) {
    try {
      const { funnelId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const analysis = await analyticsService.analyzeFunnel(funnelId, startDate, endDate);

      res.json({ success: true, data: analysis });
    } catch (error: any) {
      logger.error('Analyze funnel error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Create cohort
  async createCohort(req: Request, res: Response) {
    try {
      const { name, filters, description } = req.body;

      const cohort = await analyticsService.createCohort(name, filters, description);

      res.json({ success: true, data: cohort });
    } catch (error: any) {
      logger.error('Create cohort error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get dashboard stats
  async getDashboardStats(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const stats = await analyticsService.getDashboardStats(startDate, endDate);

      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Get dashboard stats error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
