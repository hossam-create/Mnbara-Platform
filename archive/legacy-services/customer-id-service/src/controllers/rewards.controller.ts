import { Request, Response } from 'express'
import { RewardsService } from '../services/rewards.service'

export class RewardsController {
  private rewardsService = new RewardsService()

  // Get special date rewards
  async getSpecialDateRewards(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const rewards = await this.rewardsService.getSpecialDateRewards(customerId)
      res.json({ success: true, data: rewards })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get upcoming rewards
  async getUpcomingRewards(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const rewards = await this.rewardsService.getUpcomingRewards(customerId)
      res.json({ success: true, data: rewards })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Claim reward
  async claimReward(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { rewardId } = req.body
      const result = await this.rewardsService.claimReward(customerId, rewardId)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get reward history
  async getRewardHistory(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const history = await this.rewardsService.getRewardHistory(customerId)
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get reward details
  async getRewardDetails(req: Request, res: Response) {
    try {
      const { rewardId } = req.params
      const details = await this.rewardsService.getRewardDetails(rewardId)
      res.json({ success: true, data: details })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get all available rewards
  async getAllRewards(req: Request, res: Response) {
    try {
      const rewards = await this.rewardsService.getAllRewards()
      res.json({ success: true, data: rewards })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
