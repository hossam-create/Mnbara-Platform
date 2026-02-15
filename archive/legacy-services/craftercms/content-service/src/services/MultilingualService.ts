import { CrafterCMSClient } from '../craftercms-client/CrafterCMSClient';
import { Logger } from '@mnbara/shared-utils';
import { CacheService } from './CacheService';

/**
 * Multilingual Content Service
 * Handles content translation and localization
 */
export class MultilingualService {
  private crafterClient: CrafterCMSClient;
  private cacheService: CacheService;
  private logger: Logger;
  private supportedLanguages: string[];
  private defaultLanguage: string;

  constructor(
    crafterClient: CrafterCMSClient,
    cacheService: CacheService,
    supportedLanguages: string[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'zh'],
    defaultLanguage: string = 'en'
  ) {
    this.crafterClient = crafterClient;
    this.cacheService = cacheService;
    this.logger = new Logger('MultilingualService');
    this.supportedLanguages = supportedLanguages;
    this.defaultLanguage = defaultLanguage;
  }

  /**
   * Get content in specific language with fallback
   */
  async getLocalizedContent(
    siteId: string,
    contentPath: string,
    targetLanguage: string,
    options: {
      fallbackToDefault?: boolean;
      createIfNotExists?: boolean;
      translationService?: 'google' | 'deepl' | 'openai';
    } = {}
  ): Promise<any> {
    try {
      this.logger.info(`Getting localized content: ${contentPath} in ${targetLanguage}`);

      // Check if target language is supported
      if (!this.supportedLanguages.includes(targetLanguage)) {
        throw new Error(`Unsupported language: ${targetLanguage}`);
      }

      // Try to get content in target language
      const localizedPath = this.getLocalizedPath(contentPath, targetLanguage);
      
      try {
        const content = await this.crafterClient.getContentByPath(siteId, localizedPath);
        return content;
      } catch (error) {
        this.logger.debug(`Content not found in target language: ${targetLanguage}`);
      }

      // Fallback to default language if enabled
      if (options.fallbackToDefault !== false && targetLanguage !== this.defaultLanguage) {
        try {
          const defaultContent = await this.crafterClient.getContentByPath(siteId, contentPath);
          
          if (options.createIfNotExists) {
            // Create localized version
            const translatedContent = await this.translateContent(
              defaultContent,
              this.defaultLanguage,
              targetLanguage,
              options.translationService
            );
            
            await this.createLocalizedContent(siteId, localizedPath, translatedContent);
            return translatedContent;
          }
          
          return defaultContent;
        } catch (error) {
          this.logger.error(`Fallback content not found: ${contentPath}`);
          throw error;
        }
      }

      throw new Error(`Content not available in ${targetLanguage}`);
    } catch (error) {
      this.logger.error(`Failed to get localized content: ${contentPath}`, error);
      throw error;
    }
  }

