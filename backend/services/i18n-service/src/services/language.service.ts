import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateLanguageInput {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
  enabled?: boolean;
  isDefault?: boolean;
}

export class LanguageService {
  // Create language
  async createLanguage(input: CreateLanguageInput) {
    try {
      // If setting as default, unset other defaults
      if (input.isDefault) {
        await prisma.language.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const language = await prisma.language.create({
        data: input
      });

      logger.info(`Language created: ${language.code}`);
      return language;
    } catch (error) {
      logger.error('Create language error:', error);
      throw error;
    }
  }

  // Get all languages
  async getLanguages(enabledOnly: boolean = false) {
    try {
      const where = enabledOnly ? { enabled: true } : {};

      const languages = await prisma.language.findMany({
        where,
        orderBy: { name: 'asc' }
      });

      return languages;
    } catch (error) {
      logger.error('Get languages error:', error);
      throw error;
    }
  }

  // Get language by code
  async getLanguage(code: string) {
    try {
      const language = await prisma.language.findUnique({
        where: { code }
      });

      if (!language) {
        throw new Error('Language not found');
      }

      return language;
    } catch (error) {
      logger.error('Get language error:', error);
      throw error;
    }
  }

  // Update language
  async updateLanguage(code: string, updates: Partial<CreateLanguageInput>) {
    try {
      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await prisma.language.updateMany({
          where: { isDefault: true, code: { not: code } },
          data: { isDefault: false }
        });
      }

      const language = await prisma.language.update({
        where: { code },
        data: updates
      });

      logger.info(`Language updated: ${code}`);
      return language;
    } catch (error) {
      logger.error('Update language error:', error);
      throw error;
    }
  }

  // Delete language
  async deleteLanguage(code: string) {
    try {
      await prisma.language.delete({
        where: { code }
      });

      logger.info(`Language deleted: ${code}`);
    } catch (error) {
      logger.error('Delete language error:', error);
      throw error;
    }
  }

  // Get default language
  async getDefaultLanguage() {
    try {
      const language = await prisma.language.findFirst({
        where: { isDefault: true }
      });

      if (!language) {
        // Fallback to first enabled language
        return await prisma.language.findFirst({
          where: { enabled: true }
        });
      }

      return language;
    } catch (error) {
      logger.error('Get default language error:', error);
      throw error;
    }
  }

  // Toggle language enabled status
  async toggleLanguage(code: string) {
    try {
      const language = await prisma.language.findUnique({
        where: { code }
      });

      if (!language) {
        throw new Error('Language not found');
      }

      const updated = await prisma.language.update({
        where: { code },
        data: { enabled: !language.enabled }
      });

      logger.info(`Language toggled: ${code} -> ${updated.enabled}`);
      return updated;
    } catch (error) {
      logger.error('Toggle language error:', error);
      throw error;
    }
  }
}
