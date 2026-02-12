// ============================================================
// Plugin SDK - Type Definitions
// ============================================================

/**
 * Logger Interface
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

/**
 * Hook Registry Interface
 */
export interface HookRegistry {
  register(hookName: string, handler: Function, priority?: number): void;
  unregister(hookName: string, handler: Function): void;
  execute(hookName: string, data: any): Promise<any>;
  has(hookName: string): boolean;
}

/**
 * Event Bus Interface
 */
export interface EventBus {
  emit(eventName: string, data: any): void;
  on(eventName: string, handler: Function): void;
  off(eventName: string, handler: Function): void;
}

/**
 * Service Access Interface
 */
export interface ServiceAccess {
  get<T>(serviceName: string): T;
  has(serviceName: string): boolean;
  list(): string[];
}

/**
 * Database Access Interface
 */
export interface DatabaseAccess {
  query(sql: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;
}

/**
 * Plugin Context - Available to plugins
 */
export interface PluginContext {
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  config: Record<string, any>;
  logger: Logger;
  hooks: HookRegistry;
  events: EventBus;
  services: ServiceAccess;
  database: DatabaseAccess;
}

