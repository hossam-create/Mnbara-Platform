// ============================================================
// Plugin Documentation Service - Developer Documentation Management
// ============================================================

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { CustomError } from '../utils/error-handler';

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'getting-started' | 'api-reference' | 'examples' | 'troubleshooting' | 'changelog';
}

export interface PluginDocumentation {
  pluginId: string;
  version: string;
  sections: DocumentationSection[];
  lastUpdated: Date;
  isPublished: boolean;
}

export interface DocumentationTemplate {
  id: string;
  name: string;
  description: string;
  sections: Omit<DocumentationSection, 'id'>[];
  category: string;
}

export class PluginDocumentationService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Create or update plugin documentation
   */
  async createDocumentation(pluginId: string, developerId: string, documentation: Partial<PluginDocumentation>): Promise<PluginDocumentation> {
    try {
      // Verify plugin ownership
      const plugin = await this.prisma.plugin.findFirst({
        where: { 
          id: pluginId,
          developerId 
        }
      });

      if (!plugin) {
        throw new CustomError('Plugin not found or unauthorized', 404);
      }

      // Create or update documentation
      const doc = await this.prisma.pluginDocumentation.upsert({
        where: { 
          pluginId_version: {
            pluginId,
            version: documentation.version || plugin.version
          }
        },
        update: {
          sections: documentation.sections || [],
          isPublished: documentation.isPublished || false,
          lastUpdated: new Date()
        },
        create: {
          id: uuidv4(),
          pluginId,
          version: documentation.version || plugin.version,
          sections: documentation.sections || [],
          isPublished: documentation.isPublished || false,
          lastUpdated: new Date()
        }
      });

      this.logger.info(`Documentation created/updated for plugin: ${pluginId}`);

      return this.mapToDocumentation(doc);
    } catch (error) {
      this.logger.error('Failed to create documentation', error);
      throw error;
    }
  }

  /**
   * Get plugin documentation
   */
  async getDocumentation(pluginId: string, version?: string): Promise<PluginDocumentation | null> {
    try {
      const query = version 
        ? { pluginId, version }
        : { pluginId };

      const doc = await this.prisma.pluginDocumentation.findFirst({
        where: query,
        orderBy: { lastUpdated: 'desc' }
      });

      return doc ? this.mapToDocumentation(doc) : null;
    } catch (error) {
      this.logger.error('Failed to get documentation', error);
      throw error;
    }
  }

  /**
   * Get all documentation versions for a plugin
   */
  async getDocumentationVersions(pluginId: string): Promise<string[]> {
    try {
      const docs = await this.prisma.pluginDocumentation.findMany({
        where: { pluginId },
        select: { version: true },
        orderBy: { lastUpdated: 'desc' }
      });

      return docs.map(d => d.version);
    } catch (error) {
      this.logger.error('Failed to get documentation versions', error);
      throw error;
    }
  }

  /**
   * Publish documentation
   */
  async publishDocumentation(pluginId: string, developerId: string, version: string): Promise<PluginDocumentation> {
    try {
      // Verify plugin ownership
      const plugin = await this.prisma.plugin.findFirst({
        where: { 
          id: pluginId,
          developerId 
        }
      });

      if (!plugin) {
        throw new CustomError('Plugin not found or unauthorized', 404);
      }

      const doc = await this.prisma.pluginDocumentation.update({
        where: { 
          pluginId_version: {
            pluginId,
            version
          }
        },
        data: {
          isPublished: true,
          lastUpdated: new Date()
        }
      });

      this.logger.info(`Documentation published for plugin: ${pluginId}, version: ${version}`);

      return this.mapToDocumentation(doc);
    } catch (error) {
      this.logger.error('Failed to publish documentation', error);
      throw error;
    }
  }

  /**
   * Unpublish documentation
   */
  async unpublishDocumentation(pluginId: string, developerId: string, version: string): Promise<PluginDocumentation> {
    try {
      // Verify plugin ownership
      const plugin = await this.prisma.plugin.findFirst({
        where: { 
          id: pluginId,
          developerId 
        }
      });

      if (!plugin) {
        throw new CustomError('Plugin not found or unauthorized', 404);
      }

      const doc = await this.prisma.pluginDocumentation.update({
        where: { 
          pluginId_version: {
            pluginId,
            version
          }
        },
        data: {
          isPublished: false,
          lastUpdated: new Date()
        }
      });

      this.logger.info(`Documentation unpublished for plugin: ${pluginId}, version: ${version}`);

      return this.mapToDocumentation(doc);
    } catch (error) {
      this.logger.error('Failed to unpublish documentation', error);
      throw error;
    }
  }

  /**
   * Delete documentation
   */
  async deleteDocumentation(pluginId: string, developerId: string, version: string): Promise<void> {
    try {
      // Verify plugin ownership
      const plugin = await this.prisma.plugin.findFirst({
        where: { 
          id: pluginId,
          developerId 
        }
      });

      if (!plugin) {
        throw new CustomError('Plugin not found or unauthorized', 404);
      }

      await this.prisma.pluginDocumentation.delete({
        where: { 
          pluginId_version: {
            pluginId,
            version
          }
        }
      });

      this.logger.info(`Documentation deleted for plugin: ${pluginId}, version: ${version}`);
    } catch (error) {
      this.logger.error('Failed to delete documentation', error);
      throw error;
    }
  }

  /**
   * Get documentation templates
   */
  async getDocumentationTemplates(): Promise<DocumentationTemplate[]> {
    try {
      const templates = await this.prisma.documentationTemplate.findMany({
        orderBy: { name: 'asc' }
      });

      return templates.map(this.mapToTemplate);
    } catch (error) {
      this.logger.error('Failed to get documentation templates', error);
      throw error;
    }
  }

  /**
   * Create documentation from template
   */
  async createFromTemplate(pluginId: string, developerId: string, templateId: string, version: string): Promise<PluginDocumentation> {
    try {
      const template = await this.prisma.documentationTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new CustomError('Template not found', 404);
      }

      // Verify plugin ownership
      const plugin = await this.prisma.plugin.findFirst({
        where: { 
          id: pluginId,
          developerId 
        }
      });

      if (!plugin) {
        throw new CustomError('Plugin not found or unauthorized', 404);
      }

      const sections = template.sections.map((section: any, index: number) => ({
        id: uuidv4(),
        title: section.title,
        content: this.replaceTemplateVariables(section.content, plugin),
        order: section.order || index,
        type: section.type
      }));

      const doc = await this.prisma.pluginDocumentation.create({
        data: {
          id: uuidv4(),
          pluginId,
          version,
          sections,
          isPublished: false,
          lastUpdated: new Date()
        }
      });

      this.logger.info(`Documentation created from template for plugin: ${pluginId}`);

      return this.mapToDocumentation(doc);
    } catch (error) {
      this.logger.error('Failed to create documentation from template', error);
      throw error;
    }
  }

  /**
   * Search documentation
   */
  async searchDocumentation(query: string, category?: string, limit: number = 20): Promise<PluginDocumentation[]> {
    try {
      const searchQuery: any = {
        isPublished: true,
        OR: [
          { sections: { array_contains: { title: { contains: query, mode: 'insensitive' } } } },
          { sections: { array_contains: { content: { contains: query, mode: 'insensitive' } } } }
        ]
      };

      if (category) {
        searchQuery.plugin = { category };
      }

      const docs = await this.prisma.pluginDocumentation.findMany({
        where: searchQuery,
        include: {
          plugin: {
            select: {
              id: true,
              name: true,
              category: true,
              developer: {
                select: {
                  username: true,
                  fullName: true
                }
              }
            }
          }
        },
        take: limit,
        orderBy: { lastUpdated: 'desc' }
      });

      return docs.map(this.mapToDocumentationWithPlugin);
    } catch (error) {
      this.logger.error('Failed to search documentation', error);
      throw error;
    }
  }

  private replaceTemplateVariables(content: string, plugin: any): string {
    return content
      .replace(/\{\{pluginName\}\}/g, plugin.name)
      .replace(/\{\{pluginVersion\}\}/g, plugin.version)
      .replace(/\{\{pluginDescription\}\}/g, plugin.description || '')
      .replace(/\{\{pluginCategory\}\}/g, plugin.category || '');
  }

  private mapToDocumentation(doc: any): PluginDocumentation {
    return {
      pluginId: doc.pluginId,
      version: doc.version,
      sections: doc.sections || [],
      lastUpdated: doc.lastUpdated,
      isPublished: doc.isPublished
    };
  }

  private mapToDocumentationWithPlugin(doc: any): PluginDocumentation & { plugin: any } {
    return {
      ...this.mapToDocumentation(doc),
      plugin: doc.plugin
    };
  }

  private mapToTemplate(template: any): DocumentationTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      sections: template.sections || [],
      category: template.category
    };
  }
}