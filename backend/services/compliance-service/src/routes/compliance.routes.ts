import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';

const router = Router();
const controller = new ComplianceController();

// فحص الامتثال للمنتج
router.post('/check', controller.checkCompliance);

// الحصول على تحذيرات المستخدم
router.get('/warnings/:userId', controller.getUserWarnings);

// الإقرار بالتحذير
router.post('/warnings/:warningId/acknowledge', controller.acknowledgeWarning);

// حساب الرسوم الجمركية المتوقعة
router.post('/estimate-duty', controller.estimateDuty);

// الحصول على متطلبات الشحن بين دولتين
router.get('/requirements/:originCountry/:destCountry', controller.getShippingRequirements);

export { router as complianceRoutes };
