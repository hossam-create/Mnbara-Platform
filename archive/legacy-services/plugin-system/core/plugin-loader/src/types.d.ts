export interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    main: string;
    dependencies?: Record<string, string>;
    permissions?: string[];
    hooks?: string[];
    config?: Record<string, any>;
}
export interface PluginManifest {
    metadata: PluginMetadata;
    entry: string;
    enabled: boolean;
    installedAt: Date;
    updatedAt?: Date;
    config?: Record<string, any>;
}
export interface LoadedPlugin {
    manifest: PluginManifest;
    instance: any;
    enabled: boolean;
    loadedAt: Date;
    error?: string;
}
export interface PluginLoadOptions {
    autoEnable?: boolean;
    validateDependencies?: boolean;
    checkPermissions?: boolean;
    sandbox?: boolean;
}
export interface PluginLoaderConfig {
    pluginsDirectory: string;
    manifestFile: string;
    allowedPermissions?: string[];
    sandbox?: boolean;
    maxConcurrentLoads?: number;
}
export interface PluginLoadResult {
    success: boolean;
    plugin?: LoadedPlugin;
    error?: string;
    warnings?: string[];
}
export interface PluginUnloadResult {
    success: boolean;
    error?: string;
}
export declare enum PluginStatus {
    NOT_LOADED = "NOT_LOADED",
    LOADING = "LOADING",
    LOADED = "LOADED",
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
    ERROR = "ERROR",
    UNLOADING = "UNLOADING"
}
//# sourceMappingURL=types.d.ts.map