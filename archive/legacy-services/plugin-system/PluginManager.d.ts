import { PluginLoadResult } from './core/plugin-loader';
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
export declare class PluginManager extends EventEmitter {
    private loader;
    private registry;
    private config;
    private initialized;
    constructor(config: PluginManagerConfig);
    initialize(): Promise<void>;
    installPlugin(manifest: PluginManifest): Promise<PluginLoadResult>;
    uninstallPlugin(pluginId: string): Promise<boolean>;
    enablePlugin(pluginId: string): Promise<boolean>;
    disablePlugin(pluginId: string): Promise<boolean>;
    reloadPlugin(pluginId: string): Promise<PluginLoadResult>;
    loadAllPlugins(): Promise<PluginLoadResult[]>;
    getPlugin(pluginId: string): {
        loaded?: LoadedPlugin;
        registry?: any;
    };
    getAllPlugins(): {
        loaded: LoadedPlugin[];
        registry: any[];
    };
    getPluginStatus(pluginId: string): PluginStatus;
    getStats(): any;
    private setupEventHandlers;
    private setupLoaderEvents;
}
//# sourceMappingURL=PluginManager.d.ts.map