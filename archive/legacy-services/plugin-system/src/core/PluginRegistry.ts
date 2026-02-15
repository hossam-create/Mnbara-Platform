// ============================================================
// Plugin Registry - Manages plugin metadata and state
// ============================================================

import { PrismaClient } from '@prisma/client';
import { PluginManifest, PluginType, PluginCategory } from '../types/plugin.types';
import { Logger } from '../utils/logger';

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  category: PluginCategory;
  status: 'INACTIVE' | 'ACTIVE' | 'ERROR' | 'UPDATING' | 'UNINSTALLING';
  installedAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  errorMessage?: string;
}

export class PluginRegistry {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Register a plugin in the database
   */
  async register(manifest: PluginManifest, pluginPath: string): Promise<string> {
    try {
      const plugin = await this.prisma.plugin.create({
        data: {
          name: manifest.name,
          version: manifest.version,
          type: manifest.type as any,
          category: manifest.category as any,
          manifest: manifest as any,
          status: 'INACTIVE'
        }
      });

      this.logger.info(`Plugin registered: ${manifest.name}@${manifest.version}`, {
        pluginId: plugin.id
      });

      return plugin.id;
    } catch (error: any) {
      this.logger.error('Failed to register plugin', error);
      throw error;
    }
  }

  /**
   * Update plugin status
   */
  async updateStatus(pluginId: string, status: PluginMetadata['status'], errorMessage?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'ACTIVE') {
        updateData.activatedAt = new Date();
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      await this.prisma.plugin.update({
        where: { id: pluginId },
        data: updateData
      });

      this.logger.info(`Plugin status updated: ${pluginId} -> ${status}`);
    } catch (error: any) {
      this.logger.error(`Failed to update plugin status: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<PluginMetadata | null> {
    try {
      const plugin = await this.prisma.plugin.findUnique({
        where: { id: pluginId }
      });

      if (!plugin) {
        return null;
      }

      return this.mapToMetadata(plugin);
    } catch (error: any) {
      this.logger.error(`Failed to get plugin: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Get plugin by name
   */
  async getPluginByName(name: string): Promise<PluginMetadata | null> {
    try {
      const plugin = await this.prisma.plugin.findUnique({
        where: { name }
      });

      if (!plugin) {
        return null;
      }

      return this.mapToMetadata(plugin);
    } catch (error: any) {
      this.logger.error(`Failed to get plugin by name: ${name}`, error);
      throw error;
    }
  }

  /**
   * List all plugins
   */
  async listPlugins(filters?: {
    status?: PluginMetadata['status'];
    type?: PluginType;
    category?: PluginCategory;
  }): Promise<PluginMetadata[]> {
    try {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      const plugins = await this.prisma.plugin.findMany({
        where,
        orderBy: { installedAt: 'desc' }
      });

      return plugins.map(p => this.mapToMetadata(p));
    } catch (error: any) {
      this.logger.error('Failed to list plugins', error);
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    try {
      await this.prisma.plugin.delete({
        where: { id: pluginId }
      });

      this.logger.info(`Plugin unregistered: ${pluginId}`);
    } catch (error: any) {
      this.logger.error(`Failed to unregister plugin: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Check if plugin is registered
   */
  async isRegistered(pluginName: string): Promise<boolean> {
    try {
      const plugin = await this.prisma.plugin.findUnique({
        where: { name: pluginName }
      });

      return plugin !== null;
    } catch (error: any) {
      this.logger.error(`Failed to check plugin registration: ${pluginName}`, error);
      return false;
    }
  }

  /**
   * Map Prisma model to PluginMetadata
   */
  private mapToMetadata(plugin: any): PluginMetadata {
    return {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      type: plugin.type,
      category: plugin.category,
      status: plugin.status,
      installedAt: plugin.installedAt,
      updatedAt: plugin.updatedAt,
      activatedAt: plugin.activatedAt,
      errorMessage: plugin.errorMessage
    };
  }
}

