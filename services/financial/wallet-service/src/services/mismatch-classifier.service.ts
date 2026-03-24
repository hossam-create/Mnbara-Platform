// ============================================================
// PHASE 4.4.3 — MISMATCH CLASSIFICATION SERVICE
// Categorizes reconciliation discrepancies by type and severity
// ============================================================

import { 
  ReconciliationItemStatus, 
  MismatchClassification, 
  MismatchSeverity 
} from '@prisma/client';
import { PaymentStatus } from '../interfaces/payment-gateway.interface';

// ============================================================
// CLASSIFICATION LOGIC
// ============================================================

export const mismatchClassifier = {
  /**
   * Classify a reconciliation mismatch based on status and context.
   * 
   * @param status - Reconciliation item status
   * @param gatewayStatus - Raw gateway payment status
   * @param expectedAmount - Amount in escrow
   * @param gatewayAmount - Amount reported by gateway
   * @param gatewayPaymentId - Gateway payment ID (if exists)
   * @param errorMessage - Error message (if query failed)
   * @returns Classification and severity
   */
  classify(
    status: ReconciliationItemStatus,
    gatewayStatus?: string,
    expectedAmount?: bigint,
    gatewayAmount?: bigint | null,
    gatewayPaymentId?: string | null,
    errorMessage?: string | null
  ): { classification: MismatchClassification | null; severity: MismatchSeverity | null } {
    
    // MATCH case - no classification needed
    if (status === ReconciliationItemStatus.MATCH) {
      return { classification: null, severity: null };
    }

    // ERROR case - Gateway query failed
    if (status === ReconciliationItemStatus.ERROR) {
      return {
        classification: MismatchClassification.GATEWAY_QUERY_FAILED,
        severity: MismatchSeverity.HIGH,
      };
    }

    // MISSING case - No gateway payment found
    if (status === ReconciliationItemStatus.MISSING) {
      // Check if gateway status indicates pending
      if (this.isDelayedPayment(gatewayStatus)) {
        return {
          classification: MismatchClassification.DELAYED_PAYMENT,
          severity: MismatchSeverity.LOW,
        };
      }

      // No gateway record at all
      return {
        classification: MismatchClassification.MISSING_PAYMENT,
        severity: MismatchSeverity.HIGH,
      };
    }

    // OVERPAID or UNDERPAID - Amount mismatch
    if (
      status === ReconciliationItemStatus.OVERPAID ||
      status === ReconciliationItemStatus.UNDERPAID
    ) {
      // Check if it's a significant mismatch or minor variance
      const severity = this.calculateAmountMismatchSeverity(
        expectedAmount,
        gatewayAmount
      );

      return {
        classification: MismatchClassification.AMOUNT_MISMATCH,
        severity,
      };
    }

    // Default fallback
    return { classification: null, severity: null };
  },

  /**
   * Classify a reverse scenario: Gateway payment exists but no escrow.
   * This is detected when scanning gateway payments.
   * 
   * @returns Classification and severity
   */
  classifyOrphanGatewayPayment(): { 
    classification: MismatchClassification; 
    severity: MismatchSeverity 
  } {
    return {
      classification: MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING,
      severity: MismatchSeverity.HIGH,
    };
  },

  /**
   * Classify duplicate gateway payments for same escrow.
   * 
   * @returns Classification and severity
   */
  classifyDuplicatePayment(): { 
    classification: MismatchClassification; 
    severity: MismatchSeverity 
  } {
    return {
      classification: MismatchClassification.DUPLICATE_GATEWAY_PAYMENT,
      severity: MismatchSeverity.HIGH,
    };
  },

  /**
   * Determine if a payment is delayed (pending) vs truly missing.
   * 
   * @param gatewayStatus - Raw gateway status string
   * @returns True if payment is pending/processing
   */
  isDelayedPayment(gatewayStatus?: string): boolean {
    if (!gatewayStatus) return false;

    const delayedStatuses = [
      'pending',
      'processing',
      'requires_action',
      'requires_payment_method',
      'requires_confirmation',
      'requires_capture',
    ];

    return delayedStatuses.includes(gatewayStatus.toLowerCase());
  },

  /**
   * Calculate severity of amount mismatch based on variance.
   * 
   * @param expectedAmount - Expected amount (escrow)
   * @param gatewayAmount - Gateway reported amount
   * @returns Severity level
   */
  calculateAmountMismatchSeverity(
    expectedAmount?: bigint,
    gatewayAmount?: bigint | null
  ): MismatchSeverity {
    if (!expectedAmount || !gatewayAmount) {
      return MismatchSeverity.HIGH;
    }

    // Calculate variance percentage
    const difference = expectedAmount > gatewayAmount 
      ? expectedAmount - gatewayAmount 
      : gatewayAmount - expectedAmount;

    const variancePercent = Number((difference * 100n) / expectedAmount);

    // Severity thresholds
    if (variancePercent <= 1) {
      // <= 1% variance - likely rounding or currency conversion
      return MismatchSeverity.LOW;
    } else if (variancePercent <= 10) {
      // 1-10% variance - needs review
      return MismatchSeverity.MEDIUM;
    } else {
      // > 10% variance - critical
      return MismatchSeverity.HIGH;
    }
  },

  /**
   * Get human-readable description of classification.
   * 
   * @param classification - Mismatch classification
   * @returns Description string
   */
  getClassificationDescription(classification: MismatchClassification): string {
    const descriptions: Record<MismatchClassification, string> = {
      [MismatchClassification.MISSING_PAYMENT]: 
        'Escrow record exists but no corresponding payment found at gateway. Possible webhook failure or payment never initiated.',
      
      [MismatchClassification.DELAYED_PAYMENT]: 
        'Payment is still pending at gateway. May resolve automatically once payment completes.',
      
      [MismatchClassification.AMOUNT_MISMATCH]: 
        'Payment amount at gateway does not match escrow amount. Possible currency conversion issue or incorrect payment amount.',
      
      [MismatchClassification.DUPLICATE_GATEWAY_PAYMENT]: 
        'Multiple gateway payments detected for single escrow. Risk of double-crediting.',
      
      [MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING]: 
        'Gateway shows successful payment but no escrow record exists. Possible data loss or webhook processing before escrow creation.',
      
      [MismatchClassification.GATEWAY_QUERY_FAILED]: 
        'Unable to query gateway API. Network error, invalid credentials, or gateway downtime.',
    };

    return descriptions[classification];
  },

  /**
   * Get recommended action based on classification and severity.
   * 
   * @param classification - Mismatch classification
   * @param severity - Mismatch severity
   * @returns Recommended action
   */
  getRecommendedAction(
    classification: MismatchClassification,
    severity: MismatchSeverity
  ): string {
    // High severity actions
    if (severity === MismatchSeverity.HIGH) {
      switch (classification) {
        case MismatchClassification.MISSING_PAYMENT:
          return 'URGENT: Contact customer to verify payment. Check gateway dashboard manually. May need to refund escrow if payment truly missing.';
        
        case MismatchClassification.DUPLICATE_GATEWAY_PAYMENT:
          return 'URGENT: Freeze escrow. Verify which payment is legitimate. Refund duplicate payment at gateway.';
        
        case MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING:
          return 'URGENT: Investigate data integrity. Check if escrow was deleted or never created. May need to create escrow retroactively.';
        
        case MismatchClassification.GATEWAY_QUERY_FAILED:
          return 'URGENT: Check gateway API status. Verify credentials. Retry reconciliation once gateway is accessible.';
        
        default:
          return 'URGENT: Manual investigation required.';
      }
    }

    // Medium severity actions
    if (severity === MismatchSeverity.MEDIUM) {
      switch (classification) {
        case MismatchClassification.AMOUNT_MISMATCH:
          return 'Review amount discrepancy. Check for currency conversion issues. Contact customer if variance is significant.';
        
        default:
          return 'Review and investigate. May require manual correction.';
      }
    }

    // Low severity actions
    if (severity === MismatchSeverity.LOW) {
      switch (classification) {
        case MismatchClassification.DELAYED_PAYMENT:
          return 'Monitor payment status. Re-reconcile in 24 hours. No immediate action required.';
        
        case MismatchClassification.AMOUNT_MISMATCH:
          return 'Minor variance detected. Likely rounding or currency conversion. Can be ignored if within acceptable threshold.';
        
        default:
          return 'Monitor. No immediate action required.';
      }
    }

    return 'Review as needed.';
  },

  /**
   * Determine if a mismatch requires immediate attention.
   * 
   * @param severity - Mismatch severity
   * @returns True if requires immediate action
   */
  requiresImmediateAttention(severity: MismatchSeverity): boolean {
    return severity === MismatchSeverity.HIGH;
  },

  /**
   * Get severity color for UI display.
   * 
   * @param severity - Mismatch severity
   * @returns Color code
   */
  getSeverityColor(severity: MismatchSeverity): string {
    const colors: Record<MismatchSeverity, string> = {
      [MismatchSeverity.LOW]: '#10B981',    // Green
      [MismatchSeverity.MEDIUM]: '#F59E0B', // Orange
      [MismatchSeverity.HIGH]: '#EF4444',   // Red
    };

    return colors[severity];
  },

  /**
   * Get severity priority for sorting (higher = more urgent).
   * 
   * @param severity - Mismatch severity
   * @returns Priority number
   */
  getSeverityPriority(severity: MismatchSeverity): number {
    const priorities: Record<MismatchSeverity, number> = {
      [MismatchSeverity.HIGH]: 3,
      [MismatchSeverity.MEDIUM]: 2,
      [MismatchSeverity.LOW]: 1,
    };

    return priorities[severity];
  },
};

