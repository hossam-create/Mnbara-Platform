import { PluginRegistryEntry, PluginRegistryConfig, PluginRegistryQuery, PluginRegistryStats } from './types';
import { PluginManifest, PluginStatus } from '../../plugin-loader/src/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export class PluginRegistry extends EventEmitter {
  private config: PluginRegistryConfig;
  private entries: Map<string, PluginRegistryEntry> = new Map();
  private initialized = false;

  constructor(config: PluginRegistryConfig) {
    super();
    this.config = {
      autoBackup: true,
      maxEntries: 1000,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure storage directory exists
      const storageDir = path.dirname(this.config.storagePath);
      try {
        await fs.access(storageDir);
      } catch {
        await fs.mkdir(storageDir, { recursive: true });
      }

      // Load existing registry
      await this.loadRegistry();
      this.initialized = true;
      this.emit('registry:initialized');
    } catch (error) {
      this.emit('registry:error', 'Failed to initialize registry', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async registerPlugin(manifest: PluginManifest): Promise<PluginRegistryEntry> {
    if (!this.initialized) {
      throw new Error('Registry not initialized');
    }

    const pluginId = manifest.metadata.id;
    
    // Check if plugin already exists
    const existingEntry = this.entries.get(pluginId);
    if (existingEntry) {
      return this.updatePlugin(pluginId, manifest);
    }

    const entry: PluginRegistryEntry = {
      id: pluginId,
      manifest,
      status: PluginStatus.NOT_LOADED,
      installedAt: new Date(),
      enabled: manifest.enabled,
      metadata: {
        loadCount: 0,
        config: manifest.config || {}
      }
    };

    this.entries.set(pluginId, entry);
    await this.saveRegistry();

    this.emit('registry:registered', pluginId, entry);
    return entry;
  }

  async updatePlugin(pluginId: string, manifest: PluginManifest): Promise<PluginRegistryEntry> {
    if (!this.initialized) {
      throw new Error('Registry not initialized');
    }

    const existingEntry = this.entries.get(pluginId);
    if (!existingEntry) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    const updatedEntry: PluginRegistryEntry = {
      ...existingEntry,
      manifest,
      updatedAt: new Date(),
      enabled: manifest.enabled,
      metadata: {
        ...existingEntry.metadata,
        config: manifest.config || {}
      }
    };

    this.entries.set(pluginId, updatedEntry);
    await this.saveRegistry();

    this.emit('registry:updated', pluginId, updatedEntry);
    return updatedEntry;
  }

  async unregisterPlugin(pluginId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Registry not initialized');
    }

    const entry = this.entries.get(pluginId);
    if (!entry) {
      return false;
    }

    this.entries.delete(pluginId);
    await this.saveRegistry();

    this.emit('registry:unregistered', pluginId, entry);
    return true;
  }

  async updatePluginStatus(pluginId: string, status: PluginStatus, error?: string): Promise<PluginRegistryEntry> {
    if (!this.initialized) {
      throw new Error('Registry not initialized');
    }

    const entry = this.entries.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    const updatedEntry: PluginRegistryEntry = {
      ...entry,
      status,
      error: error || undefined,
      metadata: {
        ...entry.metadata,
        lastLoadError: error || undefined
      }
    };

    // Update load count for successful loads
    if (status === PluginStatus.LOADED || status === PluginStatus.ENABLED) {
      updatedEntry.metadata.loadCount = entry.metadata.loadCount + 1;
      updatedEntry.loadedAt = new Date();
    }

    this.entries.set(pluginId, updatedEntry);
    await this.saveRegistry();

    this.emit('registry:status-updated', pluginId, status, error);
    return updatedEntry;
  }

  async enablePlugin(pluginId: string): Promise<PluginRegistryEntry> {
    return this.updatePluginEnabled(pluginId, true);
  }

  async disablePlugin(pluginId: string): Promise<PluginRegistryEntry> {
    return this.updatePluginEnabled(pluginId, false);
  }

  private async updatePluginEnabled(pluginId: string, enabled: boolean): Promise<PluginRegistryEntry> {
    if (!this.initialized) {
      throw new Error('Registry not initialized');
    }

    const entry = this.entries.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    const updatedEntry: PluginRegistryEntry = {
      ...entry,
      enabled,
      metadata: {
        ...entry.metadata,
        lastUnloadAt: !enabled ? new Date() : entry.metadata.lastUnloadAt
      }
    };

    this.entries.set(pluginId, updatedEntry);
    await this.saveRegistry();

    this.emit(enabled ? 'registry:enabled' : 'registry:disabled', pluginId, updatedEntry);
    return updatedEntry;
  }

  getPlugin(pluginId: string): PluginRegistryEntry | undefined {
    return this.entries.get(pluginId);
  }

  getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  queryPlugins(query: PluginRegistryQuery): PluginRegistryEntry[] {
    return Array.from(this.entries.values()).filter(entry => {
      if (query.id && entry.id !== query.id) return false;
      if (query.name && entry.manifest.metadata.name !== query.name) return false;
      if (query.status && entry.status !== query.status) return false;
      if (query.enabled !== undefined && entry.enabled !== query.enabled) return false;
      if (query.author && entry.manifest.metadata.author !== query.author) return false;
      if (query.hasHooks && query.hasHooks.length > 0) {
        const pluginHooks = entry.manifest.metadata.hooks || [];
        const hasAllHooks = query.hasHooks.every(hook => pluginHooks.includes(hook));
        if (!hasAllHooks) return false;
      }
      if (query.permissions && query.permissions.length > 0) {
        const pluginPermissions = entry.manifest.metadata.permissions || [];
        const hasAllPermissions = query.permissions.every(permission => pluginPermissions.includes(permission));
        if (!hasAllPermissions) return false;
      }
      return true;
    });
  }

  getStats(): PluginRegistryStats {
    const entries = Array.from(this.entries.values());
    
    const stats: PluginRegistryStats = {
      totalPlugins: entries.length,
      enabledPlugins: entries.filter(e => e.enabled).length,
      disabledPlugins: entries.filter(e => !e.enabled).length,
      errorPlugins: entries.filter(e => e.status === PluginStatus.ERROR).length,
      loadingPlugins: entries.filter(e => e.status === PluginStatus.LOADING).length,
      loadedPlugins: entries.filter(e => e.status === PluginStatus.LOADED).length,
      byStatus: {} as Record<PluginStatus, number>,
      byAuthor: {}
    };

    // Initialize byStatus
    Object.values(PluginStatus).forEach(status => {
      stats.byStatus[status as keyof typeof stats.byStatus] = 0;
    });

    // Count by status
    entries.forEach(entry => {
      stats.byStatus[entry.status as keyof typeof stats.byStatus]++;
    });

    // Count by author
    entries.forEach(entry => {
      const author = entry.manifest.metadata.author || 'Unknown';
      stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;
    });

    return stats;
  }

  async backup(): Promise<string> {
    if (!this.config.backupPath) {
      throw new Error('Backup path not configured');
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      entries: Array.from(this.entries.entries()),
      stats: this.getStats()
    };

    await fs.writeFile(this.config.backupPath, JSON.stringify(backupData, null, 2));
    return this.config.backupPath;
  }

  async restore(backupPath?: string): Promise<void> {
    const restorePath = backupPath || this.config.backupPath;
    if (!restorePath) {
      throw new Error('Backup path not provided');
    }

    try {
      const backupContent = await fs.readFile(restorePath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      if (!backupData.entries || !Array.isArray(backupData.entries)) {
        throw new Error('Invalid backup format');
      }

      this.entries.clear();
      backupData.entries.forEach(([id, entry]: [string, PluginRegistryEntry]) => {
        // Restore dates from strings
        const restoredEntry = {
          ...entry,
          installedAt: new Date(entry.installedAt),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
          loadedAt: entry.loadedAt ? new Date(entry.loadedAt) : undefined,
          metadata: {
            ...entry.metadata,
            lastUnloadAt: entry.metadata.lastUnloadAt ? new Date(entry.metadata.lastUnloadAt) : undefined
          }
        };
        this.entries.set(id, restoredEntry);
      });

      await this.saveRegistry();
      this.emit('registry:restored', restorePath);
    } catch (error) {
      this.emit('registry:error', 'Failed to restore registry', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async loadRegistry(): Promise<void> {
    try {
      const registryContent = await fs.readFile(this.config.storagePath, 'utf-8');
      const registryData = JSON.parse(registryContent);
      
      if (!registryData.entries || !Array.isArray(registryData.entries)) {
        throw new Error('Invalid registry format');
      }

      this.entries.clear();
      registryData.entries.forEach(([id, entry]: [string, PluginRegistryEntry]) => {
        // Restore dates from strings
        const restoredEntry = {
          ...entry,
          installedAt: new Date(entry.installedAt),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
          loadedAt: entry.loadedAt ? new Date(entry.loadedAt) : undefined,
          metadata: {
            ...entry.metadata,
            lastUnloadAt: entry.metadata.lastUnloadAt ? new Date(entry.metadata.lastUnloadAt) : undefined
          }
        };
        this.entries.set(id, restoredEntry);
      });
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty registry
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.emit('registry:error', 'Failed to load registry', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async saveRegistry(): Promise<void> {
    try {
      const registryData = {
        timestamp: new Date().toISOString(),
        entries: Array.from(this.entries.entries()),
        stats: this.getStats()
      };

      await fs.writeFile(this.config.storagePath, JSON.stringify(registryData, null, 2));

      // Auto-backup if configured
      if (this.config.autoBackup && this.config.backupPath) {
        try {
          await this.backup();
        } catch (backupError) {
          this.emit('registry:warning', 'Failed to create auto-backup', backupError instanceof Error ? backupError.message : 'Unknown error');
        }
      }
    } catch (error) {
      this.emit('registry:error', 'Failed to save registry', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}