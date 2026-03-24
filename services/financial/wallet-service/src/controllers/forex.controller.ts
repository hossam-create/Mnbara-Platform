import { Request, Response } from 'express';
import { forexService } from '../services/forex.service';
import { Currency } from '@prisma/client';

export const forexController = {
  // الحصول على جميع الأسعار - Get all rates
  async getAllRates(req: Request, res: Response) {
    try {
      const { baseCurrency } = req.query;

      const rates = await forexService.getAllRates(
        (baseCurrency as Currency) || 'USD'
      );

      res.json({
        success: true,
        data: {
          baseCurrency: baseCurrency || 'USD',
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

  // الحصول على سعر محدد - Get specific rate
  async getRate(req: Request, res: Response) {
    try {
      const { baseCurrency, quoteCurrency } = req.params;

      const rate = await forexService.getRate(
        baseCurrency as Currency,
        quoteCurrency as Currency
      );

      res.json({
        success: true,
        data: rate
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على السعر'
      });
    }
  },

  // تحويل مبلغ - Convert amount
  async convert(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;

      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'fromCurrency, toCurrency, and amount are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const conversion = await forexService.convert(
        fromCurrency as Currency,
        toCurrency as Currency,
        parseFloat(amount)
      );

      res.json({
        success: true,
        data: conversion
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في التحويل'
      });
    }
  },

  // الحصول على تاريخ الأسعار - Get rate history
  async getRateHistory(req: Request, res: Response) {
    try {
      const { baseCurrency, quoteCurrency } = req.params;
      const { days } = req.query;

      const history = await forexService.getRateHistory(
        baseCurrency as Currency,
        quoteCurrency as Currency,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: {
          baseCurrency,
          quoteCurrency,
          history,
          period: `${days || 30} days`
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على التاريخ'
      });
    }
  },

  // الحصول على أفضل سعر - Get best rate
  async getBestRate(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency, amount } = req.query;

      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'fromCurrency, toCurrency, and amount are required',
          messageAr: 'جميع الحقول مطلوبة'
        });
      }

      const bestRate = await forexService.getBestRate(
        fromCurrency as Currency,
        toCurrency as Currency,
        parseFloat(amount as string)
      );

      res.json({
        success: true,
        data: bestRate
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على أفضل سعر'
      });
    }
  }
};
