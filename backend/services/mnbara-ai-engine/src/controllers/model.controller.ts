// Model Controller - AI Model Management
// متحكم النماذج - إدارة نماذج الذكاء الاصطناعي

import { Request, Response } from 'express';
import { modelService } from '../services/model.service';

export class ModelController {
  // List available models
  async listAvailable(req: Request, res: Response) {
    try {
      const models = await modelService.listAvailableModels();
      res.json({
        success: true,
        data: models
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Initialize model
  async initializeModel(req: Request, res: Response) {
    try {
      const { modelKey } = req.body;

      if (!modelKey) {
        return res.status(400).json({
          success: false,
          message: 'Model key is required',
          messageAr: 'مفتاح النموذج مطلوب'
        });
      }

      const model = await modelService.initializeModel(modelKey);

      res.json({
        success: true,
        message: 'Model initialization started',
        messageAr: 'بدأ تهيئة النموذج',
        data: model
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get model status
  async getStatus(req: Request, res: Response) {
    try {
      const { modelId } = req.params;
      const status = await modelService.getModelStatus(modelId);

      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Model not found',
          messageAr: 'النموذج غير موجود'
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // List all models
  async listModels(req: Request, res: Response) {
    try {
      const models = await modelService.listModels();
      res.json({
        success: true,
        data: models
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate text
  async generateText(req: Request, res: Response) {
    try {
      const { modelName, prompt, maxTokens, temperature, topP } = req.body;

      if (!modelName || !prompt) {
        return res.status(400).json({
          success: false,
          message: 'Model name and prompt are required',
          messageAr: 'اسم النموذج والنص مطلوبان'
        });
      }

      const result = await modelService.generateText(modelName, prompt, {
        maxTokens,
        temperature,
        topP
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate embedding
  async generateEmbedding(req: Request, res: Response) {
    try {
      const { text, model } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required',
          messageAr: 'النص مطلوب'
        });
      }

      const result = await modelService.generateEmbedding(text, model);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get model metrics
  async getMetrics(req: Request, res: Response) {
    try {
      const { modelId } = req.params;
      const { days } = req.query;

      const metrics = await modelService.getModelMetrics(
        modelId,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const modelController = new ModelController();
