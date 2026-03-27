import { Request, Response } from 'express';
import { CustomsService } from '../services/customs.service';

const customsService = new CustomsService();

export class CustomsController {
  /**
   * الحصول على قواعد الجمارك لدولة
   */
  async getCustomsRules(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;
      const { ruleType } = req.query;

      const rules = await customsService.getCustomsRules(
        countryCode,
        ruleType as string
      );

      res.json({
        success: true,
        data: rules
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على معلومات الدولة
   */
  async getCountryInfo(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;

      const country = await customsService.getCountryInfo(countryCode);

      if (!country) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }

      res.json({
        success: true,
        data: country
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على جميع الدول
   */
  async getAllCountries(req: Request, res: Response) {
    try {
      const { region, hasRestrictions } = req.query;

      const countries = await customsService.getAllCountries({
        region: region as string,
        hasRestrictions: hasRestrictions === 'true'
      });

      res.json({
        success: true,
        data: countries
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * حساب الرسوم الجمركية
   */
  async calculateDuty(req: Request, res: Response) {
    try {
      const {
        countryCode,
        productCategory,
        hsCode,
        declaredValue,
        weight,
        quantity
      } = req.body;

      const calculation = await customsService.calculateDuty({
        countryCode,
        productCategory,
        hsCode,
        declaredValue,
        weight,
        quantity
      });

      res.json({
        success: true,
        data: calculation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * الحصول على الحد الأقصى للإعفاء الجمركي
   */
  async getDutyFreeLimit(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;

      const limit = await customsService.getDutyFreeLimit(countryCode);

      res.json({
        success: true,
        data: limit
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
