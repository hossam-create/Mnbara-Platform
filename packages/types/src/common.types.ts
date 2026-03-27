// Common Types and Interfaces
// Shared across all domain types in the Mnbara Platform

// ============================================================================
// Base Entity Interface
// ============================================================================

/**
 * Base entity interface that all domain entities extend
 * Provides common fields for tracking creation and updates
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Geographic and Location Types
// ============================================================================

/**
 * Geographic location with latitude and longitude coordinates
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

/**
 * Standard address interface
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  apartment?: string;
  building?: string;
  floor?: string;
  landmark?: string;
  coordinates?: GeoLocation;
}

/**
 * Delivery address with additional delivery-specific fields
 */
export interface DeliveryAddress extends Address {
  recipientName?: string;
  recipientPhone?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  isDefault?: boolean;
}

// ============================================================================
// Pagination and List Response Types
// ============================================================================

/**
 * Generic pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Generic list response (without pagination metadata)
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
}

// ============================================================================
// Currency and Money Types
// ============================================================================

/**
 * Currency codes enum
 */
export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  SAR = 'SAR',
  AED = 'AED',
  EGP = 'EGP',
  JPY = 'JPY',
  CNY = 'CNY',
  INR = 'INR',
  CAD = 'CAD',
  AUD = 'AUD'
}

/**
 * Money amount with currency
 */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

/**
 * Currency format configuration
 */
export interface CurrencyFormat {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
}

// ============================================================================
// Date and Time Types
// ============================================================================

/**
 * Date range interface
 */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Time slot interface
 */
export interface TimeSlot {
  start: string;
  end: string;
  timezone?: string;
}

/**
 * Business hours interface
 */
export interface BusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ============================================================================
// File and Media Types
// ============================================================================

/**
 * File upload interface
 */
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Image interface
 */
export interface Image {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
}

/**
 * Media type enum
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other'
}

/**
 * Media file interface
 */
export interface MediaFile {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  mimeType: string;
  size: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  uploadedAt: Date;
}

// ============================================================================
// Contact and Communication Types
// ============================================================================

/**
 * Contact information interface
 */
export interface ContactInfo {
  email?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
}

/**
 * Social media links interface
 */
export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

/**
 * Phone number interface
 */
export interface PhoneNumber {
  countryCode: string;
  number: string;
  extension?: string;
  type?: 'mobile' | 'home' | 'work' | 'fax';
  isPrimary?: boolean;
  isVerified?: boolean;
}

// ============================================================================
// Status and State Types
// ============================================================================

/**
 * Generic status enum
 */
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * Verification status enum
 */
export enum VerificationStatus {
  NOT_VERIFIED = 'not_verified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Approval status enum
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes'
}

// ============================================================================
// Error and Response Types
// ============================================================================

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  path?: string;
  statusCode?: number;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = unknown> {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results?: T[];
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

/**
 * Generic search parameters
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  pagination?: PaginationParams;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search result interface
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters?: Record<string, unknown>;
  facets?: SearchFacet[];
}

/**
 * Search facet interface
 */
export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification channel enum
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

/**
 * Notification priority enum
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  sentAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// Audit and Tracking Types
// ============================================================================

/**
 * Audit log entry interface
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Change log entry interface
 */
export interface ChangeLog {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: Date;
}

// ============================================================================
// Rating and Review Types
// ============================================================================

/**
 * Rating interface
 */
export interface Rating {
  id: string;
  entityId: string;
  entityType: string;
  userId: string;
  rating: number;
  maxRating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review interface
 */
export interface Review {
  id: string;
  entityId: string;
  entityType: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate rating interface
 */
export interface AggregateRating {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Feature flag interface
 */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  enabledFor?: string[];
}

/**
 * Configuration setting interface
 */
export interface ConfigSetting {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isPublic: boolean;
  updatedAt: Date;
}

// ============================================================================
// Metadata Types
// ============================================================================

/**
 * Generic metadata interface
 */
export interface Metadata {
  [key: string]: string | number | boolean | null | undefined | Metadata | Metadata[];
}

/**
 * Entity metadata interface
 */
export interface EntityMetadata {
  version: number;
  tags?: string[];
  labels?: Record<string, string>;
  customFields?: Record<string, unknown>;
}

// ============================================================================
// Permission and Access Control Types
// ============================================================================

/**
 * Permission interface
 */
export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
}

/**
 * Access control entry interface
 */
export interface AccessControlEntry {
  userId: string;
  resourceId: string;
  resourceType: string;
  permissions: string[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

// ============================================================================
// Analytics and Metrics Types
// ============================================================================

/**
 * Metric data point interface
 */
export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Time series data interface
 */
export interface TimeSeriesData {
  metric: string;
  dataPoints: MetricDataPoint[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  id: string;
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Webhook event interface
 */
export interface WebhookEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  signature?: string;
}

/**
 * Webhook subscription interface
 */
export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

// ============================================================================
// Export all types
// ============================================================================

export type ID = string;
export type Timestamp = Date;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];
