// Marketing AI Routes - Mnbara AI
// مسارات الذكاء الاصطناعي للتسويق

import { Router } from 'express';
import { marketingAIController } from '../controllers/marketing-ai.controller';

const router = Router();

// ==========================================
// 📝 CONTENT GENERATION
// ==========================================

// POST /api/v1/marketing/content - Generate marketing content
router.post('/content', marketingAIController.generateContent.bind(marketingAIController));

// POST /api/v1/marketing/calendar - Generate social media calendar
router.post('/calendar', marketingAIController.generateSocialCalendar.bind(marketingAIController));

// ==========================================
// 📧 EMAIL MARKETING
// ==========================================

// POST /api/v1/marketing/email - Generate email campaign
router.post('/email', marketingAIController.generateEmailCampaign.bind(marketingAIController));

// ==========================================
// 📊 CAMPAIGN OPTIMIZATION
// ==========================================

// POST /api/v1/marketing/campaign/analyze - Analyze campaign performance
router.post('/campaign/analyze', marketingAIController.analyzeCampaign.bind(marketingAIController));

// POST /api/v1/marketing/campaign/ab-test - Generate A/B test variations
router.post('/campaign/ab-test', marketingAIController.generateABVariations.bind(marketingAIController));

// ==========================================
// 🎯 AUDIENCE TARGETING
// ==========================================

// POST /api/v1/marketing/audience - Generate audience segments
router.post('/audience', marketingAIController.generateAudienceSegments.bind(marketingAIController));

// ==========================================
// 🌍 LOCALIZATION
// ==========================================

// POST /api/v1/marketing/localize - Localize campaign for region
router.post('/localize', marketingAIController.localizeCampaign.bind(marketingAIController));

// ==========================================
// 📈 GROWTH HACKING
// ==========================================

// POST /api/v1/marketing/growth - Generate growth ideas
router.post('/growth', marketingAIController.generateGrowthIdeas.bind(marketingAIController));

export default router;
