// Sentiment Routes - Gen 10 AI
// مسارات تحليل المشاعر - الجيل العاشر

import { Router } from 'express';
import { sentimentController } from '../controllers/sentiment.controller';

const router = Router();

// Analyze text sentiment
router.post('/analyze', sentimentController.analyzeText.bind(sentimentController));

// Batch analyze multiple texts
router.post('/batch', sentimentController.batchAnalyze.bind(sentimentController));

// Analyze product reviews
router.get('/products/:productId/reviews', sentimentController.analyzeProductReviews.bind(sentimentController));

// Analyze seller reputation
router.get('/sellers/:sellerId/reputation', sentimentController.analyzeSellerReputation.bind(sentimentController));

// Monitor sentiment in real-time
router.get('/monitor', sentimentController.monitorSentiment.bind(sentimentController));

// Get sentiment history
router.get('/history/:sourceType/:sourceId', sentimentController.getSentimentHistory.bind(sentimentController));

export default router;
