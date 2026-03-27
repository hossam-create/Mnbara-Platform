// Forecast Controller - متحكم التنبؤ

import { Request, Response } from 'express';
import { forecastService } from '../services/forecast.service';

export const forecastController = {
  async generateForecast(req: Request, res: Response) {
    try {
      const { targetType, targetId, periodType, periodsAhead } = req.body;
      const forecasts = await forecastService.generateForecast(targetType, targetId, periodType, periodsAhead);
      res.json({ success: true, data: forecasts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getForecasts(req: Request, res: Response) {
    try {
      const { targetType, targetId } = req.params;
      const { periodType, startDate, endDate } = req.query;
      
      const forecasts = await forecastService.getForecasts(
        targetType as any,
        targetId,
        periodType as any,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json({ success: true, data: forecasts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async analyzeTrend(req: Request, res: Response) {
    try {
      const { targetType, targetId } = req.params;
      const trend = await forecastService.analyzeTrend(targetType as any, targetId);
      res.json({ success: true, data: trend });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async recordSales(req: Request, res: Response) {
    try {
      const result = await forecastService.recordSales(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getModelPerformance(req: Request, res: Response) {
    try {
      const performance = await forecastService.evaluateModelPerformance();
      res.json({ success: true, data: performance });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
