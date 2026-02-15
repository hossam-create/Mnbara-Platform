// Alert Controller - متحكم التنبيهات

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const alertController = {
  async getAlerts(req: Request, res: Response) {
    try {
      const { status, severity, alertType, page = '1', limit = '20' } = req.query;

      const [alerts, total] = await Promise.all([
        prisma.forecastAlert.findMany({
          where: {
            ...(status && { status: status as any }),
            ...(severity && { severity: severity as any }),
            ...(alertType && { alertType: alertType as any }),
          },
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.forecastAlert.count({
          where: {
            ...(status && { status: status as any }),
            ...(severity && { severity: severity as any }),
          },
        }),
      ]);

      res.json({ success: true, data: alerts, total, page: parseInt(page as string), limit: parseInt(limit as string) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const alert = await prisma.forecastAlert.findUnique({ where: { id: alertId } });
      
      if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found', errorAr: 'التنبيه غير موجود' });
      }

      res.json({ success: true, data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async acknowledgeAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;

      const alert = await prisma.forecastAlert.update({
        where: { id: alertId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedBy,
          acknowledgedAt: new Date(),
        },
      });

      res.json({ success: true, data: alert, message: 'Alert acknowledged', messageAr: 'تم الإقرار بالتنبيه' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async dismissAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;

      const alert = await prisma.forecastAlert.update({
        where: { id: alertId },
        data: { status: 'DISMISSED' },
      });

      res.json({ success: true, data: alert, message: 'Alert dismissed', messageAr: 'تم تجاهل التنبيه' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
