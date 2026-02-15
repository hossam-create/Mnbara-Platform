import { PluginLoader, PluginLoaderConfig, PluginLoadOptions, PluginLoadResult } from './core/plugin-loader';
import { PluginRegistry, PluginRegistryConfig } from './core/plugin-registry';
import { PluginManifest, LoadedPlugin, PluginStatus } from './core/plugin-loader/src/types';
import { EventEmitter } from 'events';

export interface PluginManagerConfig {
  pluginsDirectory: string;
  registryPath: string;
  allowedPermissions?: string[];
  autoLoad?: boolean;
  autoEnable?: boolean;
  sandbox?: boolean;
}

export class PluginManager extends EventEmitter {
  private loader: PluginLoader;
  private registry: PluginRegistry;
  private config: PluginManagerConfig;
  private initialized = false;

  constructor(config: PluginManagerConfig) {
    super();
    this.config = {
      autoLoad: true,
      autoEnable: true,
      sandbox: true,
      ...config
    };

    const loaderConfig: PluginLoaderConfig = {
      pluginsDirectory: this.config.pluginsDirectory,
      manifestFile: 'plugin.json',
      allowedPermissions: this.config.allowedPermissions,
      sandbox: this.config.sandbox
    };

    const registryConfig: PluginRegistryConfig = {
      storagePath: this.config.registryPath,
      autoBackup: true
    };

    this.loader = new PluginLoader(loaderConfig);
    this.registry = new PluginRegistry(registryConfig);

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize registry first
      await this.registry.initialize();

      // Set up loader event handlers
      this.setupLoaderEvents();

      // Auto-load plugins if configured
      if (this.config.autoLoad) {
        await this.loadAllPlugins();
      }

      this.initialized = true;
      this.emit('manager:initialized');
    } catch (error) {
      this.emit('manager:error', 'Failed to initialize plugin manager', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async installPlugin(manifest: PluginManifest): Promise<PluginLoadResult> {
    if (!this.initialized) {
      throw new Error('Plugin manager not initialized');
    }

    try {
      // Register plugin in registry
      await this.registry.registerPlugin(manifest);

      // Load plugin
      const loadOptions: PluginLoadOptions = {
        autoEnable: this.config.autoEnable && manifest.enabled,
        validateDependencies: true,
        checkPermissions: true
      };

      const result = await this.loader.loadPlugin(manifest.metadata.id, loadOptions);

      if (result.success && result.plugin) {
        await this.registry.updatePluginStatus(
          manifest.metadata.id,
          result.plugin.enabled ? PluginStatus.ENABLED : PluginStatus.LOADED
        );
      } else {
        await this.registry.updatePluginStatus(
          manifest.metadata.id,
          PluginStatus.ERROR,
          result.error
        );
      }

      return result;
    } catch (error) {
      await this.registry.updatePluginStatus(
        manifest.metadata.id,
        PluginStatus.ERROR,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async uninstallPlugin(pluginId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Plugin manager not initialized');
    }

    try {
      // Unload plugin if loaded
      const loadedPlugin = this.loader.getLoadedPlugin(pluginId);
      if (loadedPlugin) {
        await this.loader.unloadPlugin(pluginId);
      }

      // Unregister from registry
      const unregistered = await this.registry.unregisterPlugin(pluginId);

      if (unregistered) {
        this.emit('manager:uninstalled', pluginId);
      }

      return unregistered;
    } catch (error) {
      this.emit('manager:error', 'Failed to uninstall plugin', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async enablePlugin(pluginId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Plugin manager not initialized');
    }

    try {
      // Enable in loader
      const loaderEnabled = this.loader.enablePlugin(pluginId);
      if (!loaderEnabled) {
        return false;
      }

      // Enable in registry
      await this.registry.enablePlugin(pluginId);

      this.emit('manager:enabled', pluginId);
      return true;
    } catch (error) {
      this.emit('manager:error', 'Failed to enable plugin', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async disablePlugin(pluginId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Plugin manager not initialized');
    }

    try {
      // Disable in loader
      const loaderDisabled = this.loader.disablePlugin(pluginId);
      if (!loaderDisabled) {
        return false;
      }

      // Disable in registry
      await this.registry.disablePlugin(pluginId);

      this.emit('manager:disabled', pluginId);
      return true;
    } catch (error) {
      this.emit('manager:error', 'Failed to disable plugin', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async reloadPlugin(pluginId: string): Promise<PluginLoadResult> {
    if (!this.initialized) {
      throw new Error('Plugin manager not initialized');
    }

    try {
      // Get current plugin info
      const registryEntry = this.registry.getPlugin(pluginId);
      if (!registryEntry) {
        return {
          success: false,
          error: `Plugin ${pluginId} not found in registry`
        };
      }

      // Unload if loaded
      const loadedPlugin = this.loader.getLoadedPlugin(pluginId);
      if (loadedPlugin) {
        await this.loader.unloadPlugin(pluginId);
      }

      // Reload plugin
      const loadOptions: PluginLoadOptions = {
        autoEnable: registryEntry.enabled,
        validateDependencies: true,
        checkPermissions: true
      };

      const result = await this.loader.loadPlugin(pluginId, loadOptions);

      if (result.success && result.plugin) {
        await this.registry.updatePluginStatus(
          pluginId,
          result.plugin.enabled ? PluginStatus.ENABLED : PluginStatus.LOADED
        );
      } else {
        await this.registry.updatePluginStatus(
          pluginId,
          PluginStatus.ERROR,
          result.error
        );
      }

      return result;
    } catch (error) {
      await this.registry.updatePluginStatus(
        pluginId,
        PluginStatus.ERROR,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async loadAllPlugins(): Promise<PluginLoadResult[]> {
    if (!this.initialized) {
      throw new Error('Plugin manager not initialized');
    }

    const results = await this.loader.loadAllPlugins({
      autoEnable: this.config.autoEnable,
      validateDependencies: true,
      checkPermissions: true
    });

    // Update registry status for all loaded plugins
    for (const result of results) {
      if (result.success && result.plugin) {
        await this.registry.updatePluginStatus(
          result.plugin.manifest.metadata.id,
          result.plugin.enabled ? PluginStatus.ENABLED : PluginStatus.LOADED
        );
      }
    }

    return results;
  }

  getPlugin(pluginId: string): { loaded?: LoadedPlugin; registry?: any } {
    return {
      loaded: this.loader.getLoadedPlugin(pluginId),
      registry: this.registry.getPlugin(pluginId)
    };
  }

  getAllPlugins(): { loaded: LoadedPlugin[]; registry: any[] } {
    return {
      loaded: this.loader.getAllLoadedPlugins(),
      registry: this.registry.getAllPlugins()
    };
  }

  getPluginStatus(pluginId: string): PluginStatus {
    return this.loader.getPluginStatus(pluginId);
  }

  getStats(): any {
    const loaderStats = {
      loaded: this.loader.getAllLoadedPlugins().length,
      loading: this.loader.getAllLoadedPlugins().filter(p => this.getPluginStatus(p.manifest.metadata.id) === PluginStatus.LOADING).length
    };

    const registryStats = this.registry.getStats();

    return {
      loader: loaderStats,
      registry: registryStats,
      total: registryStats.totalPlugins
    };
  }

  private setupEventHandlers(): void {
    // Forward loader events
    this.loader.on('plugin:loading', (pluginId: string) => {
      this.emit('plugin:loading', pluginId);
    });

    this.loader.on('plugin:loaded', (pluginId: string, plugin: LoadedPlugin) => {
      this.emit('plugin:loaded', pluginId, plugin);
    });

    this.loader.on('plugin:unloading', (pluginId: string) => {
      this.emit('plugin:unloading', pluginId);
    });

    this.loader.on('plugin:unloaded', (pluginId: string) => {
      this.emit('plugin:unloaded', pluginId);
    });

    this.loader.on('plugin:enabled', (pluginId: string) => {
      this.emit('plugin:enabled', pluginId);
    });

    this.loader.on('plugin:disabled', (pluginId: string) => {
      this.emit('plugin:disabled', pluginId);
    });

    this.loader.on('plugin:error', (pluginId: string, error: string) => {
      this.emit('plugin:error', pluginId, error);
    });

    // Forward registry events
    this.registry.on('registry:registered', (pluginId: string, entry: any) => {
      this.emit('registry:registered', pluginId, entry);
    });

    this.registry.on('registry:updated', (pluginId: string, entry: any) => {
      this.emit('registry:updated', pluginId, entry);
    });

    this.registry.on('registry:unregistered', (pluginId: string, entry: any) => {
      this.emit('registry:unregistered', pluginId, entry);
    });

    this.registry.on('registry:status-updated', (pluginId: string, status: PluginStatus, error?: string) => {
      this.emit('registry:status-updated', pluginId, status, error);
    });

    this.registry.on('registry:enabled', (pluginId: string, entry: any) => {
      this.emit('registry:enabled', pluginId, entry);
    });

    this.registry.on('registry:disabled', (pluginId: string, entry: any) => {
      this.emit('registry:disabled', pluginId, entry);
    });

    this.registry.on('registry:error', (context: string, error: string) => {
      this.emit('registry:error', context, error);
    });
  }

  private setupLoaderEvents(): void {
    // Update registry when plugins are loaded/unloaded
    this.loader.on('plugin:loaded', async (pluginId: string, plugin: LoadedPlugin) => {
      try {
        await this.registry.updatePluginStatus(
          pluginId,
          plugin.enabled ? PluginStatus.ENABLED : PluginStatus.LOADED
        );
      } catch (error) {
        this.emit('manager:error', 'Failed to update registry after load', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    this.loader.on('plugin:unloaded', async (pluginId: string) => {
      try {
        await this.registry.updatePluginStatus(pluginId, PluginStatus.NOT_LOADED);
      } catch (error) {
        this.emit('manager:error', 'Failed to update registry after unload', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    this.loader.on('plugin:error', async (pluginId: string, error: string) => {
      try {
        await this.registry.updatePluginStatus(pluginId, PluginStatus.ERROR, error);
      } catch (registryError) {
        this.emit('manager:error', 'Failed to update registry after error', registryError instanceof Error ? registryError.message : 'Unknown error');
      }
    });
  }
}