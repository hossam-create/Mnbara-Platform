import { Request, Response } from 'express';
import { RecognitionService } from '../services/recognition.service';
import { logger } from '../utils/logger';

const recognitionService = new RecognitionService();

export class RecognitionController {
  async analyzeImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const detectObjects = req.body.detectObjects !== 'false';
      const result = await recognitionService.analyzeImage(req.file.buffer, detectObjects);

      // Add image URL if provided
      if (req.body.imageUrl) {
        result.imageUrl = req.body.imageUrl;
      }

      res.json(result);
    } catch (error: any) {
      logger.error('Analyze image error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async classifyImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const classifications = await recognitionService.classifyImage(req.file.buffer);

      res.json({ classifications });
    } catch (error: any) {
      logger.error('Classify image error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async detectObjects(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const objects = await recognitionService.detectObjects(req.file.buffer);

      res.json({ objects });
    } catch (error: any) {
      logger.error('Detect objects error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async visualSearch(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const matches = await recognitionService.findSimilarProducts(req.file.buffer);

      res.json({
        query: 'visual-search',
        matches,
        totalResults: matches.length
      });
    } catch (error: any) {
      logger.error('Visual search error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async suggestCategory(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const classifications = await recognitionService.classifyImage(req.file.buffer);
      const topClass = classifications[0]?.className || '';
      const suggestedCategory = recognitionService.getCategoryMapping(topClass);

      res.json({
        topClassification: topClass,
        suggestedCategory,
        confidence: classifications[0]?.probability || 0,
        alternatives: classifications.slice(1, 4).map(c => ({
          classification: c.className,
          category: recognitionService.getCategoryMapping(c.className),
          confidence: c.probability
        }))
      });
    } catch (error: any) {
      logger.error('Suggest category error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
