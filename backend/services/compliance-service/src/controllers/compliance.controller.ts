import { Request, Response } from 'express';
import { ComplianceService } from '../services/compliance.service';

const complianceService = new ComplianceService();

export class ComplianceController {
  /**
   * فحص الامتثال للمنتج قبل الشحن
   */
  async checkCompliance(req: Request, res: Response) {
    try {
      const {
        productName,
        productCategory,
        hsCode,
        originCountry,
        destCountry,
        declaredValue,
        quantity,
        userId
      } = req.body;

      const result = await complianceService.performComplianceCheck({
        productName,
        productCategory,
        hsCode,
        originCountry,
        destCountry,
        declaredValue,
        quantity,
        userId
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على تحذيرات المستخدم
   */
  async getUserWarnings(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      const warnings = await complianceService.getUserWarnings(
        userId,
        status as string
      );

      res.json({
        success: true,
        data: warnings
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الإقرار بالتحذير
   */
  async acknowledgeWarning(req: Request, res: Response) {
    try {
      const { warningId } = req.params;
      const { userId } = req.body;

      const result = await complianceService.acknowledgeWarning(warningId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * حساب الرسوم الجمركية المتوقعة
   */
  async estimateDuty(req: Request, res: Response) {
    try {
      const {
        destCountry,
        productCategory,
        declaredValue,
        weight
      } = req.body;

      const estimate = await complianceService.estimateDuty({
        destCountry,
        productCategory,
        declaredValue,
        weight
      });

      res.json({
        success: true,
        data: estimate
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على متطلبات الشحن بين دولتين
   */
  async getShippingRequirements(req: Request, res: Response) {
    try {
      const { originCountry, destCountry } = req.params;

      const requirements = await complianceService.getShippingRequirements(
        originCountry,
        destCountry
      );

      res.json({
        success: true,
        data: requirements
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
