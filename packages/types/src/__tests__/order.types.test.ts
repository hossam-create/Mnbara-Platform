import { describe, it, expect } from 'vitest';
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  FulfillmentStatus,
  DeliveryMethod,
  Currency,
  type Order,
  type OrderItem,
  type OrderPricing,
  type CreateOrderDto,
  type OrderSummary,
} from '../order.types';

describe('Order Types', () => {
  describe('OrderStatus Enum', () => {
    it('should have correct order statuses', () => {
      expect(OrderStatus.PENDING).toBe('pending');
      expect(OrderStatus.CONFIRMED).toBe('confirmed');
      expect(OrderStatus.PROCESSING).toBe('processing');
      expect(OrderStatus.IN_TRANSIT).toBe('in_transit');
      expect(OrderStatus.DELIVERED).toBe('delivered');
      expect(OrderStatus.COMPLETED).toBe('completed');
      expect(OrderStatus.CANCELLED).toBe('cancelled');
      expect(OrderStatus.REFUNDED).toBe('refunded');
    });

    it('should contain all expected statuses', () => {
      const statuses = Object.values(OrderStatus);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('delivered');
      expect(statuses.length).toBeGreaterThan(5);
    });
  });

  describe('OrderType Enum', () => {
    it('should have correct order types', () => {
      expect(OrderType.MARKETPLACE).toBe('marketplace');
      expect(OrderType.CROWDSHIPPING).toBe('crowdshipping');
      expect(OrderType.P2P_EXCHANGE).toBe('p2p_exchange');
      expect(OrderType.AUCTION).toBe('auction');
    });
  });

  describe('PaymentStatus Enum', () => {
    it('should have correct payment statuses', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.AUTHORIZED).toBe('authorized');
      expect(PaymentStatus.CAPTURED).toBe('captured');
      expect(PaymentStatus.PAID).toBe('paid');
      expect(PaymentStatus.FAILED).toBe('failed');
      expect(PaymentStatus.REFUNDED).toBe('refunded');
    });
  });

  describe('FulfillmentStatus Enum', () => {
    it('should have correct fulfillment statuses', () => {
      expect(FulfillmentStatus.UNFULFILLED).toBe('unfulfilled');
      expect(FulfillmentStatus.PARTIALLY_FULFILLED).toBe('partially_fulfilled');
      expect(FulfillmentStatus.FULFILLED).toBe('fulfilled');
      expect(FulfillmentStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('DeliveryMethod Enum', () => {
    it('should have correct delivery methods', () => {
      expect(DeliveryMethod.STANDARD).toBe('standard');
      expect(DeliveryMethod.EXPRESS).toBe('express');
      expect(DeliveryMethod.SAME_DAY).toBe('same_day');
      expect(DeliveryMethod.CROWDSHIPPING).toBe('crowdshipping');
      expect(DeliveryMethod.PICKUP).toBe('pickup');
    });
  });

  describe('Currency Enum', () => {
    it('should have correct currencies', () => {
      expect(Currency.USD).toBe('USD');
      expect(Currency.EUR).toBe('EUR');
      expect(Currency.GBP).toBe('GBP');
      expect(Currency.SAR).toBe('SAR');
      expect(Currency.AED).toBe('AED');
      expect(Currency.EGP).toBe('EGP');
    });
  });

  describe('OrderItem Interface', () => {
    it('should accept valid order item', () => {
      const item: OrderItem = {
        id: '1',
        productId: 'prod-123',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 50.00,
        totalPrice: 100.00,
        currency: Currency.USD,
      };

      expect(item.id).toBe('1');
      expect(item.productId).toBe('prod-123');
      expect(item.quantity).toBe(2);
      expect(item.totalPrice).toBe(100.00);
    });

    it('should accept order item with optional fields', () => {
      const item: OrderItem = {
        id: '1',
        productId: 'prod-123',
        productName: 'Test Product',
        productImage: 'https://example.com/image.jpg',
        sku: 'SKU-123',
        quantity: 2,
        unitPrice: 50.00,
        totalPrice: 100.00,
        currency: Currency.USD,
        weight: 1.5,
        dimensions: {
          length: 10,
          width: 5,
          height: 3,
          unit: 'cm',
        },
      };

      expect(item.sku).toBe('SKU-123');
      expect(item.weight).toBe(1.5);
      expect(item.dimensions?.length).toBe(10);
    });
  });

  describe('OrderPricing Interface', () => {
    it('should accept valid order pricing', () => {
      const pricing: OrderPricing = {
        subtotal: 100.00,
        tax: 10.00,
        taxRate: 0.10,
        shippingCost: 5.00,
        discount: 0,
        total: 115.00,
        currency: Currency.USD,
      };

      expect(pricing.subtotal).toBe(100.00);
      expect(pricing.tax).toBe(10.00);
      expect(pricing.total).toBe(115.00);
    });

    it('should accept pricing with discount', () => {
      const pricing: OrderPricing = {
        subtotal: 100.00,
        tax: 10.00,
        taxRate: 0.10,
        shippingCost: 5.00,
        discount: 15.00,
        discountCode: 'SAVE15',
        serviceFee: 2.00,
        total: 102.00,
        currency: Currency.USD,
      };

      expect(pricing.discount).toBe(15.00);
      expect(pricing.discountCode).toBe('SAVE15');
      expect(pricing.serviceFee).toBe(2.00);
    });
  });

  describe('CreateOrderDto Interface', () => {
    it('should accept valid create order DTO', () => {
      const dto: CreateOrderDto = {
        type: OrderType.MARKETPLACE,
        customerId: 'user-123',
        items: [
          {
            productId: 'prod-123',
            quantity: 2,
            unitPrice: 50.00,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        shippingMethod: DeliveryMethod.STANDARD,
        paymentMethod: 'card',
      };

      expect(dto.type).toBe(OrderType.MARKETPLACE);
      expect(dto.customerId).toBe('user-123');
      expect(dto.items).toHaveLength(1);
      expect(dto.shippingMethod).toBe(DeliveryMethod.STANDARD);
    });

    it('should accept create order DTO with optional fields', () => {
      const dto: CreateOrderDto = {
        type: OrderType.MARKETPLACE,
        customerId: 'user-123',
        sellerId: 'seller-456',
        items: [
          {
            productId: 'prod-123',
            quantity: 2,
            unitPrice: 50.00,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        billingAddress: {
          street: '456 Oak Ave',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'USA',
        },
        shippingMethod: DeliveryMethod.EXPRESS,
        paymentMethod: 'wallet',
        discountCode: 'SAVE10',
        notes: 'Please deliver before 5 PM',
      };

      expect(dto.sellerId).toBe('seller-456');
      expect(dto.discountCode).toBe('SAVE10');
      expect(dto.notes).toBe('Please deliver before 5 PM');
    });
  });

  describe('OrderSummary Interface', () => {
    it('should accept valid order summary', () => {
      const summary: OrderSummary = {
        id: 'order-123',
        orderNumber: 'ORD-2024-001',
        status: OrderStatus.CONFIRMED,
        type: OrderType.MARKETPLACE,
        total: 115.00,
        currency: Currency.USD,
        itemCount: 3,
        customerName: 'John Doe',
        createdAt: new Date(),
      };

      expect(summary.id).toBe('order-123');
      expect(summary.orderNumber).toBe('ORD-2024-001');
      expect(summary.status).toBe(OrderStatus.CONFIRMED);
      expect(summary.total).toBe(115.00);
      expect(summary.itemCount).toBe(3);
    });

    it('should accept order summary with estimated delivery', () => {
      const summary: OrderSummary = {
        id: 'order-123',
        orderNumber: 'ORD-2024-001',
        status: OrderStatus.IN_TRANSIT,
        type: OrderType.MARKETPLACE,
        total: 115.00,
        currency: Currency.USD,
        itemCount: 3,
        customerName: 'John Doe',
        createdAt: new Date(),
        estimatedDeliveryDate: new Date('2024-12-31'),
      };

      expect(summary.estimatedDeliveryDate).toBeInstanceOf(Date);
    });
  });

  describe('Order Interface', () => {
    it('should accept valid order object', () => {
      const order: Order = {
        id: 'order-123',
        orderNumber: 'ORD-2024-001',
        type: OrderType.MARKETPLACE,
        status: OrderStatus.CONFIRMED,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        customer: {
          userId: 'user-123',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        items: [
          {
            id: '1',
            productId: 'prod-123',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 50.00,
            totalPrice: 100.00,
            currency: Currency.USD,
          },
        ],
        pricing: {
          subtotal: 100.00,
          tax: 10.00,
          taxRate: 0.10,
          shippingCost: 5.00,
          discount: 0,
          total: 115.00,
          currency: Currency.USD,
        },
        shipping: {
          method: DeliveryMethod.STANDARD,
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
          shippingCost: 5.00,
        },
        payment: {
          paymentId: 'pay-123',
          method: 'card',
          status: PaymentStatus.PAID,
          amount: 115.00,
          currency: Currency.USD,
        },
        timeline: [
          {
            id: '1',
            type: 'created',
            status: OrderStatus.PENDING,
            message: 'Order created',
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(order.id).toBe('order-123');
      expect(order.orderNumber).toBe('ORD-2024-001');
      expect(order.status).toBe(OrderStatus.CONFIRMED);
      expect(order.items).toHaveLength(1);
      expect(order.pricing.total).toBe(115.00);
    });
  });
});
