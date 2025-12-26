// Config Routes - System Configuration API
// مسارات الإعدادات - واجهة برمجة إعدادات النظام

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// ⚙️ SYSTEM CONFIG
// ==========================================

// Get config by key
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: req.params.key }
    });
    
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Config not found',
        messageAr: 'الإعداد غير موجود'
      });
      return;
    }
    
    // Hide secret values
    if (config.isSecret) {
      res.json({
        success: true,
        data: {
          ...config,
          value: '***HIDDEN***'
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// List configs by category
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    const configs = await prisma.systemConfig.findMany({
      where: category ? { category: category as string } : undefined,
      orderBy: { key: 'asc' }
    });
    
    // Hide secret values
    const safeConfigs = configs.map(c => ({
      ...c,
      value: c.isSecret ? '***HIDDEN***' : c.value
    }));
    
    res.json({
      success: true,
      data: safeConfigs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Set config
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const adminId = req.headers['x-admin-id'] as string || 'system';
    const { value, description, isSecret } = req.body;
    
    const config = await prisma.systemConfig.upsert({
      where: { key: req.params.key },
      create: {
        key: req.params.key,
        value,
        category: req.body.category || 'general',
        description,
        isSecret: isSecret || false,
        updatedBy: adminId
      },
      update: {
        value,
        description,
        isSecret,
        updatedBy: adminId
      }
    });
    
    res.json({
      success: true,
      message: 'Config updated successfully',
      messageAr: 'تم تحديث الإعداد بنجاح',
      data: {
        ...config,
        value: config.isSecret ? '***HIDDEN***' : config.value
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete config
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { key: req.params.key }
    });
    
    res.json({
      success: true,
      message: 'Config deleted successfully',
      messageAr: 'تم حذف الإعداد بنجاح'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all categories
router.get('/categories/list', async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      select: { category: true },
      distinct: ['category']
    });
    
    res.json({
      success: true,
      data: configs.map(c => c.category)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
