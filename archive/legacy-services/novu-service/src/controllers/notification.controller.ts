import { Request, Response } from 'express';
import { NovuService } from '../services/novu.service';
import { logger } from '../utils/logger';

const novuService = new NovuService();

export class NotificationController {
  // Trigger notification
  async triggerNotification(req: Request, res: Response) {
    try {
      const { subscriberId, templateId, payload, overrides } = req.body;

      const result = await novuService.triggerNotification({
        subscriberId,
        templateId,
        payload,
        overrides
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Trigger notification error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Broadcast notification
  async broadcastNotification(req: Request, res: Response) {
    try {
      const { templateId, payload } = req.body;

      const result = await novuService.broadcastNotification(templateId, payload);

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Broadcast notification error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get notification feed
  async getNotificationFeed(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 0;

      const feed = await novuService.getNotificationFeed(subscriberId, page);

      res.json({ success: true, data: feed });
    } catch (error: any) {
      logger.error('Get notification feed error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Mark as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { subscriberId, messageId } = req.params;

      await novuService.markAsRead(subscriberId, messageId);

      res.json({ success: true, message: 'Marked as read' });
    } catch (error: any) {
      logger.error('Mark as read error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Mark all as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;

      await novuService.markAllAsRead(subscriberId);

      res.json({ success: true, message: 'All marked as read' });
    } catch (error: any) {
      logger.error('Mark all as read error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get unseen count
  async getUnseenCount(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;

      const count = await novuService.getUnseenCount(subscriberId);

      res.json({ success: true, data: count });
    } catch (error: any) {
      logger.error('Get unseen count error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Cancel notification
  async cancelNotification(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;

      await novuService.cancelNotification(transactionId);

      res.json({ success: true, message: 'Notification cancelled' });
    } catch (error: any) {
      logger.error('Cancel notification error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get notification history
  async getNotificationHistory(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const history = await novuService.getNotificationHistory(subscriberId, page, limit);

      res.json({ success: true, data: history });
    } catch (error: any) {
      logger.error('Get notification history error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
