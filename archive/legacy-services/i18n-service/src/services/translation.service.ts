import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import i18next from '../config/i18n.config';

const prisma = new PrismaClient();

export interface CreateTranslationInput {
  key: string;
  namespace: string;
  translations: Record<string, string>; // { en: "Hello", ar: "مرحبا" }
  description?: string;
}

export class TranslationService {
  // Create or update translation
  async upsertTranslation(input: CreateTranslationInput) {
    try {
      // Create or get translation key
      let translationKey = await prisma.translationKey.findUnique({
        where: { key: input.key }
      });

      if (!translationKey) {
        translationKey = await prisma.translationKey.create({
          data: {
            key: input.key,
            namespace: input.namespace,
            description: input.description
          }
        });
      }

      // Upsert translations for each language
      const results = await Promise.all(
        Object.entries(input.translations).map(([langCode, value]) =>
          prisma.translation.upsert({
            where: {
              keyId_langCode: {
                keyId: translationKey!.id,
                langCode
              }
            },
            create: {
              keyId: translationKey!.id,
              langCode,
              value
            },
            update: {
              value
            }
          })
        )
      );

      logger.info(`Translation upserted: ${input.key}`);
      return { key: translationKey, translations: results };
    } catch (error) {
      logger.error('Upsert translation error:', error);
      throw error;
    }
  }

  // Get translation by key and language
  async getTranslation(key: string, langCode: string) {
    try {
      const translationKey = await prisma.translationKey.findUnique({
        where: { key },
        include: {
          translations: {
            where: { langCode }
          }
        }
      });

      if (!translationKey || translationKey.translations.length === 0) {
        return null;
      }

      return {
        key: translationKey.key,
        namespace: translationKey.namespace,
        value: translationKey.translations[0].value
      };
    } catch (error) {
      logger.error('Get translation error:', error);
      throw error;
    }
  }

  // Get all translations for a namespace and language
  async getNamespaceTranslations(namespace: string, langCode: string) {
    try {
      const keys = await prisma.translationKey.findMany({
        where: { namespace },
        include: {
          translations: {
            where: { langCode }
          }
        }
      });

      const translations: Record<string, string> = {};
      keys.forEach(key => {
        if (key.translations.length > 0) {
          translations[key.key] = key.translations[0].value;
        }
      });

      return translations;
    } catch (error) {
      logger.error('Get namespace translations error:', error);
      throw error;
    }
  }

  // Get all translations for a language
  async getAllTranslations(langCode: string) {
    try {
      const translations = await prisma.translation.findMany({
        where: { langCode },
        include: {
          key: true
        }
      });

      const grouped: Record<string, Record<string, string>> = {};

      translations.forEach(t => {
        if (!grouped[t.key.namespace]) {
          grouped[t.key.namespace] = {};
        }
        grouped[t.key.namespace][t.key.key] = t.value;
      });

      return grouped;
    } catch (error) {
      logger.error('Get all translations error:', error);
      throw error;
    }
  }

  // Translate using i18next
  async translate(key: string, langCode: string, options?: any) {
    try {
      const translation = await i18next.t(key, { lng: langCode, ...options });
      return translation;
    } catch (error) {
      logger.error('Translate error:', error);
      throw error;
    }
  }

  // Batch translate
  async batchTranslate(keys: string[], langCode: string) {
    try {
      const translations: Record<string, string> = {};

      for (const key of keys) {
        translations[key] = await i18next.t(key, { lng: langCode });
      }

      return translations;
    } catch (error) {
      logger.error('Batch translate error:', error);
      throw error;
    }
  }

  // Delete translation
  async deleteTranslation(key: string) {
    try {
      const translationKey = await prisma.translationKey.findUnique({
        where: { key }
      });

      if (!translationKey) {
        throw new Error('Translation key not found');
      }

      await prisma.translationKey.delete({
        where: { id: translationKey.id }
      });

      logger.info(`Translation deleted: ${key}`);
    } catch (error) {
      logger.error('Delete translation error:', error);
      throw error;
    }
  }

  // Search translations
  async searchTranslations(query: string, langCode?: string) {
    try {
      const where: any = {
        OR: [
          { key: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      };

      const keys = await prisma.translationKey.findMany({
        where,
        include: {
          translations: langCode ? { where: { langCode } } : true
        },
        take: 50
      });

      return keys;
    } catch (error) {
      logger.error('Search translations error:', error);
      throw error;
    }
  }

  // Get missing translations
  async getMissingTranslations(langCode: string) {
    try {
      const allKeys = await prisma.translationKey.findMany({
        include: {
          translations: {
            where: { langCode }
          }
        }
      });

      const missing = allKeys.filter(key => key.translations.length === 0);

      return missing.map(key => ({
        key: key.key,
        namespace: key.namespace,
        description: key.description
      }));
    } catch (error) {
      logger.error('Get missing translations error:', error);
      throw error;
    }
  }

  // Get translation statistics
  async getStatistics() {
    try {
      const languages = await prisma.language.findMany({
        where: { enabled: true }
      });

      const totalKeys = await prisma.translationKey.count();

      const stats = await Promise.all(
        languages.map(async lang => {
          const translatedCount = await prisma.translation.count({
            where: { langCode: lang.code }
          });

          return {
            language: lang.code,
            name: lang.name,
            total: totalKeys,
            translated: translatedCount,
            missing: totalKeys - translatedCount,
            percentage: totalKeys > 0 ? Math.round((translatedCount / totalKeys) * 100) : 0
          };
        })
      );

      return stats;
    } catch (error) {
      logger.error('Get statistics error:', error);
      throw error;
    }
  }
}
