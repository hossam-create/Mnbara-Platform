/**
 * Plugin System Integration Layer
 * 
 * Provides a unified interface for the plugin system components.
 * This is a simplified integration layer that re-exports core functionality.
 */

// Re-export core components
export { PluginLoader } from '../plugin-loader/src/PluginLoader';
export { PluginRegistry } from '../plugin-registry/src/PluginRegistry';
export { HookSystem } from '../hook-system/src/HookSystem';
export { PluginManager } from '../../PluginManager';

// Re-export core types
export type { 
  PluginManifest, 
  LoadedPlugin, 
  PluginStatus,
  PluginLoadOptions,
  PluginLoadResult,
  PluginLoaderConfig
} from '../plugin-loader/src/types';

export type {
  PluginRegistryEntry,
  PluginRegistryConfig,
  PluginRegistryQuery,
  PluginRegistryStats
} from '../plugin-registry/src/types';