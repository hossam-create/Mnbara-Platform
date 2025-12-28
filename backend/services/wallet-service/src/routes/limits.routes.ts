import { Router, Request, Response } from 'express';
import { transactionLimitsService, LimitType } from '../services/limits.service';

const router = Router();

/**
 * Transaction Limits Routes
 * مسارات حدود المعاملات
 */

// Check if a transaction is within limits
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { userId, amount, currency, transactionType, country } = req.body;

    if (!userId || !amount || !currency || !transactionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, amount, currency, transactionType',
        messageAr: 'حقول مطلوبة مفقودة: userId, amount, currency, transactionType'
      });
    }

    const results = await transactionLimitsService.checkLimits(
      userId,
      amount,
      currency,
      transactionType,
      country
    );

    const isAllowed = results.every(r => r.isAllowed);

    res.json({
      success: true,
      isAllowed,
      checks: results
    });
  } catch (error) {
    console.error('Limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check limits',
      messageAr: 'فشل التحقق من الحدود'
    });
  }
});

// Get remaining limits for a user
router.get('/remaining/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { transactionType = 'WITHDRAWAL' } = req.query;

    const limits = await transactionLimitsService.getRemainingLimits(
      userId,
      transactionType as string
    );

    res.json({
      success: true,
      ...limits
    });
  } catch (error) {
    console.error('Get remaining limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get remaining limits',
      messageAr: 'فشل الحصول على الحدود المتبقية'
    });
  }
});

// Update user limits (admin only)
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limits } = req.body;

    if (!limits || typeof limits !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid limits object',
        messageAr: 'كائن حدود غير صالح'
      });
    }

    // Validate limit types
    const validTypes = Object.values(LimitType);
    for (const key of Object.keys(limits)) {
      if (!validTypes.includes(key as LimitType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid limit type: ${key}. Valid types: ${validTypes.join(', ')}`,
          messageAr: `نوع حد غير صالح: ${key}`
        });
      }
    }

    const result = await transactionLimitsService.updateUserLimits(userId, limits);

    res.json({
      success: result.success,
      message: result.message,
      messageAr: 'تم تحديث الحدود بنجاح'
    });
  } catch (error) {
    console.error('Update limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update limits',
      messageAr: 'فشل تحديث الحدود'
    });
  }
});

// Record usage after transaction (internal use)
router.post('/record-usage', async (req: Request, res: Response) => {
  try {
    const { userId, amount, transactionType } = req.body;

    if (!userId || !amount || !transactionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, amount, transactionType',
        messageAr: 'حقول مطلوبة مفقودة: userId, amount, transactionType'
      });
    }

    await transactionLimitsService.recordUsage(userId, amount, transactionType);

    res.json({
      success: true,
      message: 'Usage recorded successfully',
      messageAr: 'تم تسجيل الاستخدام بنجاح'
    });
  } catch (error) {
    console.error('Record usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record usage',
      messageAr: 'فشل تسجيل الاستخدام'
    });
  }
});

export default router;
