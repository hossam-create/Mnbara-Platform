import { Request, Response } from 'express';
import { ProhibitedService } from '../services/prohibited.service';

const prohibitedService = new ProhibitedService();

export class ProhibitedController {
  /**
   * الحصول على قائمة المنتجات المحظورة لدولة
   */
  async getProhibitedItems(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;
      const { category } = req.query;

      const items = await prohibitedService.getProhibitedItems(
        countryCode,
        category as string
      );

      res.json({
        success: true,
        data: items
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * البحث في المنتجات المحظورة
   */
  async searchProhibited(req: Request, res: Response) {
    try {
      const { query, countryCode } = req.query;

      const results = await prohibitedService.searchProhibited(
        query as string,
        countryCode as string
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * التحقق إذا كان المنتج محظور
   */
  async checkIfProhibited(req: Request, res: Response) {
    try {
      const { productName, hsCode, countryCode, keywords } = req.body;

      const result = await prohibitedService.checkIfProhibited({
        productName,
        hsCode,
        countryCode,
        keywords
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
   * الحصول على المنتجات المقيدة
   */
  async getRestrictedItems(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;

      const items = await prohibitedService.getRestrictedItems(countryCode);

      res.json({
        success: true,
        data: items
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * إضافة منتج محظور (Admin)
   */
  async addProhibitedItem(req: Request, res: Response) {
    try {
      const item = await prohibitedService.addProhibitedItem(req.body);

      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * تحديث منتج محظور (Admin)
   */
  async updateProhibitedItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await prohibitedService.updateProhibitedItem(id, req.body);

      res.json({
        success: true,
        data: item
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
