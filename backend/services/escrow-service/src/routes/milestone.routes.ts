import { Router } from 'express';
import { PrismaClient, MilestoneStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// إنشاء مراحل للضمان - Create milestones for escrow
router.post('/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { milestones } = req.body;

    if (!milestones || !Array.isArray(milestones)) {
      return res.status(400).json({
        success: false,
        message: 'Milestones array is required',
        messageAr: 'مصفوفة المراحل مطلوبة'
      });
    }

    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found',
        messageAr: 'معاملة الضمان غير موجودة'
      });
    }

    // Validate total percentage = 100
    const totalPercentage = milestones.reduce((sum: number, m: any) => sum + m.percentage, 0);
    if (totalPercentage !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Total milestone percentage must equal 100',
        messageAr: 'مجموع نسب المراحل يجب أن يساوي 100'
      });
    }

    const createdMilestones = await Promise.all(
      milestones.map((m: any, index: number) => 
        prisma.escrowMilestone.create({
          data: {
            escrowId,
            title: m.title,
            titleAr: m.titleAr,
            description: m.description,
            amount: Number(escrow.amount) * (m.percentage / 100),
            percentage: m.percentage,
            conditions: m.conditions || [],
            dueDate: m.dueDate ? new Date(m.dueDate) : null,
            order: index
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Milestones created',
      messageAr: 'تم إنشاء المراحل',
      data: createdMilestones
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في إنشاء المراحل'
    });
  }
});

// الحصول على مراحل الضمان - Get escrow milestones
router.get('/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;

    const milestones = await prisma.escrowMilestone.findMany({
      where: { escrowId },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: milestones
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في الحصول على المراحل'
    });
  }
});

// تحديث حالة المرحلة - Update milestone status
router.patch('/:milestoneId/status', async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        messageAr: 'الحالة مطلوبة'
      });
    }

    const milestone = await prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: status as MilestoneStatus,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'RELEASED' && { releasedAt: new Date() })
      }
    });

    res.json({
      success: true,
      message: 'Milestone updated',
      messageAr: 'تم تحديث المرحلة',
      data: milestone
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في تحديث المرحلة'
    });
  }
});

// تحرير أموال المرحلة - Release milestone funds
router.post('/:milestoneId/release', async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const milestone = await prisma.escrowMilestone.findUnique({
      where: { id: milestoneId }
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
        messageAr: 'المرحلة غير موجودة'
      });
    }

    if (milestone.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Milestone must be approved before release',
        messageAr: 'يجب الموافقة على المرحلة قبل التحرير'
      });
    }

    const updated = await prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Released ${milestone.amount} for milestone`,
      messageAr: `تم تحرير ${milestone.amount} للمرحلة`,
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في تحرير أموال المرحلة'
    });
  }
});

export default router;
