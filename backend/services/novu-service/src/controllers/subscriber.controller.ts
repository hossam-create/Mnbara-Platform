import { Request, Response } from 'express';
import { NovuService } from '../services/novu.service';
import { logger } from '../utils/logger';

const novuService = new NovuService();

export class SubscriberController {
  // Upsert subscriber
  async upsertSubscriber(req: Request, res: Response) {
    try {
      const { subscriberId, email, phone, firstName, lastName, avatar, data } = req.body;

      const result = await novuService.upsertSubscriber({
        subscriberId,
        email,
        phone,
        firstName,
        lastName,
        avatar,
        data
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Upsert subscriber error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Delete subscriber
  async deleteSubscriber(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;

      await novuService.deleteSubscriber(subscriberId);

      res.json({ success: true, message: 'Subscriber deleted' });
    } catch (error: any) {
      logger.error('Delete subscriber error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Update preferences
  async updatePreferences(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;
      const { templateId, channel, enabled } = req.body;

      await novuService.updatePreferences(subscriberId, templateId, channel, enabled);

      res.json({ success: true, message: 'Preferences updated' });
    } catch (error: any) {
      logger.error('Update preferences error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get preferences
  async getPreferences(req: Request, res: Response) {
    try {
      const { subscriberId } = req.params;

      const preferences = await novuService.getPreferences(subscriberId);

      res.json({ success: true, data: preferences });
    } catch (error: any) {
      logger.error('Get preferences error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
