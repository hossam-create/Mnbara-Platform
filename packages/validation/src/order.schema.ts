import { z } from 'zod';

// Enums matching order.types.ts
const OrderTypeEnum = z.enum(['marketplace', 'crowdshipping', 'p2p_exchange', 'auction']);
const OrderStatusEnum = z.enum(['pending', 'confirmed', 'processing', 'ready_for_pickup', 'in_transit', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded', 'failed']);
const FulfillmentStatusEnum = z.enum(['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled']);
const DeliveryMethodEnum = z.enum(['standard', 'express', 'same_day', 'crowdshipping', 'pickup']);
const PaymentMethodEnum = z.enum(['card', 'wallet', 'bank_transfer', 'cash_on_delivery', 'escrow']);

// Address schema (shared with user.schema.ts)
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  country: z.string().length(2, 'Invalid country code'),
  isDefault: z.boolean().optional(),
});
export type Address = z.infer<typeof addressSchema>;

// Delivery address extends address with optional fields
export const deliveryAddressSchema = addressSchema.extend({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  instructions: z.string().max(500).optional(),
});
export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>;

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  productName: z.string().min(1, 'Product name is required'),
  productImage: z.string().url('Invalid image URL').optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
  totalPrice: z.number().positive('Total price must be positive'),
  weight: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

// Order pricing schema
export const orderPricingSchema = z.object({
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1'),
  shippingCost: z.number().min(0, 'Shipping cost cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  discountCode: z.string().optional(),
  serviceFee: z.number().min(0).optional(),
  total: z.number().min(0, 'Total cannot be negative'),
});
export type OrderPricing = z.infer<typeof orderPricingSchema>;

// Order shipping schema
export const orderShippingSchema = z.object({
  method: DeliveryMethodEnum,
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url('Invalid tracking URL').optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
  actualDeliveryDate: z.string().datetime().optional(),
  shippingAddress: deliveryAddressSchema,
  shippingCost: z.number().min(0, 'Shipping cost cannot be negative'),
  weight: z.number().positive().optional(),
});
export type OrderShipping = z.infer<typeof orderShippingSchema>;

// Order payment schema
export const orderPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  method: PaymentMethodEnum,
  status: z.enum(['pending', 'authorized', 'captured', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled']),
  amount: z.number().positive('Amount must be positive'),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  refundedAt: z.string().datetime().optional(),
  refundAmount: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type OrderPayment = z.infer<typeof orderPaymentSchema>;

// Order timeline event schema
export const orderTimelineEventSchema = z.object({
  id: z.string().uuid('Invalid timeline event ID'),
  type: z.enum(['created', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded', 'updated']),
  status: OrderStatusEnum,
  message: z.string().min(1, 'Message is required'),
  timestamp: z.string().datetime(),
  actor: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type OrderTimelineEvent = z.infer<typeof orderTimelineEventSchema>;

// Order customer schema
export const orderCustomerSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});
export type OrderCustomer = z.infer<typeof orderCustomerSchema>;

// Order seller schema
export const orderSellerSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  businessName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});
export type OrderSeller = z.infer<typeof orderSellerSchema>;

// Create order item DTO
const createOrderItemDtoSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateOrderItemDto = z.infer<typeof createOrderItemDtoSchema>;

// Create order DTO
export const createOrderDtoSchema = z.object({
  type: OrderTypeEnum,
  customerId: z.string().uuid('Invalid customer ID'),
  sellerId: z.string().uuid('Invalid seller ID').optional(),
  items: z.array(createOrderItemDtoSchema).min(1, 'Order must have at least one item'),
  shippingAddress: deliveryAddressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethod: DeliveryMethodEnum,
  paymentMethod: PaymentMethodEnum,
  discountCode: z.string().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateOrderDto = z.infer<typeof createOrderDtoSchema>;

// Update order DTO
export const updateOrderDtoSchema = z.object({
  status: OrderStatusEnum.optional(),
  fulfillmentStatus: FulfillmentStatusEnum.optional(),
  shippingAddress: deliveryAddressSchema.optional(),
  billingAddress: addressSchema.optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url('Invalid tracking URL').optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateOrderDto = z.infer<typeof updateOrderDtoSchema>;

// Order search filters
export const orderSearchFiltersSchema = z.object({
  status: z.array(OrderStatusEnum).optional(),
  type: z.array(OrderTypeEnum).optional(),
  fulfillmentStatus: z.array(FulfillmentStatusEnum).optional(),
  customerId: z.string().uuid('Invalid customer ID').optional(),
  sellerId: z.string().uuid('Invalid seller ID').optional(),
  orderNumber: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  minTotal: z.number().positive().optional(),
  maxTotal: z.number().positive().optional(),
  searchQuery: z.string().optional(),
});
export type OrderSearchFilters = z.infer<typeof orderSearchFiltersSchema>;

// Cancel order DTO
export const cancelOrderDtoSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500),
  refundAmount: z.number().positive().optional(),
  notifyCustomer: z.boolean().default(true),
});
export type CancelOrderDto = z.infer<typeof cancelOrderDtoSchema>;

// Refund order DTO
export const refundOrderDtoSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required').max(500),
  refundShipping: z.boolean().optional(),
  notifyCustomer: z.boolean().default(true),
});
export type RefundOrderDto = z.infer<typeof refundOrderDtoSchema>;

// Order export options
export const orderExportOptionsSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  filters: orderSearchFiltersSchema.optional(),
  fields: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }).optional(),
});
export type OrderExportOptions = z.infer<typeof orderExportOptionsSchema>;

// Original schemas (kept for backward compatibility)
export const orderCreateSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid('Invalid product ID'), quantity: z.number().int().positive('Quantity must be at least 1'), price: z.number().positive('Price must be positive') })).min(1, 'Order must have at least one item'),
  shippingAddressId: z.string().uuid('Invalid shipping address ID'),
  billingAddressId: z.string().uuid('Invalid billing address ID').optional(),
  shippingMethodId: z.string().uuid('Invalid shipping method ID'),
  couponCode: z.string().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});
export type OrderCreate = z.infer<typeof orderCreateSchema>;

export const orderFilterSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type OrderFilter = z.infer<typeof orderFilterSchema>;

export const orderItemUpdateSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1').optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
});
export type OrderItemUpdate = z.infer<typeof orderItemUpdateSchema>;

export const orderCancellationSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason').max(500, 'Reason too long'),
  requestRefund: z.boolean().default(true),
});
export type OrderCancellation = z.infer<typeof orderCancellationSchema>;

export const orderReturnSchema = z.object({
  items: z.array(z.object({ orderItemId: z.string().uuid('Invalid order item ID'), quantity: z.number().int().positive('Quantity must be at least 1'), reason: z.string().min(1, 'Return reason is required').max(200, 'Reason too long') })).min(1, 'At least one item is required for return'),
  returnMethod: z.enum(['pickup', 'drop_off', 'mail']),
  notes: z.string().max(500, 'Notes too long').optional(),
});
export type OrderReturn = z.infer<typeof orderReturnSchema>;

export const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  variantId: z.string().uuid('Invalid variant ID').optional(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartUpdateSchema = z.object({ items: z.array(cartItemSchema).min(1, 'Cart must have at least one item') });
export type CartUpdate = z.infer<typeof cartUpdateSchema>;

export const productReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  orderId: z.string().uuid('Invalid order ID').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100, 'Title too long').optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review too long'),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').optional(),
});
export type ProductReview = z.infer<typeof productReviewSchema>;
