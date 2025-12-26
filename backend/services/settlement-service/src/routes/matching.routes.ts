import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';

const router = Router();
const controller = new MatchingController();

// الحصول على المطابقات المقترحة لطلب
router.get('/proposals/:transferId', controller.getMatchProposals);

// قبول مطابقة
router.post('/:matchId/accept', controller.acceptMatch);

// رفض مطابقة
router.post('/:matchId/reject', controller.rejectMatch);

// الحصول على حالة المطابقة
router.get('/:matchId/status', controller.getMatchStatus);

// تأكيد التسوية
router.post('/:matchId/confirm', controller.confirmSettlement);

export { router as matchingRoutes };
