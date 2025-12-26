// Analytics AI Routes - Mnbara AI
// مسارات الذكاء الاصطناعي للتحليلات

import { Router } from 'express';
import { analyticsAIController } from '../controllers/analytics-ai.controller';

const router = Router();

// ==========================================
// 📊 SALES ANALYTICS
// ==========================================

// POST /api/v1/analytics/sales - Analyze sales trends
router.post('/sales', analyticsAIController.analyzeSalesTrends.bind(analyticsAIController));

// ==========================================
// 📦 PRODUCT ANALYTICS
// ==========================================

// POST /api/v1/analytics/products - Analyze product performance
router.post('/products', analyticsAIController.analyzeProductPerformance.bind(analyticsAIController));

// ==========================================
// 👥 CUSTOMER ANALYTICS
// ==========================================

// POST /api/v1/analytics/customers/segment - Segment customers
router.post('/customers/segment', analyticsAIController.segmentCustomers.bind(analyticsAIController));

// ==========================================
// 🔮 PREDICTIVE ANALYTICS
// ==========================================

// POST /api/v1/analytics/predict/demand - Predict product demand
router.post('/predict/demand', analyticsAIController.predictDemand.bind(analyticsAIController));

// POST /api/v1/analytics/predict/churn - Predict customer churn
router.post('/predict/churn', analyticsAIController.predictChurn.bind(analyticsAIController));

// ==========================================
// 📈 BUSINESS INSIGHTS
// ==========================================

// POST /api/v1/analytics/report - Generate business report
router.post('/report', analyticsAIController.generateReport.bind(analyticsAIController));

// POST /api/v1/analytics/insights - Get AI-powered insights
router.post('/insights', analyticsAIController.getInsights.bind(analyticsAIController));

export default router;
