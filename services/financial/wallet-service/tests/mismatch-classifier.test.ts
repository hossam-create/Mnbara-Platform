// ============================================================
// PHASE 4.4.3 — MISMATCH CLASSIFICATION TESTS
// Validates classification logic and severity assignment
// ============================================================

import { ReconciliationItemStatus, MismatchClassification, MismatchSeverity } from '@prisma/client';
import { mismatchClassifier, calculateClassificationStats } from '../services/mismatch-classifier.service';
import { PaymentStatus } from '../interfaces/payment-gateway.interface';

describe('Mismatch Classifier - Phase 4.4.3', () => {
  
  describe('classify()', () => {
    it('should return null classification for MATCH status', () => {
      const result = mismatchClassifier.classify(
        ReconciliationItemStatus.MATCH,
        'succeeded',
        10000n,
        10000n,
        'pi_123',
        null
      );

      expect(result.classification).toBeNull();
      expect(result.severity).toBeNull();
    });

    it('should classify ERROR as GATEWAY_QUERY_FAILED with HIGH severity', () => {
      const result = mismatchClassifier.classify(
        ReconciliationItemStatus.ERROR,
        undefined,
        10000n,
        null,
        null,
        'Network timeout'
      );

      expect(result.classification).toBe(MismatchClassification.GATEWAY_QUERY_FAILED);
      expect(result.severity).toBe(MismatchSeverity.HIGH);
    });

    it('should classify MISSING with pending status as DELAYED_PAYMENT with LOW severity', () => {
      const result = mismatchClassifier.classify(
        ReconciliationItemStatus.MISSING,
        'pending',
        10000n,
        null,
        null,
        null
      );

      expect(result.classification).toBe(MismatchClassification.DELAYED_PAYMENT);
      expect(result.severity).toBe(MismatchSeverity.LOW);
    });

    it('should classify MISSING without gateway record as MISSING_PAYMENT with HIGH severity', () => {
      const result = mismatchClassifier.classify(
        ReconciliationItemStatus.MISSING,
        undefined,
        10000n,
        null,
        null,
        'No gateway payment record found'
      );

      expect(result.classification).toBe(MismatchClassification.MISSING_PAYMENT);
      expect(result.severity).toBe(MismatchSeverity.HIGH);
    });

    it('should classify OVERPAID as AMOUNT_MISMATCH with appropriate severity', () => {
      const result = mismatchClassifier.classify(
        ReconciliationItemStatus.OVERPAID,
        'succeeded',
        10000n,
        15000n, // 50% overpaid
        'pi_123',
        null
      );

      expect(result.classification).toBe(MismatchClassification.AMOUNT_MISMATCH);
      expect(result.severity).toBe(MismatchSeverity.HIGH); // >10% variance
    });

    it('should classify UNDERPAID as AMOUNT_MISMATCH with appropriate severity', () => {
      const result = mismatchClassifier.classify(
        ReconciliationItemStatus.UNDERPAID,
        'succeeded',
        10000n,
        9500n, // 5% underpaid
        'pi_123',
        null
      );

      expect(result.classification).toBe(MismatchClassification.AMOUNT_MISMATCH);
      expect(result.severity).toBe(MismatchSeverity.MEDIUM); // 1-10% variance
    });
  });

  describe('isDelayedPayment()', () => {
    it('should detect pending status', () => {
      expect(mismatchClassifier.isDelayedPayment('pending')).toBe(true);
      expect(mismatchClassifier.isDelayedPayment('PENDING')).toBe(true);
    });

    it('should detect processing status', () => {
      expect(mismatchClassifier.isDelayedPayment('processing')).toBe(true);
    });

    it('should detect requires_action status', () => {
      expect(mismatchClassifier.isDelayedPayment('requires_action')).toBe(true);
    });

    it('should not detect completed status as delayed', () => {
      expect(mismatchClassifier.isDelayedPayment('succeeded')).toBe(false);
      expect(mismatchClassifier.isDelayedPayment('completed')).toBe(false);
    });

    it('should handle undefined status', () => {
      expect(mismatchClassifier.isDelayedPayment(undefined)).toBe(false);
    });
  });

  describe('calculateAmountMismatchSeverity()', () => {
    it('should return LOW severity for <=1% variance', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        10000n,
        10050n // 0.5% variance
      );

      expect(severity).toBe(MismatchSeverity.LOW);
    });

    it('should return MEDIUM severity for 1-10% variance', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        10000n,
        10500n // 5% variance
      );

      expect(severity).toBe(MismatchSeverity.MEDIUM);
    });

    it('should return HIGH severity for >10% variance', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        10000n,
        12000n // 20% variance
      );

      expect(severity).toBe(MismatchSeverity.HIGH);
    });

    it('should handle underpaid scenarios', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        10000n,
        8000n // 20% underpaid
      );

      expect(severity).toBe(MismatchSeverity.HIGH);
    });

    it('should return HIGH severity when amounts are missing', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        10000n,
        null
      );

      expect(severity).toBe(MismatchSeverity.HIGH);
    });
  });

  describe('classifyOrphanGatewayPayment()', () => {
    it('should classify as GATEWAY_SUCCESS_ESCROW_MISSING with HIGH severity', () => {
      const result = mismatchClassifier.classifyOrphanGatewayPayment();

      expect(result.classification).toBe(MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING);
      expect(result.severity).toBe(MismatchSeverity.HIGH);
    });
  });

  describe('classifyDuplicatePayment()', () => {
    it('should classify as DUPLICATE_GATEWAY_PAYMENT with HIGH severity', () => {
      const result = mismatchClassifier.classifyDuplicatePayment();

      expect(result.classification).toBe(MismatchClassification.DUPLICATE_GATEWAY_PAYMENT);
      expect(result.severity).toBe(MismatchSeverity.HIGH);
    });
  });

  describe('getClassificationDescription()', () => {
    it('should return description for MISSING_PAYMENT', () => {
      const desc = mismatchClassifier.getClassificationDescription(
        MismatchClassification.MISSING_PAYMENT
      );

      expect(desc).toContain('Escrow record exists');
      expect(desc).toContain('no corresponding payment');
    });

    it('should return description for DELAYED_PAYMENT', () => {
      const desc = mismatchClassifier.getClassificationDescription(
        MismatchClassification.DELAYED_PAYMENT
      );

      expect(desc).toContain('pending');
      expect(desc).toContain('resolve automatically');
    });

    it('should return description for AMOUNT_MISMATCH', () => {
      const desc = mismatchClassifier.getClassificationDescription(
        MismatchClassification.AMOUNT_MISMATCH
      );

      expect(desc).toContain('amount');
      expect(desc).toContain('does not match');
    });

    it('should return description for DUPLICATE_GATEWAY_PAYMENT', () => {
      const desc = mismatchClassifier.getClassificationDescription(
        MismatchClassification.DUPLICATE_GATEWAY_PAYMENT
      );

      expect(desc).toContain('Multiple gateway payments');
      expect(desc).toContain('double-crediting');
    });

    it('should return description for GATEWAY_SUCCESS_ESCROW_MISSING', () => {
      const desc = mismatchClassifier.getClassificationDescription(
        MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING
      );

      expect(desc).toContain('successful payment');
      expect(desc).toContain('no escrow record');
    });

    it('should return description for GATEWAY_QUERY_FAILED', () => {
      const desc = mismatchClassifier.getClassificationDescription(
        MismatchClassification.GATEWAY_QUERY_FAILED
      );

      expect(desc).toContain('Unable to query');
      expect(desc).toContain('gateway API');
    });
  });

  describe('getRecommendedAction()', () => {
    it('should recommend urgent action for HIGH severity MISSING_PAYMENT', () => {
      const action = mismatchClassifier.getRecommendedAction(
        MismatchClassification.MISSING_PAYMENT,
        MismatchSeverity.HIGH
      );

      expect(action).toContain('URGENT');
      expect(action).toContain('Contact customer');
    });

    it('should recommend urgent action for HIGH severity DUPLICATE_GATEWAY_PAYMENT', () => {
      const action = mismatchClassifier.getRecommendedAction(
        MismatchClassification.DUPLICATE_GATEWAY_PAYMENT,
        MismatchSeverity.HIGH
      );

      expect(action).toContain('URGENT');
      expect(action).toContain('Freeze escrow');
    });

    it('should recommend review for MEDIUM severity AMOUNT_MISMATCH', () => {
      const action = mismatchClassifier.getRecommendedAction(
        MismatchClassification.AMOUNT_MISMATCH,
        MismatchSeverity.MEDIUM
      );

      expect(action).toContain('Review');
      expect(action).not.toContain('URGENT');
    });

    it('should recommend monitoring for LOW severity DELAYED_PAYMENT', () => {
      const action = mismatchClassifier.getRecommendedAction(
        MismatchClassification.DELAYED_PAYMENT,
        MismatchSeverity.LOW
      );

      expect(action).toContain('Monitor');
      expect(action).toContain('No immediate action');
    });
  });

  describe('requiresImmediateAttention()', () => {
    it('should return true for HIGH severity', () => {
      expect(mismatchClassifier.requiresImmediateAttention(MismatchSeverity.HIGH)).toBe(true);
    });

    it('should return false for MEDIUM severity', () => {
      expect(mismatchClassifier.requiresImmediateAttention(MismatchSeverity.MEDIUM)).toBe(false);
    });

    it('should return false for LOW severity', () => {
      expect(mismatchClassifier.requiresImmediateAttention(MismatchSeverity.LOW)).toBe(false);
    });
  });

  describe('getSeverityColor()', () => {
    it('should return green for LOW severity', () => {
      const color = mismatchClassifier.getSeverityColor(MismatchSeverity.LOW);
      expect(color).toBe('#10B981');
    });

    it('should return orange for MEDIUM severity', () => {
      const color = mismatchClassifier.getSeverityColor(MismatchSeverity.MEDIUM);
      expect(color).toBe('#F59E0B');
    });

    it('should return red for HIGH severity', () => {
      const color = mismatchClassifier.getSeverityColor(MismatchSeverity.HIGH);
      expect(color).toBe('#EF4444');
    });
  });

  describe('getSeverityPriority()', () => {
    it('should return highest priority for HIGH severity', () => {
      expect(mismatchClassifier.getSeverityPriority(MismatchSeverity.HIGH)).toBe(3);
    });

    it('should return medium priority for MEDIUM severity', () => {
      expect(mismatchClassifier.getSeverityPriority(MismatchSeverity.MEDIUM)).toBe(2);
    });

    it('should return lowest priority for LOW severity', () => {
      expect(mismatchClassifier.getSeverityPriority(MismatchSeverity.LOW)).toBe(1);
    });
  });

  describe('calculateClassificationStats()', () => {
    it('should calculate statistics correctly', () => {
      const items = [
        {
          classification: MismatchClassification.MISSING_PAYMENT,
          severity: MismatchSeverity.HIGH,
        },
        {
          classification: MismatchClassification.AMOUNT_MISMATCH,
          severity: MismatchSeverity.MEDIUM,
        },
        {
          classification: MismatchClassification.DELAYED_PAYMENT,
          severity: MismatchSeverity.LOW,
        },
        {
          classification: MismatchClassification.MISSING_PAYMENT,
          severity: MismatchSeverity.HIGH,
        },
      ];

      const stats = calculateClassificationStats(items);

      expect(stats.total).toBe(4);
      expect(stats.byClassification[MismatchClassification.MISSING_PAYMENT]).toBe(2);
      expect(stats.byClassification[MismatchClassification.AMOUNT_MISMATCH]).toBe(1);
      expect(stats.byClassification[MismatchClassification.DELAYED_PAYMENT]).toBe(1);
      expect(stats.bySeverity[MismatchSeverity.HIGH]).toBe(2);
      expect(stats.bySeverity[MismatchSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[MismatchSeverity.LOW]).toBe(1);
      expect(stats.highSeverityCount).toBe(2);
      expect(stats.requiresImmediateAttention).toBe(2);
    });

    it('should handle empty items array', () => {
      const stats = calculateClassificationStats([]);

      expect(stats.total).toBe(0);
      expect(stats.highSeverityCount).toBe(0);
      expect(stats.requiresImmediateAttention).toBe(0);
    });

    it('should handle items with null classification/severity', () => {
      const items = [
        { classification: null, severity: null },
        { classification: null, severity: null },
      ];

      const stats = calculateClassificationStats(items);

      expect(stats.total).toBe(2);
      expect(stats.highSeverityCount).toBe(0);
    });
  });

  describe('Severity Thresholds', () => {
    it('should classify 0.5% variance as LOW', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        100000n,
        100500n // 0.5%
      );
      expect(severity).toBe(MismatchSeverity.LOW);
    });

    it('should classify 1% variance as LOW (boundary)', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        100000n,
        101000n // 1%
      );
      expect(severity).toBe(MismatchSeverity.LOW);
    });

    it('should classify 5% variance as MEDIUM', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        100000n,
        105000n // 5%
      );
      expect(severity).toBe(MismatchSeverity.MEDIUM);
    });

    it('should classify 10% variance as MEDIUM (boundary)', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        100000n,
        110000n // 10%
      );
      expect(severity).toBe(MismatchSeverity.MEDIUM);
    });

    it('should classify 11% variance as HIGH', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        100000n,
        111000n // 11%
      );
      expect(severity).toBe(MismatchSeverity.HIGH);
    });

    it('should classify 50% variance as HIGH', () => {
      const severity = mismatchClassifier.calculateAmountMismatchSeverity(
        100000n,
        150000n // 50%
      );
      expect(severity).toBe(MismatchSeverity.HIGH);
    });
  });
});
