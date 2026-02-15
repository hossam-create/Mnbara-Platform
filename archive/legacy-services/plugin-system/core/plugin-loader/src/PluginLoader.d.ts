import { PluginLoaderConfig, LoadedPlugin, PluginLoadOptions, PluginLoadResult, PluginUnloadResult, PluginStatus } from './types';
import { EventEmitter } from 'events';
export declare class PluginLoader extends EventEmitter {
    private config;
    private loadedPlugins;
    private loadingPlugins;
    constructor(config: PluginLoaderConfig);
    loadPlugin(pluginId: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    unloadPlugin(pluginId: string): Promise<PluginUnloadResult>;
    loadAllPlugins(options?: PluginLoadOptions): Promise<PluginLoadResult[]>;
    reloadPlugin(pluginId: string, options?: PluginLoadOptions): Promise<PluginLoadResult>;
    getLoadedPlugin(pluginId: string): LoadedPlugin | undefined;
    getAllLoadedPlugins(): LoadedPlugin[];
    getPluginStatus(pluginId: string): PluginStatus;
    enablePlugin(pluginId: string): boolean;
    disablePlugin(pluginId: string): boolean;
    private validateManifest;
    private validateDependencies;
    private validatePermissions;
    private generateWarnings;
}
//# sourceMappingURL=PluginLoader.d.ts.map