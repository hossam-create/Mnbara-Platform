// Pagination Parameters Interface
export interface PaginationParams {
  page: number;
  limit: number;
}

// Sort Parameters Interface
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// Filter Parameters Interface
export interface FilterParams {
  [key: string]: unknown;
}

// API Response Interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

// API Error Interface
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

// Validation Error Interface
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Response Metadata Interface
export interface ResponseMetadata {
  pagination?: PaginationMetadata;
  timestamp: string;
  requestId?: string;
}

// Pagination Metadata Interface
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Success Response Helper
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  metadata?: ResponseMetadata
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    metadata,
  };
}

// Error Response Helper
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  validationErrors?: ValidationError[]
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      validationErrors,
    },
  };
}

// Paginated Response Helper
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    metadata: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    },
  };
}

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Soft Delete Entity Interface
export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date;
  deletedBy?: string;
}

// Geo Coordinates Interface
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

// Address Format Interface
export interface AddressFormat {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress?: string;
}

// Currency Format Interface
export interface CurrencyFormat {
  amount: number;
  currency: string;
  locale?: string;
}

// Date Format Interface
export interface DateFormat {
  date: Date | string;
  format?: string;
  locale?: string;
}

// Search Parameters Interface
export interface SearchParams {
  query: string;
  filters?: FilterParams;
  sort?: SortParams;
  pagination?: PaginationParams;
}

// Bulk Operation Result Interface
export interface BulkOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors?: BulkOperationError[];
}

// Bulk Operation Error Interface
export interface BulkOperationError {
  index: number;
  id?: string;
  error: string;
}

// Notification Type Enum
export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_DELIVERED = 'order_delivered',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  DELIVERY_ASSIGNED = 'delivery_assigned',
  DELIVERY_UPDATE = 'delivery_update',
  NEW_MESSAGE = 'new_message',
  SYSTEM = 'system'
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}
