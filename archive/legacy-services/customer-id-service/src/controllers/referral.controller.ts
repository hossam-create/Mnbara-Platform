import { Request, Response } from 'express'
import { ReferralService } from '../services/referral.service'

export class ReferralController {
  private referralService = new ReferralService()

  // Generate referral link
  async generateReferralLink(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const referralLink = await this.referralService.generateReferralLink(customerId)
      res.json({ success: true, data: referralLink })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get referral history
  async getReferralHistory(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const history = await this.referralService.getReferralHistory(customerId)
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get referral rewards
  async getReferralRewards(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const rewards = await this.referralService.getReferralRewards(customerId)
      res.json({ success: true, data: rewards })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Track referral
  async trackReferral(req: Request, res: Response) {
    try {
      const { referrerId, referredId } = req.body
      const result = await this.referralService.trackReferral(referrerId, referredId)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get referral statistics
  async getReferralStats(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const stats = await this.referralService.getReferralStats(customerId)
      res.json({ success: true, data: stats })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
