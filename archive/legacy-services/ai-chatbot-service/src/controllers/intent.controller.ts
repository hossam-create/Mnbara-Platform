// Intent Controller - متحكم النوايا

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const intentController = {
  async getIntents(req: Request, res: Response) {
    try {
      const { category, enabled } = req.query;
      const where: any = {};
      
      if (category) where.category = category;
      if (enabled !== undefined) where.isEnabled = enabled === 'true';

      const intents = await prisma.intent.findMany({
        where,
        include: { responses: true },
        orderBy: { matchCount: 'desc' },
      });

      res.json({ success: true, data: intents });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getIntent(req: Request, res: Response) {
    try {
      const intent = await prisma.intent.findUnique({
        where: { id: req.params.intentId },
        include: { responses: { orderBy: { priority: 'desc' } } },
      });

      if (!intent) {
        return res.status(404).json({ success: false, error: 'Intent not found', errorAr: 'النية غير موجودة' });
      }

      res.json({ success: true, data: intent });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createIntent(req: Request, res: Response) {
    try {
      const { name, nameAr, description, descriptionAr, category, trainingPhrases, trainingPhrasesAr, action, actionParams, minConfidence } = req.body;

      const intent = await prisma.intent.create({
        data: {
          name,
          nameAr,
          description,
          descriptionAr,
          category,
          trainingPhrases: trainingPhrases || [],
          trainingPhrasesAr: trainingPhrasesAr || [],
          action,
          actionParams,
          minConfidence: minConfidence || 0.7,
        },
      });

      res.status(201).json({ success: true, data: intent, message: 'Intent created', messageAr: 'تم إنشاء النية' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateIntent(req: Request, res: Response) {
    try {
      const { name, nameAr, description, descriptionAr, category, trainingPhrases, trainingPhrasesAr, action, actionParams, minConfidence, isEnabled } = req.body;

      const intent = await prisma.intent.update({
        where: { id: req.params.intentId },
        data: {
          name,
          nameAr,
          description,
          descriptionAr,
          category,
          trainingPhrases,
          trainingPhrasesAr,
          action,
          actionParams,
          minConfidence,
          isEnabled,
        },
      });

      res.json({ success: true, data: intent, message: 'Intent updated', messageAr: 'تم تحديث النية' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteIntent(req: Request, res: Response) {
    try {
      await prisma.intentResponse.deleteMany({ where: { intentId: req.params.intentId } });
      await prisma.intent.delete({ where: { id: req.params.intentId } });

      res.json({ success: true, message: 'Intent deleted', messageAr: 'تم حذف النية' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addResponse(req: Request, res: Response) {
    try {
      const { response, responseAr, conditions, priority } = req.body;

      const intentResponse = await prisma.intentResponse.create({
        data: {
          intentId: req.params.intentId,
          response,
          responseAr,
          conditions,
          priority: priority || 0,
        },
      });

      res.status(201).json({ success: true, data: intentResponse, message: 'Response added', messageAr: 'تم إضافة الرد' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
