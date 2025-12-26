import { Router } from 'express';
import { escrowController } from '../controllers/escrow.controller';

const router = Router();

// إنشاء معاملة ضمان - Create escrow
router.post('/', escrowController.createEscrow);

// حساب الرسوم - Calculate fees
router.get('/calculate-fees', escrowController.calculateFees);

// الحصول على معاملة ضمان - Get escrow
router.get('/:escrowId', escrowController.getEscrow);

// الحصول على معاملات المستخدم - Get user escrows
router.get('/user/:userId', escrowController.getUserEscrows);

// تمويل الضمان - Fund escrow
router.post('/:escrowId/fund', escrowController.fundEscrow);

// تأكيد الشحن - Confirm shipping
router.post('/:escrowId/ship', escrowController.confirmShipping);

// تأكيد التسليم - Confirm delivery
router.post('/:escrowId/deliver', escrowController.confirmDelivery);

// موافقة المشتري - Approve transaction
router.post('/:escrowId/approve', escrowController.approveTransaction);

// تمديد فترة الفحص - Extend inspection
router.post('/:escrowId/extend-inspection', escrowController.extendInspection);

export default router;
