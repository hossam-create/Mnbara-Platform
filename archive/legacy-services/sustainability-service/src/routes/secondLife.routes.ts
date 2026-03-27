import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Average CO2 saved by buying used instead of new (kg)
const AVG_CO2_SAVED_PER_ITEM = 15;

// إنشاء قائمة حياة ثانية من طلب سابق
// Create a second life listing from a previous order
router.post('/', async (req, res) => {
  try {
    const {
      originalOrderId,
      originalProductId,
      productName,
      productImages,
      originalPrice,
      resalePrice,
      condition,
      conditionNotes,
      sellerId,
      sellerName,
    } = req.body;

    const listing = await prisma.secondLifeListing.create({
      data: {
        originalOrderId,
        originalProductId,
        productName,
        productImages,
        originalPrice,
        resalePrice,
        condition,
        conditionNotes,
        sellerId,
        sellerName,
        carbonSaved: AVG_CO2_SAVED_PER_ITEM,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم نشر منتجك في سوق حياة ثانية! 🌱',
      data: listing,
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على المنتجات المستعملة المتاحة
// Get available second-hand products
router.get('/', async (req, res) => {
  try {
    const { condition, minPrice, maxPrice, productId } = req.query;

    const listings = await prisma.secondLifeListing.findMany({
      where: {
        status: 'ACTIVE',
        ...(condition && { condition: condition as any }),
        ...(productId && { originalProductId: productId as string }),
        ...(minPrice && { resalePrice: { gte: parseFloat(minPrice as string) } }),
        ...(maxPrice && { resalePrice: { lte: parseFloat(maxPrice as string) } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: listings,
      count: listings.length,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// شراء منتج مستعمل
// Purchase a second-hand item
router.post('/:id/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerId } = req.body;

    const listing = await prisma.secondLifeListing.findUnique({ where: { id } });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'المنتج غير متاح' });
    }

    // Update listing
    const updatedListing = await prisma.secondLifeListing.update({
      where: { id },
      data: {
        status: 'SOLD',
        soldAt: new Date(),
        buyerId,
      },
    });

    // Record carbon action for buyer
    await prisma.carbonAction.create({
      data: {
        userId: buyerId,
        actionType: 'BOUGHT_SECONDHAND',
        carbonKg: listing.carbonSaved || AVG_CO2_SAVED_PER_ITEM,
        description: `اشتريت ${listing.productName} مستعمل ووفرت ${listing.carbonSaved?.toFixed(1)} كجم CO2`,
      },
    });

    // Record carbon action for seller
    await prisma.carbonAction.create({
      data: {
        userId: listing.sellerId,
        actionType: 'SOLD_SECONDHAND',
        carbonKg: listing.carbonSaved || AVG_CO2_SAVED_PER_ITEM,
        description: `بعت ${listing.productName} وساهمت في توفير ${listing.carbonSaved?.toFixed(1)} كجم CO2`,
      },
    });

    // Update sustainability scores
    await updateSustainabilityScore(buyerId, 50, listing.carbonSaved || AVG_CO2_SAVED_PER_ITEM);
    await updateSustainabilityScore(listing.sellerId, 30, (listing.carbonSaved || AVG_CO2_SAVED_PER_ITEM) * 0.5);

    res.json({
      success: true,
      message: `تم الشراء بنجاح! 🌱 وفرت ${listing.carbonSaved?.toFixed(1)} كجم من CO2`,
      data: updatedListing,
      carbonSaved: listing.carbonSaved,
    });
  } catch (error) {
    console.error('Error purchasing listing:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// قوائم المستخدم للبيع
// Get user's listings
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    const listings = await prisma.secondLifeListing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: listings,
    });
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// Helper function to update sustainability score
async function updateSustainabilityScore(userId: string, points: number, carbonKg: number) {
  const existingScore = await prisma.sustainabilityScore.findUnique({ where: { userId } });

  if (existingScore) {
    const newTotal = existingScore.totalScore + points;
    const newCarbon = existingScore.carbonSavedKg + carbonKg;

    await prisma.sustainabilityScore.update({
      where: { userId },
      data: {
        totalScore: newTotal,
        carbonSavedKg: newCarbon,
        treesEquivalent: newCarbon / 21, // 1 tree absorbs ~21kg CO2/year
        level: calculateLevel(newTotal),
      },
    });
  } else {
    await prisma.sustainabilityScore.create({
      data: {
        userId,
        totalScore: points,
        carbonSavedKg: carbonKg,
        treesEquivalent: carbonKg / 21,
        level: calculateLevel(points),
      },
    });
  }
}

function calculateLevel(points: number): 'SEEDLING' | 'SAPLING' | 'TREE' | 'FOREST' | 'ECOSYSTEM' {
  if (points >= 10001) return 'ECOSYSTEM';
  if (points >= 2001) return 'FOREST';
  if (points >= 501) return 'TREE';
  if (points >= 101) return 'SAPLING';
  return 'SEEDLING';
}

export default router;