// ============================================================
// CLASSIFICATION STATISTICS
// ============================================================

export interface ClassificationStats {
  total: number;
  byClassification: Record<MismatchClassification, number>;
  bySeverity: Record<MismatchSeverity, number>;
  highSeverityCount: number;
  requiresImmediateAttention: number;
}

/**
 * Calculate statistics from classification results.
 * 
 * @param items - Array of reconciliation items with classifications
 * @returns Classification statistics
 */
export function calculateClassificationStats(
  items: Array<{
    classification: MismatchClassification | null;
    severity: MismatchSeverity | null;
  }>
): ClassificationStats {
  const stats: ClassificationStats = {
    total: items.length,
    byClassification: {
      [MismatchClassification.MISSING_PAYMENT]: 0,
      [MismatchClassification.DELAYED_PAYMENT]: 0,
      [MismatchClassification.AMOUNT_MISMATCH]: 0,
      [MismatchClassification.DUPLICATE_GATEWAY_PAYMENT]: 0,
      [MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING]: 0,
      [MismatchClassification.GATEWAY_QUERY_FAILED]: 0,
    },
    bySeverity: {
      [MismatchSeverity.LOW]: 0,
      [MismatchSeverity.MEDIUM]: 0,
      [MismatchSeverity.HIGH]: 0,
    },
    highSeverityCount: 0,
    requiresImmediateAttention: 0,
  };

  for (const item of items) {
    if (item.classification) {
      stats.byClassification[item.classification]++;
    }

    if (item.severity) {
      stats.bySeverity[item.severity]++;
      
      if (item.severity === MismatchSeverity.HIGH) {
        stats.highSeverityCount++;
        stats.requiresImmediateAttention++;
      }
    }
  }

  return stats;
}
