import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

// إنشاء بث مباشر جديد
// Create a new live stream
router.post('/', async (req, res) => {
  try {
    const { title, description, hostId, hostName, scheduledAt, thumbnailUrl } = req.body;

    const liveStream = await prisma.liveStream.create({
      data: {
        title,
        description,
        hostId,
        hostName,
        thumbnailUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء البث المباشر',
      data: liveStream,
    });
  } catch (error) {
    console.error('Error creating live stream:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// بدء البث المباشر
// Start live stream
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { streamUrl } = req.body;

    const liveStream = await prisma.liveStream.update({
      where: { id },
      data: {
        status: 'LIVE',
        streamUrl,
        startedAt: new Date(),
      },
    });

    // Notify all subscribers
    io.emit('stream-started', {
      streamId: id,
      title: liveStream.title,
      hostName: liveStream.hostName,
    });

    res.json({
      success: true,
      message: 'البث المباشر بدأ الآن! 🔴',
      data: liveStream,
    });
  } catch (error) {
    console.error('Error starting live stream:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// إضافة منتج للبث المباشر
// Add product to live stream
router.post('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, productName, originalPrice, livePrice, stock } = req.body;

    const product = await prisma.liveStreamProduct.create({
      data: {
        liveStreamId: id,
        productId,
        productName,
        originalPrice,
        livePrice,
        stock,
      },
    });

    // Notify viewers about new product
    io.to(`stream:${id}`).emit('new-product', {
      productName,
      livePrice,
      discount: Math.round((1 - livePrice / originalPrice) * 100),
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// شراء منتج من البث المباشر
// Purchase product from live stream
router.post('/:id/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, userId, quantity } = req.body;

    const product = await prisma.liveStreamProduct.findFirst({
      where: { liveStreamId: id, productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'الكمية غير متوفرة' });
    }

    // Create purchase record
    const purchase = await prisma.liveStreamPurchase.create({
      data: {
        liveStreamId: id,
        productId,
        userId,
        quantity,
        price: product.livePrice * quantity,
      },
    });

    // Update stock and sold count
    await prisma.liveStreamProduct.update({
      where: { id: product.id },
      data: {
        stock: { decrement: quantity },
        soldCount: { increment: quantity },
      },
    });

    // Notify viewers
    io.to(`stream:${id}`).emit('purchase-made', {
      productName: product.productName,
      quantity,
      remainingStock: product.stock - quantity,
    });

    res.json({
      success: true,
      message: 'تم الشراء بنجاح! 🎉',
      data: purchase,
    });
  } catch (error) {
    console.error('Error purchasing:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على البثوث المباشرة النشطة
// Get active live streams
router.get('/live', async (req, res) => {
  try {
    const streams = await prisma.liveStream.findMany({
      where: { status: 'LIVE' },
      include: {
        products: true,
      },
      orderBy: { viewerCount: 'desc' },
    });

    res.json({
      success: true,
      data: streams,
    });
  } catch (error) {
    console.error('Error fetching live streams:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// إنهاء البث المباشر
// End live stream
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;

    const liveStream = await prisma.liveStream.update({
      where: { id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
      include: {
        products: true,
        purchases: true,
      },
    });

    // Calculate total sales
    const totalSales = liveStream.purchases.reduce((sum, p) => sum + p.price, 0);
    const totalItems = liveStream.purchases.reduce((sum, p) => sum + p.quantity, 0);

    io.to(`stream:${id}`).emit('stream-ended', {
      message: 'انتهى البث المباشر',
      totalSales,
      totalItems,
    });

    res.json({
      success: true,
      message: 'انتهى البث',
      data: {
        ...liveStream,
        totalSales,
        totalItems,
      },
    });
  } catch (error) {
    console.error('Error ending stream:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
