// Assistant Controller - Mnbara AI
// متحكم المساعد - ذكاء منبرة

import { Request, Response } from 'express';
import { assistantService } from '../services/assistant.service';

export class AssistantController {
  // Chat with Mnbara AI
  async chat(req: Request, res: Response) {
    try {
      const { sessionId, userId, message, language, context } = req.body;

      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and message are required',
          messageAr: 'معرف الجلسة والرسالة مطلوبان'
        });
      }

      const response = await assistantService.chat({
        sessionId,
        userId,
        message,
        language,
        context
      });

      // Emit via WebSocket if available
      const io = req.app.get('io');
      if (io) {
        io.to(sessionId).emit('ai_response', response);
      }

      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء المعالجة'
      });
    }
  }

  // Get greeting
  async getGreeting(req: Request, res: Response) {
    try {
      const { language } = req.query;
      const greeting = await assistantService.getGreeting(language as string);

      res.json({
        success: true,
        data: greeting
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Rate response
  async rateResponse(req: Request, res: Response) {
    try {
      const { inferenceId } = req.params;
      const { rating, feedback } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
          messageAr: 'التقييم يجب أن يكون بين 1 و 5'
        });
      }

      const result = await assistantService.rateResponse(inferenceId, rating, feedback);

      res.json({
        success: true,
        message: 'Thank you for your feedback!',
        messageAr: 'شكراً على تقييمك!',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Quick actions
  async quickAction(req: Request, res: Response) {
    try {
      const { action, parameters, language } = req.body;

      let response;
      switch (action) {
        case 'SEARCH':
          response = {
            action: 'NAVIGATE',
            target: '/search',
            params: { q: parameters.query },
            message: language === 'ar' ? `جاري البحث عن "${parameters.query}"` : `Searching for "${parameters.query}"`
          };
          break;
        case 'TRACK_ORDER':
          response = {
            action: 'NAVIGATE',
            target: '/orders',
            message: language === 'ar' ? 'جاري عرض طلباتك' : 'Showing your orders'
          };
          break;
        case 'VIEW_CART':
          response = {
            action: 'NAVIGATE',
            target: '/cart',
            message: language === 'ar' ? 'جاري فتح السلة' : 'Opening cart'
          };
          break;
        default:
          response = {
            action: 'NONE',
            message: language === 'ar' ? 'لم أفهم الأمر' : 'Command not understood'
          };
      }

      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const assistantController = new AssistantController();
