import { describe, it, expect, beforeEach } from '@jest/globals';
import { FeeCalculatorService } from '../fee-calculator.service';

/**
 * Unit tests for fee calculator service
 * Requirements: TRN-001, TRN-002
 */
describe('FeeCalculatorService', () => {
  let service: FeeCalculatorService;

  beforeEach(() => {
    service = new FeeCalculatorService();
  });

  describe('calculateFees', () => {
    it('should calculate fees for a basic item', () => {
      const result = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
      });

      expect(result.subtotal).toBe(100);
      expect(result.platformFee).toBe(8); // 8%
      expect(result.paymentProcessingFee).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(result.subtotal);
    });

    it('should calculate fees with multiple quantities', () => {
      const result = service.calculateFees({
        itemPrice: 50,
        quantity: 2,
      });

      expect(result.subtotal).toBe(100);
      expect(result.platformFee).toBe(8);
    });

    it('should include shipping fee when provided', () => {
      const result = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
        shippingCost: 10,
      });

      expect(result.shippingFee).toBe(10);
      expect(result.total).toBeGreaterThan(108);
    });

    it('should calculate tax correctly', () => {
      const result = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
        taxRate: 0.1, // 10%
      });

      expect(result.tax).toBeGreaterThan(0);
    });

    it('should adjust payment processing fee for PayPal', () => {
      const cardResult = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
        paymentMethod: 'card',
      });

      const paypalResult = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
        paymentMethod: 'paypal',
      });

      expect(paypalResult.paymentProcessingFee).toBeGreaterThan(
        cardResult.paymentProcessingFee
      );
    });

    it('should not charge payment processing fee for wallet', () => {
      const result = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
        paymentMethod: 'wallet',
      });

      expect(result.paymentProcessingFee).toBe(0);
    });

    it('should include breakdown array', () => {
      const result = service.calculateFees({
        itemPrice: 100,
        quantity: 1,
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.length).toBeGreaterThan(0);
      expect(result.breakdown[0].label).toBe('Item Price');
    });
  });

  describe('calculateSellerEarnings', () => {
    it('should calculate seller earnings after fees', () => {
      const earnings = service.calculateSellerEarnings(100, 1);

      expect(earnings).toBeLessThan(100);
      expect(earnings).toBeGreaterThan(0);
    });

    it('should calculate earnings for multiple items', () => {
      const earnings = service.calculateSellerEarnings(50, 2);

      expect(earnings).toBeLessThan(100);
    });
  });

  describe('getFeeSummary', () => {
    it('should return fee summary', () => {
      const summary = service.getFeeSummary({
        itemPrice: 100,
        quantity: 1,
      });

      expect(summary.itemPrice).toBe(100);
      expect(summary.totalFees).toBeGreaterThan(0);
      expect(summary.total).toBeGreaterThan(100);
      expect(summary.feePercentage).toBeGreaterThan(0);
    });

    it('should calculate correct fee percentage', () => {
      const summary = service.getFeeSummary({
        itemPrice: 100,
        quantity: 1,
      });

      const expectedPercentage = (summary.totalFees / summary.itemPrice) * 100;
      expect(summary.feePercentage).toBeCloseTo(expectedPercentage, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle very small amounts', () => {
      const result = service.calculateFees({
        itemPrice: 0.99,
        quantity: 1,
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(result.subtotal);
    });

    it('should handle large amounts', () => {
      const result = service.calculateFees({
        itemPrice: 10000,
        quantity: 1,
      });

      expect(result.total).toBeGreaterThan(10000);
      expect(result.platformFee).toBe(800); // 8% of 10000
    });

    it('should round to 2 decimal places', () => {
      const result = service.calculateFees({
        itemPrice: 33.33,
        quantity: 3,
      });

      expect(result.total.toString().split('.')[1]?.length).toBeLessThanOrEqual(2);
    });
  });
});
