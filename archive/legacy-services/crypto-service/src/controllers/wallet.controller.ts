import { Request, Response } from 'express';
import { walletService } from '../services/wallet.service';
import { CryptoCurrency } from '@prisma/client';

export const walletController = {
  // إنشاء محفظة - Create wallet
  async createWallet(req: Request, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
          messageAr: 'معرف المستخدم مطلوب'
        });
      }

      const wallet = await walletService.createWallet(userId);

      res.status(201).json({
        success: true,
        message: 'Wallet created successfully',
        messageAr: 'تم إنشاء المحفظة بنجاح',
        data: wallet
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء المحفظة'
      });
    }
  },

  // الحصول على المحفظة - Get wallet
  async getWallet(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const wallet = await walletService.getWallet(userId);

      res.json({
        success: true,
        data: wallet
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'المحفظة غير موجودة'
      });
    }
  },

  // الحصول على الرصيد - Get balance
  async getBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const balance = await walletService.getBalance(userId);

      res.json({
        success: true,
        data: balance
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على الرصيد'
      });
    }
  },

  // الحصول على عنوان الإيداع - Get deposit address
  async getDepositAddress(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { currency } = req.query;

      if (!currency || !['BTC', 'ETH', 'USDC', 'USDT'].includes(currency as string)) {
        return res.status(400).json({
          success: false,
          message: 'Valid currency is required (BTC, ETH, USDC, USDT)',
          messageAr: 'العملة مطلوبة (BTC, ETH, USDC, USDT)'
        });
      }

      const address = await walletService.getDepositAddress(userId, currency as CryptoCurrency);

      res.json({
        success: true,
        data: address
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على عنوان الإيداع'
      });
    }
  },

  // الحصول على تاريخ المعاملات - Get transaction history
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { currency, limit, offset } = req.query;

      const history = await walletService.getTransactionHistory(userId, {
        currency: currency as CryptoCurrency | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على تاريخ المعاملات'
      });
    }
  }
};
