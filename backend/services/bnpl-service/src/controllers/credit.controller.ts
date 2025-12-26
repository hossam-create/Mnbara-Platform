import { Request, Response } from 'express';
import { installmentService } from '../services/installment.service';

export const creditController = {
  async getUserCreditScore(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const creditScore = await installmentService.getUserCreditScore(userId);

      return res.json({
        success: true,
        data: creditScore
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch credit score',
        messageAr: 'فشل في جلب درجة الائتمان'
      });
    }
  },

  async checkEligibility(req: Request, res: Response) {
    try {
      const { userId, amount } = req.body;

      const isEligible = await installmentService.isUserEligible(userId, amount);
      const recommendedPlan = await installmentService.getRecommendedPlan(userId, amount);

      return res.json({
        success: true,
        data: {
          isEligible,
          recommendedPlan
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check eligibility',
        messageAr: 'فشل في التحقق من الأهلية'
      });
    }
  }
};
