import { describe, it, expect } from 'vitest';
import {
  orderCreateSchema,
  orderFilterSchema,
  orderItemUpdateSchema,
  orderCancellationSchema,
  orderReturnSchema,
  cartItemSchema,
  cartUpdateSchema,
  productReviewSchema,
  createOrderDtoSchema,
  updateOrderDtoSchema,
  orderSearchFiltersSchema,
  cancelOrderDtoSchema,
  refundOrderDtoSchema,
  addressSchema,
  deliveryAddressSchema,
  orderItemSchema,
  orderPricingSchema,
} from '../order.schema';

describe('Order Validation Schemas', () => {
  describe('orderCreateSchema', () => {
    it('should validate a valid order creation object', () => {
      const validData = {
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, price: 29.99 },
        ],
        shippingAddressId: '123e4567-e89b-12d3-a456-426614174001',
        shippingMethodId: '123e4567-e89b-12d3-a456-426614174002',
      };
      const result = orderCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const invalidData = {
        items: [],
        shippingAddressId: '123e4567-e89b-12d3-a456-426614174001',
        shippingMethodId: '123e4567-e89b-12d3-a456-426614174002',
      };
      const result = orderCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid product ID format', () => {
      const invalidData = {
        items: [
          { productId: 'invalid-uuid', quantity: 2, price: 29.99 },
        ],
        shippingAddressId: '123e4567-e89b-12d3-a456-426614174001',
        shippingMethodId: '123e4567-e89b-12d3-a456-426614174002',
      };
      const result = orderCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive quantity', () => {
      const invalidData = {
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 0, price: 29.99 },
        ],
        shippingAddressId: '123e4567-e89b-12d3-a456-426614174001',
        shippingMethodId: '123e4567-e89b-12d3-a456-426614174002',
      };
      const result = orderCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const invalidData = {
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, price: -29.99 },
        ],
        shippingAddressId: '123e4567-e89b-12d3-a456-426614174001',
        shippingMethodId: '123e4567-e89b-12d3-a456-426614174002',
      };
      const result = orderCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional coupon code', () => {
      const validData = {
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, price: 29.99 },
        ],
        shippingAddressId: '123e4567-e89b-12d3-a456-426614174001',
        shippingMethodId: '123e4567-e89b-12d3-a456-426614174002',
        couponCode: 'SAVE10',
      };
      const result = orderCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('orderFilterSchema', () => {
    it('should validate a valid filter object', () => {
      const validData = {
        status: 'pending',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        minAmount: 10,
        maxAmount: 1000,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const result = orderFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default values for optional fields', () => {
      const validData = {};
      const result = orderFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      };
      const result = orderFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative page number', () => {
      const invalidData = {
        page: -1,
      };
      const result = orderFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding maximum', () => {
      const invalidData = {
        limit: 200,
      };
      const result = orderFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sortBy field', () => {
      const invalidData = {
        sortBy: 'invalid_field',
      };
      const result = orderFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('orderItemUpdateSchema', () => {
    it('should validate a valid item update', () => {
      const validData = {
        quantity: 5,
        status: 'processing',
      };
      const result = orderItemUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty update object', () => {
      const validData = {};
      const result = orderItemUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-positive quantity', () => {
      const invalidData = {
        quantity: 0,
      };
      const result = orderItemUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid',
      };
      const result = orderItemUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('orderCancellationSchema', () => {
    it('should validate a valid cancellation', () => {
      const validData = {
        reason: 'I changed my mind about the product',
        requestRefund: true,
      };
      const result = orderCancellationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short reason', () => {
      const invalidData = {
        reason: 'Too short',
      };
      const result = orderCancellationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject reason exceeding max length', () => {
      const invalidData = {
        reason: 'a'.repeat(501),
      };
      const result = orderCancellationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should use default value for requestRefund', () => {
      const validData = {
        reason: 'I changed my mind about the product',
      };
      const result = orderCancellationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requestRefund).toBe(true);
      }
    });
  });

  describe('orderReturnSchema', () => {
    it('should validate a valid return request', () => {
      const validData = {
        items: [
          { orderItemId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1, reason: 'Wrong size' },
        ],
        returnMethod: 'pickup',
      };
      const result = orderReturnSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const invalidData = {
        items: [],
        returnMethod: 'pickup',
      };
      const result = orderReturnSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid return method', () => {
      const invalidData = {
        items: [
          { orderItemId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1, reason: 'Wrong size' },
        ],
        returnMethod: 'invalid_method',
      };
      const result = orderReturnSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid order item ID', () => {
      const invalidData = {
        items: [
          { orderItemId: 'invalid', quantity: 1, reason: 'Wrong size' },
        ],
        returnMethod: 'pickup',
      };
      const result = orderReturnSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('cartItemSchema', () => {
    it('should validate a valid cart item', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      };
      const result = cartItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional variantId', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        variantId: '123e4567-e89b-12d3-a456-426614174001',
      };
      const result = cartItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-positive quantity', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0,
      };
      const result = cartItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('cartUpdateSchema', () => {
    it('should validate a valid cart update', () => {
      const validData = {
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
        ],
      };
      const result = cartUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty cart', () => {
      const invalidData = {
        items: [],
      };
      const result = cartUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('productReviewSchema', () => {
    it('should validate a valid product review', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        orderId: '123e4567-e89b-12d3-a456-426614174001',
        rating: 5,
        title: 'Great product!',
        content: 'This product exceeded my expectations. Highly recommended!',
        images: ['https://example.com/image1.jpg'],
      };
      const result = productReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating below minimum', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 0,
        content: 'This is a review',
      };
      const result = productReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating above maximum', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 6,
        content: 'This is a review',
      };
      const result = productReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short content', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        content: 'Short',
      };
      const result = productReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many images', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        content: 'This is a great product that I really enjoyed using.',
        images: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg',
        ],
      };
      const result = productReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URL', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        content: 'This is a great product that I really enjoyed using.',
        images: ['not-a-url'],
      };
      const result = productReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createOrderDtoSchema', () => {
    it('should validate a valid create order DTO', () => {
      const validData = {
        type: 'marketplace',
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174001', quantity: 2, unitPrice: 29.99 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
        },
        shippingMethod: 'standard',
        paymentMethod: 'card',
      };
      const result = createOrderDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid order type', () => {
      const invalidData = {
        type: 'invalid_type',
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174001', quantity: 2, unitPrice: 29.99 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
        },
        shippingMethod: 'standard',
        paymentMethod: 'card',
      };
      const result = createOrderDtoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateOrderDtoSchema', () => {
    it('should validate a valid update order DTO', () => {
      const validData = {
        status: 'processing',
        trackingNumber: '1Z999AA10123456784',
        trackingUrl: 'https://example.com/track/1Z999AA10123456784',
      };
      const result = updateOrderDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty update', () => {
      const validData = {};
      const result = updateOrderDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('orderSearchFiltersSchema', () => {
    it('should validate valid search filters', () => {
      const validData = {
        status: ['pending', 'confirmed'],
        type: ['marketplace'],
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 20,
      };
      const result = orderSearchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status in array', () => {
      const invalidData = {
        status: ['pending', 'invalid_status'],
      };
      const result = orderSearchFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('cancelOrderDtoSchema', () => {
    it('should validate a valid cancel order DTO', () => {
      const validData = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'I found a better price elsewhere',
        refundAmount: 29.99,
        notifyCustomer: true,
      };
      const result = cancelOrderDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short reason', () => {
      const invalidData = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Short',
      };
      const result = cancelOrderDtoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('refundOrderDtoSchema', () => {
    it('should validate a valid refund DTO', () => {
      const validData = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 29.99,
        reason: 'Item damaged during shipping',
        refundShipping: true,
        notifyCustomer: true,
      };
      const result = refundOrderDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 0,
        reason: 'Item damaged during shipping',
      };
      const result = refundOrderDtoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('addressSchema', () => {
    it('should validate a valid address', () => {
      const validData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };
      const result = addressSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('deliveryAddressSchema', () => {
    it('should validate a valid delivery address', () => {
      const validData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      };
      const result = deliveryAddressSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('orderItemSchema', () => {
    it('should validate a valid order item', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 29.99,
        totalPrice: 59.98,
      };
      const result = orderItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        productName: 'Test Product',
        quantity: -1,
        unitPrice: 29.99,
        totalPrice: 59.98,
      };
      const result = orderItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('orderPricingSchema', () => {
    it('should validate valid pricing', () => {
      const validData = {
        subtotal: 100,
        tax: 10,
        taxRate: 0.1,
        shippingCost: 5,
        discount: 5,
        total: 110,
      };
      const result = orderPricingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative subtotal', () => {
      const invalidData = {
        subtotal: -100,
        tax: 10,
        taxRate: 0.1,
        shippingCost: 5,
        discount: 5,
        total: 110,
      };
      const result = orderPricingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject tax rate above 1', () => {
      const invalidData = {
        subtotal: 100,
        tax: 10,
        taxRate: 1.5,
        shippingCost: 5,
        discount: 5,
        total: 110,
      };
      const result = orderPricingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});