// Sentiment Controller - Gen 10 AI
// متحكم تحليل المشاعر - الجيل العاشر

import { Request, Response } from 'express';
import { sentimentService } from '../services/sentiment.service';

export class SentimentController {
  // Analyze text sentiment
  async analyzeText(req: Request, res: Response) {
    try {
      const { text, sourceType, sourceId, userId, language } = req.body;

      if (!text || !sourceType || !sourceId) {
        return res.status(400).json({
          success: false,
          message: 'Text, sourceType, and sourceId are required',
          messageAr: 'النص ونوع المصدر ومعرف المصدر مطلوبة'
        });
      }

      const result = await sentimentService.analyzeText({
        text,
        sourceType,
        sourceId,
        userId,
        language
      });

      res.json({
        success: true,
        message: 'Sentiment analyzed successfully',
        messageAr: 'تم تحليل المشاعر بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء تحليل المشاعر'
      });
    }
  }

  // Batch analyze
  async batchAnalyze(req: Request, res: Response) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Items array is required',
          messageAr: 'مصفوفة العناصر مطلوبة'
        });
      }

      const result = await sentimentService.batchAnalyze(items);

      res.json({
        success: true,
        message: 'Batch analysis completed',
        messageAr: 'تم إكمال التحليل الجماعي',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Analyze product reviews
  async analyzeProductReviews(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const analysis = await sentimentService.analyzeProductReviews(productId);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Analyze seller reputation
  async analyzeSellerReputation(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;

      const analysis = await sentimentService.analyzeSellerReputation(sellerId);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Monitor sentiment in real-time
  async monitorSentiment(req: Request, res: Response) {
    try {
      const { sourceType, timeWindow } = req.query;

      if (!sourceType) {
        return res.status(400).json({
          success: false,
          message: 'Source type is required',
          messageAr: 'نوع المصدر مطلوب'
        });
      }

      const monitoring = await sentimentService.monitorSentiment(
        sourceType as any,
        timeWindow ? parseInt(timeWindow as string) : 60
      );

      res.json({
        success: true,
        data: monitoring
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get sentiment history
  async getSentimentHistory(req: Request, res: Response) {
    try {
      const { sourceType, sourceId } = req.params;
      const { days } = req.query;

      const history = await sentimentService.getSentimentHistory(
        sourceType as any,
        sourceId,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const sentimentController = new SentimentController();
