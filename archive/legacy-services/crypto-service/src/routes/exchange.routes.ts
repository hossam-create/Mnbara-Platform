import { Router } from 'express';
import { exchangeController } from '../controllers/exchange.controller';

const router = Router();

// الحصول على جميع الأسعار - Get all rates
router.get('/rates', exchangeController.getAllRates);

// الحصول على سعر عملة محددة - Get specific rate
router.get('/rates/:currency', exchangeController.getRate);

// تحويل بين العملات - Convert currencies
router.post('/convert', exchangeController.convert);

// الحصول على تاريخ الأسعار - Get price history
router.get('/history/:currency', exchangeController.getPriceHistory);

// الحصول على رسوم الشبكة - Get network fees
router.get('/fees/:currency', exchangeController.getNetworkFees);

export default router;
