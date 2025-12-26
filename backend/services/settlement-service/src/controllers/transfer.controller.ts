import { Request, Response } from 'express';
import { TransferService } from '../services/transfer.service';

const transferService = new TransferService();

export class TransferController {
  /**
   * إنشاء طلب تحويل جديد
   */
  async createTransfer(req: Request, res: Response) {
    try {
      const {
        senderId,
        senderCountry,
        senderCurrency,
        sendAmount,
        recipientCountry,
        recipientCurrency,
        recipientId
      } = req.body;

      const transfer = await transferService.createTransfer({
        senderId,
        senderCountry,
        senderCurrency,
        sendAmount,
        recipientCountry,
        recipientCurrency,
        recipientId
      });

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'تم إنشاء طلب التحويل بنجاح'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على طلبات المستخدم
   */
  async getUserTransfers(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status, page, limit } = req.query;

      const transfers = await transferService.getUserTransfers(
        userId,
        status as string,
        Number(page) || 1,
        Number(limit) || 20
      );

      res.json({
        success: true,
        data: transfers
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على تفاصيل طلب
   */
  async getTransferDetails(req: Request, res: Response) {
    try {
      const { transferId } = req.params;

      const transfer = await transferService.getTransferDetails(transferId);

      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: 'Transfer not found'
        });
      }

      res.json({
        success: true,
        data: transfer
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * إلغاء طلب تحويل
   */
  async cancelTransfer(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      const { userId, reason } = req.body;

      const result = await transferService.cancelTransfer(transferId, userId, reason);

      res.json({
        success: true,
        data: result,
        message: 'تم إلغاء طلب التحويل'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * حساب تكلفة التحويل
   */
  async estimateTransfer(req: Request, res: Response) {
    try {
      const {
        senderCurrency,
        recipientCurrency,
        sendAmount,
        senderCountry,
        recipientCountry
      } = req.body;

      const estimate = await transferService.estimateTransfer({
        senderCurrency,
        recipientCurrency,
        sendAmount,
        senderCountry,
        recipientCountry
      });

      res.json({
        success: true,
        data: estimate
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على الممرات المتاحة
   */
  async getAvailableCorridors(req: Request, res: Response) {
    try {
      const { fromCountry } = req.query;

      const corridors = await transferService.getAvailableCorridors(
        fromCountry as string
      );

      res.json({
        success: true,
        data: corridors
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
