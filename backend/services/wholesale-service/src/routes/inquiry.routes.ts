// Inquiry Routes - RFQ
// مسارات الاستفسارات - طلب عرض سعر

import { Router } from 'express';
import { inquiryController } from '../controllers/inquiry.controller';

const router = Router();

// Inquiry CRUD
router.post('/', inquiryController.create.bind(inquiryController));
router.get('/', inquiryController.list.bind(inquiryController));
router.get('/:id', inquiryController.getById.bind(inquiryController));

// Actions
router.post('/:id/respond', inquiryController.respond.bind(inquiryController));
router.put('/:id/status', inquiryController.updateStatus.bind(inquiryController));

// Stats
router.get('/supplier/:supplierId/pending', inquiryController.getPendingCount.bind(inquiryController));

export default router;
