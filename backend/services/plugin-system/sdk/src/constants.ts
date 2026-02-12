/**
 * MNBara Plugin SDK Constants
 * 
 * Core constants and configuration values for the plugin SDK
 */

/**
 * Plugin SDK version
 */
export const PLUGIN_SDK_VERSION = '1.0.0';

/**
 * Minimum Node.js version required
 */
export const MIN_NODE_VERSION = '16.0.0';

/**
 * Default hooks available to plugins
 */
export const DEFAULT_HOOKS = {
  // Lifecycle hooks
  ON_INSTALL: 'plugin:on-install',
  ON_ENABLE: 'plugin:on-enable',
  ON_DISABLE: 'plugin:on-disable',
  ON_UNINSTALL: 'plugin:on-uninstall',
  
  // Wallet hooks
  ON_WALLET_CONNECT: 'wallet:on-connect',
  ON_WALLET_DISCONNECT: 'wallet:on-disconnect',
  ON_WALLET_SWITCH_CHAIN: 'wallet:on-switch-chain',
  ON_WALLET_ACCOUNT_CHANGE: 'wallet:on-account-change',
  
  // Transaction hooks
  ON_TRANSACTION_SUBMIT: 'transaction:on-submit',
  ON_TRANSACTION_CONFIRM: 'transaction:on-confirm',
  ON_TRANSACTION_FAIL: 'transaction:on-fail',
  ON_TRANSACTION_SPEED_UP: 'transaction:on-speed-up',
  ON_TRANSACTION_CANCEL: 'transaction:on-cancel',
  
  // UI hooks
  ON_UI_MOUNT: 'ui:on-mount',
  ON_UI_UNMOUNT: 'ui:on-unmount',
  ON_UI_UPDATE: 'ui:on-update',
  ON_UI_ERROR: 'ui:on-error',
  
  // API hooks
  ON_API_REQUEST: 'api:on-request',
  ON_API_RESPONSE: 'api:on-response',
  ON_API_ERROR: 'api:on-error',
  ON_API_RATE_LIMIT: 'api:on-rate-limit',
  
  // Storage hooks
  ON_STORAGE_READ: 'storage:on-read',
  ON_STORAGE_WRITE: 'storage:on-write',
  ON_STORAGE_DELETE: 'storage:on-delete',
  
  // System hooks
  ON_SYSTEM_STARTUP: 'system:on-startup',
  ON_SYSTEM_SHUTDOWN: 'system:on-shutdown',
  ON_SYSTEM_ERROR: 'system:on-error',
  
  // Custom hooks prefix
  CUSTOM_PREFIX: 'custom:'
} as const;

/**
 * Default permissions for different plugin types
 */
export const DEFAULT_PERMISSIONS = {
  WALLET_INTEGRATION: {
    wallet: {
      read: true,
      write: true,
      sign: true,
      admin: false
    },
    api: {
      external: true,
      internal: true,
      admin: false
    },
    ui: {
      render: true,
      modify: true,
      admin: false
    },
    hooks: {
      register: true,
      trigger: true,
      admin: false
    },
    storage: {
      read: true,
      write: true,
      admin: false
    },
    system: {
      network: true,
      filesystem: false,
      process: false,
      admin: false
    }
  },
  
  UI_COMPONENT: {
    wallet: {
      read: false,
      write: false,
      sign: false,
      admin: false
    },
    api: {
      external: false,
      internal: true,
      admin: false
    },
    ui: {
      render: true,
      modify: true,
      admin: false
    },
    hooks: {
      register: true,
      trigger: true,
      admin: false
    },
    storage: {
      read: true,
      write: true,
      admin: false
    },
    system: {
      network: false,
      filesystem: false,
      process: false,
      admin: false
    }
  },
  
  API_SERVICE: {
    wallet: {
      read: false,
      write: false,
      sign: false,
      admin: false
    },
    api: {
      external: true,
      internal: true,
      admin: false
    },
    ui: {
      render: false,
      modify: false,
      admin: false
    },
    hooks: {
      register: true,
      trigger: true,
      admin: false
    },
    storage: {
      read: true,
      write: true,
      admin: false
    },
    system: {
      network: true,
      filesystem: false,
      process: false,
      admin: false
    }
  },
  
  HOOK_PROVIDER: {
    wallet: {
      read: false,
      write: false,
      sign: false,
      admin: false
    },
    api: {
      external: false,
      internal: true,
      admin: false
    },
    ui: {
      render: false,
      modify: false,
      admin: false
    },
    hooks: {
      register: true,
      trigger: true,
      admin: false
    },
    storage: {
      read: true,
      write: true,
      admin: false
    },
    system: {
      network: false,
      filesystem: false,
      process: false,
      admin: false
    }
  }
} as const;

/**
 * Plugin lifecycle events
 */
export const PLUGIN_LIFECYCLE_EVENTS = {
  INSTALL: 'plugin:install',
  ENABLE: 'plugin:enable',
  DISABLE: 'plugin:disable',
  UNINSTALL: 'plugin:uninstall',
  UPDATE: 'plugin:update',
  ERROR: 'plugin:error',
  HEALTH_CHECK: 'plugin:health-check',
  METRICS_UPDATE: 'plugin:metrics-update',
  STARTUP: 'plugin:startup',
  SHUTDOWN: 'plugin:shutdown'
} as const;

