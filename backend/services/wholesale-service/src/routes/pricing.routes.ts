// Pricing Routes - Wholesale B2B
// مسارات التسعير - البيع بالجملة

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get supplier pricing tiers
router.get('/supplier/:supplierId/tiers', async (req, res) => {
  try {
    const tiers = await prisma.pricingTier.findMany({
      where: { supplierId: req.params.supplierId, isActive: true },
      orderBy: { priority: 'asc' }
    });
    res.json({ success: true, data: tiers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create pricing tier
router.post('/supplier/:supplierId/tiers', async (req, res) => {
  try {
    const tier = await prisma.pricingTier.create({
      data: {
        supplierId: req.params.supplierId,
        ...req.body
      }
    });
    res.status(201).json({
      success: true,
      message: 'Pricing tier created',
      messageAr: 'تم إنشاء مستوى السعر',
      data: tier
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update pricing tier
router.put('/tiers/:id', async (req, res) => {
  try {
    const tier = await prisma.pricingTier.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({
      success: true,
      message: 'Pricing tier updated',
      messageAr: 'تم تحديث مستوى السعر',
      data: tier
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete pricing tier
router.delete('/tiers/:id', async (req, res) => {
  try {
    await prisma.pricingTier.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({
      success: true,
      message: 'Pricing tier deleted',
      messageAr: 'تم حذف مستوى السعر'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
