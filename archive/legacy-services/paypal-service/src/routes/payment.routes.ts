import { Router } from 'express';
import { paypalService } from '../services/paypal.service';
import { PayPalStatus } from '@prisma/client';

const router = Router();

// إنشاء طلب دفع - Create payment order
router.post('/create', async (req, res) => {
  try {
    const { orderId, userId, amount, currency, description, returnUrl, cancelUrl, metadata } = req.body;

    if (!orderId || !userId || !amount || !returnUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'orderId, userId, amount, returnUrl, and cancelUrl are required',
        messageAr: 'جميع الحقول مطلوبة'
      });
    }

    const result = await paypalService.createOrder({
      orderId,
      userId,
      amount: parseFloat(amount),
      currency,
      description,
      returnUrl,
      cancelUrl,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'PayPal order created',
      messageAr: 'تم إنشاء طلب PayPal',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في إنشاء طلب الدفع'
    });
  }
});

// التقاط الدفع - Capture payment
router.post('/capture/:paypalOrderId', async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    const result = await paypalService.capturePayment(paypalOrderId);

    res.json({
      success: true,
      message: 'Payment captured successfully',
      messageAr: 'تم التقاط الدفع بنجاح',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في التقاط الدفع'
    });
  }
});

// الحصول على تفاصيل الطلب - Get order details
router.get('/order/:paypalOrderId', async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    const result = await paypalService.getOrderDetails(paypalOrderId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في الحصول على تفاصيل الطلب'
    });
  }
});

// الحصول على معاملة - Get transaction
router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await paypalService.getTransaction(transactionId);

    res.json({
      success: true,
      data: transaction
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
      messageAr: 'المعاملة غير موجودة'
    });
  }
});

// الحصول على معاملات المستخدم - Get user transactions
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit, offset } = req.query;

    const result = await paypalService.getUserTransactions(userId, {
      status: status as PayPalStatus | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في الحصول على المعاملات'
    });
  }
});

// إلغاء الطلب - Void order
router.post('/void/:paypalOrderId', async (req, res) => {
  try {
    const { paypalOrderId } = req.params;

    const result = await paypalService.voidOrder(paypalOrderId);

    res.json({
      success: true,
      message: 'Order voided',
      messageAr: 'تم إلغاء الطلب',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في إلغاء الطلب'
    });
  }
});

export default router;
