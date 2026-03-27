// Showroom Controller - متحكم صالة العرض

import { Request, Response } from 'express';
import { showroomService } from '../services/showroom.service';

export const showroomController = {
  async getShowrooms(req: Request, res: Response) {
    try {
      const result = await showroomService.getShowrooms(req.query as any);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getShowroom(req: Request, res: Response) {
    try {
      const showroom = await showroomService.getShowroom(req.params.showroomId);
      if (!showroom) {
        return res.status(404).json({ success: false, error: 'Showroom not found', errorAr: 'صالة العرض غير موجودة' });
      }
      res.json({ success: true, data: showroom });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createShowroom(req: Request, res: Response) {
    try {
      const showroom = await showroomService.createShowroom(req.body);
      res.status(201).json({ success: true, data: showroom, message: 'Showroom created', messageAr: 'تم إنشاء صالة العرض' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateShowroom(req: Request, res: Response) {
    try {
      const showroom = await showroomService.updateShowroom(req.params.showroomId, req.body);
      res.json({ success: true, data: showroom, message: 'Showroom updated', messageAr: 'تم تحديث صالة العرض' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async publishShowroom(req: Request, res: Response) {
    try {
      const showroom = await showroomService.publishShowroom(req.params.showroomId);
      res.json({ success: true, data: showroom, message: 'Showroom published', messageAr: 'تم نشر صالة العرض' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addProduct(req: Request, res: Response) {
    try {
      const product = await showroomService.addProduct(req.params.showroomId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateProductPosition(req: Request, res: Response) {
    try {
      const product = await showroomService.updateProductPosition(req.params.productId, req.body);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async removeProduct(req: Request, res: Response) {
    try {
      await showroomService.removeProduct(req.params.productId);
      res.json({ success: true, message: 'Product removed', messageAr: 'تم إزالة المنتج' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async trackInteraction(req: Request, res: Response) {
    try {
      const { action } = req.body;
      await showroomService.trackProductInteraction(req.params.productId, action);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await showroomService.getAnalytics(
        req.params.showroomId,
        startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate ? new Date(endDate as string) : new Date()
      );
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getDashboardStats(req: Request, res: Response) {
    try {
      const { showroomId } = req.query;
      const stats = await showroomService.getDashboardStats(showroomId as string);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
