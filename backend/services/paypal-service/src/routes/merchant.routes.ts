import { Router } from 'express';
import { merchantService } from '../services/merchant.service';
import { OnboardingStatus } from '@prisma/client';

const router = Router();

// تسجيل تاجر جديد - Register new merchant
router.post('/register', async (req, res) => {
  try {
    const { merchantId, paypalEmail, returnUrl } = req.body;

    if (!merchantId || !paypalEmail || !returnUrl) {
      return res.status(400).json({
        success: false,
        message: 'merchantId, paypalEmail, and returnUrl are required',
        messageAr: 'جميع الحقول مطلوبة'
      });
    }

    const result = await merchantService.registerMerchant({
      merchantId,
      paypalEmail,
      returnUrl
    });

    res.status(201).json({
      success: true,
      message: 'Merchant registration initiated',
      messageAr: 'تم بدء تسجيل التاجر',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في تسجيل التاجر'
    });
  }
});

// التحقق من حالة التسجيل - Check onboarding status
router.get('/:merchantId/status', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const result = await merchantService.checkOnboardingStatus(merchantId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في التحقق من الحالة'
    });
  }
});

// الحصول على حساب التاجر - Get merchant account
router.get('/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const account = await merchantService.getMerchantAccount(merchantId);

    res.json({
      success: true,
      data: account
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
      messageAr: 'التاجر غير موجود'
    });
  }
});

// تحديث بريد PayPal - Update PayPal email
router.patch('/:merchantId/email', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { paypalEmail } = req.body;

    if (!paypalEmail) {
      return res.status(400).json({
        success: false,
        message: 'PayPal email is required',
        messageAr: 'بريد PayPal مطلوب'
      });
    }

    const result = await merchantService.updatePayPalEmail(merchantId, paypalEmail);

    res.json({
      success: true,
      message: 'PayPal email updated',
      messageAr: 'تم تحديث بريد PayPal',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في تحديث البريد'
    });
  }
});

// الحصول على جميع التجار (Admin) - Get all merchants
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const result = await merchantService.getAllMerchants({
      status: status as OnboardingStatus | undefined,
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
      messageAr: 'فشل في الحصول على التجار'
    });
  }
});

export default router;
