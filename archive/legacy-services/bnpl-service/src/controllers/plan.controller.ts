import { Request, Response } from 'express';
import { prisma } from '../index';

export const planController = {
  async getAllPlans(req: Request, res: Response) {
    try {
      const plans = await prisma.bNPLPlan.findMany({
        where: { isActive: true },
        orderBy: { installmentCount: 'asc' }
      });

      return res.json({
        success: true,
        data: plans,
        count: plans.length
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch plans',
        messageAr: 'فشل في جلب الخطط'
      });
    }
  },

  async getPlanById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const plan = await prisma.bNPLPlan.findUnique({
        where: { id }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found',
          messageAr: 'الخطة غير موجودة'
        });
      }

      return res.json({
        success: true,
        data: plan
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch plan',
        messageAr: 'فشل في جلب الخطة'
      });
    }
  },

  async createPlan(req: Request, res: Response) {
    try {
      const { name, nameAr, installmentCount, interestRate, minAmount, maxAmount } = req.body;

      const plan = await prisma.bNPLPlan.create({
        data: {
          name,
          nameAr,
          installmentCount,
          interestRate: interestRate || 0,
          minAmount: minAmount || 100,
          maxAmount: maxAmount || 10000
        }
      });

      return res.status(201).json({
        success: true,
        data: plan,
        message: 'Plan created successfully',
        messageAr: 'تم إنشاء الخطة بنجاح'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create plan',
        messageAr: 'فشل في إنشاء الخطة'
      });
    }
  }
};
