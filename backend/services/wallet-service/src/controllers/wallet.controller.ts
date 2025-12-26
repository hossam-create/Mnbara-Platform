import { Request, Response } from 'express';
import { walletService } from '../services/wallet.service';
import { Currency, TransactionType } from '@prisma/client';

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'];

export const walletController = {
  // إنشاء محفظة - Create wallet
  async createWallet(req: Request, res: Response) {
    try {
      const { userId, primaryCurrency } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
          messageAr: 'معرف المستخدم مطلوب'
        });
      }

      if (primaryCurrency && !VALID_CURRENCIES.includes(primaryCurrency)) {
        return res.status(400).json({
          success: false,
          message: `Invalid currency. Supported: ${VALID_CURRENCIES.join(', ')}`,
          messageAr: 'عملة غير صالحة'
        });
      }

      const wallet = await walletService.createWallet(userId, primaryCurrency as Currency);

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

  // الحصول على الرصيد الإجمالي - Get total balance
  async getTotalBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { displayCurrency } = req.query;

      const balance = await walletService.getTotalBalance(
        userId,
        (displayCurrency as Currency) || 'USD'
      );

      res.json({
        success: true,
        data: balance
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على الرصيد'
      });
    }
  },

  // إيداع - Deposit
  async deposit(req: Request, res: Response) {
    try {
      const { userId, currency, amount, referenceId } = req.body;

      if (!userId || !currency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'userId, currency, and amount are required',
          messageAr: 'معرف المستخدم والعملة والمبلغ مطلوبة'
        });
      }

      if (!VALID_CURRENCIES.includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency',
          messageAr: 'عملة غير صالحة'
        });
      }

      const result = await walletService.deposit(
        userId,
        currency as Currency,
        parseFloat(amount),
        referenceId
      );

      res.json({
        success: true,
        message: 'Deposit successful',
        messageAr: 'تم الإيداع بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الإيداع'
      });
    }
  },

  // سحب - Withdraw
  async withdraw(req: Request, res: Response) {
    try {
      const { userId, currency, amount, referenceId } = req.body;

      if (!userId || !currency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'userId, currency, and amount are required',
          messageAr: 'معرف المستخدم والعملة والمبلغ مطلوبة'
        });
      }

      const result = await walletService.withdraw(
        userId,
        currency as Currency,
        parseFloat(amount),
        referenceId
      );

      res.json({
        success: true,
        message: 'Withdrawal successful',
        messageAr: 'تم السحب بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في السحب'
      });
    }
  },

  // تحويل بين العملات - Convert currencies
  async convert(req: Request, res: Response) {
    try {
      const { userId, fromCurrency, toCurrency, amount } = req.body;

      if (!userId || !fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'userId, fromCurrency, toCurrency, and amount are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const result = await walletService.convert(
        userId,
        fromCurrency as Currency,
        toCurrency as Currency,
        parseFloat(amount)
      );

      res.json({
        success: true,
        message: 'Conversion successful',
        messageAr: 'تم التحويل بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في التحويل'
      });
    }
  },

  // الحصول على تاريخ المعاملات - Get transaction history
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { currency, type, limit, offset } = req.query;

      const history = await walletService.getTransactionHistory(userId, {
        currency: currency as Currency | undefined,
        type: type as TransactionType | undefined,
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
        messageAr: 'فشل في الحصول على التاريخ'
      });
    }
  },

  // تحديث الحدود - Update limits
  async updateLimits(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { dailyLimit, monthlyLimit } = req.body;

      const wallet = await walletService.updateLimits(
        userId,
        dailyLimit ? parseFloat(dailyLimit) : undefined,
        monthlyLimit ? parseFloat(monthlyLimit) : undefined
      );

      res.json({
        success: true,
        message: 'Limits updated',
        messageAr: 'تم تحديث الحدود',
        data: wallet
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تحديث الحدود'
      });
    }
  }
};
