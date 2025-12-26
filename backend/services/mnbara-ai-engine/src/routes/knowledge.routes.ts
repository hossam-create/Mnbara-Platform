// Knowledge Routes - Knowledge Base
// مسارات المعرفة - قاعدة المعرفة

import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledge.controller';

const router = Router();

// Add product knowledge
router.post('/products', knowledgeController.addProduct.bind(knowledgeController));

// Add travel knowledge
router.post('/travel', knowledgeController.addTravel.bind(knowledgeController));

// Search knowledge
router.get('/search', knowledgeController.search.bind(knowledgeController));

// Get customs info for country
router.get('/customs/:country', knowledgeController.getCustomsInfo.bind(knowledgeController));

// Get shopping tips for country
router.get('/shopping/:country', knowledgeController.getShoppingTips.bind(knowledgeController));

// Add training data
router.post('/training-data', knowledgeController.addTrainingData.bind(knowledgeController));

// Bulk import
router.post('/bulk-import', knowledgeController.bulkImport.bind(knowledgeController));

// Get stats
router.get('/stats', knowledgeController.getStats.bind(knowledgeController));

export default router;
