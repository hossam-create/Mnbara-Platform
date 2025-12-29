import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// إنشاء مجموعة شراء جماعي جديدة
// Create a new team purchase group
router.post('/', async (req, res) => {
  try {
    const { productId, productName, originalPrice, discountedPrice, targetMembers, creatorId, expiresInHours = 24 } = req.body;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const teamPurchase = await prisma.teamPurchase.create({
      data: {
        productId,
        productName,
        originalPrice,
        discountedPrice,
        targetMembers,
        creatorId,
        expiresAt,
        members: {
          create: {
            userId: creatorId,
            hasPaid: false,
          },
        },
      },
      include: { members: true },
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء مجموعة الشراء الجماعي بنجاح',
      data: teamPurchase,
    });
  } catch (error) {
    console.error('Error creating team purchase:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء المجموعة' });
  }
});

// الانضمام لمجموعة شراء
// Join a team purchase group
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const teamPurchase = await prisma.teamPurchase.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!teamPurchase) {
      return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }

    if (teamPurchase.status !== 'PENDING' && teamPurchase.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'المجموعة مغلقة' });
    }

    if (new Date() > teamPurchase.expiresAt) {
      return res.status(400).json({ success: false, message: 'انتهت صلاحية المجموعة' });
    }

    if (teamPurchase.currentMembers >= teamPurchase.targetMembers) {
      return res.status(400).json({ success: false, message: 'المجموعة مكتملة' });
    }

    // Add member
    await prisma.teamMember.create({
      data: {
        teamPurchaseId: id,
        userId,
      },
    });

    // Update member count
    const updatedTeam = await prisma.teamPurchase.update({
      where: { id },
      data: {
        currentMembers: { increment: 1 },
        status: teamPurchase.currentMembers + 1 >= teamPurchase.targetMembers ? 'ACTIVE' : 'PENDING',
      },
      include: { members: true },
    });

    res.json({
      success: true,
      message: 'تم الانضمام للمجموعة بنجاح! 🎉',
      data: updatedTeam,
      isComplete: updatedTeam.currentMembers >= updatedTeam.targetMembers,
    });
  } catch (error) {
    console.error('Error joining team purchase:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء الانضمام' });
  }
});

// الحصول على مجموعات الشراء النشطة
// Get active team purchases
router.get('/active', async (req, res) => {
  try {
    const { productId } = req.query;

    const teams = await prisma.teamPurchase.findMany({
      where: {
        status: { in: ['PENDING', 'ACTIVE'] },
        expiresAt: { gt: new Date() },
        ...(productId && { productId: productId as string }),
      },
      include: {
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: teams,
      count: teams.length,
    });
  } catch (error) {
    console.error('Error fetching active teams:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على مجموعات المستخدم
// Get user's team purchases
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const memberOf = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        teamPurchase: {
          include: { members: true },
        },
      },
    });

    res.json({
      success: true,
      data: memberOf.map((m) => m.teamPurchase),
    });
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
