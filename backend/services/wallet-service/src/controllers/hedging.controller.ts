import { Request, Response } from 'express';
import { hedgingService } from '../services/hedging.service';
import { Currency, HedgeType, HedgingStatus } from '@prisma/client';

export const hedgingController = {
  // إنشاء أمر تحوط - Create hedging order
  async createOrder(req: Request, res: Response) {
    try {
      const { userId, currency, amount, hedgeType, targetRate, protectionCurrency, durationDays } = req.body;

      if (!userId || !currency || !amount || !hedgeType || !targetRate || !protectionCurrency || !durationDays) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      if (!['FORWARD', 'OPTION', 'STOP_LOSS'].includes(hedgeType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hedge type. Supported: FORWARD, OPTION, STOP_LOSS',
          messageAr: 'نوع التحوط غير صالح'
        });
      }

      const order = await hedgingService.createHedgingOrder({
        userId,
        currency: currency as Currency,
        amount: parseFloat(amount),
        hedgeType: hedgeType as HedgeType,
        targetRate: parseFloat(targetRate),
        protectionCurrency: protectionCurrency as Currency,
        durationDays: parseInt(durationDays)
      });

      res.status(201).json({
        success: true,
        message: 'Hedging order created',
        messageAr: 'تم إنشاء أمر التحوط',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء أمر التحوط'
      });
    }
  },

  // الحصول على أمر تحوط - Get hedging order
  async getOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const order = await hedgingService.getHedgingOrder(orderId);

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'أمر التحوط غير موجود'
      });
    }
  },

  // الحصول على أوامر المستخدم - Get user orders
  async getUserOrders(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status, limit, offset } = req.query;

      const orders = await hedgingService.getUserHedgingOrders(userId, {
        status: status as HedgingStatus | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على الأوامر'
      });
    }
  },

  // تنفيذ أمر التحوط - Execute order
  async executeOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const result = await hedgingService.executeHedgingOrder(orderId);

      res.json({
        success: true,
        message: 'Order executed',
        messageAr: 'تم تنفيذ الأمر',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تنفيذ الأمر'
      });
    }
  },

  // إلغاء أمر التحوط - Cancel order
  async cancelOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const result = await hedgingService.cancelHedgingOrder(orderId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إلغاء الأمر'
      });
    }
  }
};
