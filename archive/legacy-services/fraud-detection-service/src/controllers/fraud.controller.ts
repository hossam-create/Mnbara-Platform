// Fraud Controller - متحكم كشف الاحتيال

import { Request, Response } from 'express';
import { fraudService } from '../services/fraud.service';

export const fraudController = {
  // Analyze Transaction
  async analyzeTransaction(req: Request, res: Response) {
    try {
      const result = await fraudService.analyzeTransaction(req.body);
      res.json({
        success: true,
        data: result,
        message: result.decision === 'APPROVED' ? 'Transaction approved' : 'Transaction requires attention',
        messageAr: result.decision === 'APPROVED' ? 'تمت الموافقة على المعاملة' : 'المعاملة تحتاج مراجعة',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get Transaction Risk
  async getTransactionRisk(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const risk = await prisma.transactionRisk.findUnique({
        where: { transactionId },
      });

      if (!risk) {
        return res.status(404).json({ success: false, error: 'Transaction not found', errorAr: 'المعاملة غير موجودة' });
      }

      res.json({ success: true, data: risk });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get User Risk Profile
  async getUserRiskProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const profile = await fraudService.getUserRiskProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update User Risk Profile
  async updateUserRiskProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const profile = await fraudService.updateUserRiskProfile(userId, req.body);
      res.json({ success: true, data: profile, message: 'Profile updated', messageAr: 'تم تحديث الملف' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Add Known Device
  async addKnownDevice(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { deviceId } = req.body;
      await fraudService.addKnownDevice(userId, deviceId);
      res.json({ success: true, message: 'Device added', messageAr: 'تمت إضافة الجهاز' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Add Known Location
  async addKnownLocation(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { location } = req.body;
      await fraudService.addKnownLocation(userId, location);
      res.json({ success: true, message: 'Location added', messageAr: 'تمت إضافة الموقع' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get Dashboard Stats
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await fraudService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get Metrics
  async getMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const metrics = await fraudService.getMetrics(start, end);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
