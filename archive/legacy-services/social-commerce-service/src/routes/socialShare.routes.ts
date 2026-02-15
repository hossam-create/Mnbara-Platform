import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// مشاركة منتج على منصة اجتماعية
// Share a product on social platform
router.post('/', async (req, res) => {
  try {
    const { userId, productId, platform } = req.body;

    // Generate unique share URL
    const shareUrl = `https://mnbara.com/p/${productId}?ref=${userId}`;

    const share = await prisma.socialShare.create({
      data: {
        userId,
        productId,
        platform,
        shareUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء رابط المشاركة',
      data: {
        ...share,
        shareUrl,
      },
    });
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تسجيل نقرة على الرابط
// Track click on share link
router.post('/:shareId/click', async (req, res) => {
  try {
    const { shareId } = req.params;

    await prisma.socialShare.update({
      where: { id: shareId },
      data: { clicks: { increment: 1 } },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تسجيل تحويل (شراء بعد النقر)
// Track conversion (purchase after click)
router.post('/:shareId/conversion', async (req, res) => {
  try {
    const { shareId } = req.params;

    await prisma.socialShare.update({
      where: { id: shareId },
      data: { conversions: { increment: 1 } },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// إحصائيات المشاركة للمستخدم
// Get user's sharing stats
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const shares = await prisma.socialShare.findMany({
      where: { userId },
    });

    const stats = {
      totalShares: shares.length,
      totalClicks: shares.reduce((sum, s) => sum + s.clicks, 0),
      totalConversions: shares.reduce((sum, s) => sum + s.conversions, 0),
      byPlatform: {} as Record<string, number>,
    };

    shares.forEach((s) => {
      stats.byPlatform[s.platform] = (stats.byPlatform[s.platform] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
