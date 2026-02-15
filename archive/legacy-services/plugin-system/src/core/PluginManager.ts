// ============================================================
// Plugin Manager - Orchestrates plugin lifecycle
// ============================================================

import { PrismaClient } from '@prisma/client';
import { PluginLoader, LoadedPlugin } from './PluginLoader';
import { PluginRegistry } from './PluginRegistry';
import { HookRegistry } from '../hooks/HookRegistry';
import { EventBus } from '../events/EventBus';
import { PluginContext } from '../types/plugin.types';
import { WinstonLogger } from '../utils/logger';
import { ServiceAccess } from '../types/plugin.types';

export class PluginManager {
  private loader: PluginLoader;
  private registry: PluginRegistry;
  private hooks: HookRegistry;
  private eventBus: EventBus;
  private prisma: PrismaClient;
  private logger: WinstonLogger;
  private serviceAccess: ServiceAccess;
  private initializedPlugins: Map<string, any> = new Map();

  constructor(
    loader: PluginLoader,
    registry: PluginRegistry,
    hooks: HookRegistry,
    eventBus: EventBus,
    prisma: PrismaClient,
    logger: WinstonLogger,
    serviceAccess: ServiceAccess
  ) {
    this.loader = loader;
    this.registry = registry;
    this.hooks = hooks;
    this.eventBus = eventBus;
    this.prisma = prisma;
    this.logger = logger;
    this.serviceAccess = serviceAccess;
  }

  /**
   * Initialize a plugin (create instance and call initialize)
   */
  async initializePlugin(pluginId: string, config: Record<string, any> = {}): Promise<void> {
    try {
      const loadedPlugin = this.loader.getLoadedPlugin(pluginId);
      if (!loadedPlugin) {
        throw new Error(`Plugin not loaded: ${pluginId}`);
      }

      // Get plugin metadata
      const metadata = await this.registry.getPlugin(pluginId);
      if (!metadata) {
        throw new Error(`Plugin not registered: ${pluginId}`);
      }

      // Create plugin context
      const context: PluginContext = {
        pluginId,
        pluginName: loadedPlugin.manifest.name,
        pluginVersion: loadedPlugin.manifest.version,
        config,
        logger: this.logger,
        hooks: this.hooks,
        events: this.eventBus,
        services: this.serviceAccess,
        database: {
          query: async (sql: string, params?: any[]) => {
            // Permission check would go here
            return this.prisma.$queryRawUnsafe(sql, ...(params || []));
          },
          transaction: async <T>(callback: (tx: any) => Promise<T>) => {
            return this.prisma.$transaction(callback);
          }
        }
      };

      // Create plugin instance
      const PluginClass = loadedPlugin.instance;
      const pluginInstance = new PluginClass(context);

      // Call initialize
      await pluginInstance.initialize();

      // Store initialized instance
      this.initializedPlugins.set(pluginId, pluginInstance);

      // Update status
      await this.registry.updateStatus(pluginId, 'ACTIVE');

      // Register hooks from manifest
      if (loadedPlugin.manifest.hooks) {
        for (const hookName of loadedPlugin.manifest.hooks) {
          // Hooks should be registered in initialize() method
          // This is just for tracking
          this.logger.debug(`Plugin ${pluginId} can register hook: ${hookName}`);
        }
      }

      this.logger.info(`Plugin initialized: ${pluginId}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize plugin: ${pluginId}`, error);
      await this.registry.updateStatus(pluginId, 'ERROR', error.message);
      throw error;
    }
  }

  /**
   * Deinitialize a plugin
   */
  async deinitializePlugin(pluginId: string): Promise<void> {
    try {
      const instance = this.initializedPlugins.get(pluginId);
      if (!instance) {
        throw new Error(`Plugin not initialized: ${pluginId}`);
      }

      // Call destroy
      if (typeof instance.destroy === 'function') {
        await instance.destroy();
      }

      // Unregister all hooks
      await this.hooks.unregisterAll(pluginId);

      // Remove from initialized plugins
      this.initializedPlugins.delete(pluginId);

      // Update status
      await this.registry.updateStatus(pluginId, 'INACTIVE');

      this.logger.info(`Plugin deinitialized: ${pluginId}`);
    } catch (error: any) {
      this.logger.error(`Failed to deinitialize plugin: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Install a plugin (load + register + initialize)
   */
  async installPlugin(pluginName: string, config: Record<string, any> = {}): Promise<string> {
    try {
      // Load plugin
      const loadResult = await this.loader.loadPlugin(pluginName);
      if (!loadResult.success || !loadResult.pluginId) {
        throw new Error(loadResult.error || 'Failed to load plugin');
      }

      const pluginId = loadResult.pluginId;
      const loadedPlugin = this.loader.getLoadedPlugin(pluginId);
      if (!loadedPlugin) {
        throw new Error('Plugin loaded but not found in registry');
      }

      // Register in database
      const registeredId = await this.registry.register(
        loadedPlugin.manifest,
        loadedPlugin.path
      );

      // Store config
      if (Object.keys(config).length > 0) {
        for (const [key, value] of Object.entries(config)) {
          await this.prisma.pluginConfig.create({
            data: {
              pluginId: registeredId,
              configKey: key,
              configValue: value as any,
              isSecret: false // Should check manifest for secret fields
            }
          });
        }
      }

      // Initialize
      await this.initializePlugin(registeredId, config);

      this.logger.info(`Plugin installed: ${pluginName} -> ${registeredId}`);

      return registeredId;
    } catch (error: any) {
      this.logger.error(`Failed to install plugin: ${pluginName}`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      // Deinitialize
      if (this.initializedPlugins.has(pluginId)) {
        await this.deinitializePlugin(pluginId);
      }

      // Unload
      await this.loader.unloadPlugin(pluginId);

      // Unregister
      await this.registry.unregister(pluginId);

      this.logger.info(`Plugin uninstalled: ${pluginId}`);
    } catch (error: any) {
      this.logger.error(`Failed to uninstall plugin: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Get initialized plugin instance
   */
  getPluginInstance(pluginId: string): any {
    return this.initializedPlugins.get(pluginId);
  }
}

