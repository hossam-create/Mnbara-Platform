// CrafterCMS Configuration Types
export interface CrafterCMSConfig {
  studioUrl: string;
  engineUrl: string;
  authToken?: string;
  timeout?: number;
  retryAttempts?: number;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

// Content Types
export interface ContentItem {
  id: string;
  path: string;
  previewUrl?: string;
  contentType: string;
  mimeType?: string;
  locale: string;
  size?: number;
  encoding?: string;
  createdBy: string;
  createdOn: string;
  lastModifiedBy: string;
  lastModifiedOn: string;
  lastPublishedOn?: string;
  commitId: string;
  state: ContentState;
  lockedBy?: string;
  lockedOn?: string;
  metadata?: ContentMetadata[];
  content?: Record<string, any>;
  deleted?: boolean;
  siteId?: string;
}

export interface ContentMetadata {
  key: string;
  value: string;
}

export interface ContentQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: SortOption[];
  limit?: number;
  offset?: number;
  locale?: string;
  contentTypes?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface ContentUpdate {
  path: string;
  contentType: string;
  content: Record<string, any>;
  metadata?: ContentMetadata[];
  locale?: string;
  commitMessage?: string;
}

export interface BatchUpdateRequest extends ContentUpdate {
  id?: string;
  priority?: number;
}

export interface ContentFetchOptions {
  skipCache?: boolean;
  allowStale?: boolean;
  cacheTTL?: number;
  locale?: string;
  filters?: Record<string, any>;
  sort?: SortOption[];
  limit?: number;
  offset?: number;
}

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchResult {
  total: number;
  items: ContentItem[];
  facets?: SearchFacet[];
  suggestions?: string[];
  took?: number;
}

export interface SearchFacet {
  name: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
}

// Publishing Types
export interface PublishingTarget {
  id: string;
  name: string;
  environment: string;
  serverUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn: string;
  lastPublished?: string;
}

export interface PublishingRequest {
  siteId: string;
  paths: string[];
  target: string;
  scheduledDate?: Date;
  submissionComment?: string;
  userId?: string;
}

// Content State Types
export enum ContentState {
  NEW = 'NEW',
  EDITED = 'EDITED',
  LOCKED = 'LOCKED',
  IN_WORKFLOW = 'IN_WORKFLOW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
  DELETED = 'DELETED'
}

// Workflow Types
export interface WorkflowItem {
  id: string;
  siteId: string;
  contentId: string;
  processId: string;
  submittedBy: string;
  submittedOn: string;
  submittedForDeletion: boolean;
  state: WorkflowState;
  publishingPackageId?: string;
  approver?: string;
  approvedOn?: string;
  rejectedOn?: string;
  rejectedReason?: string;
}

export enum WorkflowState {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// Site Types
export interface Site {
  id: string;
  siteId: string;
  name: string;
  description?: string;
  status: SiteStatus;
  blueprint?: string;
  createdBy: string;
  createdOn: string;
  lastCommitId?: string;
  publishingLockOwner?: string;
  publishingLockHeartbeat?: string;
  state: SiteState;
}

export enum SiteStatus {
  CREATING = 'CREATING',
  READY = 'READY',
  ERROR = 'ERROR',
  DELETING = 'DELETING'
}

export enum SiteState {
  READY = 'READY',
  LOCKED = 'LOCKED',
  BUSY = 'BUSY'
}

// User and Permission Types
export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  enabled: boolean;
  externallyManaged: boolean;
  timezone?: string;
  locale?: string;
  createdDate: string;
  lastModifiedDate: string;
  lastLoginDate?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: GroupType;
  externallyManaged: boolean;
  createdDate: string;
  lastModifiedDate: string;
}

export enum GroupType {
  SYSTEM_ADMIN = 2,
  SITE_ADMIN = 1,
  SITE_AUTHOR = 1,
  SITE_PUBLISHER = 1,
  SITE_DEVELOPER = 1,
  SITE_REVIEWER = 1,
  SITE_GUEST = 1
}

// Error Types
export interface CrafterCMSError extends Error {
  code: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
}

export enum CrafterCMSErrorCode {
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  CONTENT_LOCKED = 'CONTENT_LOCKED',
  INVALID_CONTENT_TYPE = 'INVALID_CONTENT_TYPE',
  PUBLISHING_FAILED = 'PUBLISHING_FAILED',
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: CrafterCMSError;
  metadata?: {
    timestamp: string;
    requestId: string;
    took: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}