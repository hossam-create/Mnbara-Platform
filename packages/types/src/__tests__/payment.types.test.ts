import { describe, it, expect } from 'vitest';
import {
  PaymentMethodType,
  PaymentStatus,
  PaymentProvider,
  CardType,
  Currency,
  TransactionType,
  RefundStatus,
  PayoutStatus,
  type PaymentMethod,
  type PaymentTransaction,
  type CreatePaymentDto,
  type PaymentBalance,
} from '../payment.types';

describe('Payment Types', () => {
  describe('PaymentMethodType Enum', () => {
    it('should have correct payment method types', () => {
      expect(PaymentMethodType.CARD).toBe('card');
      expect(PaymentMethodType.WALLET).toBe('wallet');
      expect(PaymentMethodType.BANK_TRANSFER).toBe('bank_transfer');
      expect(PaymentMethodType.CASH_ON_DELIVERY).toBe('cash_on_delivery');
      expect(PaymentMethodType.ESCROW).toBe('escrow');
      expect(PaymentMethodType.MOBILE_MONEY).toBe('mobile_money');
      expect(PaymentMethodType.CRYPTO).toBe('crypto');
    });
  });

  describe('PaymentStatus Enum', () => {
    it('should have correct payment statuses', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.AUTHORIZED).toBe('authorized');
      expect(PaymentStatus.CAPTURED).toBe('captured');
      expect(PaymentStatus.PAID).toBe('paid');
      expect(PaymentStatus.PROCESSING).toBe('processing');
      expect(PaymentStatus.FAILED).toBe('failed');
      expect(PaymentStatus.REFUNDED).toBe('refunded');
      expect(PaymentStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('PaymentProvider Enum', () => {
    it('should have correct payment providers', () => {
      expect(PaymentProvider.STRIPE).toBe('stripe');
      expect(PaymentProvider.PAYPAL).toBe('paypal');
      expect(PaymentProvider.SQUARE).toBe('square');
      expect(PaymentProvider.INTERNAL_WALLET).toBe('internal_wallet');
      expect(PaymentProvider.BANK_TRANSFER).toBe('bank_transfer');
      expect(PaymentProvider.CASH).toBe('cash');
      expect(PaymentProvider.ESCROW).toBe('escrow');
    });
  });

  describe('CardType Enum', () => {
    it('should have correct card types', () => {
      expect(CardType.VISA).toBe('visa');
      expect(CardType.MASTERCARD).toBe('mastercard');
      expect(CardType.AMEX).toBe('amex');
      expect(CardType.DISCOVER).toBe('discover');
      expect(CardType.DINERS).toBe('diners');
      expect(CardType.JCB).toBe('jcb');
      expect(CardType.UNIONPAY).toBe('unionpay');
      expect(CardType.UNKNOWN).toBe('unknown');
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
      expect(Currency.JPY).toBe('JPY');
      expect(Currency.CNY).toBe('CNY');
    });
  });

  describe('TransactionType Enum', () => {
    it('should have correct transaction types', () => {
      expect(TransactionType.PAYMENT).toBe('payment');
      expect(TransactionType.REFUND).toBe('refund');
      expect(TransactionType.PAYOUT).toBe('payout');
      expect(TransactionType.TRANSFER).toBe('transfer');
      expect(TransactionType.DEPOSIT).toBe('deposit');
      expect(TransactionType.WITHDRAWAL).toBe('withdrawal');
      expect(TransactionType.FEE).toBe('fee');
      expect(TransactionType.ADJUSTMENT).toBe('adjustment');
      expect(TransactionType.CHARGEBACK).toBe('chargeback');
    });
  });

  describe('RefundStatus Enum', () => {
    it('should have correct refund statuses', () => {
      expect(RefundStatus.PENDING).toBe('pending');
      expect(RefundStatus.PROCESSING).toBe('processing');
      expect(RefundStatus.SUCCEEDED).toBe('succeeded');
      expect(RefundStatus.FAILED).toBe('failed');
      expect(RefundStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('PayoutStatus Enum', () => {
    it('should have correct payout statuses', () => {
      expect(PayoutStatus.PENDING).toBe('pending');
      expect(PayoutStatus.IN_TRANSIT).toBe('in_transit');
      expect(PayoutStatus.PAID).toBe('paid');
      expect(PayoutStatus.FAILED).toBe('failed');
      expect(PayoutStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('PaymentMethod Interface', () => {
    it('should accept valid payment method', () => {
      const method: PaymentMethod = {
        id: 'pm-123',
        userId: 'user-123',
        type: PaymentMethodType.CARD,
        provider: PaymentProvider.STRIPE,
        isDefault: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(method.id).toBe('pm-123');
      expect(method.type).toBe(PaymentMethodType.CARD);
      expect(method.isDefault).toBe(true);
    });

    it('should accept payment method with card info', () => {
      const method: PaymentMethod = {
        id: 'pm-123',
        userId: 'user-123',
        type: PaymentMethodType.CARD,
        provider: PaymentProvider.STRIPE,
        isDefault: true,
        isVerified: true,
        card: {
          brand: CardType.VISA,
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          holderName: 'John Doe',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(method.card?.brand).toBe(CardType.VISA);
      expect(method.card?.last4).toBe('4242');
      expect(method.card?.expiryMonth).toBe(12);
    });
  });

  describe('PaymentTransaction Interface', () => {
    it('should accept valid payment transaction', () => {
      const transaction: PaymentTransaction = {
        id: 'txn-123',
        transactionId: 'TXN-2024-001',
        type: TransactionType.PAYMENT,
        status: PaymentStatus.PAID,
        amount: 100.00,
        currency: Currency.USD,
        netAmount: 97.00,
        userId: 'user-123',
        provider: PaymentProvider.STRIPE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(transaction.transactionId).toBe('TXN-2024-001');
      expect(transaction.type).toBe(TransactionType.PAYMENT);
      expect(transaction.amount).toBe(100.00);
      expect(transaction.netAmount).toBe(97.00);
    });

    it('should accept transaction with optional fields', () => {
      const transaction: PaymentTransaction = {
        id: 'txn-123',
        transactionId: 'TXN-2024-001',
        type: TransactionType.PAYMENT,
        status: PaymentStatus.PAID,
        amount: 100.00,
        currency: Currency.USD,
        fee: 3.00,
        netAmount: 97.00,
        userId: 'user-123',
        orderId: 'order-123',
        paymentMethodId: 'pm-123',
        provider: PaymentProvider.STRIPE,
        providerTransactionId: 'ch_123456',
        description: 'Payment for order #123',
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(transaction.fee).toBe(3.00);
      expect(transaction.orderId).toBe('order-123');
      expect(transaction.description).toBe('Payment for order #123');
    });
  });

  describe('CreatePaymentDto Interface', () => {
    it('should accept valid create payment DTO', () => {
      const dto: CreatePaymentDto = {
        amount: 100.00,
        currency: Currency.USD,
        paymentMethodId: 'pm-123',
        customerId: 'user-123',
      };

      expect(dto.amount).toBe(100.00);
      expect(dto.currency).toBe(Currency.USD);
      expect(dto.paymentMethodId).toBe('pm-123');
    });

    it('should accept create payment DTO with optional fields', () => {
      const dto: CreatePaymentDto = {
        amount: 100.00,
        currency: Currency.USD,
        paymentMethodId: 'pm-123',
        orderId: 'order-123',
        customerId: 'user-123',
        description: 'Payment for order #123',
        metadata: {
          orderNumber: 'ORD-2024-001',
          customField: 'value',
        },
      };

      expect(dto.orderId).toBe('order-123');
      expect(dto.description).toBe('Payment for order #123');
      expect(dto.metadata?.orderNumber).toBe('ORD-2024-001');
    });
  });

  describe('PaymentBalance Interface', () => {
    it('should accept valid payment balance', () => {
      const balance: PaymentBalance = {
        userId: 'user-123',
        available: 500.00,
        pending: 100.00,
        reserved: 50.00,
        total: 650.00,
        currency: Currency.USD,
        lastUpdated: new Date(),
      };

      expect(balance.userId).toBe('user-123');
      expect(balance.available).toBe(500.00);
      expect(balance.pending).toBe(100.00);
      expect(balance.reserved).toBe(50.00);
      expect(balance.total).toBe(650.00);
    });

    it('should calculate total correctly', () => {
      const balance: PaymentBalance = {
        userId: 'user-123',
        available: 500.00,
        pending: 100.00,
        reserved: 50.00,
        total: 650.00,
        currency: Currency.USD,
        lastUpdated: new Date(),
      };

      const calculatedTotal = balance.available + balance.pending + balance.reserved;
      expect(calculatedTotal).toBe(balance.total);
    });
  });
});
