import { Router } from 'express';
import { ProhibitedController } from '../controllers/prohibited.controller';

const router = Router();
const controller = new ProhibitedController();

// الحصول على قائمة المنتجات المحظورة لدولة
router.get('/items/:countryCode', controller.getProhibitedItems);

// البحث في المنتجات المحظورة
router.get('/search', controller.searchProhibited);

// التحقق إذا كان المنتج محظور
router.post('/check', controller.checkIfProhibited);

// الحصول على المنتجات المقيدة
router.get('/restricted/:countryCode', controller.getRestrictedItems);

// إضافة منتج محظور (Admin)
router.post('/items', controller.addProhibitedItem);

// تحديث منتج محظور (Admin)
router.put('/items/:id', controller.updateProhibitedItem);

export { router as prohibitedRoutes };
