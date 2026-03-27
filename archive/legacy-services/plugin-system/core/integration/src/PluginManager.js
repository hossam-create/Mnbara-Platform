"use strict";
/**
 * Plugin System Integration Layer
 *
 * Provides a unified interface for the plugin system components, integrating
 * PluginLoader, PluginRegistry, and HookSystem. Manages plugin lifecycle,
 * coordinates between components, and provides high-level plugin operations.
 *
 * Features:
 * - Unified plugin management interface
 * - Plugin lifecycle coordination
 * - Hook integration with plugin system
 * - Error handling and recovery
 * - Plugin marketplace integration
 * - Configuration management
 *
 * Usage:
 * ```typescript
 * const pluginManager = new PluginManager(prisma);
 * await pluginManager.installPlugin('payment-plugin', '1.0.0');
 * await pluginManager.activatePlugin('payment-plugin');
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
const PluginLoader_1 = require("../plugin-loader/src/PluginLoader");
const PluginRegistry_1 = require("../plugin-registry/src/PluginRegistry");
const HookSystem_1 = require("../hook-system/src/HookSystem");
class PluginManager {
    constructor(prisma, options = {}) {
        this.prisma = prisma;
        this.options = options;
        this.loadedPlugins = new Map();
        this.options = {
            pluginDirectory: './plugins',
            enableSandbox: true,
            autoRegisterHooks: true,
            enableMarketplace: false,
            maxConcurrentOperations: 5,
            ...options,
        };
        this.pluginLoader = new PluginLoader_1.PluginLoader();
        this.pluginRegistry = new PluginRegistry_1.PluginRegistry(prisma);
        this.hookSystem = new HookSystem_1.HookSystem();
        this.setupEventHandlers();
    }
    /**
     * Install a plugin from marketplace or local path
     */
    async installPlugin(pluginIdentifier, options = {}) {
        try {
            // Emit pre-install hook
            await this.hookSystem.executeHooks('plugin:pre-install', {
                pluginIdentifier,
                options,
            });
            let pluginPath;
            let manifest;
            // Determine if pluginIdentifier is a path or marketplace name
            if (pluginIdentifier.includes('/') || pluginIdentifier.includes('\\')) {
                // Local path
                pluginPath = pluginIdentifier;
                manifest = await this.pluginLoader.validatePlugin(pluginPath);
            }
            else {
                // Marketplace plugin
                if (!this.options.enableMarketplace) {
                    throw new Error('Marketplace integration is not enabled');
                }
                const marketplacePlugin = await this.prisma.pluginMarketplace.findFirst({
                    where: { name: pluginIdentifier },
                });
                if (!marketplacePlugin) {
                    throw new Error(`Plugin ${pluginIdentifier} not found in marketplace`);
                }
                // Download and extract plugin (simplified - would need actual download logic)
                pluginPath = `${this.options.pluginDirectory}/${pluginIdentifier}`;
                manifest = JSON.parse(JSON.stringify(marketplacePlugin)); // Simplified
            }
            // Register plugin in registry
            await this.pluginRegistry.registerPlugin({
                name: manifest.name,
                version: options.version || manifest.version,
                type: manifest.type,
                category: manifest.category || 'custom',
                description: manifest.description,
                author: manifest.author,
                manifest,
                status: 'pending',
            });
            // Load plugin
            const loadedPlugin = await this.pluginLoader.loadPlugin(pluginPath, {
                enableSandbox: this.options.enableSandbox,
            });
            // Store loaded plugin
            this.loadedPlugins.set(manifest.name, loadedPlugin);
            // Auto-register hooks if enabled
            if (this.options.autoRegisterHooks && manifest.hooks) {
                await this.registerPluginHooks(manifest.name, manifest.hooks);
            }
            // Auto-activate if requested
            if (options.autoActivate) {
                await this.activatePlugin(manifest.name);
            }
            // Emit post-install hook
            await this.hookSystem.executeHooks('plugin:post-install', {
                pluginName: manifest.name,
                plugin: loadedPlugin,
            });
            return {
                success: true,
                pluginName: manifest.name,
                message: `Plugin ${manifest.name} installed successfully`,
                data: { plugin: loadedPlugin },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                pluginName: pluginIdentifier,
                message: `Failed to install plugin: ${errorMessage}`,
                error: error instanceof Error ? error : new Error(errorMessage),
            };
        }
    }
    /**
     * Activate a plugin
     */
    async activatePlugin(pluginName) {
        try {
            // Emit pre-activation hook
            await this.hookSystem.executeHooks('plugin:pre-activate', { pluginName });
            const plugin = await this.pluginRegistry.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            if (plugin.status === 'active') {
                return {
                    success: true,
                    pluginName,
                    message: `Plugin ${pluginName} is already active`,
                };
            }
            // Update plugin status
            await this.pluginRegistry.updatePluginStatus(pluginName, 'active');
            // Load plugin if not already loaded
            if (!this.loadedPlugins.has(pluginName)) {
                const loadedPlugin = await this.pluginLoader.loadPlugin(`${this.options.pluginDirectory}/${pluginName}`, { enableSandbox: this.options.enableSandbox });
                this.loadedPlugins.set(pluginName, loadedPlugin);
            }
            // Emit post-activation hook
            await this.hookSystem.executeHooks('plugin:post-activate', { pluginName });
            return {
                success: true,
                pluginName,
                message: `Plugin ${pluginName} activated successfully`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                pluginName,
                message: `Failed to activate plugin: ${errorMessage}`,
                error: error instanceof Error ? error : new Error(errorMessage),
            };
        }
    }
    /**
     * Deactivate a plugin
     */
    async deactivatePlugin(pluginName) {
        try {
            // Emit pre-deactivation hook
            await this.hookSystem.executeHooks('plugin:pre-deactivate', { pluginName });
            const plugin = await this.pluginRegistry.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            if (plugin.status !== 'active') {
                return {
                    success: true,
                    pluginName,
                    message: `Plugin ${pluginName} is not active`,
                };
            }
            // Update plugin status
            await this.pluginRegistry.updatePluginStatus(pluginName, 'inactive');
            // Unload plugin
            const loadedPlugin = this.loadedPlugins.get(pluginName);
            if (loadedPlugin) {
                await this.pluginLoader.unloadPlugin(pluginName);
                this.loadedPlugins.delete(pluginName);
            }
            // Emit post-deactivation hook
            await this.hookSystem.executeHooks('plugin:post-deactivate', { pluginName });
            return {
                success: true,
                pluginName,
                message: `Plugin ${pluginName} deactivated successfully`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                pluginName,
                message: `Failed to deactivate plugin: ${errorMessage}`,
                error: error instanceof Error ? error : new Error(errorMessage),
            };
        }
    }
    /**
     * Uninstall a plugin
     */
    async uninstallPlugin(pluginName) {
        try {
            // Emit pre-uninstall hook
            await this.hookSystem.executeHooks('plugin:pre-uninstall', { pluginName });
            const plugin = await this.pluginRegistry.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            // Deactivate if active
            if (plugin.status === 'active') {
                await this.deactivatePlugin(pluginName);
            }
            // Remove from registry
            await this.pluginRegistry.deletePlugin(pluginName);
            // Remove from loaded plugins
            this.loadedPlugins.delete(pluginName);
            // Emit post-uninstall hook
            await this.hookSystem.executeHooks('plugin:post-uninstall', { pluginName });
            return {
                success: true,
                pluginName,
                message: `Plugin ${pluginName} uninstalled successfully`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                pluginName,
                message: `Failed to uninstall plugin: ${errorMessage}`,
                error: error instanceof Error ? error : new Error(errorMessage),
            };
        }
    }
    /**
     * Update plugin configuration
     */
    async updatePluginConfig(pluginName, config) {
        try {
            const plugin = await this.pluginRegistry.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            // Update each config key
            for (const [key, value] of Object.entries(config)) {
                await this.pluginRegistry.setPluginConfig(pluginName, key, value);
            }
            // Emit config update hook
            await this.hookSystem.executeHooks('plugin:config-updated', {
                pluginName,
                config,
            });
            return {
                success: true,
                pluginName,
                message: `Plugin ${pluginName} configuration updated successfully`,
                data: { config },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                pluginName,
                message: `Failed to update plugin configuration: ${errorMessage}`,
                error: error instanceof Error ? error : new Error(errorMessage),
            };
        }
    }
    /**
     * Get plugin information
     */
    async getPluginInfo(pluginName) {
        const plugin = await this.pluginRegistry.getPlugin(pluginName);
        if (!plugin) {
            return null;
        }
        const loadedPlugin = this.loadedPlugins.get(pluginName);
        const hooks = await this.pluginRegistry.getPluginHooks(pluginName);
        const configs = await this.pluginRegistry.getPluginConfigs(pluginName);
        return {
            ...plugin,
            isLoaded: !!loadedPlugin,
            hooks: hooks.length,
            configs: configs.length,
            manifest: typeof plugin.manifest === 'string' ? JSON.parse(plugin.manifest) : plugin.manifest,
        };
    }
    /**
     * Get all plugins with their status
     */
    async getAllPlugins() {
        const plugins = await this.pluginRegistry.getPlugins();
        return Promise.all(plugins.map(async (plugin) => {
            const loadedPlugin = this.loadedPlugins.get(plugin.name);
            const hooks = await this.pluginRegistry.getPluginHooks(plugin.name);
            return {
                ...plugin,
                isLoaded: !!loadedPlugin,
                hookCount: hooks.length,
            };
        }));
    }
    /**
     * Get active plugins
     */
    async getActivePlugins() {
        const plugins = await this.pluginRegistry.getActivePlugins();
        return Promise.all(plugins.map(async (plugin) => {
            const loadedPlugin = this.loadedPlugins.get(plugin.name);
            return {
                ...plugin,
                isLoaded: !!loadedPlugin,
            };
        }));
    }
    /**
     * Register plugin hooks
     */
    async registerPluginHooks(pluginName, hooks) {
        await this.pluginRegistry.createPluginHooks(pluginName, hooks);
        // Register hooks in hook system
        for (const hook of hooks) {
            this.hookSystem.registerHook(hook.name, async (data) => {
                const loadedPlugin = this.loadedPlugins.get(pluginName);
                if (loadedPlugin && loadedPlugin.instance) {
                    // Call the handler method on the plugin instance
                    const handler = loadedPlugin.instance[hook.handler];
                    if (typeof handler === 'function') {
                        return await handler(data);
                    }
                }
                throw new Error(`Hook handler ${hook.handler} not found in plugin ${pluginName}`);
            }, {
                metadata: {
                    plugin: pluginName,
                    description: `Hook ${hook.name} from plugin ${pluginName}`,
                },
            });
        }
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Plugin loader events
        this.pluginLoader.on('plugin:loaded', (pluginName) => {
            console.log(`Plugin loaded: ${pluginName}`);
        });
        this.pluginLoader.on('plugin:unloaded', (pluginName) => {
            console.log(`Plugin unloaded: ${pluginName}`);
        });
        this.pluginLoader.on('plugin:error', (pluginName, error) => {
            console.error(`Plugin error: ${pluginName}`, error);
            this.pluginRegistry.updatePluginStatus(pluginName, 'error');
        });
        // Hook system events
        this.hookSystem.on('hook:registered', ({ hookName, hookId }) => {
            console.log(`Hook registered: ${hookName} (${hookId})`);
        });
        this.hookSystem.on('hooks:execution:start', ({ hookName, registrations }) => {
            console.log(`Executing hooks: ${hookName} (${registrations} handlers)`);
        });
        this.hookSystem.on('hooks:execution:end', ({ hookName, results, totalExecutionTime }) => {
            const successCount = results.filter((r) => r.success).length;
            console.log(`Hooks executed: ${hookName} (${successCount}/${results.length} successful, ${totalExecutionTime}ms)`);
        });
    }
    /**
     * Get plugin loader
     */
    getPluginLoader() {
        return this.pluginLoader;
    }
    /**
     * Get plugin registry
     */
    getPluginRegistry() {
        return this.pluginRegistry;
    }
    /**
     * Get hook system
     */
    getHookSystem() {
        return this.hookSystem;
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=PluginManager.js.map