"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
const types_1 = require("../../plugin-loader/src/types");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const events_1 = require("events");
class PluginRegistry extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.entries = new Map();
        this.initialized = false;
        this.config = {
            autoBackup: true,
            maxEntries: 1000,
            ...config
        };
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Ensure storage directory exists
            const storageDir = path.dirname(this.config.storagePath);
            try {
                await fs.access(storageDir);
            }
            catch {
                await fs.mkdir(storageDir, { recursive: true });
            }
            // Load existing registry
            await this.loadRegistry();
            this.initialized = true;
            this.emit('registry:initialized');
        }
        catch (error) {
            this.emit('registry:error', 'Failed to initialize registry', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async registerPlugin(manifest) {
        if (!this.initialized) {
            throw new Error('Registry not initialized');
        }
        const pluginId = manifest.metadata.id;
        // Check if plugin already exists
        const existingEntry = this.entries.get(pluginId);
        if (existingEntry) {
            return this.updatePlugin(pluginId, manifest);
        }
        const entry = {
            id: pluginId,
            manifest,
            status: types_1.PluginStatus.NOT_LOADED,
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
    async updatePlugin(pluginId, manifest) {
        if (!this.initialized) {
            throw new Error('Registry not initialized');
        }
        const existingEntry = this.entries.get(pluginId);
        if (!existingEntry) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }
        const updatedEntry = {
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
    async unregisterPlugin(pluginId) {
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
    async updatePluginStatus(pluginId, status, error) {
        if (!this.initialized) {
            throw new Error('Registry not initialized');
        }
        const entry = this.entries.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }
        const updatedEntry = {
            ...entry,
            status,
            error: error || undefined,
            metadata: {
                ...entry.metadata,
                lastLoadError: error || undefined
            }
        };
        // Update load count for successful loads
        if (status === types_1.PluginStatus.LOADED || status === types_1.PluginStatus.ENABLED) {
            updatedEntry.metadata.loadCount = entry.metadata.loadCount + 1;
            updatedEntry.loadedAt = new Date();
        }
        this.entries.set(pluginId, updatedEntry);
        await this.saveRegistry();
        this.emit('registry:status-updated', pluginId, status, error);
        return updatedEntry;
    }
    async enablePlugin(pluginId) {
        return this.updatePluginEnabled(pluginId, true);
    }
    async disablePlugin(pluginId) {
        return this.updatePluginEnabled(pluginId, false);
    }
    async updatePluginEnabled(pluginId, enabled) {
        if (!this.initialized) {
            throw new Error('Registry not initialized');
        }
        const entry = this.entries.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin ${pluginId} not found in registry`);
        }
        const updatedEntry = {
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
    getPlugin(pluginId) {
        return this.entries.get(pluginId);
    }
    getAllPlugins() {
        return Array.from(this.entries.values());
    }
    queryPlugins(query) {
        return Array.from(this.entries.values()).filter(entry => {
            if (query.id && entry.id !== query.id)
                return false;
            if (query.name && entry.manifest.metadata.name !== query.name)
                return false;
            if (query.status && entry.status !== query.status)
                return false;
            if (query.enabled !== undefined && entry.enabled !== query.enabled)
                return false;
            if (query.author && entry.manifest.metadata.author !== query.author)
                return false;
            if (query.hasHooks && query.hasHooks.length > 0) {
                const pluginHooks = entry.manifest.metadata.hooks || [];
                const hasAllHooks = query.hasHooks.every(hook => pluginHooks.includes(hook));
                if (!hasAllHooks)
                    return false;
            }
            if (query.permissions && query.permissions.length > 0) {
                const pluginPermissions = entry.manifest.metadata.permissions || [];
                const hasAllPermissions = query.permissions.every(permission => pluginPermissions.includes(permission));
                if (!hasAllPermissions)
                    return false;
            }
            return true;
        });
    }
    getStats() {
        const entries = Array.from(this.entries.values());
        const stats = {
            totalPlugins: entries.length,
            enabledPlugins: entries.filter(e => e.enabled).length,
            disabledPlugins: entries.filter(e => !e.enabled).length,
            errorPlugins: entries.filter(e => e.status === types_1.PluginStatus.ERROR).length,
            loadingPlugins: entries.filter(e => e.status === types_1.PluginStatus.LOADING).length,
            loadedPlugins: entries.filter(e => e.status === types_1.PluginStatus.LOADED).length,
            byStatus: {},
            byAuthor: {}
        };
        // Initialize byStatus
        Object.values(types_1.PluginStatus).forEach(status => {
            stats.byStatus[status] = 0;
        });
        // Count by status
        entries.forEach(entry => {
            stats.byStatus[entry.status]++;
        });
        // Count by author
        entries.forEach(entry => {
            const author = entry.manifest.metadata.author || 'Unknown';
            stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;
        });
        return stats;
    }
    async backup() {
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
    async restore(backupPath) {
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
            backupData.entries.forEach(([id, entry]) => {
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
        }
        catch (error) {
            this.emit('registry:error', 'Failed to restore registry', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async loadRegistry() {
        try {
            const registryContent = await fs.readFile(this.config.storagePath, 'utf-8');
            const registryData = JSON.parse(registryContent);
            if (!registryData.entries || !Array.isArray(registryData.entries)) {
                throw new Error('Invalid registry format');
            }
            this.entries.clear();
            registryData.entries.forEach(([id, entry]) => {
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
        }
        catch (error) {
            // If file doesn't exist or is invalid, start with empty registry
            if (error.code !== 'ENOENT') {
                this.emit('registry:error', 'Failed to load registry', error instanceof Error ? error.message : 'Unknown error');
            }
        }
    }
    async saveRegistry() {
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
                }
                catch (backupError) {
                    this.emit('registry:warning', 'Failed to create auto-backup', backupError instanceof Error ? backupError.message : 'Unknown error');
                }
            }
        }
        catch (error) {
            this.emit('registry:error', 'Failed to save registry', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
}
exports.PluginRegistry = PluginRegistry;
//# sourceMappingURL=PluginRegistry.js.map