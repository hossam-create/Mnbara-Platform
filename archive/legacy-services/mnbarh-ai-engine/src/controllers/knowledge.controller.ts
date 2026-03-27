// Knowledge Controller - Knowledge Base Management
// متحكم المعرفة - إدارة قاعدة المعرفة

import { Request, Response } from 'express';
import { knowledgeService } from '../services/knowledge.service';

export class KnowledgeController {
  // Add product knowledge
  async addProduct(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.name || !data.description) {
        return res.status(400).json({
          success: false,
          message: 'Name and description are required',
          messageAr: 'الاسم والوصف مطلوبان'
        });
      }

      const result = await knowledgeService.addProductKnowledge(data);

      res.status(201).json({
        success: true,
        message: 'Product knowledge added',
        messageAr: 'تمت إضافة معرفة المنتج',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add travel knowledge
  async addTravel(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.country || !data.type || !data.title || !data.content) {
        return res.status(400).json({
          success: false,
          message: 'Country, type, title, and content are required',
          messageAr: 'البلد والنوع والعنوان والمحتوى مطلوبة'
        });
      }

      const result = await knowledgeService.addTravelKnowledge(data);

      res.status(201).json({
        success: true,
        message: 'Travel knowledge added',
        messageAr: 'تمت إضافة معرفة السفر',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search knowledge
  async search(req: Request, res: Response) {
    try {
      const { query, category, limit } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required',
          messageAr: 'الاستعلام مطلوب'
        });
      }

      const results = await knowledgeService.searchRelevantKnowledge(
        query as string,
        (category as any) || 'GENERAL_CHAT',
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get customs info
  async getCustomsInfo(req: Request, res: Response) {
    try {
      const { country } = req.params;
      const info = await knowledgeService.getCustomsInfo(country);

      res.json({
        success: true,
        data: info
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get shopping tips
  async getShoppingTips(req: Request, res: Response) {
    try {
      const { country } = req.params;
      const tips = await knowledgeService.getShoppingTips(country);

      res.json({
        success: true,
        data: tips
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add training data
  async addTrainingData(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.category || !data.inputText || !data.outputText) {
        return res.status(400).json({
          success: false,
          message: 'Category, input text, and output text are required',
          messageAr: 'الفئة ونص الإدخال ونص الإخراج مطلوبة'
        });
      }

      const result = await knowledgeService.addTrainingData(data);

      res.status(201).json({
        success: true,
        message: 'Training data added',
        messageAr: 'تمت إضافة بيانات التدريب',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk import
  async bulkImport(req: Request, res: Response) {
    try {
      const { type, items } = req.body;

      if (!type || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Type and items array are required',
          messageAr: 'النوع ومصفوفة العناصر مطلوبة'
        });
      }

      let results;
      if (type === 'product') {
        results = await knowledgeService.bulkImportProductKnowledge(items);
      } else if (type === 'travel') {
        results = await knowledgeService.bulkImportTravelKnowledge(items);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be "product" or "travel"'
        });
      }

      res.json({
        success: true,
        message: 'Bulk import completed',
        messageAr: 'تم الاستيراد الجماعي',
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get stats
  async getStats(req: Request, res: Response) {
    try {
      const stats = await knowledgeService.getKnowledgeStats();

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
}

export const knowledgeController = new KnowledgeController();
