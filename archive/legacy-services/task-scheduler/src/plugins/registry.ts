// Plugin Registry - Manages all available plugins
import { Plugin } from '../types/task.types';
import { NotificationPlugin } from './notification.plugin';
import { CurrencyPlugin } from './currency.plugin';
import { CleanupPlugin } from './cleanup.plugin';
import { ReportPlugin } from './report.plugin';
import logger from '../utils/logger';

export class PluginRegistry {
  private plugins: Map<string, Plugin>;

  constructor() {
    this.plugins = new Map();
    this.registerDefaults();
  }

  private registerDefaults() {
    // Register built-in plugins
    this.register(new NotificationPlugin());
    this.register(new CurrencyPlugin());
    this.register(new CleanupPlugin());
    this.register(new ReportPlugin());

    logger.info(`Registered ${this.plugins.size} plugins`);
  }

  register(plugin: Plugin) {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`Plugin already registered: ${plugin.name}`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    logger.info(`Registered plugin: ${plugin.name}`);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }
}
