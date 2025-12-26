import { Request, Response } from 'express';
import { prisma } from '../index';

export const paymentController = {
  async processPayment(req: Request, res: Response) {
    try {
      const { installmentId, amount, stripePaymentId } = req.body;

      const payment = await prisma.payment.findFirst({
        where: {
          installmentId,
          status: 'pending'
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'No pending payment found',
          messageAr: 'لا توجد دفعة معلقة'
        });
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          paidDate: new Date(),
          stripePaymentId
        }
      });

      return res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment processed successfully',
        messageAr: 'تمت معالجة الدفعة بنجاح'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process payment',
        messageAr: 'فشل في معالجة الدفعة'
      });
    }
  },

  async getPaymentSchedule(req: Request, res: Response) {
    try {
      const { installmentId } = req.params;

      const payments = await prisma.payment.findMany({
        where: { installmentId },
        orderBy: { dueDate: 'asc' }
      });

      return res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment schedule',
        messageAr: 'فشل في جلب جدول الدفع'
      });
    }
  }
};
