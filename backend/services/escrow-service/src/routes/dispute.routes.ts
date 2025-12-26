import { Router } from 'express';
import { disputeController } from '../controllers/dispute.controller';

const router = Router();

// فتح نزاع - Open dispute
router.post('/', disputeController.openDispute);

// الحصول على نزاع - Get dispute
router.get('/:disputeId', disputeController.getDispute);

// الحصول على نزاعات المستخدم - Get user disputes
router.get('/user/:userId', disputeController.getUserDisputes);

// إضافة رسالة - Add message
router.post('/:disputeId/messages', disputeController.addMessage);

// إضافة دليل - Add evidence
router.post('/:disputeId/evidence', disputeController.addEvidence);

// تصعيد النزاع - Escalate dispute
router.post('/:disputeId/escalate', disputeController.escalateDispute);

// حل النزاع - Resolve dispute (Admin only)
router.post('/:disputeId/resolve', disputeController.resolveDispute);

export default router;
