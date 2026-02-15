import { PluginIntegrationService } from '../services/plugin-integration.service';
import { logger } from '../utils/logger';
import { prisma } from '../index';

export interface PluginConfig {
  enabled: boolean;
  pluginDirectory: string;
  enableSandbox: boolean;
  enableMarketplace: boolean;
  autoRegisterHooks: boolean;
  maxActivePlugins: number;
  allowedModules: string[];
  restrictedModules: string[];
}

export const defaultPluginConfig: PluginConfig = {
  enabled: true,
  pluginDirectory: './plugins',
  enableSandbox: true,
  enableMarketplace: true,
  autoRegisterHooks: true,
  maxActivePlugins: 50,
  allowedModules: [
    'crypto',
    'util',
    'url',
    'querystring',
    'path',
    'fs',
    'os',
    'stream',
    'buffer',
    'events',
    'timers',
    'process',
  ],
  restrictedModules: [
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'http2',
    'https',
    'net',
    'tls',
    'vm',
    'zlib',
    'v8',
    'inspector',
  ],
};

export class PluginConfigManager {
  private static instance: PluginConfigManager;
  private config: PluginConfig;
  private pluginService: PluginIntegrationService;

  private constructor() {
    this.config = defaultPluginConfig;
    this.pluginService = PluginIntegrationService.getInstance(prisma);
    this.loadConfig();
  }

  static getInstance(): PluginConfigManager {
    if (!PluginConfigManager.instance) {
      PluginConfigManager.instance = new PluginConfigManager();
    }
    return PluginConfigManager.instance;
  }

  private async loadConfig() {
    try {
      // Load config from database if available
      const dbConfig = await prisma.systemSettings.findFirst({
        where: { key: 'plugin_config' },
      });

      if (dbConfig) {
        this.config = { ...defaultPluginConfig, ...JSON.parse(dbConfig.value) };
        logger.info('Plugin configuration loaded from database');
      } else {
        // Save default config to database
        await prisma.systemSettings.create({
          data: {
            key: 'plugin_config',
            value: JSON.stringify(defaultPluginConfig),
            description: 'Plugin system configuration',
          },
        });
        logger.info('Default plugin configuration saved to database');
      }
    } catch (error) {
      logger.error('Failed to load plugin configuration:', error);
      this.config = defaultPluginConfig;
    }
  }

  async updateConfig(newConfig: Partial<PluginConfig>) {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Update database
      await prisma.systemSettings.update({
        where: { key: 'plugin_config' },
        data: { value: JSON.stringify(this.config) },
      });

      logger.info('Plugin configuration updated');
      return { success: true, message: 'Configuration updated successfully' };
    } catch (error) {
      logger.error('Failed to update plugin configuration:', error);
      return { success: false, message: 'Failed to update configuration' };
    }
  }

  getConfig(): PluginConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getPluginDirectory(): string {
    return this.config.pluginDirectory;
  }

  isSandboxEnabled(): boolean {
    return this.config.enableSandbox;
  }

  isMarketplaceEnabled(): boolean {
    return this.config.enableMarketplace;
  }

  getAllowedModules(): string[] {
    return this.config.allowedModules;
  }

  getRestrictedModules(): string[] {
    return this.config.restrictedModules;
  }

  getMaxActivePlugins(): number {
    return this.config.maxActivePlugins;
  }

  // Validation methods
  isModuleAllowed(moduleName: string): boolean {
    return this.config.allowedModules.includes(moduleName) && 
           !this.config.restrictedModules.includes(moduleName);
  }

  canActivateMorePlugins(currentActiveCount: number): boolean {
    return currentActiveCount < this.config.maxActivePlugins;
  }

  // Health check
  async getHealthStatus() {
    const health = await this.pluginService.getHealthStatus();
    return {
      ...health,
      config: {
        enabled: this.config.enabled,
        sandboxEnabled: this.config.enableSandbox,
        marketplaceEnabled: this.config.enableMarketplace,
        maxActivePlugins: this.config.maxActivePlugins,
      },
    };
  }
}

export const pluginConfigManager = PluginConfigManager.getInstance();