import { Request, Response } from 'express';
import { prisma } from '../index';
import { installmentService } from '../services/installment.service';

export const installmentController = {
  /**
   * Create new installment plan
   * إنشاء خطة دفع مقسطة جديدة
   */
  async createInstallment(req: Request, res: Response) {
    try {
      const { userId, orderId, planId, totalAmount } = req.body;

      // Validation
      if (!userId || !orderId || !planId || !totalAmount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          messageAr: 'حقول مطلوبة مفقودة'
        });
      }

      // Get plan
      const plan = await prisma.bNPLPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found',
          messageAr: 'الخطة غير موجودة'
        });
      }

      // Validate amount
      if (totalAmount < plan.minAmount || totalAmount > plan.maxAmount) {
        return res.status(400).json({
          success: false,
          message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount}`,
          messageAr: `المبلغ يجب أن يكون بين ${plan.minAmount} و ${plan.maxAmount}`
        });
      }

      // Create installment
      const installment = await installmentService.createInstallment({
        userId,
        orderId,
        planId,
        totalAmount
      });

      return res.status(201).json({
        success: true,
        data: installment,
        message: 'Installment created successfully',
        messageAr: 'تم إنشاء الخطة بنجاح'
      });
    } catch (error: any) {
      console.error('Error creating installment:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create installment',
        messageAr: 'فشل في إنشاء الخطة'
      });
    }
  },

  /**
   * Get user's installments
   * الحصول على خطط المستخدم
   */
  async getUserInstallments(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const installments = await prisma.installment.findMany({
        where: { userId },
        include: {
          plan: true,
          payments: {
            orderBy: { dueDate: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: installments,
        count: installments.length
      });
    } catch (error: any) {
      console.error('Error fetching installments:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch installments',
        messageAr: 'فشل في جلب الخطط'
      });
    }
  },

  /**
   * Get installment details
   * الحصول على تفاصيل الخطة
   */
  async getInstallmentDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const installment = await prisma.installment.findUnique({
        where: { id },
        include: {
          plan: true,
          payments: {
            orderBy: { dueDate: 'asc' }
          }
        }
      });

      if (!installment) {
        return res.status(404).json({
          success: false,
          message: 'Installment not found',
          messageAr: 'الخطة غير موجودة'
        });
      }

      return res.json({
        success: true,
        data: installment
      });
    } catch (error: any) {
      console.error('Error fetching installment:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch installment',
        messageAr: 'فشل في جلب الخطة'
      });
    }
  },

  /**
   * Update installment status
   * تحديث حالة الخطة
   */
  async updateInstallment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'active', 'completed', 'defaulted'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          messageAr: 'حالة غير صحيحة'
        });
      }

      const installment = await prisma.installment.update({
        where: { id },
        data: { status },
        include: {
          plan: true,
          payments: true
        }
      });

      return res.json({
        success: true,
        data: installment,
        message: 'Installment updated successfully',
        messageAr: 'تم تحديث الخطة بنجاح'
      });
    } catch (error: any) {
      console.error('Error updating installment:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update installment',
        messageAr: 'فشل في تحديث الخطة'
      });
    }
  },

  /**
   * Get installment statistics
   * الحصول على إحصائيات الخطة
   */
  async getInstallmentStats(req: Request, res: Response) {
    try {
      const totalInstallments = await prisma.installment.count();
      const activeInstallments = await prisma.installment.count({
        where: { status: 'active' }
      });
      const completedInstallments = await prisma.installment.count({
        where: { status: 'completed' }
      });
      const defaultedInstallments = await prisma.installment.count({
        where: { status: 'defaulted' }
      });

      const totalAmount = await prisma.installment.aggregate({
        _sum: { totalAmount: true }
      });

      return res.json({
        success: true,
        data: {
          totalInstallments,
          activeInstallments,
          completedInstallments,
          defaultedInstallments,
          totalAmount: totalAmount._sum.totalAmount || 0
        }
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch statistics',
        messageAr: 'فشل في جلب الإحصائيات'
      });
    }
  }
};
