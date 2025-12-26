// Forecast Controller - Gen 10 AI (95% Accuracy)
// متحكم التوقعات - الجيل العاشر

import { Request, Response } from 'express';
import { forecastService } from '../services/forecast.service';

export class ForecastController {
  // Get product forecast
  async getProductForecast(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { days } = req.query;

      const forecast = await forecastService.getProductForecast(
        productId,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        message: 'Forecast generated successfully',
        messageAr: 'تم إنشاء التوقعات بنجاح',
        data: forecast
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء إنشاء التوقعات'
      });
    }
  }

  // Get category forecast
  async getCategoryForecast(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const { region, days } = req.query;

      const forecast = await forecastService.getCategoryForecast(
        categoryId,
        region as string,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: forecast
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get AI-enhanced forecast
  async getAIEnhancedForecast(req: Request, res: Response) {
    try {
      const { productId, categoryId, region, includeWeather, includeEconomic, includeSocial } = req.body;
      const { days } = req.query;

      const forecast = await forecastService.getAIEnhancedForecast(
        {
          productId,
          categoryId,
          region,
          includeWeather,
          includeEconomic,
          includeSocial
        },
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        message: 'AI-enhanced forecast generated',
        messageAr: 'تم إنشاء التوقعات المعززة بالذكاء الاصطناعي',
        data: forecast
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update with actual data
  async updateWithActual(req: Request, res: Response) {
    try {
      const { forecastId } = req.params;
      const { actualDemand } = req.body;

      if (actualDemand === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Actual demand is required',
          messageAr: 'الطلب الفعلي مطلوب'
        });
      }

      const result = await forecastService.updateWithActual(forecastId, actualDemand);

      res.json({
        success: true,
        message: 'Forecast updated with actual data',
        messageAr: 'تم تحديث التوقعات بالبيانات الفعلية',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get accuracy metrics
  async getAccuracyMetrics(req: Request, res: Response) {
    try {
      const { productId, categoryId, days } = req.query;

      const metrics = await forecastService.getAccuracyMetrics(
        productId as string,
        categoryId as string,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get inventory recommendations
  async getInventoryRecommendations(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const recommendations = await forecastService.getInventoryRecommendations(productId);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const forecastController = new ForecastController();
