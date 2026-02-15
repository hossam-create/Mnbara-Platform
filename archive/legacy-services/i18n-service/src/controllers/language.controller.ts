import { Request, Response } from 'express';
import { LanguageService } from '../services/language.service';
import { logger } from '../utils/logger';

const languageService = new LanguageService();

export class LanguageController {
  // Create language
  async createLanguage(req: Request, res: Response) {
    try {
      const { code, name, nativeName, direction, enabled, isDefault } = req.body;

      const language = await languageService.createLanguage({
        code,
        name,
        nativeName,
        direction,
        enabled,
        isDefault
      });

      res.status(201).json({ success: true, data: language });
    } catch (error: any) {
      logger.error('Create language error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get all languages
  async getLanguages(req: Request, res: Response) {
    try {
      const enabledOnly = req.query.enabled === 'true';

      const languages = await languageService.getLanguages(enabledOnly);

      res.json({ success: true, data: languages });
    } catch (error: any) {
      logger.error('Get languages error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get language
  async getLanguage(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const language = await languageService.getLanguage(code);

      res.json({ success: true, data: language });
    } catch (error: any) {
      logger.error('Get language error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // Update language
  async updateLanguage(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const updates = req.body;

      const language = await languageService.updateLanguage(code, updates);

      res.json({ success: true, data: language });
    } catch (error: any) {
      logger.error('Update language error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Delete language
  async deleteLanguage(req: Request, res: Response) {
    try {
      const { code } = req.params;

      await languageService.deleteLanguage(code);

      res.json({ success: true, message: 'Language deleted' });
    } catch (error: any) {
      logger.error('Delete language error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get default language
  async getDefaultLanguage(req: Request, res: Response) {
    try {
      const language = await languageService.getDefaultLanguage();

      res.json({ success: true, data: language });
    } catch (error: any) {
      logger.error('Get default language error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Toggle language
  async toggleLanguage(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const language = await languageService.toggleLanguage(code);

      res.json({ success: true, data: language });
    } catch (error: any) {
      logger.error('Toggle language error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
