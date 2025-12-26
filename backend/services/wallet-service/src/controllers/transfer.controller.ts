import { Request, Response } from 'express';
import { transferService } from '../services/transfer.service';
import { Currency, TransferStatus } from '@prisma/client';

export const transferController = {
  // إنشاء تحويل - Create transfer
  async createTransfer(req: Request, res: Response) {
    try {
      const { fromUserId, toUserId, fromCurrency, toCurrency, amount, note } = req.body;

      if (!fromUserId || !toUserId || !fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const transfer = await transferService.createTransfer({
        fromUserId,
        toUserId,
        fromCurrency: fromCurrency as Currency,
        toCurrency: toCurrency as Currency,
        amount: parseFloat(amount),
        note
      });

      res.status(201).json({
        success: true,
        message: 'Transfer completed',
        messageAr: 'تم التحويل بنجاح',
        data: transfer
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في التحويل'
      });
    }
  },

  // الحصول على تحويل - Get transfer
  async getTransfer(req: Request, res: Response) {
    try {
      const { transferId } = req.params;

      const transfer = await transferService.getTransfer(transferId);

      res.json({
        success: true,
        data: transfer
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'التحويل غير موجود'
      });
    }
  },

  // الحصول على تحويلات المستخدم - Get user transfers
  async getUserTransfers(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type, status, limit, offset } = req.query;

      const transfers = await transferService.getUserTransfers(userId, {
        type: type as 'sent' | 'received' | 'all' | undefined,
        status: status as TransferStatus | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: transfers
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على التحويلات'
      });
    }
  },

  // حساب رسوم التحويل - Calculate transfer fee
  async calculateFee(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency, amount } = req.query;

      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'fromCurrency, toCurrency, and amount are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const fee = await transferService.calculateFee(
        fromCurrency as Currency,
        toCurrency as Currency,
        parseFloat(amount as string)
      );

      res.json({
        success: true,
        data: fee
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في حساب الرسوم'
      });
    }
  }
};
