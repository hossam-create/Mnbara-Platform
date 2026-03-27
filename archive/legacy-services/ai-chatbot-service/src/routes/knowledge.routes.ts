// Knowledge Routes - مسارات قاعدة المعرفة

import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledge.controller';

const router = Router();

router.get('/', knowledgeController.getArticles);
router.get('/search', knowledgeController.searchArticles);
router.get('/:articleId', knowledgeController.getArticle);
router.post('/', knowledgeController.createArticle);
router.put('/:articleId', knowledgeController.updateArticle);
router.delete('/:articleId', knowledgeController.deleteArticle);
router.post('/:articleId/feedback', knowledgeController.submitFeedback);

export { router as knowledgeRoutes };
