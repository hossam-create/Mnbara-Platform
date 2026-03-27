import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

// تسجيل كمؤثر
// Register as influencer
router.post('/register', async (req, res) => {
  try {
    const { influencerId, influencerName, commissionRate = 0.05 } = req.body;

    // Generate unique referral code
    const referralCode = `MNB-${influencerId.slice(0, 4).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    const campaign = await prisma.influencerCampaign.create({
      data: {
        influencerId,
        influencerName,
        referralCode,
        commissionRate,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم تسجيلك كمؤثر بنجاح! 🌟',
      data: {
        ...campaign,
        shareableLink: `https://mnbara.com/ref/${referralCode}`,
      },
    });
  } catch (error) {
    console.error('Error registering influencer:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تسجيل عملية شراء عبر رابط المؤثر
// Record a purchase via influencer referral
router.post('/referral', async (req, res) => {
  try {
    const { referralCode, buyerId, orderId, orderAmount } = req.body;

    const campaign = await prisma.influencerCampaign.findUnique({
      where: { referralCode },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'كود الإحالة غير صحيح' });
    }

    if (campaign.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'الحملة غير نشطة' });
    }

    const commission = orderAmount * campaign.commissionRate;

    const referral = await prisma.influencerReferral.create({
      data: {
        campaignId: campaign.id,
        buyerId,
        orderId,
        orderAmount,
        commission,
      },
    });

    // Update campaign totals
    await prisma.influencerCampaign.update({
      where: { id: campaign.id },
      data: {
        totalEarnings: { increment: commission },
        totalSales: { increment: 1 },
      },
    });

    res.json({
      success: true,
      message: 'تم تسجيل الإحالة',
      data: {
        referral,
        influencerEarned: commission,
      },
    });
  } catch (error) {
    console.error('Error recording referral:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على إحصائيات المؤثر
// Get influencer stats
router.get('/:influencerId/stats', async (req, res) => {
  try {
    const { influencerId } = req.params;

    const campaign = await prisma.influencerCampaign.findFirst({
      where: { influencerId },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على الحملة' });
    }

    const unpaidEarnings = await prisma.influencerReferral.aggregate({
      where: { campaignId: campaign.id, isPaid: false },
      _sum: { commission: true },
    });

    res.json({
      success: true,
      data: {
        campaign,
        unpaidEarnings: unpaidEarnings._sum.commission || 0,
        shareableLink: `https://mnbara.com/ref/${campaign.referralCode}`,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// طلب سحب الأرباح
// Request payout
router.post('/:influencerId/payout', async (req, res) => {
  try {
    const { influencerId } = req.params;

    const campaign = await prisma.influencerCampaign.findFirst({
      where: { influencerId },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'الحملة غير موجودة' });
    }

    const unpaidReferrals = await prisma.influencerReferral.findMany({
      where: { campaignId: campaign.id, isPaid: false },
    });

    if (unpaidReferrals.length === 0) {
      return res.status(400).json({ success: false, message: 'لا توجد أرباح للسحب' });
    }

    const totalPayout = unpaidReferrals.reduce((sum, r) => sum + r.commission, 0);

    // Mark as paid (in real implementation, this would trigger wallet transfer)
    await prisma.influencerReferral.updateMany({
      where: { campaignId: campaign.id, isPaid: false },
      data: { isPaid: true },
    });

    res.json({
      success: true,
      message: `تم تحويل ${totalPayout.toFixed(2)} إلى محفظتك! 💰`,
      data: {
        amount: totalPayout,
        referralsCount: unpaidReferrals.length,
      },
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// لوحة المتصدرين للمؤثرين
// Influencer leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topInfluencers = await prisma.influencerCampaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { totalSales: 'desc' },
      take: 20,
      select: {
        influencerName: true,
        totalSales: true,
        totalEarnings: true,
      },
    });

    res.json({
      success: true,
      data: topInfluencers,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
