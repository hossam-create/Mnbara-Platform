import { PluginRegistryEntry, PluginRegistryConfig, PluginRegistryQuery, PluginRegistryStats } from './types';
import { PluginManifest, PluginStatus } from '../../plugin-loader/src/types';
import { EventEmitter } from 'events';
export declare class PluginRegistry extends EventEmitter {
    private config;
    private entries;
    private initialized;
    constructor(config: PluginRegistryConfig);
    initialize(): Promise<void>;
    registerPlugin(manifest: PluginManifest): Promise<PluginRegistryEntry>;
    updatePlugin(pluginId: string, manifest: PluginManifest): Promise<PluginRegistryEntry>;
    unregisterPlugin(pluginId: string): Promise<boolean>;
    updatePluginStatus(pluginId: string, status: PluginStatus, error?: string): Promise<PluginRegistryEntry>;
    enablePlugin(pluginId: string): Promise<PluginRegistryEntry>;
    disablePlugin(pluginId: string): Promise<PluginRegistryEntry>;
    private updatePluginEnabled;
    getPlugin(pluginId: string): PluginRegistryEntry | undefined;
    getAllPlugins(): PluginRegistryEntry[];
    queryPlugins(query: PluginRegistryQuery): PluginRegistryEntry[];
    getStats(): PluginRegistryStats;
    backup(): Promise<string>;
    restore(backupPath?: string): Promise<void>;
    private loadRegistry;
    private saveRegistry;
}
//# sourceMappingURL=PluginRegistry.d.ts.map