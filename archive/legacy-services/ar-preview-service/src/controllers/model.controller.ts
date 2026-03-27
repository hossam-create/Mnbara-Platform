// Model Controller - متحكم النماذج

import { Request, Response } from 'express';
import { arService } from '../services/ar.service';

export const modelController = {
  async getModels(req: Request, res: Response) {
    try {
      const { status, page, limit } = req.query;
      const result = await arService.getModels({
        status: status as any,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getModel(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const model = await arService.getModel(productId);
      
      if (!model) {
        return res.status(404).json({ success: false, error: 'Model not found', errorAr: 'النموذج غير موجود' });
      }

      res.json({ success: true, data: model });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createModel(req: Request, res: Response) {
    try {
      const model = await arService.createModel(req.body);
      res.status(201).json({ success: true, data: model, message: 'Model created', messageAr: 'تم إنشاء النموذج' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateModel(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const model = await prisma.product3DModel.update({
        where: { productId },
        data: req.body,
      });
      res.json({ success: true, data: model, message: 'Model updated', messageAr: 'تم تحديث النموذج' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteModel(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      await arService.updateModelStatus(productId, 'ARCHIVED');
      res.json({ success: true, message: 'Model archived', messageAr: 'تم أرشفة النموذج' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { status, error } = req.body;
      const model = await arService.updateModelStatus(productId, status, error);
      res.json({ success: true, data: model });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async trackView(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      await arService.incrementViewCount(productId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
