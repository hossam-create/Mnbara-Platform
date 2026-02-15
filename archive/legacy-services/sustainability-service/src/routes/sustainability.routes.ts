import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// الحصول على نقاط الاستدامة للمستخدم
// Get user's sustainability score
router.get('/score/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let score = await prisma.sustainabilityScore.findUnique({ where: { userId } });

    if (!score) {
      score = await prisma.sustainabilityScore.create({
        data: { userId },
      });
    }

    const levelInfo = {
      SEEDLING: { name: 'بذرة 🌱', min: 0, max: 100, nextLevel: 'SAPLING' },
      SAPLING: { name: 'شتلة 🌿', min: 101, max: 500, nextLevel: 'TREE' },
      TREE: { name: 'شجرة 🌳', min: 501, max: 2000, nextLevel: 'FOREST' },
      FOREST: { name: 'غابة 🌲', min: 2001, max: 10000, nextLevel: 'ECOSYSTEM' },
      ECOSYSTEM: { name: 'نظام بيئي 🌍', min: 10001, max: Infinity, nextLevel: null },
    };

    const currentLevelInfo = levelInfo[score.level];
    const progress = ((score.totalScore - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min)) * 100;

    res.json({
      success: true,
      data: {
        ...score,
        levelName: currentLevelInfo.name,
        progress: Math.min(progress, 100),
        pointsToNextLevel: currentLevelInfo.max - score.totalScore,
        nextLevel: currentLevelInfo.nextLevel,
      },
    });
  } catch (error) {
    console.error('Error fetching score:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// لوحة المتصدرين
// Sustainability leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const leaders = await prisma.sustainabilityScore.findMany({
      orderBy: { totalScore: 'desc' },
      take: parseInt(limit as string),
      select: {
        userId: true,
        totalScore: true,
        level: true,
        carbonSavedKg: true,
        treesEquivalent: true,
      },
    });

    res.json({
      success: true,
      data: leaders,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// مكافآت المستخدم
// Get user's eco rewards
router.get('/rewards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { available = 'true' } = req.query;

    const rewards = await prisma.ecoReward.findMany({
      where: {
        userId,
        ...(available === 'true' && { isRedeemed: false }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// استخدام مكافأة
// Redeem a reward
router.post('/rewards/:rewardId/redeem', async (req, res) => {
  try {
    const { rewardId } = req.params;

    const reward = await prisma.ecoReward.findUnique({ where: { id: rewardId } });

    if (!reward) {
      return res.status(404).json({ success: false, message: 'المكافأة غير موجودة' });
    }

    if (reward.isRedeemed) {
      return res.status(400).json({ success: false, message: 'تم استخدام هذه المكافأة مسبقاً' });
    }

    if (reward.expiresAt && new Date() > reward.expiresAt) {
      return res.status(400).json({ success: false, message: 'انتهت صلاحية هذه المكافأة' });
    }

    const updatedReward = await prisma.ecoReward.update({
      where: { id: rewardId },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'تم استخدام المكافأة بنجاح! 🎉',
      data: updatedReward,
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// إحصائيات المنصة الإجمالية
// Platform-wide sustainability stats
router.get('/platform-stats', async (req, res) => {
  try {
    const totalUsers = await prisma.sustainabilityScore.count();
    const totalCarbon = await prisma.sustainabilityScore.aggregate({
      _sum: { carbonSavedKg: true },
    });
    const totalTrees = await prisma.sustainabilityScore.aggregate({
      _sum: { treesEquivalent: true },
    });
    const secondLifeItems = await prisma.secondLifeListing.count({ where: { status: 'SOLD' } });

    res.json({
      success: true,
      data: {
        totalEcoUsers: totalUsers,
        totalCarbonSavedKg: totalCarbon._sum.carbonSavedKg || 0,
        totalTreesEquivalent: Math.floor(totalTrees._sum.treesEquivalent || 0),
        itemsGivenNewLife: secondLifeItems,
      },
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
