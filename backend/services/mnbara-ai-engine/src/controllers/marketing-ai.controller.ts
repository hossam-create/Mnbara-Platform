// Marketing AI Controller - Mnbara AI
// متحكم الذكاء الاصطناعي للتسويق

import { Request, Response } from 'express';
import { marketingAIService } from '../services/marketing-ai.service';

export class MarketingAIController {
  // ==========================================
  // 📝 CONTENT GENERATION
  // ==========================================

  // Generate marketing content
  async generateContent(req: Request, res: Response) {
    try {
      const { type, topic, tone, language, platform } = req.body;

      if (!type || !topic) {
        return res.status(400).json({
          success: false,
          message: 'Content type and topic are required',
          messageAr: 'نوع المحتوى والموضوع مطلوبان'
        });
      }

      const content = await marketingAIService.generateContent({
        type,
        topic,
        tone: tone || 'professional',
        language: language || 'en',
        platform
      });

      res.json({
        success: true,
        data: content
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء المحتوى'
      });
    }
  }

  // Generate social media calendar
  async generateSocialCalendar(req: Request, res: Response) {
    try {
      const { month, year, platforms } = req.body;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'Month and year are required',
          messageAr: 'الشهر والسنة مطلوبان'
        });
      }

      const calendar = await marketingAIService.generateSocialCalendar(
        month,
        year,
        platforms || ['instagram', 'facebook', 'twitter']
      );

      res.json({
        success: true,
        data: calendar
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء التقويم'
      });
    }
  }

  // ==========================================
  // 📧 EMAIL MARKETING
  // ==========================================

  // Generate email campaign
  async generateEmailCampaign(req: Request, res: Response) {
    try {
      const { type, audience, product, discount } = req.body;

      if (!type || !audience) {
        return res.status(400).json({
          success: false,
          message: 'Campaign type and audience are required',
          messageAr: 'نوع الحملة والجمهور مطلوبان'
        });
      }

      const campaign = await marketingAIService.generateEmailCampaign({
        type,
        audience,
        product,
        discount
      });

      res.json({
        success: true,
        data: campaign
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء حملة البريد'
      });
    }
  }

  // ==========================================
  // 📊 CAMPAIGN OPTIMIZATION
  // ==========================================

  // Analyze campaign performance
  async analyzeCampaign(req: Request, res: Response) {
    try {
      const { impressions, clicks, conversions, spend, revenue } = req.body;

      if (impressions === undefined || clicks === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Campaign metrics are required',
          messageAr: 'مقاييس الحملة مطلوبة'
        });
      }

      const analysis = await marketingAIService.analyzeCampaign({
        impressions,
        clicks,
        conversions: conversions || 0,
        spend: spend || 0,
        revenue: revenue || 0
      });

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تحليل الحملة'
      });
    }
  }

  // Generate A/B test variations
  async generateABVariations(req: Request, res: Response) {
    try {
      const { original, type } = req.body;

      if (!original || !type) {
        return res.status(400).json({
          success: false,
          message: 'Original content and type are required',
          messageAr: 'المحتوى الأصلي والنوع مطلوبان'
        });
      }

      const variations = await marketingAIService.generateABVariations(original, type);

      res.json({
        success: true,
        data: variations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء التنويعات'
      });
    }
  }

  // ==========================================
  // 🎯 AUDIENCE TARGETING
  // ==========================================

  // Generate audience segments
  async generateAudienceSegments(req: Request, res: Response) {
    try {
      const { productCategory } = req.body;

      if (!productCategory) {
        return res.status(400).json({
          success: false,
          message: 'Product category is required',
          messageAr: 'فئة المنتج مطلوبة'
        });
      }

      const segments = await marketingAIService.generateAudienceSegments(productCategory);

      res.json({
        success: true,
        data: segments
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء شرائح الجمهور'
      });
    }
  }

  // ==========================================
  // 🌍 LOCALIZATION
  // ==========================================

  // Localize campaign
  async localizeCampaign(req: Request, res: Response) {
    try {
      const { campaign, region } = req.body;

      if (!campaign || !region) {
        return res.status(400).json({
          success: false,
          message: 'Campaign and region are required',
          messageAr: 'الحملة والمنطقة مطلوبان'
        });
      }

      const localized = await marketingAIService.localizeCampaign(campaign, region);

      res.json({
        success: true,
        data: localized
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل توطين الحملة'
      });
    }
  }

  // ==========================================
  // 📈 GROWTH HACKING
  // ==========================================

  // Generate growth ideas
  async generateGrowthIdeas(req: Request, res: Response) {
    try {
      const { users, revenue, growth } = req.body;

      const ideas = await marketingAIService.generateGrowthIdeas({
        users: users || 0,
        revenue: revenue || 0,
        growth: growth || 0
      });

      res.json({
        success: true,
        data: ideas
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء أفكار النمو'
      });
    }
  }
}

export const marketingAIController = new MarketingAIController();
