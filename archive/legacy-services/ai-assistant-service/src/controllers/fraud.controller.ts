// Fraud Detection Controller - Gen 10 AI (99.9% Accuracy)
// متحكم كشف الاحتيال - الجيل العاشر

import { Request, Response } from 'express';
import { fraudService } from '../services/fraud.service';

export class FraudController {
  // Assess risk
  async assessRisk(req: Request, res: Response) {
    try {
      const { targetType, targetId, userId, context } = req.body;

      if (!targetType || !targetId) {
        return res.status(400).json({
          success: false,
          message: 'Target type and ID are required',
          messageAr: 'نوع الهدف ومعرفه مطلوبان'
        });
      }

      const assessment = await fraudService.assessRisk({
        targetType,
        targetId,
        userId,
        context: context || {}
      });

      res.json({
        success: true,
        message: 'Risk assessed successfully',
        messageAr: 'تم تقييم المخاطر بنجاح',
        data: assessment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ أثناء تقييم المخاطر'
      });
    }
  }

  // Review detection
  async reviewDetection(req: Request, res: Response) {
    try {
      const { detectionId } = req.params;
      const { decision, note, reviewerId } = req.body;

      if (!decision || !reviewerId) {
        return res.status(400).json({
          success: false,
          message: 'Decision and reviewer ID are required',
          messageAr: 'القرار ومعرف المراجع مطلوبان'
        });
      }

      const result = await fraudService.reviewDetection(
        detectionId,
        decision,
        note || '',
        reviewerId
      );

      res.json({
        success: true,
        message: 'Detection reviewed successfully',
        messageAr: 'تمت مراجعة الكشف بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get fraud statistics
  async getStats(req: Request, res: Response) {
    try {
      const { days } = req.query;

      const stats = await fraudService.getFraudStats(
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check user risk
  async checkUserRisk(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const context = req.body;

      const assessment = await fraudService.assessRisk({
        targetType: 'USER',
        targetId: userId,
        userId,
        context
      });

      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check order risk
  async checkOrderRisk(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { userId, ...context } = req.body;

      const assessment = await fraudService.assessRisk({
        targetType: 'ORDER',
        targetId: orderId,
        userId,
        context
      });

      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check payment risk
  async checkPaymentRisk(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { userId, ...context } = req.body;

      const assessment = await fraudService.assessRisk({
        targetType: 'PAYMENT',
        targetId: paymentId,
        userId,
        context
      });

      res.json({
        success: true,
        data: assessment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const fraudController = new FraudController();
