import { Router } from 'express';
import { locationNotificationController } from '../controllers/location.controller';

const router = Router();

/**
 * @route POST /api/v1/location/check
 * @desc التحقق من موقع المستخدم وإرسال إشعارات البدائل
 * @desc Check user location and send alternative notifications
 */
router.post('/check', locationNotificationController.checkLocation);

/**
 * @route GET /api/v1/location/nearby
 * @desc البحث عن مكاتب التحويل القريبة
 * @desc Find nearby transfer offices
 */
router.get('/nearby', locationNotificationController.findNearby);

/**
 * @route POST /api/v1/location/compare
 * @desc مقارنة الأسعار مع المنافسين
 * @desc Compare prices with competitors
 */
router.post('/compare', locationNotificationController.comparePrices);

/**
 * @route POST /api/v1/location/alternative
 * @desc إنشاء إشعار بديل للمستخدم
 * @desc Generate alternative notification for user
 */
router.post('/alternative', locationNotificationController.generateAlternative);

export default router;
