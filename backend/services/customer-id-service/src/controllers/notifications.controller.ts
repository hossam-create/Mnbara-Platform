import { Request, Response } from 'express'
import { NotificationsService } from '../services/notifications.service'

export class NotificationsController {
  private notificationsService = new NotificationsService()

  async getNotificationPreferences(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const preferences = await this.notificationsService.getNotificationPreferences(customerId)
      res.json({ success: true, data: preferences })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async updateNotificationPreferences(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const preferences = req.body
      const result = await this.notificationsService.updateNotificationPreferences(customerId, preferences)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getNotificationHistory(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { limit = 20 } = req.query
      const history = await this.notificationsService.getNotificationHistory(customerId, Number(limit))
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async sendNotification(req: Request, res: Response) {
    try {
      const { customerId, type, message } = req.body
      const result = await this.notificationsService.sendNotification(customerId, type, message)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
