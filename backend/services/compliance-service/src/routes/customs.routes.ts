import { Router } from 'express';
import { CustomsController } from '../controllers/customs.controller';

const router = Router();
const controller = new CustomsController();

// الحصول على قواعد الجمارك لدولة
router.get('/rules/:countryCode', controller.getCustomsRules);

// الحصول على معلومات الدولة
router.get('/country/:countryCode', controller.getCountryInfo);

// الحصول على جميع الدول
router.get('/countries', controller.getAllCountries);

// حساب الرسوم الجمركية
router.post('/calculate-duty', controller.calculateDuty);

// الحصول على الحد الأقصى للإعفاء الجمركي
router.get('/duty-free-limit/:countryCode', controller.getDutyFreeLimit);

export { router as customsRoutes };