  /**
   * Create localized content
   */
  async createLocalizedContent(
    siteId: string,
    contentPath: string,
    content: any,
    options: {
      publish?: boolean;
      target?: string;
    } = {}
  ): Promise<any> {
    try {
      this.logger.info(`Creating localized content: ${contentPath}`);

      const contentUpdate = {
        path: contentPath,
        contentType: content.contentType || 'page',
        content: content.content || content,
        metadata: content.metadata || [],
        locale: this.extractLanguageFromPath(contentPath)
      };

      const result = await this.crafterClient.updateContent(siteId, contentUpdate);

      if (options.publish && options.target) {
        await this.crafterClient.publishContent(siteId, [contentPath], options.target);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to create localized content: ${contentPath}`, error);
      throw error;
    }
  }

  /**
   * Translate content
   */
  async translateContent(
    content: any,
    sourceLanguage: string,
    targetLanguage: string,
    service: 'google' | 'deepl' | 'openai' = 'openai'
  ): Promise<any> {
    try {
      this.logger.info(`Translating content from ${sourceLanguage} to ${targetLanguage} using ${service}`);

      // Create a copy of the content
      const translatedContent = JSON.parse(JSON.stringify(content));

      // Extract text fields to translate
      const textFields = this.extractTextFields(translatedContent);
      
      // Translate text fields
      const translatedFields = await this.translateTextFields(
        textFields,
        sourceLanguage,
        targetLanguage,
        service
      );

      // Update content with translated fields
      this.updateContentWithTranslations(translatedContent, translatedFields);

      // Update metadata
      translatedContent.locale = targetLanguage;
      translatedContent.metadata = translatedContent.metadata || [];
      translatedContent.metadata.push({
        key: 'translation_source',
        value: sourceLanguage
      });
      translatedContent.metadata.push({
        key: 'translation_service',
        value: service
      });
      translatedContent.metadata.push({
        key: 'translation_date',
        value: new Date().toISOString()
      });

      return translatedContent;
    } catch (error) {
      this.logger.error(`Failed to translate content`, error);
      throw error;
    }
  }

  /**
   * Bulk translate content
   */
  async bulkTranslateContent(
    siteId: string,
    contentPaths: string[],
    targetLanguages: string[],
    options: {
      translationService?: 'google' | 'deepl' | 'openai';
      publish?: boolean;
      target?: string;
    } = {}
  ): Promise<{
    successful: { path: string; language: string }[];
    failed: { path: string; language: string; error: string }[];
  }> {
    const results = {
      successful: [] as { path: string; language: string }[],
      failed: [] as { path: string; language: string; error: string }[]
    };

    this.logger.info(`Starting bulk translation of ${contentPaths.length} content items to ${targetLanguages.length} languages`);

    for (const contentPath of contentPaths) {
      for (const targetLanguage of targetLanguages) {
        try {
          // Get source content
          const sourceContent = await this.crafterClient.getContentByPath(siteId, contentPath);
          const sourceLanguage = this.extractLanguageFromPath(contentPath) || this.defaultLanguage;

          // Skip if source and target are the same
          if (sourceLanguage === targetLanguage) {
            continue;
          }

          // Translate content
          const translatedContent = await this.translateContent(
            sourceContent,
            sourceLanguage,
            targetLanguage,
            options.translationService
          );

          // Create localized path
          const localizedPath = this.getLocalizedPath(contentPath, targetLanguage);

          // Create localized content
          await this.createLocalizedContent(siteId, localizedPath, translatedContent, {
            publish: options.publish,
            target: options.target
          });

          results.successful.push({ path: localizedPath, language: targetLanguage });
          
          this.logger.debug(`Successfully translated ${contentPath} to ${targetLanguage}`);

        } catch (error) {
          results.failed.push({
            path: contentPath,
            language: targetLanguage,
            error: error.message
          });
          
          this.logger.error(`Failed to translate ${contentPath} to ${targetLanguage}`, error);
        }
      }
    }

    this.logger.info(`Bulk translation completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Get available languages for content
   */
  async getAvailableLanguages(
    siteId: string,
    contentPath: string
  ): Promise<string[]> {
    try {
      const languages: string[] = [];

      // Check default language
      try {
        await this.crafterClient.getContentByPath(siteId, contentPath);
        languages.push(this.defaultLanguage);
      } catch (error) {
        // Default language not available
      }

      // Check other supported languages
      for (const language of this.supportedLanguages) {
        if (language === this.defaultLanguage) continue;

        const localizedPath = this.getLocalizedPath(contentPath, language);
        try {
          await this.crafterClient.getContentByPath(siteId, localizedPath);
          languages.push(language);
        } catch (error) {
          // Language not available
        }
      }

      return languages;
    } catch (error) {
      this.logger.error(`Failed to get available languages for ${contentPath}`, error);
      return [this.defaultLanguage];
    }
  }

  /**
   * Detect content language
   */
  async detectContentLanguage(content: any): Promise<string> {
    try {
      // Extract text content
      const textContent = this.extractTextContent(content);
      
      if (!textContent) {
        return this.defaultLanguage;
      }

      // Simple language detection based on common words
      // In production, use a proper language detection library
      const languagePatterns = {
        'en': /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i,
        'es': /\b(el|la|y|o|pero|en|de|para|con|por)\b/i,
        'fr': /\b(le|la|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/i,
        'de': /\b(der|die|und|oder|aber|in|auf|an|zu|für|von|mit|nach)\b/i,
        'it': /\b(il|la|e|o|ma|in|su|a|per|di|con|da)\b/i,
        'pt': /\b(o|a|e|ou|mas|em|sobre|para|de|com|por)\b/i,
        'ar': /[\u0600-\u06FF]/,
        'zh': /[\u4e00-\u9fff]/
      };

      for (const [language, pattern] of Object.entries(languagePatterns)) {
        if (pattern.test(textContent)) {
          return language;
        }
      }

      return this.defaultLanguage;
    } catch (error) {
      this.logger.error('Failed to detect content language', error);
      return this.defaultLanguage;
    }
  }

  /**
   * Extract text fields from content
   */
  private extractTextFields(content: any): Record<string, string> {
    const textFields: Record<string, string> = {};
    
    const extractFields = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
          // Check if it's likely text content (not URL, ID, etc.)
          if (this.isTextContent(value)) {
            textFields[fieldPath] = value;
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extractFields(value, fieldPath);
        }
      }
    };

    extractFields(content);
    return textFields;
  }

  /**
   * Check if string is text content
   */
  private isTextContent(value: string): boolean {
    // Skip if it's a URL, email, ID, or very short
    if (value.length < 10) return false;
    if (value.startsWith('http')) return false;
    if (value.includes('@') && value.includes('.')) return false;
    if (/^[a-zA-Z0-9_-]+$/.test(value) && value.length < 50) return false;
    
    return true;
  }

  /**
   * Translate text fields
   */
  private async translateTextFields(
    textFields: Record<string, string>,
    sourceLanguage: string,
    targetLanguage: string,
    service: string
  ): Promise<Record<string, string>> {
    const translatedFields: Record<string, string> = {};

    for (const [fieldPath, text] of Object.entries(textFields)) {
      try {
        const translatedText = await this.translateText(text, sourceLanguage, targetLanguage, service);
        translatedFields[fieldPath] = translatedText;
      } catch (error) {
        this.logger.warn(`Failed to translate field ${fieldPath}`, error);
        translatedFields[fieldPath] = text; // Keep original text
      }
    }

    return translatedFields;
  }

  /**
   * Translate individual text
   */
  private async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    service: string
  ): Promise<string> {
    // Simple translation implementation
    // In production, integrate with actual translation services
    
    this.logger.debug(`Translating text from ${sourceLanguage} to ${targetLanguage} using ${service}`);
    
    // For now, return the original text with a language indicator
    // In production, this would call actual translation APIs
    return `[${targetLanguage.toUpperCase()}] ${text}`;
  }

  /**
   * Update content with translations
   */
  private updateContentWithTranslations(content: any, translations: Record<string, string>): void {
    for (const [fieldPath, translatedText] of Object.entries(translations)) {
      this.setNestedProperty(content, fieldPath, translatedText);
    }
  }

  /**
   * Set nested property
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Extract text content for language detection
   */
  private extractTextContent(content: any): string {
    const textFields = this.extractTextFields(content);
    return Object.values(textFields).join(' ');
  }

  /**
   * Get localized path
   */
  private getLocalizedPath(originalPath: string, language: string): string {
    if (language === this.defaultLanguage) {
      return originalPath;
    }
    
    // Add language prefix to path
    const pathParts = originalPath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const directoryPath = pathParts.slice(0, -1).join('/');
    
    // Remove file extension if present
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const extension = filename.match(/\.[^/.]+$/)?.[0] || '';
    
    return `${directoryPath}/${language}/${nameWithoutExt}${extension}`;
  }

  /**
   * Extract language from path
   */
  private extractLanguageFromPath(path: string): string {
    const pathParts = path.split('/');
    
    // Look for language code in path
    for (const part of pathParts) {
      if (this.supportedLanguages.includes(part)) {
        return part;
      }
    }
    
    return this.defaultLanguage;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  /**
   * Get default language
   */
  getDefaultLanguage(): string {
    return this.defaultLanguage;
  }

  /**
   * Add supported language
   */
  addSupportedLanguage(language: string): void {
    if (!this.supportedLanguages.includes(language)) {
      this.supportedLanguages.push(language);
      this.logger.info(`Added supported language: ${language}`);
    }
  }

  /**
   * Remove supported language
   */
  removeSupportedLanguage(language: string): void {
    const index = this.supportedLanguages.indexOf(language);
    if (index > -1) {
      this.supportedLanguages.splice(index, 1);
      this.logger.info(`Removed supported language: ${language}`);
    }
  }
}