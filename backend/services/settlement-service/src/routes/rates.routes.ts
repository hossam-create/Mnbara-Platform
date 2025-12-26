import { Router } from 'express';
import { RatesController } from '../controllers/rates.controller';

const router = Router();
const controller = new RatesController();

// الحصول على سعر الصرف
router.get('/:from/:to', controller.getExchangeRate);

// الحصول على جميع الأسعار
router.get('/', controller.getAllRates);

// تحديث سعر الصرف (Admin)
router.post('/update', controller.updateRate);

// الحصول على تاريخ الأسعار
router.get('/history/:from/:to', controller.getRateHistory);

export { router as ratesRoutes };
