import { Request, Response } from 'express';
import { TranslationService } from '../services/translation.service';
import { logger } from '../utils/logger';

const translationService = new TranslationService();

export class TranslationController {
  // Upsert translation
  async upsertTranslation(req: Request, res: Response) {
    try {
      const { key, namespace, translations, description } = req.body;

      const result = await translationService.upsertTranslation({
        key,
        namespace,
        translations,
        description
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Upsert translation error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get translation
  async getTranslation(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const langCode = req.query.lang as string || 'en';

      const translation = await translationService.getTranslation(key, langCode);

      if (!translation) {
        return res.status(404).json({ success: false, error: 'Translation not found' });
      }

      res.json({ success: true, data: translation });
    } catch (error: any) {
      logger.error('Get translation error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get namespace translations
  async getNamespaceTranslations(req: Request, res: Response) {
    try {
      const { namespace } = req.params;
      const langCode = req.query.lang as string || 'en';

      const translations = await translationService.getNamespaceTranslations(namespace, langCode);

      res.json({ success: true, data: translations });
    } catch (error: any) {
      logger.error('Get namespace translations error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get all translations
  async getAllTranslations(req: Request, res: Response) {
    try {
      const langCode = req.query.lang as string || 'en';

      const translations = await translationService.getAllTranslations(langCode);

      res.json({ success: true, data: translations });
    } catch (error: any) {
      logger.error('Get all translations error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Translate
  async translate(req: Request, res: Response) {
    try {
      const { key, lang, options } = req.body;

      const translation = await translationService.translate(key, lang || 'en', options);

      res.json({ success: true, data: { key, translation } });
    } catch (error: any) {
      logger.error('Translate error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Batch translate
  async batchTranslate(req: Request, res: Response) {
    try {
      const { keys, lang } = req.body;

      const translations = await translationService.batchTranslate(keys, lang || 'en');

      res.json({ success: true, data: translations });
    } catch (error: any) {
      logger.error('Batch translate error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Delete translation
  async deleteTranslation(req: Request, res: Response) {
    try {
      const { key } = req.params;

      await translationService.deleteTranslation(key);

      res.json({ success: true, message: 'Translation deleted' });
    } catch (error: any) {
      logger.error('Delete translation error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Search translations
  async searchTranslations(req: Request, res: Response) {
    try {
      const { q, lang } = req.query;

      const results = await translationService.searchTranslations(
        q as string,
        lang as string
      );

      res.json({ success: true, data: results });
    } catch (error: any) {
      logger.error('Search translations error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get missing translations
  async getMissingTranslations(req: Request, res: Response) {
    try {
      const langCode = req.query.lang as string || 'en';

      const missing = await translationService.getMissingTranslations(langCode);

      res.json({ success: true, data: missing });
    } catch (error: any) {
      logger.error('Get missing translations error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Get statistics
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await translationService.getStatistics();

      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Get statistics error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
