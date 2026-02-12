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
import { PrismaClient } from '@prisma/client';
import { PluginLoader } from '../plugin-loader/src/PluginLoader';
import { PluginRegistry } from '../plugin-registry/src/PluginRegistry';
import { HookSystem } from '../hook-system/src/HookSystem';
export interface PluginInstallationOptions {
    version?: string;
    config?: Record<string, any>;
    autoActivate?: boolean;
    skipHooks?: boolean;
}
export interface PluginOperationResult {
    success: boolean;
    pluginName: string;
    message: string;
    data?: any;
    error?: Error;
}
export interface PluginManagerOptions {
    pluginDirectory?: string;
    enableSandbox?: boolean;
    autoRegisterHooks?: boolean;
    enableMarketplace?: boolean;
    maxConcurrentOperations?: number;
}
export declare class PluginManager {
    private prisma;
    private options;
    private pluginLoader;
    private pluginRegistry;
    private hookSystem;
    private loadedPlugins;
    constructor(prisma: PrismaClient, options?: PluginManagerOptions);
    /**
     * Install a plugin from marketplace or local path
     */
    installPlugin(pluginIdentifier: string, options?: PluginInstallationOptions): Promise<PluginOperationResult>;
    /**
     * Activate a plugin
     */
    activatePlugin(pluginName: string): Promise<PluginOperationResult>;
    /**
     * Deactivate a plugin
     */
    deactivatePlugin(pluginName: string): Promise<PluginOperationResult>;
    /**
     * Uninstall a plugin
     */
    uninstallPlugin(pluginName: string): Promise<PluginOperationResult>;
    /**
     * Update plugin configuration
     */
    updatePluginConfig(pluginName: string, config: Record<string, any>): Promise<PluginOperationResult>;
    /**
     * Get plugin information
     */
    getPluginInfo(pluginName: string): Promise<any>;
    /**
     * Get all plugins with their status
     */
    getAllPlugins(): Promise<any[]>;
    /**
     * Get active plugins
     */
    getActivePlugins(): Promise<any[]>;
    /**
     * Register plugin hooks
     */
    private registerPluginHooks;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Get plugin loader
     */
    getPluginLoader(): PluginLoader;
    /**
     * Get plugin registry
     */
    getPluginRegistry(): PluginRegistry;
    /**
     * Get hook system
     */
    getHookSystem(): HookSystem;
}
//# sourceMappingURL=PluginManager.d.ts.map