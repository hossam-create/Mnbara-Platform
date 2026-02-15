import { Router } from 'express';
import { paypalService } from '../services/paypal.service';
import { RefundReason } from '@prisma/client';

const router = Router();

// إنشاء استرداد - Create refund
router.post('/', async (req, res) => {
  try {
    const { transactionId, amount, reason, note, initiatedBy } = req.body;

    if (!transactionId || !reason || !initiatedBy) {
      return res.status(400).json({
        success: false,
        message: 'transactionId, reason, and initiatedBy are required',
        messageAr: 'جميع الحقول مطلوبة'
      });
    }

    const validReasons = ['CUSTOMER_REQUEST', 'ITEM_NOT_RECEIVED', 'ITEM_NOT_AS_DESCRIBED', 'DUPLICATE_TRANSACTION', 'FRAUD', 'OTHER'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Valid: ${validReasons.join(', ')}`,
        messageAr: 'سبب غير صالح'
      });
    }

    const result = await paypalService.refundPayment({
      transactionId,
      amount: amount ? parseFloat(amount) : undefined,
      reason: reason as RefundReason,
      note,
      initiatedBy
    });

    res.status(201).json({
      success: true,
      message: 'Refund processed',
      messageAr: 'تم معالجة الاسترداد',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في معالجة الاسترداد'
    });
  }
});

export default router;
