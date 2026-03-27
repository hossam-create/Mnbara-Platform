// Price Optimization Controller - Gen 10 AI
// متحكم تحسين الأسعار - الجيل العاشر

import { Request, Response } from 'express';
import { priceService } from '../services/price.service';

export class PriceController {
  // Optimize price
  async optimizePrice(req: Request, res: Response) {
    try {
      const { productId, currentPrice, cost, competitorPrices, historicalSales, targetMargin } = req.body;

      if (!productId || !currentPrice) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and current price are required',
          messageAr: 'معرف المنتج والسعر الحالي مطلوبان'
        });
      }

      const optimization = await priceService.optimizePrice({
        productId,
        currentPrice,
        cost,
        competitorPrices,
        historicalSales,
        targetMargin
      });

      res.json({
        success: true,
        message: 'Price optimized successfully',
        messageAr: 'تم تحسين السعر بنجاح',
        data: optimization
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء تحسين السعر'
      });
    }
  }

  // Batch optimize
  async batchOptimize(req: Request, res: Response) {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products)) {
        return res.status(400).json({
          success: false,
          message: 'Products array is required',
          messageAr: 'مصفوفة المنتجات مطلوبة'
        });
      }

      const result = await priceService.batchOptimize(products);

      res.json({
        success: true,
        message: 'Batch optimization completed',
        messageAr: 'تم إكمال التحسين الجماعي',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get dynamic price
  async getDynamicPrice(req: Request, res: Response) {
    try {
      const { productId, basePrice, currentInventory, demandLevel, timeOfDay, dayOfWeek, isHoliday } = req.body;

      if (!productId || !basePrice) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and base price are required',
          messageAr: 'معرف المنتج والسعر الأساسي مطلوبان'
        });
      }

      const dynamicPrice = await priceService.getDynamicPrice({
        productId,
        basePrice,
        currentInventory: currentInventory || 50,
        demandLevel: demandLevel || 'medium',
        timeOfDay,
        dayOfWeek,
        isHoliday
      });

      res.json({
        success: true,
        data: dynamicPrice
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Apply optimization
  async applyOptimization(req: Request, res: Response) {
    try {
      const { optimizationId } = req.params;

      const result = await priceService.applyOptimization(optimizationId);

      res.json({
        success: true,
        message: 'Optimization applied successfully',
        messageAr: 'تم تطبيق التحسين بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get price analytics
  async getPriceAnalytics(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { days } = req.query;

      const analytics = await priceService.getPriceAnalytics(
        productId,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create A/B test
  async createPriceTest(req: Request, res: Response) {
    try {
      const { productId, priceA, priceB, duration } = req.body;

      if (!productId || !priceA || !priceB) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and both prices are required',
          messageAr: 'معرف المنتج وكلا السعرين مطلوبان'
        });
      }

      const test = await priceService.createPriceTest({
        productId,
        priceA,
        priceB,
        duration: duration || 7
      });

      res.json({
        success: true,
        data: test
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Monitor competitor prices
  async monitorCompetitors(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { competitors } = req.body;

      const monitoring = await priceService.monitorCompetitorPrices(
        productId,
        competitors || []
      );

      res.json({
        success: true,
        data: monitoring
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const priceController = new PriceController();
