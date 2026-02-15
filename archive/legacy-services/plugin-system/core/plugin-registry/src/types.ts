import { PluginManifest, LoadedPlugin, PluginStatus } from '../../plugin-loader/src/types';

export interface PluginRegistryEntry {
  id: string;
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: Date;
  updatedAt?: Date;
  loadedAt?: Date;
  enabled: boolean;
  error?: string;
  metadata: {
    loadCount: number;
    lastLoadError?: string;
    lastUnloadAt?: Date;
    config?: Record<string, any>;
  };
}

export interface PluginRegistryConfig {
  storagePath: string;
  backupPath?: string;
  autoBackup?: boolean;
  maxEntries?: number;
}

export interface PluginRegistryQuery {
  id?: string;
  name?: string;
  status?: PluginStatus;
  enabled?: boolean;
  author?: string;
  hasHooks?: string[];
  permissions?: string[];
}

export interface PluginRegistryStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  errorPlugins: number;
  loadingPlugins: number;
  loadedPlugins: number;
  byStatus: Record<PluginStatus, number>;
  byAuthor: Record<string, number>;
}