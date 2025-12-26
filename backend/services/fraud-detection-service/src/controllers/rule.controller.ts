// Rule Controller - متحكم القواعد

import { Request, Response } from 'express';
import { fraudService } from '../services/fraud.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ruleController = {
  // Get Rules
  async getRules(req: Request, res: Response) {
    try {
      const { ruleType, isEnabled } = req.query;

      const rules = await fraudService.getRules({
        ruleType: ruleType as any,
        isEnabled: isEnabled !== undefined ? isEnabled === 'true' : undefined,
      });

      res.json({ success: true, data: rules });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create Rule
  async createRule(req: Request, res: Response) {
    try {
      const rule = await fraudService.createRule(req.body);

      res.status(201).json({ 
        success: true, 
        data: rule, 
        message: 'Rule created',
        messageAr: 'تم إنشاء القاعدة',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update Rule
  async updateRule(req: Request, res: Response) {
    try {
      const { ruleId } = req.params;
      const rule = await fraudService.updateRule(ruleId, req.body);

      res.json({ 
        success: true, 
        data: rule, 
        message: 'Rule updated',
        messageAr: 'تم تحديث القاعدة',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete Rule
  async deleteRule(req: Request, res: Response) {
    try {
      const { ruleId } = req.params;
      
      await prisma.fraudRule.delete({ where: { id: ruleId } });

      res.json({ 
        success: true, 
        message: 'Rule deleted',
        messageAr: 'تم حذف القاعدة',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Toggle Rule
  async toggleRule(req: Request, res: Response) {
    try {
      const { ruleId } = req.params;
      
      const rule = await prisma.fraudRule.findUnique({ where: { id: ruleId } });
      if (!rule) {
        return res.status(404).json({ success: false, error: 'Rule not found', errorAr: 'القاعدة غير موجودة' });
      }

      const updated = await prisma.fraudRule.update({
        where: { id: ruleId },
        data: { isEnabled: !rule.isEnabled },
      });

      res.json({ 
        success: true, 
        data: updated, 
        message: updated.isEnabled ? 'Rule enabled' : 'Rule disabled',
        messageAr: updated.isEnabled ? 'تم تفعيل القاعدة' : 'تم تعطيل القاعدة',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
