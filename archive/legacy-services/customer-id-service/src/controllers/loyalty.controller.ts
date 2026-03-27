import { Request, Response } from 'express'
import { LoyaltyService } from '../services/loyalty.service'

export class LoyaltyController {
  private loyaltyService = new LoyaltyService()

  // Get customer loyalty info
  async getLoyaltyInfo(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const loyaltyInfo = await this.loyaltyService.getLoyaltyInfo(customerId)
      res.json({ success: true, data: loyaltyInfo })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get loyalty tiers
  async getTiers(req: Request, res: Response) {
    try {
      const tiers = await this.loyaltyService.getTiers()
      res.json({ success: true, data: tiers })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Add points to customer
  async addPoints(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { points, reason } = req.body
      const result = await this.loyaltyService.addPoints(customerId, points, reason)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Redeem points
  async redeemPoints(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { points, rewardId } = req.body
      const result = await this.loyaltyService.redeemPoints(customerId, points, rewardId)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get tier benefits
  async getTierBenefits(req: Request, res: Response) {
    try {
      const { tier } = req.params
      const benefits = await this.loyaltyService.getTierBenefits(tier)
      res.json({ success: true, data: benefits })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get how to earn points
  async getHowToEarn(req: Request, res: Response) {
    try {
      const methods = await this.loyaltyService.getHowToEarn()
      res.json({ success: true, data: methods })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
