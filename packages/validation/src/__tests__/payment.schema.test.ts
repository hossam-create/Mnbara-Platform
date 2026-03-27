import { describe, it, expect } from 'vitest';
import {
  paymentMethodSchema,
  creditCardSchema,
  paymentIntentSchema,
  refundSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  invoiceFilterSchema,
  payoutSchema,
  bankAccountSchema,
} from '../payment.schema';

describe('Payment Validation Schemas', () => {
  describe('paymentMethodSchema', () => {
    it('should validate a valid payment method', () => {
      const validData = {
        type: 'credit_card',
        cardLast4: '4242',
        cardBrand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      };
      const result = paymentMethodSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept payment method without optional fields', () => {
      const validData = {
        type: 'paypal',
      };
      const result = paymentMethodSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid card brand', () => {
      const invalidData = {
        type: 'credit_card',
        cardBrand: 'invalid_brand',
      };
      const result = paymentMethodSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid expiry month', () => {
      const invalidData = {
        type: 'credit_card',
        expiryMonth: 13,
      };
      const result = paymentMethodSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject expiry month of 0', () => {
      const invalidData = {
        type: 'credit_card',
        expiryMonth: 0,
      };
      const result = paymentMethodSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid card last4 length', () => {
      const invalidData = {
        type: 'credit_card',
        cardLast4: '42',
      };
      const result = paymentMethodSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('creditCardSchema', () => {
    it('should validate a valid credit card', () => {
      const validData = {
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
        cardholderName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = creditCardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid card number length', () => {
      const invalidData = {
        cardNumber: '41111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
        cardholderName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = creditCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric card number', () => {
      const invalidData = {
        cardNumber: '4111abcd111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
        cardholderName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = creditCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid CVV length', () => {
      const invalidData = {
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '12',
        cardholderName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = creditCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject expired card', () => {
      const invalidData = {
        cardNumber: '4111111111111111',
        expiryMonth: 1,
        expiryYear: 2020,
        cvv: '123',
        cardholderName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = creditCardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentIntentSchema', () => {
    it('should validate a valid payment intent', () => {
      const validData = {
        amount: 99.99,
        currency: 'USD',
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Payment for order #123',
      };
      const result = paymentIntentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        amount: 0,
        currency: 'USD',
      };
      const result = paymentIntentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        amount: -50,
        currency: 'USD',
      };
      const result = paymentIntentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency length', () => {
      const invalidData = {
        amount: 99.99,
        currency: 'US',
      };
      const result = paymentIntentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding max length', () => {
      const invalidData = {
        amount: 99.99,
        currency: 'USD',
        description: 'a'.repeat(501),
      };
      const result = paymentIntentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('refundSchema', () => {
    it('should validate a valid refund', () => {
      const validData = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50,
        reason: 'Customer requested refund due to product quality issues',
        refundMethod: 'original',
      };
      const result = refundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default refund method', () => {
      const validData = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50,
        reason: 'Customer requested refund due to product quality issues',
      };
      const result = refundSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refundMethod).toBe('original');
      }
    });

    it('should reject short reason', () => {
      const invalidData = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50,
        reason: 'Short',
      };
      const result = refundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid refund method', () => {
      const invalidData = {
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50,
        reason: 'Customer requested refund due to product quality issues',
        refundMethod: 'invalid',
      };
      const result = refundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid payment ID', () => {
      const invalidData = {
        paymentId: 'invalid-uuid',
        amount: 50,
        reason: 'Customer requested refund due to product quality issues',
      };
      const result = refundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('subscriptionCreateSchema', () => {
    it('should validate a valid subscription creation', () => {
      const validData = {
        priceId: 'price_123456',
        paymentMethodId: '123e4567-e89b-12d3-a456-426614174000',
        couponCode: 'SAVE20',
        trialDays: 14,
      };
      const result = subscriptionCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid payment method ID', () => {
      const invalidData = {
        priceId: 'price_123456',
        paymentMethodId: 'invalid',
      };
      const result = subscriptionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative trial days', () => {
      const invalidData = {
        priceId: 'price_123456',
        paymentMethodId: '123e4567-e89b-12d3-a456-426614174000',
        trialDays: -1,
      };
      const result = subscriptionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject trial days exceeding maximum', () => {
      const invalidData = {
        priceId: 'price_123456',
        paymentMethodId: '123e4567-e89b-12d3-a456-426614174000',
        trialDays: 400,
      };
      const result = subscriptionCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('subscriptionUpdateSchema', () => {
    it('should validate a valid subscription update', () => {
      const validData = {
        subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        newPriceId: 'price_789',
        prorationBehavior: 'always_invoice',
      };
      const result = subscriptionUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default proration behavior', () => {
      const validData = {
        subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        newPriceId: 'price_789',
      };
      const result = subscriptionUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prorationBehavior).toBe('create_prorations');
      }
    });

    it('should reject invalid proration behavior', () => {
      const invalidData = {
        subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
        newPriceId: 'price_789',
        prorationBehavior: 'invalid',
      };
      const result = subscriptionUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('invoiceFilterSchema', () => {
    it('should validate a valid invoice filter', () => {
      const validData = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'paid',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 20,
      };
      const result = invoiceFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      };
      const result = invoiceFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding maximum', () => {
      const invalidData = {
        limit: 200,
      };
      const result = invoiceFilterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('payoutSchema', () => {
    it('should validate a valid payout', () => {
      const validData = {
        amount: 1000,
        currency: 'USD',
        destinationId: 'acct_123456',
        description: 'Weekly payout',
      };
      const result = payoutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        amount: 0,
        currency: 'USD',
        destinationId: 'acct_123456',
      };
      const result = payoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        amount: -100,
        currency: 'USD',
        destinationId: 'acct_123456',
      };
      const result = payoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency length', () => {
      const invalidData = {
        amount: 1000,
        currency: 'DOLLARS',
        destinationId: 'acct_123456',
      };
      const result = payoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('bankAccountSchema', () => {
    it('should validate a valid bank account', () => {
      const validData = {
        accountHolderName: 'John Doe',
        routingNumber: '123456789',
        accountNumber: '123456789012',
        accountType: 'checking',
        country: 'US',
        currency: 'USD',
      };
      const result = bankAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid routing number length', () => {
      const invalidData = {
        accountHolderName: 'John Doe',
        routingNumber: '12345',
        accountNumber: '123456789012',
        accountType: 'checking',
        country: 'US',
      };
      const result = bankAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric routing number', () => {
      const invalidData = {
        accountHolderName: 'John Doe',
        routingNumber: '12345abcde',
        accountNumber: '123456789012',
        accountType: 'checking',
        country: 'US',
      };
      const result = bankAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid account number length', () => {
      const invalidData = {
        accountHolderName: 'John Doe',
        routingNumber: '123456789',
        accountNumber: '12',
        accountType: 'checking',
        country: 'US',
      };
      const result = bankAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid account type', () => {
      const invalidData = {
        accountHolderName: 'John Doe',
        routingNumber: '123456789',
        accountNumber: '123456789012',
        accountType: 'investment',
        country: 'US',
      };
      const result = bankAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should use default currency', () => {
      const validData = {
        accountHolderName: 'John Doe',
        routingNumber: '123456789',
        accountNumber: '123456789012',
        accountType: 'checking',
        country: 'US',
      };
      const result = bankAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('USD');
      }
    });
  });
});