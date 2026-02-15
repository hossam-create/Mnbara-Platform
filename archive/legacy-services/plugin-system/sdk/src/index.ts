/**
 * MNBara Plugin SDK
 * 
 * Official SDK for building MNBara plugins with TypeScript support,
 * comprehensive tooling, and best practices.
 */

// Core exports
export { PluginSDK, PluginContext, PluginConfig } from './core/plugin-sdk';
export { HookSystem, HookContext, HookHandler } from './core/hook-system';
export { WalletIntegration } from './core/wallet-integration';
export { UIComponent } from './core/ui-components';
export { APIEndpoint } from './core/api-endpoints';

// Types
export {
  PluginMetadata,
  PluginManifest,
  PluginPermissions,
  PluginHooks,
  PluginConfiguration,
  PluginState,
  PluginHealth,
  PluginMetrics
} from './types/plugin-types';

export {
  WalletEvent,
  TransactionEvent,
  BalanceEvent,
  ChainEvent,
  WalletProvider,
  SupportedChain,
  TransactionType,
  WalletFeature
} from './types/wallet-types';

export {
  HookEvent,
  HookPriority,
  HookExecutionContext,
  HookRegistration,
  HookUnregistration,
  HookError,
  HookCondition,
  HookStatistics,
  HookSystemConfig,
  HookContext as HookContextType,
  DEFAULT_HOOK_SYSTEM_CONFIG,
  HOOK_PRIORITY_VALUES
} from './types/hook-types';

export {
  HttpMethod,
  ApiEndpointType,
  ApiAuthType,
  ApiResponseFormat,
  ApiData,
  ApiEndpoint,
  RateLimitConfig,
  CacheConfig,
  ValidationConfig,
  ApiRequestContext,
  ApiResponseContext,
  ApiError,
  ApiMiddleware,
  ApiPluginConfig,
  ApiContext as ApiContextType,
  DEFAULT_API_PLUGIN_CONFIG,
  HTTP_STATUS_CODES,
  API_ERROR_CODES
} from './types/api-types';

export {
  UIComponentType,
  UITheme,
  UISize,
  UIVariant,
  UIColor,
  UIState,
  UIPosition,
  UIAlignment,
  UILayout,
  UIEvent,
  UIThemeConfig,
  UILayoutConfig,
  UIComponentRegistry,
  UIContext as UIContextType,
  DEFAULT_UI_THEME_CONFIG
} from './types/ui-types';

// Utilities
export { PluginLogger, LogLevel, LogContext } from './utils/logger';
export { PluginError, PluginErrorCode, PluginErrorHandler } from './utils/errors';
export { PluginValidator, ValidationRule, ValidationSchema } from './utils/validator';
export { PluginSecurity, SecurityPolicy, PermissionChecker } from './utils/security';
export { PluginStorage, StorageAdapter, MemoryStorage, FileStorage } from './utils/storage';
export { PluginCache, CacheStrategy, TTLCache, LRUCache } from './utils/cache';
export { PluginMetricsCollector, MetricType, MetricValue } from './utils/metrics';

// Template Generator
export { 
  PluginTemplateGenerator, 
  PluginTemplateOptions, 
  generatePluginTemplate 
} from './plugin-template-generator';

// CLI Tools
export { 
  main as generateTemplate
} from './cli';

// Constants
export {
  PLUGIN_SDK_VERSION,
  MIN_NODE_VERSION,
  DEFAULT_HOOKS,
  DEFAULT_PERMISSIONS,
  PLUGIN_LIFECYCLE_EVENTS,
  WALLET_EVENTS,
  API_ENDPOINTS,
  UI_COMPONENT_TYPES
} from './constants';

// Validation utilities (to be implemented)
// export { 
//   validatePluginManifest, 
//   validatePluginConfig, 
//   validatePluginPermissions,
//   validateWalletIntegration,
//   validateAPIEndpoints,
//   validateUIComponents
// } from './validation/plugin-validator';

// Development utilities (to be implemented)
// export {
//   createMockPluginContext,
//   createMockWalletContext,
//   createMockHookContext,
//   createMockAPIContext,
//   createMockUIContext,
//   MockPluginSDK
// } from './testing/mocks';

// Plugin packaging utilities (to be implemented)
// export {
//   PluginPackager,
//   PluginPackage,
//   PluginPackageMetadata,
//   createPluginPackage,
//   validatePluginPackage,
//   extractPluginPackage
// } from './packaging/plugin-packager';

// Version
export const VERSION = '1.0.0';