/**
 * Wallet events
 */
export const WALLET_EVENTS = {
  CONNECT: 'wallet:connect',
  DISCONNECT: 'wallet:disconnect',
  ACCOUNT_CHANGE: 'wallet:account-change',
  CHAIN_CHANGE: 'wallet:chain-change',
  TRANSACTION_SUBMIT: 'wallet:transaction-submit',
  TRANSACTION_CONFIRM: 'wallet:transaction-confirm',
  TRANSACTION_FAIL: 'wallet:transaction-fail',
  BALANCE_UPDATE: 'wallet:balance-update',
  ASSET_ADDED: 'wallet:asset-added',
  ASSET_REMOVED: 'wallet:asset-removed'
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  PLUGIN: {
    LIST: '/api/plugins',
    INSTALL: '/api/plugins/install',
    UNINSTALL: '/api/plugins/uninstall',
    ENABLE: '/api/plugins/enable',
    DISABLE: '/api/plugins/disable',
    UPDATE: '/api/plugins/update',
    HEALTH: '/api/plugins/health',
    METRICS: '/api/plugins/metrics'
  },
  WALLET: {
    CONNECT: '/api/wallet/connect',
    DISCONNECT: '/api/wallet/disconnect',
    BALANCE: '/api/wallet/balance',
    TRANSACTIONS: '/api/wallet/transactions',
    SEND: '/api/wallet/send',
    SIGN: '/api/wallet/sign'
  },
  HOOKS: {
    REGISTER: '/api/hooks/register',
    UNREGISTER: '/api/hooks/unregister',
    TRIGGER: '/api/hooks/trigger',
    LIST: '/api/hooks/list'
  },
  STORAGE: {
    GET: '/api/storage/get',
    SET: '/api/storage/set',
    DELETE: '/api/storage/delete',
    LIST: '/api/storage/list'
  }
} as const;

/**
 * UI component types
 */
export const UI_COMPONENT_TYPES = {
  BUTTON: 'button',
  CARD: 'card',
  MODAL: 'modal',
  FORM: 'form',
  INPUT: 'input',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTAREA: 'textarea',
  LABEL: 'label',
  SPINNER: 'spinner',
  ICON: 'icon',
  IMAGE: 'image',
  TEXT: 'text',
  HEADING: 'heading',
  DIVIDER: 'divider',
  SPACE: 'space',
  GRID: 'grid',
  FLEX: 'flex',
  CONTAINER: 'container',
  NAVIGATION: 'navigation',
  SIDEBAR: 'sidebar',
  HEADER: 'header',
  FOOTER: 'footer',
  MENU: 'menu',
  DROPDOWN: 'dropdown',
  TABS: 'tabs',
  ACCORDION: 'accordion',
  ALERT: 'alert',
  BADGE: 'badge',
  AVATAR: 'avatar',
  BREADCRUMB: 'breadcrumb',
  PAGINATION: 'pagination',
  PROGRESS: 'progress',
  SKELETON: 'skeleton',
  TOOLTIP: 'tooltip',
  POPOVER: 'popover',
  DRAWER: 'drawer',
  NOTIFICATION: 'notification',
  TOAST: 'toast'
} as const;

/**
 * Default plugin template configuration
 */
export const DEFAULT_TEMPLATE_CONFIG = {
  name: 'My Plugin',
  description: 'A MNBara plugin',
  version: '1.0.0',
  author: 'Anonymous',
  features: {
    typescript: true,
    hooks: false,
    walletIntegration: false,
    uiComponents: false,
    apiEndpoints: false,
    storage: true,
    cache: false,
    metrics: true
  },
  permissions: DEFAULT_PERMISSIONS.UI_COMPONENT
} as const;

/**
 * Plugin validation rules
 */
export const PLUGIN_VALIDATION_RULES = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 50,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_VERSION_LENGTH: 3,
  MAX_VERSION_LENGTH: 20,
  VALID_VERSION_PATTERN: /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/,
  VALID_ID_PATTERN: /^[a-z0-9-]+$/,
  VALID_AUTHOR_PATTERN: /^[a-zA-Z0-9\s._-]+$/,
  MAX_KEYWORDS: 10,
  MAX_KEYWORD_LENGTH: 20
} as const;

/**
 * Security policies
 */
export const SECURITY_POLICIES = {
  MAX_REQUEST_SIZE: '10mb',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100,
  CORS_ORIGIN: '*',
  CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  CORS_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  API_KEY_LENGTH: 32,
  JWT_EXPIRY: '1h',
  JWT_REFRESH_EXPIRY: '7d'
} as const;

/**
 * Plugin metrics configuration
 */
export const METRICS_CONFIG = {
  COLLECTION_INTERVAL: 30 * 1000, // 30 seconds
  RETENTION_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_METRICS_PER_PLUGIN: 10000,
  ALERT_THRESHOLDS: {
    MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
    CPU_USAGE: 80, // 80%
    ERROR_RATE: 0.1, // 10%
    RESPONSE_TIME: 5000 // 5 seconds
  }
} as const;