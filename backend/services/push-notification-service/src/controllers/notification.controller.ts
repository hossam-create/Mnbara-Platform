import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  async registerDevice(req: Request, res: Response): Promise<void> {
    try {
      const { userId, token, platform, provider } = req.body;

      if (!userId || !token || !platform || !provider) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      await this.service.registerDevice({ userId, token, platform, provider });

      res.json({
        success: true,
        message: 'Device registered successfully',
      });
    } catch (error) {
      logger.error('Register device error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register device',
      });
    }
  }

  async unregisterDevice(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required',
        });
        return;
      }

      await this.service.unregisterDevice(token);

      res.json({
        success: true,
        message: 'Device unregistered successfully',
      });
    } catch (error) {
      logger.error('Unregister device error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unregister device',
      });
    }
  }

  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, body, data, imageUrl, actionUrl, priority } = req.body;

      if (!userId || !title || !body) {
        res.status(400).json({
          success: false,
          error: 'userId, title, and body are required',
        });
        return;
      }

      const result = await this.service.sendNotification({
        userId,
        title,
        body,
        data,
        imageUrl,
        actionUrl,
        priority,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Send notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }

  async sendBulkNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, title, body, data, imageUrl, actionUrl, priority } = req.body;

      if (!userIds || !Array.isArray(userIds) || !title || !body) {
        res.status(400).json({
          success: false,
          error: 'userIds (array), title, and body are required',
        });
        return;
      }

      const result = await this.service.sendBulkNotification({
        userIds,
        title,
        body,
        data,
        imageUrl,
        actionUrl,
        priority,
      });

      res.json(result);
    } catch (error) {
      logger.error('Send bulk notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk notification',
      });
    }
  }

  async sendToTopic(req: Request, res: Response): Promise<void> {
    try {
      const { topic, title, body, data, imageUrl, actionUrl, priority } = req.body;

      if (!topic || !title || !body) {
        res.status(400).json({
          success: false,
          error: 'topic, title, and body are required',
        });
        return;
      }

      const result = await this.service.sendToTopic(topic, {
        title,
        body,
        data,
        imageUrl,
        actionUrl,
        priority,
      });

      res.json(result);
    } catch (error) {
      logger.error('Send to topic error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send to topic',
      });
    }
  }

  async sendToSegment(req: Request, res: Response): Promise<void> {
    try {
      const { segment, title, body, data, imageUrl, actionUrl, priority } = req.body;

      if (!segment || !title || !body) {
        res.status(400).json({
          success: false,
          error: 'segment, title, and body are required',
        });
        return;
      }

      const result = await this.service.sendToSegment(segment, {
        title,
        body,
        data,
        imageUrl,
        actionUrl,
        priority,
      });

      res.json(result);
    } catch (error) {
      logger.error('Send to segment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send to segment',
      });
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await this.service.getNotificationHistory(userId, limit);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification history',
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await this.service.getNotificationStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification stats',
      });
    }
  }
}
