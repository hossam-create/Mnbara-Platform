import { z } from 'zod';

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
