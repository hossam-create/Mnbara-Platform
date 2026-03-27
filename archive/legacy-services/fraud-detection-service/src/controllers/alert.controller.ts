// Alert Controller - متحكم التنبيهات

import { Request, Response } from 'express';
import { fraudService } from '../services/fraud.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const alertController = {
  // Get Alerts
  async getAlerts(req: Request, res: Response) {
    try {
      const { status, severity, targetType, startDate, endDate, page, limit } = req.query;
      
      const result = await fraudService.getAlerts({
        status: status as any,
        severity: severity as any,
        targetType: targetType as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get Single Alert
  async getAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const alert = await prisma.fraudAlert.findUnique({ where: { id: alertId } });

      if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found', errorAr: 'التنبيه غير موجود' });
      }

      res.json({ success: true, data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Review Alert
  async reviewAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const { status, resolution, reviewedBy, actionsTaken } = req.body;

      const alert = await fraudService.reviewAlert(alertId, {
        status,
        resolution,
        reviewedBy,
        actionsTaken,
      });

      res.json({ success: true, data: alert, message: 'Alert reviewed', messageAr: 'تمت مراجعة التنبيه' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Escalate Alert
  async escalateAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const { escalatedBy, reason } = req.body;

      const alert = await prisma.fraudAlert.update({
        where: { id: alertId },
        data: {
          status: 'ESCALATED',
          actionsTaken: { push: `Escalated by ${escalatedBy}: ${reason}` },
        },
      });

      res.json({ success: true, data: alert, message: 'Alert escalated', messageAr: 'تم تصعيد التنبيه' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Bulk Review Alerts
  async bulkReviewAlerts(req: Request, res: Response) {
    try {
      const { alertIds, status, resolution, reviewedBy } = req.body;

      const result = await prisma.fraudAlert.updateMany({
        where: { id: { in: alertIds } },
        data: {
          status,
          resolution,
          reviewedBy,
          reviewedAt: new Date(),
        },
      });

      res.json({ 
        success: true, 
        data: { updated: result.count }, 
        message: `${result.count} alerts reviewed`,
        messageAr: `تمت مراجعة ${result.count} تنبيه`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
