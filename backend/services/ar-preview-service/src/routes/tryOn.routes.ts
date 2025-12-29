import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// إنشاء جلسة تجربة افتراضية
// Create a virtual try-on session
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      productId,
      productName,
      productCategory,
      productImageUrl,
      userPhotoUrl,
      measurements,
    } = req.body;

    const tryOn = await prisma.virtualTryOn.create({
      data: {
        userId,
        productId,
        productName,
        productCategory,
        productImageUrl,
        userPhotoUrl,
        measurements,
        processingStatus: 'PROCESSING',
      },
    });

    // In a real implementation, this would trigger an async AI job
    // For now, we simulate processing completion after creation
    setTimeout(async () => {
      await prisma.virtualTryOn.update({
        where: { id: tryOn.id },
        data: {
          processingStatus: 'COMPLETED',
          resultImageUrl: `https://ai.mnbara.com/tryon/results/${tryOn.id}.jpg`,
          processingTime: Math.floor(Math.random() * 3000) + 1000,
          confidenceScore: 0.85 + Math.random() * 0.15,
        },
      });
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'جاري معالجة صورة التجربة... ⏳',
      data: tryOn,
    });
  } catch (error) {
    console.error('Error creating try-on:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على نتيجة التجربة
// Get try-on result
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tryOn = await prisma.virtualTryOn.findUnique({ where: { id } });

    if (!tryOn) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على الجلسة' });
    }

    res.json({
      success: true,
      data: tryOn,
      isReady: tryOn.processingStatus === 'COMPLETED',
    });
  } catch (error) {
    console.error('Error fetching try-on:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تقييم نتيجة التجربة
// Rate try-on result
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    const tryOn = await prisma.virtualTryOn.update({
      where: { id },
      data: {
        userRating: rating,
        userFeedback: feedback,
      },
    });

    res.json({
      success: true,
      message: 'شكراً لتقييمك! 🙏',
      data: tryOn,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// إضافة للسلة بعد التجربة
// Add to cart after try-on
router.post('/:id/add-to-cart', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.virtualTryOn.update({
      where: { id },
      data: { addedToCart: true },
    });

    res.json({
      success: true,
      message: 'تمت الإضافة للسلة! 🛒',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// مشاركة النتيجة
// Share try-on result
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;

    const tryOn = await prisma.virtualTryOn.update({
      where: { id },
      data: { sharedOnSocial: true },
    });

    res.json({
      success: true,
      message: 'تم إنشاء رابط المشاركة!',
      shareUrl: `https://mnbara.com/tryon/${id}`,
    });
  } catch (error) {
    console.error('Error sharing:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// سجل تجارب المستخدم
// Get user's try-on history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const history = await prisma.virtualTryOn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// إحصائيات التحويل
// Try-on conversion stats
router.get('/stats/conversion', async (req, res) => {
  try {
    const total = await prisma.virtualTryOn.count();
    const addedToCart = await prisma.virtualTryOn.count({ where: { addedToCart: true } });
    const purchased = await prisma.virtualTryOn.count({ where: { purchased: true } });
    const shared = await prisma.virtualTryOn.count({ where: { sharedOnSocial: true } });

    res.json({
      success: true,
      data: {
        totalTryOns: total,
        addToCartRate: total > 0 ? (addedToCart / total * 100).toFixed(1) : 0,
        purchaseRate: total > 0 ? (purchased / total * 100).toFixed(1) : 0,
        shareRate: total > 0 ? (shared / total * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
