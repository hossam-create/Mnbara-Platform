/**
 * Plugin Error Types
 * 
 * Error handling for MNBara plugins
 */

export enum PluginErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  INVALID_MANIFEST = 'INVALID_MANIFEST',
  INVALID_PERMISSIONS = 'INVALID_PERMISSIONS',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  ALREADY_INITIALIZED = 'ALREADY_INITIALIZED',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  
  // Plugin lifecycle errors
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_DISABLED = 'PLUGIN_DISABLED',
  PLUGIN_ALREADY_EXISTS = 'PLUGIN_ALREADY_EXISTS',
  PLUGIN_DEPENDENCY_ERROR = 'PLUGIN_DEPENDENCY_ERROR',
  PLUGIN_VERSION_MISMATCH = 'PLUGIN_VERSION_MISMATCH',
  
  // Wallet integration errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WALLET_TRANSACTION_FAILED = 'WALLET_TRANSACTION_FAILED',
  WALLET_SIGNATURE_FAILED = 'WALLET_SIGNATURE_FAILED',
  WALLET_INSUFFICIENT_BALANCE = 'WALLET_INSUFFICIENT_BALANCE',
  WALLET_INVALID_ADDRESS = 'WALLET_INVALID_ADDRESS',
  WALLET_UNSUPPORTED_CHAIN = 'WALLET_UNSUPPORTED_CHAIN',
  
  // Hook system errors
  HOOK_NOT_FOUND = 'HOOK_NOT_FOUND',
  HOOK_REGISTRATION_FAILED = 'HOOK_REGISTRATION_FAILED',
  HOOK_EXECUTION_FAILED = 'HOOK_EXECUTION_FAILED',
  HOOK_PERMISSION_DENIED = 'HOOK_PERMISSION_DENIED',
  HOOK_TIMEOUT = 'HOOK_TIMEOUT',
  
  // API errors
  API_ENDPOINT_NOT_FOUND = 'API_ENDPOINT_NOT_FOUND',
  API_METHOD_NOT_ALLOWED = 'API_METHOD_NOT_ALLOWED',
  API_VALIDATION_FAILED = 'API_VALIDATION_FAILED',
  API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED',
  API_AUTHENTICATION_FAILED = 'API_AUTHENTICATION_FAILED',
  API_AUTHORIZATION_FAILED = 'API_AUTHORIZATION_FAILED',
  API_TIMEOUT = 'API_TIMEOUT',
  
  // UI errors
  UI_COMPONENT_NOT_FOUND = 'UI_COMPONENT_NOT_FOUND',
  UI_RENDERING_FAILED = 'UI_RENDERING_FAILED',
  UI_THEME_NOT_FOUND = 'UI_THEME_NOT_FOUND',
  UI_INVALID_PROPS = 'UI_INVALID_PROPS',
  
  // Storage errors
  STORAGE_READ_FAILED = 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',
  STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
  STORAGE_KEY_NOT_FOUND = 'STORAGE_KEY_NOT_FOUND',
  
  // Validation errors
  VALIDATION_SCHEMA_INVALID = 'VALIDATION_SCHEMA_INVALID',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  
  // Security errors
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  SECURITY_PERMISSION_DENIED = 'SECURITY_PERMISSION_DENIED',
  
  // Network errors
  NETWORK_REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_INVALID_RESPONSE = 'NETWORK_INVALID_RESPONSE',
  
  // Configuration errors
  CONFIG_MISSING_REQUIRED = 'CONFIG_MISSING_REQUIRED',
  CONFIG_INVALID_VALUE = 'CONFIG_INVALID_VALUE',
  CONFIG_VALIDATION_FAILED = 'CONFIG_VALIDATION_FAILED'
}

export interface PluginErrorDetails {
  code: PluginErrorCode;
  message: string;
  pluginId?: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp?: Date;
  stack?: string;
}

export class PluginError extends Error {
  public readonly code: PluginErrorCode;
  public readonly pluginId?: string;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(code: PluginErrorCode, message: string, details?: Partial<PluginErrorDetails>) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.pluginId = details?.pluginId;
    this.originalError = details?.originalError;
    this.context = details?.context;
    this.timestamp = details?.timestamp || new Date();
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginError);
    }
  }

  toJSON(): PluginErrorDetails {
    return {
      code: this.code,
      message: this.message,
      pluginId: this.pluginId,
      originalError: this.originalError,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  static fromError(error: Error, code?: PluginErrorCode, context?: Record<string, any>): PluginError {
    return new PluginError(
      code || PluginErrorCode.UNKNOWN_ERROR,
      error.message,
      {
        originalError: error,
        context,
        stack: error.stack
      }
    );
  }

  static isPluginError(error: any): error is PluginError {
    return error instanceof PluginError;
  }
}

export interface PluginErrorHandler {
  handle: (error: PluginError) => void;
  register: (handler: (error: PluginError) => void) => void;
  unregister: (handler: (error: PluginError) => void) => void;
  clear: () => void;
  getHandlers: () => Array<(error: PluginError) => void>;
}

export class DefaultPluginErrorHandler implements PluginErrorHandler {
  private handlers: Array<(error: PluginError) => void> = [];

  handle(error: PluginError): void {
    // Log the error
    console.error(`[PluginError] ${error.code}: ${error.message}`, {
      pluginId: error.pluginId,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack
    });

    // Call all registered handlers
    this.handlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  register(handler: (error: PluginError) => void): void {
    this.handlers.push(handler);
  }

  unregister(handler: (error: PluginError) => void): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  clear(): void {
    this.handlers = [];
  }

  getHandlers(): Array<(error: PluginError) => void> {
    return [...this.handlers];
  }
}