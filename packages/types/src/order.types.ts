import { BaseEntity, Address, DeliveryAddress, CurrencyFormat } from './common.types';

// Order Status Enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

// Order Type Enum
export enum OrderType {
  MARKETPLACE = 'marketplace',
  CROWDSHIPPING = 'crowdshipping',
  P2P_EXCHANGE = 'p2p_exchange',
  AUCTION = 'auction'
}

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled'
}

// Fulfillment Status Enum
export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled'
}

// Delivery Method Enum
export enum DeliveryMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  CROWDSHIPPING = 'crowdshipping',
  PICKUP = 'pickup'
}

// Currency Enum
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  SAR = 'SAR',
  AED = 'AED',
  EGP = 'EGP'
}

// Order Item Interface
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: Currency;
  weight?: number;
  dimensions?: ProductDimensions;
  metadata?: Record<string, unknown>;
}

// Product Dimensions Interface
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

// Order Pricing Interface
export interface OrderPricing {
  subtotal: number;
  tax: number;
  taxRate: number;
  shippingCost: number;
  discount: number;
  discountCode?: string;
  serviceFee?: number;
  total: number;
  currency: Currency;
}

// Order Discount Interface
export interface OrderDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  appliedAmount: number;
  description?: string;
}

// Order Shipping Interface
export interface OrderShipping {
  method: DeliveryMethod;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingAddress: DeliveryAddress;
  shippingCost: number;
  weight?: number;
  dimensions?: ProductDimensions;
}

// Order Payment Interface
export interface OrderPayment {
  paymentId: string;
  method: 'card' | 'wallet' | 'bank_transfer' | 'cash_on_delivery' | 'escrow';
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  metadata?: Record<string, unknown>;
}

// Order Timeline Event Interface
export interface OrderTimelineEvent {
  id: string;
  type: 'created' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'updated';
  status: OrderStatus;
  message: string;
  timestamp: Date;
  actor?: string;
  metadata?: Record<string, unknown>;
}

// Order Customer Interface
export interface OrderCustomer {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Order Seller Interface
export interface OrderSeller {
  userId: string;
  businessName?: string;
  email: string;
  phoneNumber?: string;
}

// Order Traveler Interface (for crowdshipping)
export interface OrderTraveler {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tripId?: string;
  estimatedDeliveryDate?: Date;
}

// Order Notes Interface
export interface OrderNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

// Order Metadata Interface
export interface OrderMetadata {
  source?: 'web' | 'mobile' | 'api';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  campaignId?: string;
  affiliateId?: string;
  customFields?: Record<string, unknown>;
}

// Main Order Interface
export interface Order extends BaseEntity {
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  customer: OrderCustomer;
  seller?: OrderSeller;
  traveler?: OrderTraveler;
  items: OrderItem[];
  pricing: OrderPricing;
  discount?: OrderDiscount;
  shipping: OrderShipping;
  payment: OrderPayment;
  billingAddress?: Address;
  timeline: OrderTimelineEvent[];
  notes?: OrderNote[];
  metadata?: OrderMetadata;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  completedAt?: Date;
}

// Create Order DTO
export interface CreateOrderDto {
  type: OrderType;
  customerId: string;
  sellerId?: string;
  items: CreateOrderItemDto[];
  shippingAddress: DeliveryAddress;
  billingAddress?: Address;
  shippingMethod: DeliveryMethod;
  paymentMethod: 'card' | 'wallet' | 'bank_transfer' | 'cash_on_delivery' | 'escrow';
  discountCode?: string;
  notes?: string;
  metadata?: OrderMetadata;
}

// Create Order Item DTO
export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  metadata?: Record<string, unknown>;
}

// Update Order DTO
export interface UpdateOrderDto {
  status?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  shippingAddress?: DeliveryAddress;
  billingAddress?: Address;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  notes?: string;
}

// Order Search Filters
export interface OrderSearchFilters {
  status?: OrderStatus[];
  type?: OrderType[];
  fulfillmentStatus?: FulfillmentStatus[];
  paymentStatus?: PaymentStatus[];
  customerId?: string;
  sellerId?: string;
  travelerId?: string;
  orderNumber?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  minTotal?: number;
  maxTotal?: number;
  searchQuery?: string;
}

// Order List Response
export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

// Order Summary Interface
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: OrderType;
  total: number;
  currency: Currency;
  itemCount: number;
  customerName: string;
  createdAt: Date;
  estimatedDeliveryDate?: Date;
}

// Order Statistics Interface
export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  currency: Currency;
}

// Order Cancellation DTO
export interface CancelOrderDto {
  orderId: string;
  reason: string;
  refundAmount?: number;
  notifyCustomer?: boolean;
}

// Order Refund DTO
export interface RefundOrderDto {
  orderId: string;
  amount: number;
  reason: string;
  refundShipping?: boolean;
  notifyCustomer?: boolean;
}

// Order Tracking Info Interface
export interface OrderTrackingInfo {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDeliveryDate?: Date;
  currentLocation?: string;
  timeline: OrderTimelineEvent[];
  shippingAddress: DeliveryAddress;
}

// Order Invoice Interface
export interface OrderInvoice {
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  issuedDate: Date;
  dueDate?: Date;
  customer: OrderCustomer;
  seller?: OrderSeller;
  items: OrderItem[];
  pricing: OrderPricing;
  billingAddress: Address;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
}

// Order Receipt Interface
export interface OrderReceipt {
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  issuedDate: Date;
  customer: OrderCustomer;
  items: OrderItem[];
  pricing: OrderPricing;
  payment: OrderPayment;
  billingAddress: Address;
}

// Bulk Order Operation Result
export interface BulkOrderOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors?: BulkOrderError[];
}

// Bulk Order Error
export interface BulkOrderError {
  orderId: string;
  orderNumber: string;
  error: string;
}

// Order Export Options
export interface OrderExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  filters?: OrderSearchFilters;
  fields?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Order Analytics Interface
export interface OrderAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: Date;
    revenue: number;
    orderCount: number;
  }>;
}
