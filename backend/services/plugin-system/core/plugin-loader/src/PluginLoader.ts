import { PluginLoaderConfig, PluginManifest, LoadedPlugin, PluginLoadOptions, PluginLoadResult, PluginUnloadResult, PluginStatus } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export class PluginLoader extends EventEmitter {
  private config: PluginLoaderConfig;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private loadingPlugins: Set<string> = new Set();

  constructor(config: PluginLoaderConfig) {
    super();
    this.config = {
      allowedPermissions: [],
      sandbox: true,
      maxConcurrentLoads: 5,
      ...config
    };
  }

  async loadPlugin(pluginId: string, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    if (this.loadingPlugins.has(pluginId)) {
      return {
        success: false,
        error: `Plugin ${pluginId} is already being loaded`
      };
    }

    if (this.loadedPlugins.has(pluginId)) {
      return {
        success: false,
        error: `Plugin ${pluginId} is already loaded`
      };
    }

    this.loadingPlugins.add(pluginId);
    this.emit('plugin:loading', pluginId);

    try {
      const pluginPath = path.join(this.config.pluginsDirectory, pluginId);
      const manifestPath = path.join(pluginPath, this.config.manifestFile);
      
      // Check if plugin directory exists
      try {
        await fs.access(pluginPath);
      } catch {
        return {
          success: false,
          error: `Plugin directory not found: ${pluginPath}`
        };
      }

      // Load manifest
      let manifest: PluginManifest;
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        return {
          success: false,
          error: `Failed to load plugin manifest: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }

      // Validate manifest
      const validationResult = this.validateManifest(manifest);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid plugin manifest: ${validationResult.errors.join(', ')}`
        };
      }

      // Check dependencies if requested
      if (options.validateDependencies !== false) {
        const dependencyResult = await this.validateDependencies(manifest.metadata.dependencies || {});
        if (!dependencyResult.valid) {
          return {
            success: false,
            error: `Dependency validation failed: ${dependencyResult.errors.join(', ')}`
          };
        }
      }

      // Check permissions if requested
      if (options.checkPermissions !== false && this.config.allowedPermissions) {
        const permissionResult = this.validatePermissions(manifest.metadata.permissions || []);
        if (!permissionResult.valid) {
          return {
            success: false,
            error: `Permission validation failed: ${permissionResult.errors.join(', ')}`
          };
        }
      }

      // Load plugin module
      const entryPath = path.join(pluginPath, manifest.metadata.main);
      let pluginInstance;
      
      try {
        // Clear require cache to allow reloading
        delete require.cache[require.resolve(entryPath)];
        pluginInstance = require(entryPath);
        
        // Handle both default exports and module.exports
        if (pluginInstance.default && typeof pluginInstance.default === 'function') {
          pluginInstance = pluginInstance.default;
        }
        
        // Instantiate the plugin if it's a class or function
        if (typeof pluginInstance === 'function') {
          pluginInstance = new pluginInstance();
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to load plugin module: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }

      // Initialize plugin if it has an init method
      if (pluginInstance.init && typeof pluginInstance.init === 'function') {
        try {
          await pluginInstance.init({
            config: manifest.config || {},
            permissions: manifest.metadata.permissions || []
          });
        } catch (error) {
          return {
            success: false,
            error: `Plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance: pluginInstance,
        enabled: options.autoEnable !== false && manifest.enabled,
        loadedAt: new Date()
      };

      this.loadedPlugins.set(pluginId, loadedPlugin);
      this.loadingPlugins.delete(pluginId);
      
      this.emit('plugin:loaded', pluginId, loadedPlugin);
      
      return {
        success: true,
        plugin: loadedPlugin,
        warnings: this.generateWarnings(manifest)
      };
    } catch (error) {
      this.loadingPlugins.delete(pluginId);
      this.emit('plugin:error', pluginId, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async unloadPlugin(pluginId: string): Promise<PluginUnloadResult> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return {
        success: false,
        error: `Plugin ${pluginId} is not loaded`
      };
    }

    this.emit('plugin:unloading', pluginId);

    try {
      // Call destroy method if available
      if (plugin.instance.destroy && typeof plugin.instance.destroy === 'function') {
        await plugin.instance.destroy();
      }

      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);

      // Clear require cache
      const pluginPath = path.join(this.config.pluginsDirectory, pluginId);
      const entryPath = path.join(pluginPath, plugin.manifest.metadata.main);
      delete require.cache[require.resolve(entryPath)];

      this.emit('plugin:unloaded', pluginId);

      return {
        success: true
      };
    } catch (error) {
      this.emit('plugin:error', pluginId, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async loadAllPlugins(options: PluginLoadOptions = {}): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = [];
    
    try {
      const pluginDirs = await fs.readdir(this.config.pluginsDirectory);
      const loadPromises = pluginDirs.map(async (dir) => {
        const pluginPath = path.join(this.config.pluginsDirectory, dir);
        const stat = await fs.stat(pluginPath);
        
        if (stat.isDirectory()) {
          return this.loadPlugin(dir, options);
        }
        return null;
      });

      const loadResults = await Promise.all(loadPromises);
      
      return loadResults.filter(result => result !== null) as PluginLoadResult[];
    } catch (error) {
      this.emit('error', 'Failed to load plugins', error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  async reloadPlugin(pluginId: string, options: PluginLoadOptions = {}): Promise<PluginLoadResult> {
    await this.unloadPlugin(pluginId);
    return this.loadPlugin(pluginId, options);
  }

  getLoadedPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  getAllLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  getPluginStatus(pluginId: string): PluginStatus {
    if (this.loadingPlugins.has(pluginId)) {
      return PluginStatus.LOADING;
    }

    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return PluginStatus.NOT_LOADED;
    }

    if (plugin.error) {
      return PluginStatus.ERROR;
    }

    return plugin.enabled ? PluginStatus.ENABLED : PluginStatus.DISABLED;
  }

  enablePlugin(pluginId: string): boolean {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    plugin.enabled = true;
    this.emit('plugin:enabled', pluginId);
    return true;
  }

  disablePlugin(pluginId: string): boolean {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    plugin.enabled = false;
    this.emit('plugin:disabled', pluginId);
    return true;
  }

  private validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.metadata) {
      errors.push('Missing metadata');
      return { valid: false, errors };
    }

    if (!manifest.metadata.id) {
      errors.push('Missing metadata.id');
    }

    if (!manifest.metadata.name) {
      errors.push('Missing metadata.name');
    }

    if (!manifest.metadata.version) {
      errors.push('Missing metadata.version');
    }

    if (!manifest.metadata.main) {
      errors.push('Missing metadata.main');
    }

    if (typeof manifest.enabled !== 'boolean') {
      errors.push('Missing or invalid enabled field');
    }

    return { valid: errors.length === 0, errors };
  }

  private async validateDependencies(dependencies: Record<string, string>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [depName, depVersion] of Object.entries(dependencies)) {
      try {
        require.resolve(depName);
      } catch {
        errors.push(`Missing dependency: ${depName}@${depVersion}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validatePermissions(permissions: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.allowedPermissions && this.config.allowedPermissions.length > 0) {
      for (const permission of permissions) {
        if (!this.config.allowedPermissions!.includes(permission)) {
          errors.push(`Permission not allowed: ${permission}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private generateWarnings(manifest: PluginManifest): string[] {
    const warnings: string[] = [];

    if (!manifest.metadata.description) {
      warnings.push('Missing plugin description');
    }

    if (!manifest.metadata.author) {
      warnings.push('Missing plugin author');
    }

    if (!manifest.metadata.hooks || manifest.metadata.hooks.length === 0) {
      warnings.push('No hooks registered');
    }

    return warnings;
  }
}