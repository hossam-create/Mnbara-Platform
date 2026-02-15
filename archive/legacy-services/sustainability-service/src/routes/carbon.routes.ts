import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Carbon emission factors (kg CO2 per km)
const EMISSION_FACTORS = {
  STANDARD_SHIPPING: 0.1, // Standard ground
  EXPRESS_SHIPPING: 0.25, // Air freight
  LOCAL_PICKUP: 0,
  GROUP_DELIVERY: 0.05, // Shared delivery
};

// تسجيل انبعاثات الشحن
// Record shipping emissions
router.post('/shipping', async (req, res) => {
  try {
    const { userId, orderId, shippingType, distanceKm } = req.body;

    let carbonKg: number;
    let actionType: string;

    switch (shippingType) {
      case 'EXPRESS':
        carbonKg = -distanceKm * EMISSION_FACTORS.EXPRESS_SHIPPING;
        actionType = 'SHIPPING_EXPRESS';
        break;
      case 'GROUP':
        carbonKg = distanceKm * (EMISSION_FACTORS.STANDARD_SHIPPING - EMISSION_FACTORS.GROUP_DELIVERY);
        actionType = 'GROUP_DELIVERY';
        break;
      case 'LOCAL_PICKUP':
        carbonKg = distanceKm * EMISSION_FACTORS.STANDARD_SHIPPING;
        actionType = 'LOCAL_PICKUP';
        break;
      default:
        carbonKg = -distanceKm * EMISSION_FACTORS.STANDARD_SHIPPING;
        actionType = 'SHIPPING_STANDARD';
    }

    const action = await prisma.carbonAction.create({
      data: {
        userId,
        orderId,
        actionType: actionType as any,
        carbonKg,
        description: carbonKg > 0
          ? `وفرت ${carbonKg.toFixed(2)} كجم CO2 باختيار ${shippingType}`
          : `انبعاثات الشحن: ${Math.abs(carbonKg).toFixed(2)} كجم CO2`,
      },
    });

    // Update monthly footprint
    const now = new Date();
    await updateMonthlyFootprint(userId, now.getMonth() + 1, now.getFullYear(), carbonKg, shippingType);

    res.json({
      success: true,
      data: action,
      message: carbonKg > 0 ? `🌱 وفرت ${carbonKg.toFixed(2)} كجم CO2!` : undefined,
    });
  } catch (error) {
    console.error('Error recording shipping:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على البصمة الكربونية للمستخدم
// Get user's carbon footprint
router.get('/footprint/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { year } = req.query;

    const footprints = await prisma.carbonFootprint.findMany({
      where: {
        userId,
        ...(year && { year: parseInt(year as string) }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const total = footprints.reduce(
      (acc, f) => ({
        emissions: acc.emissions + f.totalEmissions,
        saved: acc.saved + f.totalSaved,
      }),
      { emissions: 0, saved: 0 }
    );

    res.json({
      success: true,
      data: {
        monthly: footprints,
        total,
        treesEquivalent: total.saved / 21,
      },
    });
  } catch (error) {
    console.error('Error fetching footprint:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// سجل الأفعال الكربونية
// Get carbon action history
router.get('/actions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const actions = await prisma.carbonAction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: actions,
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تعويض الكربون بالتبرع
// Offset carbon by donation
router.post('/offset', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // $1 = 0.5 kg CO2 offset (tree planting)
    const carbonOffset = amount * 0.5;

    await prisma.carbonAction.create({
      data: {
        userId,
        actionType: 'CARBON_OFFSET_DONATION',
        carbonKg: carbonOffset,
        description: `تبرعت بـ ${amount} وعوضت ${carbonOffset.toFixed(2)} كجم CO2`,
      },
    });

    // Add reward
    await prisma.ecoReward.create({
      data: {
        userId,
        rewardType: 'TREE_PLANTED',
        points: Math.floor(carbonOffset * 10),
        description: `شكراً! ساهمت في زراعة ${Math.floor(carbonOffset / 21)} شجرة`,
      },
    });

    res.json({
      success: true,
      message: `🌳 شكراً! عوضت ${carbonOffset.toFixed(2)} كجم CO2`,
      data: { carbonOffset },
    });
  } catch (error) {
    console.error('Error offsetting carbon:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

async function updateMonthlyFootprint(
  userId: string,
  month: number,
  year: number,
  carbonKg: number,
  shippingType: string
) {
  const existing = await prisma.carbonFootprint.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });

  const isEmission = carbonKg < 0;
  const absCarbon = Math.abs(carbonKg);

  if (existing) {
    await prisma.carbonFootprint.update({
      where: { userId_month_year: { userId, month, year } },
      data: {
        shippingEmissions: isEmission ? { increment: absCarbon } : existing.shippingEmissions,
        groupDeliverySaved: shippingType === 'GROUP' ? { increment: absCarbon } : existing.groupDeliverySaved,
        localPickupSaved: shippingType === 'LOCAL_PICKUP' ? { increment: absCarbon } : existing.localPickupSaved,
        totalEmissions: isEmission ? { increment: absCarbon } : existing.totalEmissions,
        totalSaved: !isEmission ? { increment: absCarbon } : existing.totalSaved,
      },
    });
  } else {
    await prisma.carbonFootprint.create({
      data: {
        userId,
        month,
        year,
        shippingEmissions: isEmission ? absCarbon : 0,
        groupDeliverySaved: shippingType === 'GROUP' ? absCarbon : 0,
        localPickupSaved: shippingType === 'LOCAL_PICKUP' ? absCarbon : 0,
        totalEmissions: isEmission ? absCarbon : 0,
        totalSaved: !isEmission ? absCarbon : 0,
      },
    });
  }
}

export default router;
