import { Router } from 'express';
import { forexController } from '../controllers/forex.controller';

const router = Router();

// الحصول على جميع الأسعار - Get all rates
router.get('/rates', forexController.getAllRates);

// الحصول على سعر محدد - Get specific rate
router.get('/rates/:baseCurrency/:quoteCurrency', forexController.getRate);

// تحويل مبلغ - Convert amount
router.post('/convert', forexController.convert);

// الحصول على تاريخ الأسعار - Get rate history
router.get('/history/:baseCurrency/:quoteCurrency', forexController.getRateHistory);

// الحصول على أفضل سعر - Get best rate
router.get('/best-rate', forexController.getBestRate);

export default router;
