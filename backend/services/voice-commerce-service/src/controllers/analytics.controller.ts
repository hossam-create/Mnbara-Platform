// Analytics Controller - متحكم التحليلات

import { Request, Response } from 'express';
import { voiceService } from '../services/voice.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsController = {
  // Get dashboard stats
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await voiceService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get metrics
  async getMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await voiceService.getAnalytics(start, end);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get intent report
  async getIntentReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const intents = await prisma.voiceCommand.groupBy({
        by: ['intent'],
        where: { createdAt: { gte: start, lte: end } },
        _count: true,
      });

      const total = intents.reduce((sum, i) => sum + i._count, 0);
      const report = intents.map(i => ({
        intent: i.intent,
        count: i._count,
        percentage: ((i._count / total) * 100).toFixed(1),
      }));

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get language report
  async getLanguageReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await prisma.voiceAnalytics.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: {
          arabicCount: true,
          englishCount: true,
          otherCount: true,
        },
      });

      const total = (analytics._sum.arabicCount || 0) + (analytics._sum.englishCount || 0) + (analytics._sum.otherCount || 0);

      res.json({
        success: true,
        data: {
          arabic: { count: analytics._sum.arabicCount || 0, percentage: total ? ((analytics._sum.arabicCount || 0) / total * 100).toFixed(1) : 0 },
          english: { count: analytics._sum.englishCount || 0, percentage: total ? ((analytics._sum.englishCount || 0) / total * 100).toFixed(1) : 0 },
          other: { count: analytics._sum.otherCount || 0, percentage: total ? ((analytics._sum.otherCount || 0) / total * 100).toFixed(1) : 0 },
          total,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
