// Blacklist Controller - متحكم القائمة السوداء

import { Request, Response } from 'express';
import { fraudService } from '../services/fraud.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const blacklistController = {
  // Get Blacklist
  async getBlacklist(req: Request, res: Response) {
    try {
      const { entryType, isActive, page = '1', limit = '50' } = req.query;

      const where: any = {};
      if (entryType) where.entryType = entryType;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [entries, total] = await Promise.all([
        prisma.blacklist.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
        }),
        prisma.blacklist.count({ where }),
      ]);

      res.json({
        success: true,
        data: entries,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Add to Blacklist
  async addToBlacklist(req: Request, res: Response) {
    try {
      const { entryType, value, reason, reasonAr, source, relatedAlertId, expiresAt, addedBy } = req.body;

      const entry = await fraudService.addToBlacklist({
        entryType,
        value,
        reason,
        reasonAr,
        source: source || 'manual',
        relatedAlertId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        addedBy,
      });

      res.json({ 
        success: true, 
        data: entry, 
        message: 'Added to blacklist',
        messageAr: 'تمت الإضافة للقائمة السوداء',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Remove from Blacklist
  async removeFromBlacklist(req: Request, res: Response) {
    try {
      const { entryType, value } = req.params;

      await fraudService.removeFromBlacklist(entryType as any, decodeURIComponent(value));

      res.json({ 
        success: true, 
        message: 'Removed from blacklist',
        messageAr: 'تمت الإزالة من القائمة السوداء',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Check Blacklist
  async checkBlacklist(req: Request, res: Response) {
    try {
      const { entryType, value } = req.params;

      const isBlacklisted = await fraudService.checkBlacklist(entryType as any, decodeURIComponent(value));

      res.json({ 
        success: true, 
        data: { isBlacklisted },
        message: isBlacklisted ? 'Entry is blacklisted' : 'Entry is not blacklisted',
        messageAr: isBlacklisted ? 'العنصر في القائمة السوداء' : 'العنصر ليس في القائمة السوداء',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
