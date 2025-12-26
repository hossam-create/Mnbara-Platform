import { Request, Response } from 'express'
import { SecurityService } from '../services/security.service'

export class SecurityController {
  private securityService = new SecurityService()

  // Get security status
  async getSecurityStatus(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const status = await this.securityService.getSecurityStatus(customerId)
      res.json({ success: true, data: status })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get fraud alerts
  async getFraudAlerts(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const alerts = await this.securityService.getFraudAlerts(customerId)
      res.json({ success: true, data: alerts })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Report suspicious activity
  async reportSuspiciousActivity(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { activityType, description, evidence } = req.body
      const result = await this.securityService.reportSuspiciousActivity(
        customerId,
        activityType,
        description,
        evidence
      )
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get security recommendations
  async getSecurityRecommendations(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const recommendations = await this.securityService.getSecurityRecommendations(customerId)
      res.json({ success: true, data: recommendations })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Enable two-factor authentication
  async enableTwoFactor(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const result = await this.securityService.enableTwoFactor(customerId)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get security history
  async getSecurityHistory(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const history = await this.securityService.getSecurityHistory(customerId)
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
