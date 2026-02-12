"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
const plugin_loader_1 = require("./core/plugin-loader");
const plugin_registry_1 = require("./core/plugin-registry");
const types_1 = require("./core/plugin-loader/src/types");
const events_1 = require("events");
class PluginManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.initialized = false;
        this.config = {
            autoLoad: true,
            autoEnable: true,
            sandbox: true,
            ...config
        };
        const loaderConfig = {
            pluginsDirectory: this.config.pluginsDirectory,
            manifestFile: 'plugin.json',
            allowedPermissions: this.config.allowedPermissions,
            sandbox: this.config.sandbox
        };
        const registryConfig = {
            storagePath: this.config.registryPath,
            autoBackup: true
        };
        this.loader = new plugin_loader_1.PluginLoader(loaderConfig);
        this.registry = new plugin_registry_1.PluginRegistry(registryConfig);
        this.setupEventHandlers();
    }
    async initialize() {
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
        }
        catch (error) {
            this.emit('manager:error', 'Failed to initialize plugin manager', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async installPlugin(manifest) {
        if (!this.initialized) {
            throw new Error('Plugin manager not initialized');
        }
        try {
            // Register plugin in registry
            await this.registry.registerPlugin(manifest);
            // Load plugin
            const loadOptions = {
                autoEnable: this.config.autoEnable && manifest.enabled,
                validateDependencies: true,
                checkPermissions: true
            };
            const result = await this.loader.loadPlugin(manifest.metadata.id, loadOptions);
            if (result.success && result.plugin) {
                await this.registry.updatePluginStatus(manifest.metadata.id, result.plugin.enabled ? types_1.PluginStatus.ENABLED : types_1.PluginStatus.LOADED);
            }
            else {
                await this.registry.updatePluginStatus(manifest.metadata.id, types_1.PluginStatus.ERROR, result.error);
            }
            return result;
        }
        catch (error) {
            await this.registry.updatePluginStatus(manifest.metadata.id, types_1.PluginStatus.ERROR, error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async uninstallPlugin(pluginId) {
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
        }
        catch (error) {
            this.emit('manager:error', 'Failed to uninstall plugin', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    async enablePlugin(pluginId) {
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
        }
        catch (error) {
            this.emit('manager:error', 'Failed to enable plugin', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    async disablePlugin(pluginId) {
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
        }
        catch (error) {
            this.emit('manager:error', 'Failed to disable plugin', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    async reloadPlugin(pluginId) {
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
            const loadOptions = {
                autoEnable: registryEntry.enabled,
                validateDependencies: true,
                checkPermissions: true
            };
            const result = await this.loader.loadPlugin(pluginId, loadOptions);
            if (result.success && result.plugin) {
                await this.registry.updatePluginStatus(pluginId, result.plugin.enabled ? types_1.PluginStatus.ENABLED : types_1.PluginStatus.LOADED);
            }
            else {
                await this.registry.updatePluginStatus(pluginId, types_1.PluginStatus.ERROR, result.error);
            }
            return result;
        }
        catch (error) {
            await this.registry.updatePluginStatus(pluginId, types_1.PluginStatus.ERROR, error instanceof Error ? error.message : 'Unknown error');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async loadAllPlugins() {
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
                await this.registry.updatePluginStatus(result.plugin.manifest.metadata.id, result.plugin.enabled ? types_1.PluginStatus.ENABLED : types_1.PluginStatus.LOADED);
            }
        }
        return results;
    }
    getPlugin(pluginId) {
        return {
            loaded: this.loader.getLoadedPlugin(pluginId),
            registry: this.registry.getPlugin(pluginId)
        };
    }
    getAllPlugins() {
        return {
            loaded: this.loader.getAllLoadedPlugins(),
            registry: this.registry.getAllPlugins()
        };
    }
    getPluginStatus(pluginId) {
        return this.loader.getPluginStatus(pluginId);
    }
    getStats() {
        const loaderStats = {
            loaded: this.loader.getAllLoadedPlugins().length,
            loading: this.loader.getAllLoadedPlugins().filter(p => this.getPluginStatus(p.manifest.metadata.id) === types_1.PluginStatus.LOADING).length
        };
        const registryStats = this.registry.getStats();
        return {
            loader: loaderStats,
            registry: registryStats,
            total: registryStats.totalPlugins
        };
    }
    setupEventHandlers() {
        // Forward loader events
        this.loader.on('plugin:loading', (pluginId) => {
            this.emit('plugin:loading', pluginId);
        });
        this.loader.on('plugin:loaded', (pluginId, plugin) => {
            this.emit('plugin:loaded', pluginId, plugin);
        });
        this.loader.on('plugin:unloading', (pluginId) => {
            this.emit('plugin:unloading', pluginId);
        });
        this.loader.on('plugin:unloaded', (pluginId) => {
            this.emit('plugin:unloaded', pluginId);
        });
        this.loader.on('plugin:enabled', (pluginId) => {
            this.emit('plugin:enabled', pluginId);
        });
        this.loader.on('plugin:disabled', (pluginId) => {
            this.emit('plugin:disabled', pluginId);
        });
        this.loader.on('plugin:error', (pluginId, error) => {
            this.emit('plugin:error', pluginId, error);
        });
        // Forward registry events
        this.registry.on('registry:registered', (pluginId, entry) => {
            this.emit('registry:registered', pluginId, entry);
        });
        this.registry.on('registry:updated', (pluginId, entry) => {
            this.emit('registry:updated', pluginId, entry);
        });
        this.registry.on('registry:unregistered', (pluginId, entry) => {
            this.emit('registry:unregistered', pluginId, entry);
        });
        this.registry.on('registry:status-updated', (pluginId, status, error) => {
            this.emit('registry:status-updated', pluginId, status, error);
        });
        this.registry.on('registry:enabled', (pluginId, entry) => {
            this.emit('registry:enabled', pluginId, entry);
        });
        this.registry.on('registry:disabled', (pluginId, entry) => {
            this.emit('registry:disabled', pluginId, entry);
        });
        this.registry.on('registry:error', (context, error) => {
            this.emit('registry:error', context, error);
        });
    }
    setupLoaderEvents() {
        // Update registry when plugins are loaded/unloaded
        this.loader.on('plugin:loaded', async (pluginId, plugin) => {
            try {
                await this.registry.updatePluginStatus(pluginId, plugin.enabled ? types_1.PluginStatus.ENABLED : types_1.PluginStatus.LOADED);
            }
            catch (error) {
                this.emit('manager:error', 'Failed to update registry after load', error instanceof Error ? error.message : 'Unknown error');
            }
        });
        this.loader.on('plugin:unloaded', async (pluginId) => {
            try {
                await this.registry.updatePluginStatus(pluginId, types_1.PluginStatus.NOT_LOADED);
            }
            catch (error) {
                this.emit('manager:error', 'Failed to update registry after unload', error instanceof Error ? error.message : 'Unknown error');
            }
        });
        this.loader.on('plugin:error', async (pluginId, error) => {
            try {
                await this.registry.updatePluginStatus(pluginId, types_1.PluginStatus.ERROR, error);
            }
            catch (registryError) {
                this.emit('manager:error', 'Failed to update registry after error', registryError instanceof Error ? registryError.message : 'Unknown error');
            }
        });
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=PluginManager.js.map