/**
 * Plugin System Types
 * TypeScript definitions for plugin marketplace and management
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  price: number;
  currency: string;
  isFree: boolean;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  isInstalled: boolean;
  isVerified: boolean;
  isPublished: boolean;
  manifest: PluginManifest;
  createdAt: string;
  updatedAt: string;
  screenshots?: string[];
  documentation?: string;
  supportUrl?: string;
  repositoryUrl?: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  keywords?: string[];
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  homepage?: string;
  engines?: {
    node?: string;
    npm?: string;
  };
  os?: string[];
  cpu?: string[];
  MnbaraPlugin?: {
    type: PluginType;
    category: PluginCategory;
    hooks: string[];
    permissions: PluginPermission[];
    configSchema?: PluginConfigSchema;
    events?: string[];
    dependencies?: string[];
  };
}

export type PluginType = 
  | 'payment-gateway'
  | 'shipping-provider'
  | 'analytics'
  | 'marketing'
  | 'security'
  | 'productivity'
  | 'integration'
  | 'custom';

export type PluginCategory =
  | 'payments'
  | 'shipping'
  | 'analytics'
  | 'marketing'
  | 'security'
  | 'productivity'
  | 'integrations'
  | 'communication'
  | 'inventory'
  | 'customer-support'
  | 'automation'
  | 'custom';

export type PluginPermission =
  | 'read:products'
  | 'write:products'
  | 'read:orders'
  | 'write:orders'
  | 'read:users'
  | 'write:users'
  | 'read:payments'
  | 'write:payments'
  | 'read:analytics'
  | 'write:analytics'
  | 'read:settings'
  | 'write:settings'
  | 'external:api'
  | 'external:webhook'
  | 'system:config'
  | 'system:logs';

export interface PluginConfigSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    title?: string;
    description?: string;
    default?: any;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
  }>;
  required?: string[];
}

export interface PluginFilters {
  category: string;
  search: string;
  sortBy: PluginSortOption;
  price: 'all' | 'free' | 'paid';
}

export type PluginSortOption =
  | 'popular'
  | 'rating'
  | 'newest'
  | 'name'
  | 'price-low'
  | 'price-high';

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  helpful: number;
  reported: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PluginInstallation {
  id: string;
  pluginId: string;
  userId: string;
  version: string;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error' | 'updating';
  installedAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export interface PluginDeveloper {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  verified: boolean;
  plugins: Plugin[];
  totalDownloads: number;
  averageRating: number;
  joinedAt: string;
  lastActiveAt: string;
}

export interface PluginAnalytics {
  pluginId: string;
  installations: number;
  activeInstallations: number;
  uninstallations: number;
  totalUsage: number;
  averageUsagePerUser: number;
  errors: number;
  averageRating: number;
  totalReviews: number;
  revenue: number;
  topCountries: Array<{
    country: string;
    installations: number;
    usage: number;
  }>;
  usageTrend: Array<{
    date: string;
    installations: number;
    activeUsers: number;
    usage: number;
  }>;
}

export interface PluginSubmission {
  pluginId: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  price: number;
  manifest: PluginManifest;
  code: string;
  documentation: string;
  screenshots: string[];
  supportUrl?: string;
  repositoryUrl?: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PluginHook {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  returnType: string;
  examples: string[];
}

export interface PluginEvent {
  name: string;
  description: string;
  payload: Record<string, any>;
  examples: string[];
}

export interface CreatePluginRequest {
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  price?: number;
  manifest: PluginManifest;
  code?: string;
  documentation?: string;
  screenshots?: string[];
  supportUrl?: string;
  repositoryUrl?: string;
}

export interface UpdatePluginRequest {
  name?: string;
  description?: string;
  category?: PluginCategory;
  price?: number;
  manifest?: PluginManifest;
  documentation?: string;
  screenshots?: string[];
  supportUrl?: string;
  repositoryUrl?: string;
}

export interface InstallPluginRequest {
  pluginId: string;
  version: string;
  config?: Record<string, any>;
}

export interface PluginError {
  pluginId: string;
  error: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface PluginApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}