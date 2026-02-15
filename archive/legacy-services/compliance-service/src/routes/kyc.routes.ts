import { Router } from 'express';
import { KYCController } from '../controllers/kyc.controller';

const router = Router();
const controller = new KYCController();

router.post('/initiate', controller.initiateKYC);
router.post('/upload-document', controller.uploadDocument);
router.post('/verify/:kycId', controller.verifyDocuments);
router.post('/aml-check', controller.performAMLCheck);
router.get('/status/:userId', controller.getKYCStatus);
router.post('/report-suspicious', controller.reportSuspiciousTransaction);

export default router;
