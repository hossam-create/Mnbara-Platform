// ============================================================
// Plugin Loader - Loads and validates plugins
// ============================================================

import { promises as fs } from 'fs';
import path from 'path';
import { PluginManifest, PluginLoadResult, PluginType, PluginCategory } from '../types/plugin.types';
import { PluginValidator } from './PluginValidator';
import { PluginSandbox } from './PluginSandbox';
import { Logger } from '../utils/logger';

export interface LoadedPlugin {
  id: string;
  manifest: PluginManifest;
  instance: any;
  loadedAt: Date;
  path: string;
}

export class PluginLoader {
  private pluginsDir: string;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private validator: PluginValidator;
  private sandbox: PluginSandbox;
  private logger: Logger;

  constructor(
    pluginsDir: string,
    validator: PluginValidator,
    sandbox: PluginSandbox,
    logger: Logger
  ) {
    this.pluginsDir = pluginsDir;
    this.validator = validator;
    this.sandbox = sandbox;
    this.logger = logger;
  }

  /**
   * Load all plugins from plugins directory
   */
  async loadAllPlugins(): Promise<PluginLoadResult[]> {
    try {
      const pluginDirs = await fs.readdir(this.pluginsDir);
      const results: PluginLoadResult[] = [];

      for (const dir of pluginDirs) {
        const pluginPath = path.join(this.pluginsDir, dir);
        const stat = await fs.stat(pluginPath);
        
        if (stat.isDirectory()) {
          const result = await this.loadPlugin(dir);
          results.push(result);
        }
      }

      return results;
    } catch (error: any) {
      this.logger.error('Failed to load plugins', error);
      throw error;
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginName: string): Promise<PluginLoadResult> {
    try {
      const pluginPath = path.join(this.pluginsDir, pluginName);
      
      // Check if plugin directory exists
      try {
        await fs.access(pluginPath);
      } catch {
        return {
          success: false,
          error: `Plugin directory not found: ${pluginName}`
        };
      }

      // Read manifest
      const manifestPath = path.join(pluginPath, 'plugin.json');
      let manifestContent: string;
      
      try {
        manifestContent = await fs.readFile(manifestPath, 'utf-8');
      } catch {
        return {
          success: false,
          error: `Manifest file not found: ${manifestPath}`
        };
      }

      let manifest: PluginManifest;
      try {
        manifest = JSON.parse(manifestContent);
      } catch (error: any) {
        return {
          success: false,
          error: `Invalid manifest JSON: ${error.message}`
        };
      }

      // Validate manifest
      const validationResult = await this.validator.validateManifest(manifest);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Manifest validation failed: ${validationResult.errors.join(', ')}`
        };
      }

      // Check platform compatibility
      const compatibilityResult = this.validator.checkCompatibility(manifest);
      if (!compatibilityResult.compatible) {
        return {
          success: false,
          error: `Platform compatibility check failed: ${compatibilityResult.reason}`
        };
      }

      // Load plugin code
      const entryPath = path.join(pluginPath, manifest.entry);
      
      // Check if entry file exists
      try {
        await fs.access(entryPath);
      } catch {
        return {
          success: false,
          error: `Entry file not found: ${entryPath}`
        };
      }

      // Load plugin in sandbox
      const pluginClass = await this.sandbox.loadPlugin(entryPath, manifest.name);

      // Generate plugin ID (use name@version format)
      const pluginId = `${manifest.name}@${manifest.version}`;

      // Store loaded plugin (instance will be created during initialization)
      this.loadedPlugins.set(pluginId, {
        id: pluginId,
        manifest,
        instance: pluginClass, // Class, not instance yet
        loadedAt: new Date(),
        path: pluginPath
      });

      this.logger.info(`Plugin loaded successfully: ${manifest.name}@${manifest.version}`, {
        pluginId,
        type: manifest.type,
        category: manifest.category
      });

      return {
        success: true,
        pluginId,
        warnings: validationResult.warnings
      };
    } catch (error: any) {
      this.logger.error(`Failed to load plugin: ${pluginName}`, error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Destroy plugin instance if it exists
    if (plugin.instance && typeof plugin.instance.destroy === 'function') {
      try {
        await plugin.instance.destroy();
      } catch (error: any) {
        this.logger.error(`Error destroying plugin: ${pluginId}`, error);
      }
    }

    // Remove from loaded plugins
    this.loadedPlugins.delete(pluginId);

    this.logger.info(`Plugin unloaded: ${pluginId}`);
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginId: string): Promise<PluginLoadResult> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return {
        success: false,
        error: `Plugin not found: ${pluginId}`
      };
    }

    // Unload first
    await this.unloadPlugin(pluginId);

    // Load again
    const pluginName = path.basename(plugin.path);
    return await this.loadPlugin(pluginName);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get a loaded plugin by ID
   */
  getLoadedPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

}

