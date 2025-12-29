import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// تسجيل منتج صديق للبيئة
// Register an eco-friendly product
router.post('/', async (req, res) => {
  try {
    const {
      productId,
      certifications,
      carbonFootprint,
      recyclable,
      biodegradable,
      locallyMade,
    } = req.body;

    const ecoProduct = await prisma.ecoProduct.create({
      data: {
        productId,
        certifications,
        carbonFootprint,
        recyclable,
        biodegradable,
        locallyMade,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم تسجيل المنتج كصديق للبيئة 🌿',
      data: ecoProduct,
    });
  } catch (error) {
    console.error('Error registering eco product:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على معلومات المنتج البيئي
// Get eco product info
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const ecoProduct = await prisma.ecoProduct.findUnique({
      where: { productId },
    });

    if (!ecoProduct) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على معلومات بيئية لهذا المنتج',
      });
    }

    res.json({
      success: true,
      data: ecoProduct,
    });
  } catch (error) {
    console.error('Error fetching eco product:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// البحث عن منتجات صديقة للبيئة
// Search eco-friendly products
router.get('/', async (req, res) => {
  try {
    const { certification, recyclable, biodegradable, locallyMade } = req.query;

    const products = await prisma.ecoProduct.findMany({
      where: {
        ...(certification && { certifications: { has: certification as string } }),
        ...(recyclable === 'true' && { recyclable: true }),
        ...(biodegradable === 'true' && { biodegradable: true }),
        ...(locallyMade === 'true' && { locallyMade: true }),
      },
    });

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error searching eco products:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
