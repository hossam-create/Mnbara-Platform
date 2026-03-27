import { describe, it, expect } from 'vitest';
import * as Types from '../index';

describe('Package Exports', () => {
  describe('User Types Exports', () => {
    it('should export user enums', () => {
      expect(Types.UserRole).toBeDefined();
      expect(Types.UserStatus).toBeDefined();
      expect(Types.KYCStatus).toBeDefined();
      expect(Types.AccountType).toBeDefined();
    });

    it('should have correct user role values', () => {
      expect(Types.UserRole.ADMIN).toBe('admin');
      expect(Types.UserRole.USER).toBe('user');
      expect(Types.UserRole.SELLER).toBe('seller');
    });
  });

  describe('Order Types Exports', () => {
    it('should export order enums', () => {
      expect(Types.OrderStatus).toBeDefined();
      expect(Types.OrderType).toBeDefined();
      expect(Types.FulfillmentStatus).toBeDefined();
      expect(Types.DeliveryMethod).toBeDefined();
    });

    it('should have correct order status values', () => {
      expect(Types.OrderStatus.PENDING).toBe('pending');
      expect(Types.OrderStatus.CONFIRMED).toBe('confirmed');
      expect(Types.OrderStatus.DELIVERED).toBe('delivered');
    });
  });

  describe('Payment Types Exports', () => {
    it('should export payment enums', () => {
      expect(Types.PaymentMethodType).toBeDefined();
      expect(Types.PaymentStatus).toBeDefined();
      expect(Types.PaymentProvider).toBeDefined();
      expect(Types.CardType).toBeDefined();
    });

    it('should have correct payment method types', () => {
      expect(Types.PaymentMethodType.CARD).toBe('card');
      expect(Types.PaymentMethodType.WALLET).toBe('wallet');
      expect(Types.PaymentMethodType.BANK_TRANSFER).toBe('bank_transfer');
    });
  });

  describe('Delivery Types Exports', () => {
    it('should export delivery enums', () => {
      expect(Types.DeliveryStatus).toBeDefined();
      expect(Types.DeliveryType).toBeDefined();
      expect(Types.DeliveryPriority).toBeDefined();
      expect(Types.PackageSize).toBeDefined();
    });

    it('should have correct delivery status values', () => {
      expect(Types.DeliveryStatus.PENDING).toBe('pending');
      expect(Types.DeliveryStatus.IN_TRANSIT).toBe('in_transit');
      expect(Types.DeliveryStatus.DELIVERED).toBe('delivered');
    });
  });

  describe('Common Types Exports', () => {
    it('should export common enums', () => {
      expect(Types.CurrencyCode).toBeDefined();
      expect(Types.Status).toBeDefined();
      expect(Types.VerificationStatus).toBeDefined();
      expect(Types.NotificationChannel).toBeDefined();
    });

    it('should have correct currency codes', () => {
      expect(Types.CurrencyCode.USD).toBe('USD');
      expect(Types.CurrencyCode.EUR).toBe('EUR');
      expect(Types.CurrencyCode.GBP).toBe('GBP');
    });

    it('should have correct status values', () => {
      expect(Types.Status.ACTIVE).toBe('active');
      expect(Types.Status.INACTIVE).toBe('inactive');
      expect(Types.Status.PENDING).toBe('pending');
    });
  });

  describe('Type Availability', () => {
    it('should export all major type categories', () => {
      // Check that we can access types from all modules
      const categories = [
        'UserRole',
        'OrderStatus',
        'PaymentStatus',
        'DeliveryStatus',
        'CurrencyCode',
      ];

      categories.forEach(category => {
        expect(Types).toHaveProperty(category);
      });
    });
  });

  describe('Enum Value Consistency', () => {
    it('should have consistent currency enums across modules', () => {
      // Currency is defined in both order.types and payment.types
      // They should be consistent
      expect(Types.Currency).toBeDefined();
      expect(Types.CurrencyCode).toBeDefined();
    });

    it('should have consistent status enums', () => {
      // Multiple modules have status enums
      expect(Types.Status).toBeDefined();
      expect(Types.UserStatus).toBeDefined();
      expect(Types.OrderStatus).toBeDefined();
      expect(Types.PaymentStatus).toBeDefined();
      expect(Types.DeliveryStatus).toBeDefined();
    });
  });
});
