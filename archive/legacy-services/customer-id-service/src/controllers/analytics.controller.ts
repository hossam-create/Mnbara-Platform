import { Request, Response } from 'express'
import { AnalyticsService } from '../services/analytics.service'

export class AnalyticsController {
  private analyticsService = new AnalyticsService()

  async getCustomerAnalytics(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const analytics = await this.analyticsService.getCustomerAnalytics(customerId)
      res.json({ success: true, data: analytics })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getPurchaseHistory(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { limit = 10 } = req.query
      const history = await this.analyticsService.getPurchaseHistory(customerId, Number(limit))
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getSpendingTrends(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { months = 6 } = req.query
      const trends = await this.analyticsService.getSpendingTrends(customerId, Number(months))
      res.json({ success: true, data: trends })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getCategoryBreakdown(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const breakdown = await this.analyticsService.getCategoryBreakdown(customerId)
      res.json({ success: true, data: breakdown })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getEngagementMetrics(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const metrics = await this.analyticsService.getEngagementMetrics(customerId)
      res.json({ success: true, data: metrics })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
