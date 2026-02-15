import { Request, Response } from 'express';
import { exchangeService } from '../services/exchange.service';
import { CryptoCurrency } from '@prisma/client';

export const exchangeController = {
  // الحصول على جميع الأسعار - Get all rates
  async getAllRates(req: Request, res: Response) {
    try {
      const rates = await exchangeService.getCurrentRates();

      res.json({
        success: true,
        data: {
          rates,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على الأسعار'
      });
    }
  },

  // الحصول على سعر عملة محددة - Get specific rate
  async getRate(req: Request, res: Response) {
    try {
      const { currency } = req.params;

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency. Supported: BTC, ETH, USDC, USDT',
          messageAr: 'عملة غير صالحة'
        });
      }

      const rate = await exchangeService.getRate(currency as CryptoCurrency);

      res.json({
        success: true,
        data: rate
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على السعر'
      });
    }
  },

  // تحويل بين العملات - Convert currencies
  async convert(req: Request, res: Response) {
    try {
      const { from, to, amount } = req.body;

      if (!from || !to || !amount) {
        return res.status(400).json({
          success: false,
          message: 'from, to, and amount are required',
          messageAr: 'العملة المصدر والهدف والمبلغ مطلوبة'
        });
      }

      const validCurrencies = ['BTC', 'ETH', 'USDC', 'USDT', 'USD'];
      if (!validCurrencies.includes(from) || !validCurrencies.includes(to)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency. Supported: BTC, ETH, USDC, USDT, USD',
          messageAr: 'عملة غير صالحة'
        });
      }

      const conversion = await exchangeService.convert(
        from as CryptoCurrency | 'USD',
        to as CryptoCurrency | 'USD',
        parseFloat(amount)
      );

      res.json({
        success: true,
        data: conversion
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في التحويل'
      });
    }
  },

  // الحصول على تاريخ الأسعار - Get price history
  async getPriceHistory(req: Request, res: Response) {
    try {
      const { currency } = req.params;
      const { days } = req.query;

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency',
          messageAr: 'عملة غير صالحة'
        });
      }

      const history = await exchangeService.getPriceHistory(
        currency as CryptoCurrency,
        days ? parseInt(days as string) : 7
      );

      res.json({
        success: true,
        data: {
          currency,
          history,
          period: `${days || 7} days`
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على التاريخ'
      });
    }
  },

  // الحصول على رسوم الشبكة - Get network fees
  async getNetworkFees(req: Request, res: Response) {
    try {
      const { currency } = req.params;

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency',
          messageAr: 'عملة غير صالحة'
        });
      }

      const fees = await exchangeService.getNetworkFee(currency as CryptoCurrency);

      res.json({
        success: true,
        data: fees
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على الرسوم'
      });
    }
  }
};
