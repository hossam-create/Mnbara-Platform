// Intent Routes - مسارات النوايا

import { Router } from 'express';
import { intentController } from '../controllers/intent.controller';

const router = Router();

// Intent patterns
router.get('/patterns', intentController.getPatterns);
router.post('/patterns', intentController.createPattern);
router.put('/patterns/:patternId', intentController.updatePattern);
router.delete('/patterns/:patternId', intentController.deletePattern);

// Test intent recognition
router.post('/recognize', intentController.recognizeIntent);

export { router as intentRoutes };
