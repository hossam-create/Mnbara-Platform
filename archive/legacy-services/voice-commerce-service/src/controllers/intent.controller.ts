// Intent Controller - متحكم النوايا

import { Request, Response } from 'express';
import { voiceService } from '../services/voice.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const intentController = {
  // Get all patterns
  async getPatterns(req: Request, res: Response) {
    try {
      const { intent, isEnabled } = req.query;

      const patterns = await prisma.intentPattern.findMany({
        where: {
          ...(intent && { intent: intent as any }),
          ...(isEnabled !== undefined && { isEnabled: isEnabled === 'true' }),
        },
        orderBy: [{ intent: 'asc' }, { priority: 'desc' }],
      });

      res.json({ success: true, data: patterns });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create pattern
  async createPattern(req: Request, res: Response) {
    try {
      const pattern = await prisma.intentPattern.create({ data: req.body });
      res.status(201).json({ success: true, data: pattern, message: 'Pattern created', messageAr: 'تم إنشاء النمط' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update pattern
  async updatePattern(req: Request, res: Response) {
    try {
      const { patternId } = req.params;
      const pattern = await prisma.intentPattern.update({
        where: { id: patternId },
        data: req.body,
      });
      res.json({ success: true, data: pattern, message: 'Pattern updated', messageAr: 'تم تحديث النمط' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete pattern
  async deletePattern(req: Request, res: Response) {
    try {
      const { patternId } = req.params;
      await prisma.intentPattern.delete({ where: { id: patternId } });
      res.json({ success: true, message: 'Pattern deleted', messageAr: 'تم حذف النمط' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Test intent recognition
  async recognizeIntent(req: Request, res: Response) {
    try {
      const { text, language } = req.body;
      
      // Use the voice service's intent recognition
      const result = await (voiceService as any).recognizeIntent(text, language || 'ar-SA');
      
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
