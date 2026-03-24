/**
 * TypeScript Type Definitions for API Endpoints
 * 
 * Comprehensive type definitions for all API requests and responses
 * across the Mnbara platform services.
 * 
 * @module types
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, unknown>;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
  verificationRequired: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  code: string;
}

export interface SessionInfo {
  id: string;
  deviceName: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  roles: UserRole[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'user' | 'seller' | 'traveler' | 'admin' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
}

export interface UserStatistics {
  totalOrders: number;
  totalSpent: number;
  totalDeliveries: number;
  averageRating: number;
  reviewCount: number;
  joinedDate: string;
}

export interface KYCStatus {
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents: KYCDocument[];
}

export interface KYCDocument {
  id: string;
  type: 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  url: string;
}

export interface SubmitKYCRequest {
  documentType: KYCDocument['type'];
  documentNumber: string;
  expiryDate?: string;
}

export interface UserActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Order Types
// ============================================================================

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddressId?: string;
  shippingAddress?: Address;
  billingAddressId?: string;
  billingAddress?: Address;
  paymentMethodId: string;
  discountCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

export interface OrderTimeline {
  events: OrderTimelineEvent[];
}

export interface OrderTimelineEvent {
  id: string;
  type: string;
  status: OrderStatus;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface OrderNote {
  id: string;
  orderId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'wallet' | 'cash';
  isDefault: boolean;
  card?: CardDetails;
  bankAccount?: BankAccountDetails;
  createdAt: string;
}

export interface CardDetails {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountType: 'checking' | 'savings';
  last4: string;
  holderName: string;
}

export interface AddPaymentMethodRequest {
  type: PaymentMethod['type'];
  token: string;
  setAsDefault?: boolean;
}

export interface Payment {
  id: string;
  orderId?: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'cancelled';
  clientSecret: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  metadata?: Record<string, unknown>;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  destination: string;
  createdAt: string;
  paidAt?: string;
}

export interface CreatePayoutRequest {
  amount: number;
  currency: string;
  destination: string;
  metadata?: Record<string, unknown>;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface DepositRequest {
  amount: number;
  paymentMethodId: string;
}

export interface WithdrawRequest {
  amount: number;
  destination: string;
}

export interface TransferRequest {
  recipientId: string;
  amount: number;
  note?: string;
}

export interface Escrow {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'held' | 'released' | 'refunded';
  createdAt: string;
  releasedAt?: string;
}

export interface CreateEscrowRequest {
  orderId: string;
  amount: number;
  currency: string;
}

export interface Dispute {
  id: string;
  paymentId: string;
  reason: string;
  status: 'open' | 'under_review' | 'won' | 'lost';
  evidence: DisputeEvidence[];
  createdAt: string;
  resolvedAt?: string;
}

export interface DisputeEvidence {
  id: string;
  type: 'document' | 'image' | 'text';
  content: string;
  uploadedAt: string;
}

export interface SubmitDisputeEvidenceRequest {
  type: DisputeEvidence['type'];
  content: string;
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
  description?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'paid';
}

export interface CreatePaymentLinkRequest {
  amount: number;
  currency: string;
  description?: string;
  expiresIn?: number;
}

// ============================================================================
// Delivery Types
// ============================================================================

export interface Delivery {
  id: string;
  orderId?: string;
  userId: string;
  travelerId?: string;
  status: DeliveryStatus;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  trackingNumber: string;
  cost: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 
  | 'pending' 
  | 'assigned' 
  | 'accepted' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled' 
  | 'failed';

export interface PackageDetails {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  fragile: boolean;
  value?: number;
}

export interface CreateDeliveryRequest {
  orderId?: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  scheduledPickupTime?: string;
  notes?: string;
}

export interface AssignDeliveryRequest {
  travelerId: string;
}

export interface UpdateDeliveryStatusRequest {
  status: DeliveryStatus;
  location?: Location;
  note?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface TrackingEvent {
  id: string;
  deliveryId: string;
  status: DeliveryStatus;
  location?: Location;
  description: string;
  timestamp: string;
}

export interface ProofOfDelivery {
  id: string;
  deliveryId: string;
  signature?: string;
  photo?: string;
  recipientName: string;
  notes?: string;
  timestamp: string;
}

export interface SubmitProofRequest {
  signature?: string;
  photo?: string;
  recipientName: string;
  notes?: string;
}

export interface DeliveryRating {
  id: string;
  deliveryId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface RateDeliveryRequest {
  rating: number;
  comment?: string;
}

export interface DeliveryIssue {
  id: string;
  deliveryId: string;
  type: 'damaged' | 'lost' | 'delayed' | 'wrong_address' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedAt: string;
  resolvedAt?: string;
}

export interface ReportIssueRequest {
  type: DeliveryIssue['type'];
  description: string;
  photos?: string[];
}

export interface DeliveryQuote {
  estimatedCost: number;
  currency: string;
  estimatedDuration: number;
  availableSlots: string[];
}

export interface GetDeliveryQuoteRequest {
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
}

export interface DeliveryBatch {
  id: string;
  name: string;
  deliveryIds: string[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  boundaries: Array<{ latitude: number; longitude: number }>;
  serviceable: boolean;
  estimatedDeliveryTime: number;
}

export interface CheckZoneServiceabilityRequest {
  latitude: number;
  longitude: number;
}

export interface OptimizeRouteRequest {
  deliveryIds: string[];
  startLocation: Location;
}

export interface OptimizedRoute {
  deliveries: Array<{
    deliveryId: string;
    order: number;
    estimatedArrival: string;
  }>;
  totalDistance: number;
  totalDuration: number;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  images: string[];
  variants: ProductVariant[];
  inventory: ProductInventory;
  rating: number;
  reviewCount: number;
  sellerId: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, string>;
  inventory: number;
}

export interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  images?: string[];
  variants?: Omit<ProductVariant, 'id'>[];
  inventory?: ProductInventory;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  status?: Product['status'];
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  productCount: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: string;
}

export interface CreateProductReviewRequest {
  rating: number;
  comment: string;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  discountCode?: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApplyDiscountRequest {
  code: string;
}

export interface CheckoutRequest {
  shippingAddressId?: string;
  shippingAddress?: Address;
  billingAddressId?: string;
  billingAddress?: Address;
  paymentMethodId: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'order_update' 
  | 'payment_received' 
  | 'delivery_update' 
  | 'message' 
  | 'promotion' 
  | 'system';

export interface RegisterDeviceRequest {
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
}

// ============================================================================
// Trip Types
// ============================================================================

export interface Trip {
  id: string;
  travelerId: string;
  origin: Address;
  destination: Address;
  departureDate: string;
  arrivalDate: string;
  availableCapacity: number;
  pricePerKg: number;
  currency: string;
  status: TripStatus;
  deliveries: string[];
  createdAt: string;
  updatedAt: string;
}

export type TripStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface CreateTripRequest {
  origin: Address;
  destination: Address;
  departureDate: string;
  arrivalDate: string;
  availableCapacity: number;
  pricePerKg: number;
  currency: string;
  notes?: string;
}

export interface UpdateTripRequest {
  departureDate?: string;
  arrivalDate?: string;
  availableCapacity?: number;
  pricePerKg?: number;
  status?: TripStatus;
}

export interface TripMatch {
  tripId: string;
  deliveryId: string;
  matchScore: number;
  estimatedCost: number;
  estimatedDuration: number;
}

export interface SearchMatchingTripsRequest {
  pickupLocation: Location;
  deliveryLocation: Location;
  packageWeight: number;
  earliestPickup?: string;
  latestDelivery?: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface CreateConversationRequest {
  participantIds: string[];
  initialMessage?: string;
}

export interface SendMessageRequest {
  content: string;
  type?: Message['type'];
  fileUrl?: string;
}

export interface TypingIndicatorRequest {
  isTyping: boolean;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalDeliveries: number;
  activeUsers: number;
  pendingOrders: number;
  recentActivity: UserActivity[];
}

export interface AdminUserListParams extends PaginationParams {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface SuspendUserRequest {
  reason: string;
  duration?: number;
}

export interface GenerateReportRequest {
  type: 'users' | 'orders' | 'payments' | 'deliveries';
  startDate: string;
  endDate: string;
  format: 'pdf' | 'csv' | 'excel';
  filters?: Record<string, unknown>;
}

export interface Report {
  id: string;
  type: string;
  status: 'generating' | 'completed' | 'failed';
  url?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultCurrency: string;
  supportedCurrencies: string[];
  taxRate: number;
  shippingRates: Record<string, number>;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadResponse {
  fileId: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface GetUploadUrlRequest {
  filename: string;
  contentType: string;
  size: number;
}

export interface GetUploadUrlResponse {
  uploadUrl: string;
  fileId: string;
  expiresAt: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsParams {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface UserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  userGrowth: Array<{ date: string; count: number }>;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueByDay: Array<{ date: string; revenue: number }>;
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  successRate: number;
  paymentsByMethod: Record<string, number>;
  paymentsByStatus: Record<PaymentStatus, number>;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  deliveriesByStatus: Record<DeliveryStatus, number>;
  onTimeDeliveryRate: number;
}

export interface ProductAnalytics {
  totalProducts: number;
  totalViews: number;
  totalSales: number;
  topProducts: Array<{
    productId: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByCategory: Record<string, number>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  projectedRevenue: number;
}

// ============================================================================
// Health & Status Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: number;
  lastCheck: string;
}

export interface VersionResponse {
  version: string;
  buildDate: string;
  commit: string;
}

export interface StatusResponse {
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
}
