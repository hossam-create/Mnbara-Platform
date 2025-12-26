// Analytics Controller - متحكم التحليلات

import { Request, Response } from 'express';
import { arService } from '../services/ar.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await arService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await arService.getAnalytics(start, end);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTopProducts(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;

      const topProducts = await prisma.product3DModel.findMany({
        where: { status: 'READY' },
        orderBy: { arSessionCount: 'desc' },
        take: parseInt(limit as string),
        select: {
          productId: true,
          thumbnailUrl: true,
          viewCount: true,
          arSessionCount: true,
        },
      });

      res.json({ success: true, data: topProducts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
