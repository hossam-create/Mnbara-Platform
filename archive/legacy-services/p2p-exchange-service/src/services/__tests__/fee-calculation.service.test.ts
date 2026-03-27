// ============================================================
// Fee Calculation Service Tests
// Comprehensive tests for Fee Calculation Logic
// ============================================================

import { Decimal } from 'decimal.js';
import { FeeCalculationService } from '../fee-calculation.service';
import { TransactionClass } from '../../types/enums';

describe('FeeCalculationService', () => {
  let service: FeeCalculationService;

  beforeEach(() => {
    service = new FeeCalculationService();
  });

  // ============================================================
  // 1. CALCULATE FEES TESTS
  // ============================================================

  describe('calculateFees', () => {
    it('should calculate fees for small transaction', async () => {
      const result = service.calculateFees({
        amount: new Decimal(200),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.transactionClass).toBe(TransactionClass.SMALL);
      expect(result.platformFee.toString()).toBe('3'); // 1.5% of 200
      expect(result.platformFeePercentage.toString()).toBe('0.015');
      expect(result.protectionFee.toString()).toBe('0');
      expect(result.urgentMatchingFee).toBeUndefined();
      expect(result.totalFees.toString()).toBe('3');
    });

    it('should calculate fees for medium transaction', async () => {
      const result = service.calculateFees({
        amount: new Decimal(500),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.transactionClass).toBe(TransactionClass.MEDIUM);
      expect(result.platformFee.toString()).toBe('5'); // 1.0% of 500
      expect(result.platformFeePercentage.toString()).toBe('0.01');
      expect(result.totalFees.toString()).toBe('5');
    });

    it('should calculate fees for large transaction', async () => {
      const result = service.calculateFees({
        amount: new Decimal(2000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.transactionClass).toBe(TransactionClass.LARGE);
      expect(result.platformFee.toString()).toBe('10'); // 0.5% of 2000
      expect(result.platformFeePercentage.toString()).toBe('0.005');
      expect(result.totalFees.toString()).toBe('10');
    });

    it('should add protection fee when using external escrow', async () => {
      const result = service.calculateFees({
        amount: new Decimal(200),
        useExternalEscrow: true,
        urgentMatching: false,
      });

      expect(result.protectionFee.toString()).toBe('2');
      expect(result.totalFees.toString()).toBe('5'); // 3 (platform) + 2 (protection)
    });

    it('should add urgent matching fee when requested', async () => {
      const result = service.calculateFees({
        amount: new Decimal(1000),
        useExternalEscrow: false,
        urgentMatching: true,
      });

      expect(result.urgentMatchingFee?.toString()).toBe('5'); // 0.5% of 1000
      expect(result.totalFees.toString()).toBe('15'); // 10 (platform) + 5 (urgent)
    });

    it('should calculate all fees combined', async () => {
      const result = service.calculateFees({
        amount: new Decimal(500),
        useExternalEscrow: true,
        urgentMatching: true,
      });

      expect(result.platformFee.toString()).toBe('5'); // 1.0% of 500
      expect(result.protectionFee.toString()).toBe('3'); // Medium amount
      expect(result.urgentMatchingFee?.toString()).toBe('2.5'); // 0.5% of 500
      expect(result.totalFees.toString()).toBe('10.5'); // 5 + 3 + 2.5
    });
  });

  // ============================================================
  // 2. GET PLATFORM FEE PERCENTAGE TESTS
  // ============================================================

  describe('getPlatformFeePercentage', () => {
    it('should return 1.5% for small transactions', () => {
      const result = service.getPlatformFeePercentage(TransactionClass.SMALL);
      expect(result.toString()).toBe('0.015');
    });

    it('should return 1.0% for medium transactions', () => {
      const result = service.getPlatformFeePercentage(TransactionClass.MEDIUM);
      expect(result.toString()).toBe('0.01');
    });

    it('should return 0.5% for large transactions', () => {
      const result = service.getPlatformFeePercentage(TransactionClass.LARGE);
      expect(result.toString()).toBe('0.005');
    });
  });

  // ============================================================
  // 3. GET PROTECTION FEE TESTS
  // ============================================================

  describe('getProtectionFee', () => {
    it('should return $2 for small amounts', () => {
      const result = service.getProtectionFee(new Decimal(200));
      expect(result.toString()).toBe('2');
    });

    it('should return $3 for medium amounts', () => {
      const result = service.getProtectionFee(new Decimal(500));
      expect(result.toString()).toBe('3');
    });

    it('should return $5 for large amounts', () => {
      const result = service.getProtectionFee(new Decimal(2000));
      expect(result.toString()).toBe('5');
    });

    it('should handle boundary at $300', () => {
      const resultBelow = service.getProtectionFee(new Decimal(299));
      const resultAt = service.getProtectionFee(new Decimal(300));

      expect(resultBelow.toString()).toBe('2');
      expect(resultAt.toString()).toBe('3');
    });

    it('should handle boundary at $1000', () => {
      const resultBelow = service.getProtectionFee(new Decimal(999));
      const resultAt = service.getProtectionFee(new Decimal(1000));

      expect(resultBelow.toString()).toBe('3');
      expect(resultAt.toString()).toBe('5');
    });
  });

  // ============================================================
  // 4. CALCULATE EXTERNAL ESCROW FEE TESTS
  // ============================================================

  describe('calculateExternalEscrowFee', () => {
    it('should calculate percentage-only fee', () => {
      const result = service.calculateExternalEscrowFee(
        new Decimal(1000),
        new Decimal(0.02) // 2%
      );

      expect(result.toString()).toBe('20');
    });

    it('should calculate percentage + fixed fee', () => {
      const result = service.calculateExternalEscrowFee(
        new Decimal(1000),
        new Decimal(0.02), // 2%
        new Decimal(5) // $5 fixed
      );

      expect(result.toString()).toBe('25'); // 20 + 5
    });

    it('should handle zero percentage fee', () => {
      const result = service.calculateExternalEscrowFee(
        new Decimal(1000),
        new Decimal(0),
        new Decimal(10)
      );

      expect(result.toString()).toBe('10');
    });

    it('should handle no fixed fee', () => {
      const result = service.calculateExternalEscrowFee(
        new Decimal(500),
        new Decimal(0.015)
      );

      expect(result.toString()).toBe('7.5');
    });
  });

  // ============================================================
  // 5. CLASSIFY TRANSACTION TESTS
  // ============================================================

  describe('classifyTransaction', () => {
    it('should classify amounts < $300 as SMALL', () => {
      expect(service.classifyTransaction(new Decimal(100))).toBe(
        TransactionClass.SMALL
      );
      expect(service.classifyTransaction(new Decimal(299))).toBe(
        TransactionClass.SMALL
      );
    });

    it('should classify amounts $300-$999 as MEDIUM', () => {
      expect(service.classifyTransaction(new Decimal(300))).toBe(
        TransactionClass.MEDIUM
      );
      expect(service.classifyTransaction(new Decimal(500))).toBe(
        TransactionClass.MEDIUM
      );
      expect(service.classifyTransaction(new Decimal(999))).toBe(
        TransactionClass.MEDIUM
      );
    });

    it('should classify amounts >= $1000 as LARGE', () => {
      expect(service.classifyTransaction(new Decimal(1000))).toBe(
        TransactionClass.LARGE
      );
      expect(service.classifyTransaction(new Decimal(5000))).toBe(
        TransactionClass.LARGE
      );
      expect(service.classifyTransaction(new Decimal(10000))).toBe(
        TransactionClass.LARGE
      );
    });

    it('should handle boundary values correctly', () => {
      expect(service.classifyTransaction(new Decimal(299.99))).toBe(
        TransactionClass.SMALL
      );
      expect(service.classifyTransaction(new Decimal(300))).toBe(
        TransactionClass.MEDIUM
      );
      expect(service.classifyTransaction(new Decimal(999.99))).toBe(
        TransactionClass.MEDIUM
      );
      expect(service.classifyTransaction(new Decimal(1000))).toBe(
        TransactionClass.LARGE
      );
    });
  });

  // ============================================================
  // 6. CALCULATE TOTAL COST TESTS
  // ============================================================

  describe('calculateTotalCost', () => {
    it('should calculate total cost including fees', () => {
      const fees = service.calculateFees({
        amount: new Decimal(1000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      const totalCost = service.calculateTotalCost(new Decimal(1000), fees);

      expect(totalCost.toString()).toBe('1010'); // 1000 + 10
    });

    it('should handle multiple fee types', () => {
      const fees = service.calculateFees({
        amount: new Decimal(500),
        useExternalEscrow: true,
        urgentMatching: true,
      });

      const totalCost = service.calculateTotalCost(new Decimal(500), fees);

      expect(totalCost.toString()).toBe('510.5'); // 500 + 10.5
    });
  });

  // ============================================================
  // 7. CALCULATE NET AMOUNT TESTS
  // ============================================================

  describe('calculateNetAmount', () => {
    it('should calculate net amount after fees', () => {
      const fees = service.calculateFees({
        amount: new Decimal(1000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      const netAmount = service.calculateNetAmount(new Decimal(1000), fees);

      expect(netAmount.toString()).toBe('990'); // 1000 - 10
    });

    it('should handle multiple fee types', () => {
      const fees = service.calculateFees({
        amount: new Decimal(500),
        useExternalEscrow: true,
        urgentMatching: true,
      });

      const netAmount = service.calculateNetAmount(new Decimal(500), fees);

      expect(netAmount.toString()).toBe('489.5'); // 500 - 10.5
    });
  });

  // ============================================================
  // 8. COMPARE WITH COMPETITORS TESTS
  // ============================================================

  describe('compareWithCompetitors', () => {
    it('should show savings compared to competitors', () => {
      const fees = service.calculateFees({
        amount: new Decimal(1000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      const comparison = service.compareWithCompetitors(new Decimal(1000), fees);

      expect(comparison.wise.toString()).toBe('20'); // 2% of 1000
      expect(comparison.westernUnion.toString()).toBe('30'); // 3% of 1000
      expect(comparison.ourFees.toString()).toBe('10'); // 1% of 1000
      expect(comparison.savings.toString()).toBe('10'); // 20 - 10
    });

    it('should calculate savings for small transactions', () => {
      const fees = service.calculateFees({
        amount: new Decimal(200),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      const comparison = service.compareWithCompetitors(new Decimal(200), fees);

      expect(comparison.wise.toString()).toBe('4'); // 2% of 200
      expect(comparison.westernUnion.toString()).toBe('6'); // 3% of 200
      expect(comparison.ourFees.toString()).toBe('3'); // 1.5% of 200
      expect(comparison.savings.toString()).toBe('1'); // 4 - 3
    });

    it('should calculate savings for large transactions', () => {
      const fees = service.calculateFees({
        amount: new Decimal(5000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      const comparison = service.compareWithCompetitors(new Decimal(5000), fees);

      expect(comparison.wise.toString()).toBe('100'); // 2% of 5000
      expect(comparison.westernUnion.toString()).toBe('150'); // 3% of 5000
      expect(comparison.ourFees.toString()).toBe('25'); // 0.5% of 5000
      expect(comparison.savings.toString()).toBe('75'); // 100 - 25
    });
  });

  // ============================================================
  // 9. EDGE CASES AND PRECISION TESTS
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const result = service.calculateFees({
        amount: new Decimal(1),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.platformFee.toString()).toBe('0.015'); // 1.5% of 1
      expect(result.transactionClass).toBe(TransactionClass.SMALL);
    });

    it('should handle very large amounts', () => {
      const result = service.calculateFees({
        amount: new Decimal(100000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.platformFee.toString()).toBe('500'); // 0.5% of 100000
      expect(result.transactionClass).toBe(TransactionClass.LARGE);
    });

    it('should maintain precision with decimal amounts', () => {
      const result = service.calculateFees({
        amount: new Decimal('123.45'),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.platformFee.toString()).toBe('1.85175'); // 1.5% of 123.45
    });

    it('should handle boundary at exactly $300', () => {
      const result = service.calculateFees({
        amount: new Decimal(300),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.transactionClass).toBe(TransactionClass.MEDIUM);
      expect(result.platformFee.toString()).toBe('3'); // 1.0% of 300
    });

    it('should handle boundary at exactly $1000', () => {
      const result = service.calculateFees({
        amount: new Decimal(1000),
        useExternalEscrow: false,
        urgentMatching: false,
      });

      expect(result.transactionClass).toBe(TransactionClass.LARGE);
      expect(result.platformFee.toString()).toBe('5'); // 0.5% of 1000
    });
  });

  // ============================================================
  // 10. INTEGRATION TESTS
  // ============================================================

  describe('Integration Tests', () => {
    it('should calculate complete fee breakdown for typical transaction', () => {
      const amount = new Decimal(750);
      const fees = service.calculateFees({
        amount,
        useExternalEscrow: true,
        urgentMatching: true,
      });

      // Verify all components
      expect(fees.transactionClass).toBe(TransactionClass.MEDIUM);
      expect(fees.platformFee.toString()).toBe('7.5'); // 1.0% of 750
      expect(fees.protectionFee.toString()).toBe('3'); // Medium amount
      expect(fees.urgentMatchingFee?.toString()).toBe('3.75'); // 0.5% of 750
      expect(fees.totalFees.toString()).toBe('14.25'); // 7.5 + 3 + 3.75

      // Verify cost calculations
      const totalCost = service.calculateTotalCost(amount, fees);
      const netAmount = service.calculateNetAmount(amount, fees);

      expect(totalCost.toString()).toBe('764.25');
      expect(netAmount.toString()).toBe('735.75');
    });

    it('should provide accurate competitor comparison', () => {
      const amount = new Decimal(1500);
      const fees = service.calculateFees({
        amount,
        useExternalEscrow: false,
        urgentMatching: false,
      });

      const comparison = service.compareWithCompetitors(amount, fees);

      // Our fee: 0.5% = $7.50
      // Wise: 2% = $30
      // Western Union: 3% = $45
      expect(comparison.ourFees.toString()).toBe('7.5');
      expect(comparison.wise.toString()).toBe('30');
      expect(comparison.westernUnion.toString()).toBe('45');
      expect(comparison.savings.toString()).toBe('22.5'); // 30 - 7.5
    });
  });
});
