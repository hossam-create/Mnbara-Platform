// ============================================================
// PHASE 4.4 — ESCROW ↔ GATEWAY RECONCILIATION SERVICE
// Detects mismatches between internal Escrow state and Gateway reality
// ABSOLUTE RULES:
// - NEVER modifies wallet ledger (immutable)
// - NEVER auto-releases escrow
// - ONLY detects and logs discrepancies
// - Backend-only, no UI triggers
// ============================================================

import { PrismaClient, EscrowStatus, ReconciliationRunStatus, ReconciliationItemStatus, ReconciliationResolution, ReconciliationGateway, MismatchClassification, MismatchSeverity } from '@prisma/client';
import { getPaymentGateway } from '../adapters/payment-gateway.registry';
import { PaymentStatus } from '../interfaces/payment-gateway.interface';
import { mismatchClassifier } from './mismatch-classifier.service';


const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

interface ReconciliationRunRequest {
  gateway: 'STRIPE' | 'PAYMOB';
  triggeredBy: string; // User ID or 'system'
  notes?: string;
  escrowIds?: string[]; // Optional: reconcile specific escrows only
}

interface ReconciliationResult {
  runId: string;
  status: ReconciliationRunStatus;
  totalChecked: number;
  matchCount: number;
  mismatchCount: number;
  errorCount: number;
  items: ReconciliationItemResult[];
}

interface ReconciliationItemResult {
  itemId: string;
  escrowId: string;
  status: ReconciliationItemStatus;
  resolution: ReconciliationResolution;
  gatewayStatus?: string;
  errorMessage?: string;
}

interface EscrowGatewayComparison {
  escrowId: string;
  walletId: string;
  gatewayPaymentId: string | null;
  expectedAmount: bigint;
  gatewayAmount: bigint | null;
  status: ReconciliationItemStatus;
  gatewayStatus?: string;
  errorMessage?: string;
}

// ============================================================
// RECONCILIATION SERVICE
// ============================================================

export const reconciliationService = {
  /**
   * Execute a full reconciliation run for a specific gateway.
   * Scans all FUNDED escrows and compares with gateway state.
   * 
   * @param request - Reconciliation run configuration
   * @returns Reconciliation run results with all detected mismatches
   */
  async executeReconciliationRun(request: ReconciliationRunRequest): Promise<ReconciliationResult> {
    console.log(`[Reconciliation] Starting run for gateway: ${request.gateway}`);
    
    // 1. Create Reconciliation Run record
    const run = await prisma.reconciliationRun.create({
      data: {
        gateway: request.gateway as ReconciliationGateway,
        triggeredBy: request.triggeredBy,
        notes: request.notes,
        status: ReconciliationRunStatus.RUNNING,
      },
    });

    try {
      // 2. Fetch Escrows to reconcile
      const escrows = await this.fetchEscrowsForReconciliation(request.escrowIds);
      
      console.log(`[Reconciliation] Found ${escrows.length} escrows to check`);

      // 3. Process each escrow
      const items: ReconciliationItemResult[] = [];
      let matchCount = 0;
      let mismatchCount = 0;
      let errorCount = 0;

      for (const escrow of escrows) {
        try {
          // Compare escrow with gateway
          const comparison = await this.compareEscrowWithGateway(
            escrow.id,
            escrow.buyerWalletId,
            escrow.amount,
            escrow.currency,
            request.gateway.toLowerCase()
          );

          // PHASE 4.4.3 — Classify mismatch
          const { classification, severity } = mismatchClassifier.classify(
            comparison.status,
            comparison.gatewayStatus,
            comparison.expectedAmount,
            comparison.gatewayAmount,
            comparison.gatewayPaymentId,
            comparison.errorMessage
          );

          // Record reconciliation item
          const item = await prisma.reconciliationItem.create({
            data: {
              runId: run.id,
              escrowId: comparison.escrowId,
              walletId: comparison.walletId,
              gatewayPaymentId: comparison.gatewayPaymentId,
              expectedAmount: comparison.expectedAmount,
              gatewayAmount: comparison.gatewayAmount,
              status: comparison.status,
              gatewayStatus: comparison.gatewayStatus,
              errorMessage: comparison.errorMessage,
              resolution: this.determineResolution(comparison.status),
              classification,
              severity,
            },
          });

          items.push({
            itemId: item.id,
            escrowId: item.escrowId,
            status: item.status,
            resolution: item.resolution,
            gatewayStatus: item.gatewayStatus || undefined,
            errorMessage: item.errorMessage || undefined,
          });

          // Update counters
          if (comparison.status === ReconciliationItemStatus.MATCH) {
            matchCount++;
          } else if (comparison.status === ReconciliationItemStatus.ERROR) {
            errorCount++;
          } else {
            mismatchCount++;
          }

        } catch (error: any) {
          console.error(`[Reconciliation] Error processing escrow ${escrow.id}:`, error.message);
          
          // Record error item
          const errorItem = await prisma.reconciliationItem.create({
            data: {
              runId: run.id,
              escrowId: escrow.id,
              walletId: escrow.buyerWalletId,
              gatewayPaymentId: null,
              expectedAmount: escrow.amount,
              gatewayAmount: null,
              status: ReconciliationItemStatus.ERROR,
              errorMessage: error.message,
              resolution: ReconciliationResolution.FLAGGED,
            },
          });

          items.push({
            itemId: errorItem.id,
            escrowId: errorItem.escrowId,
            status: errorItem.status,
            resolution: errorItem.resolution,
            errorMessage: error.message,
          });

          errorCount++;
        }
      }

      // 4. Finalize run
      const finalStatus = this.determineRunStatus(errorCount, escrows.length);
      
      const completedRun = await prisma.reconciliationRun.update({
        where: { id: run.id },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
          totalChecked: escrows.length,
          matchCount,
          mismatchCount,
          errorCount,
        },
      });

      console.log(`[Reconciliation] Run completed: ${finalStatus} (${matchCount} matches, ${mismatchCount} mismatches, ${errorCount} errors)`);

      return {
        runId: completedRun.id,
        status: completedRun.status,
        totalChecked: completedRun.totalChecked,
        matchCount: completedRun.matchCount,
        mismatchCount: completedRun.mismatchCount,
        errorCount: completedRun.errorCount,
        items,
      };

    } catch (error: any) {
      // Mark run as failed
      await prisma.reconciliationRun.update({
        where: { id: run.id },
        data: {
          status: ReconciliationRunStatus.FAILED,
          finishedAt: new Date(),
        },
      });

      console.error(`[Reconciliation] Run failed:`, error.message);
      throw error;
    }
  },

  /**
   * Compare a single escrow with gateway payment status.
   * CORE RECONCILIATION LOGIC.
   * 
   * @param escrowId - Escrow ID to check
   * @param walletId - Buyer wallet ID
   * @param expectedAmount - Amount held in escrow (minor units)
   * @param currency - Currency code
   * @param gatewayName - Gateway to query (stripe/paymob)
   * @returns Comparison result with status and amounts
   */
  async compareEscrowWithGateway(
    escrowId: string,
    walletId: string,
    expectedAmount: bigint,
    currency: string,
    gatewayName: string
  ): Promise<EscrowGatewayComparison> {
    console.log(`[Reconciliation] Comparing escrow ${escrowId} with ${gatewayName}`);

    try {
      // 1. Find gateway payment ID for this escrow
      // We look for a PaymentEvent that references this escrow
      const gatewayPaymentId = await this.findGatewayPaymentId(escrowId, gatewayName);

      if (!gatewayPaymentId) {
        // No gateway record found
        console.warn(`[Reconciliation] No gateway payment found for escrow ${escrowId}`);
        return {
          escrowId,
          walletId,
          gatewayPaymentId: null,
          expectedAmount,
          gatewayAmount: null,
          status: ReconciliationItemStatus.MISSING,
          errorMessage: 'No gateway payment record found',
        };
      }

      // 2. Query gateway for current status
      const adapter = getPaymentGateway(gatewayName);
      const gatewayDetails = await adapter.getPaymentDetails(gatewayPaymentId);

      // 3. Extract gateway amount (convert to bigint if needed)
      const gatewayAmount = this.extractAmount(gatewayDetails);

      // 4. Compare amounts and status
      const comparisonStatus = this.compareAmounts(
        expectedAmount,
        gatewayAmount,
        gatewayDetails.status
      );

      return {
        escrowId,
        walletId,
        gatewayPaymentId,
        expectedAmount,
        gatewayAmount,
        status: comparisonStatus,
        gatewayStatus: gatewayDetails.status,
      };

    } catch (error: any) {
      console.error(`[Reconciliation] Gateway query failed for escrow ${escrowId}:`, error.message);
      
      return {
        escrowId,
        walletId,
        gatewayPaymentId: null,
        expectedAmount,
        gatewayAmount: null,
        status: ReconciliationItemStatus.ERROR,
        errorMessage: error.message,
      };
    }
  },

  /**
   * Fetch escrows that need reconciliation.
   * Targets FUNDED escrows (money is held, waiting for delivery/release).
   * 
   * @param escrowIds - Optional specific escrow IDs to check
   * @returns List of escrows to reconcile
   */
  async fetchEscrowsForReconciliation(escrowIds?: string[]) {
    if (escrowIds && escrowIds.length > 0) {
      // Reconcile specific escrows
      return await prisma.escrow.findMany({
        where: {
          id: { in: escrowIds },
        },
      });
    }

    // Reconcile all FUNDED escrows (active holds)
    return await prisma.escrow.findMany({
      where: {
        status: EscrowStatus.FUNDED,
      },
      orderBy: {
        fundedAt: 'asc', // Oldest first
      },
    });
  },

  /**
   * Find the gateway payment ID associated with an escrow.
   * Looks up PaymentEvent records that reference this escrow.
   * 
   * @param escrowId - Escrow ID
   * @param gatewayName - Gateway name
   * @returns Gateway payment ID or null
   */
  async findGatewayPaymentId(escrowId: string, gatewayName: string): Promise<string | null> {
    // Strategy: Look for PaymentEvent with metadata containing escrowId
    // This assumes webhook payload includes escrow reference
    const event = await prisma.paymentEvent.findFirst({
      where: {
        gateway: gatewayName,
        processed: true,
        // We need to search JSON payload for escrowId
        // Prisma JSON filtering is limited, so we fetch and filter
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // TODO: Implement proper JSON search or maintain escrow->payment mapping
    // For now, we extract from payload
    if (event && typeof event.payload === 'object') {
      const payload = event.payload as any;
      
      // Check metadata for escrow reference
      if (payload.metadata?.escrowId === escrowId) {
        return event.eventId;
      }
      
      // Check if referenceId matches
      if (payload.referenceId === escrowId) {
        return event.eventId;
      }
    }

    return null;
  },

  /**
   * Extract amount from gateway response.
   * Handles different gateway response formats.
   * 
   * @param gatewayDetails - Gateway payment details
   * @returns Amount in minor units (bigint)
   */
  extractAmount(gatewayDetails: any): bigint | null {
    // Gateway responses may have amount in different fields
    if (gatewayDetails.rawResponse?.amount) {
      return BigInt(gatewayDetails.rawResponse.amount);
    }
    
    // Fallback: try to extract from metadata
    return null;
  },

  /**
   * Compare expected amount with gateway amount.
   * Determines reconciliation status.
   * 
   * @param expectedAmount - Amount held in escrow
   * @param gatewayAmount - Amount reported by gateway
   * @param gatewayStatus - Gateway payment status
   * @returns Reconciliation item status
   */
  compareAmounts(
    expectedAmount: bigint,
    gatewayAmount: bigint | null,
    gatewayStatus: PaymentStatus
  ): ReconciliationItemStatus {
    // If gateway payment is not completed, flag as mismatch
    if (gatewayStatus !== PaymentStatus.COMPLETED) {
      return ReconciliationItemStatus.MISSING;
    }

    // If no amount from gateway, cannot compare
    if (gatewayAmount === null) {
      return ReconciliationItemStatus.ERROR;
    }

    // Compare amounts
    if (gatewayAmount === expectedAmount) {
      return ReconciliationItemStatus.MATCH;
    } else if (gatewayAmount > expectedAmount) {
      return ReconciliationItemStatus.OVERPAID;
    } else {
      return ReconciliationItemStatus.UNDERPAID;
    }
  },

  /**
   * Determine resolution action based on status.
   * 
   * @param status - Reconciliation item status
   * @returns Recommended resolution
   */
  determineResolution(status: ReconciliationItemStatus): ReconciliationResolution {
    switch (status) {
      case ReconciliationItemStatus.MATCH:
        return ReconciliationResolution.NONE;
      
      case ReconciliationItemStatus.MISSING:
      case ReconciliationItemStatus.OVERPAID:
      case ReconciliationItemStatus.UNDERPAID:
        return ReconciliationResolution.FLAGGED;
      
      case ReconciliationItemStatus.ERROR:
        return ReconciliationResolution.FLAGGED;
      
      default:
        return ReconciliationResolution.NONE;
    }
  },

  /**
   * Determine overall run status based on results.
   * 
   * @param errorCount - Number of errors encountered
   * @param totalCount - Total escrows checked
   * @returns Run status
   */
  determineRunStatus(errorCount: number, totalCount: number): ReconciliationRunStatus {
    if (errorCount === 0) {
      return ReconciliationRunStatus.SUCCESS;
    } else if (errorCount === totalCount) {
      return ReconciliationRunStatus.FAILED;
    } else {
      return ReconciliationRunStatus.PARTIAL;
    }
  },

  // ============================================================
  // ADMIN OPERATIONS
  // ============================================================

  /**
   * Get reconciliation run details.
   * 
   * @param runId - Reconciliation run ID
   * @returns Run details with items
   */
  async getReconciliationRun(runId: string) {
    return await prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        items: {
          orderBy: {
            checkedAt: 'desc',
          },
        },
      },
    });
  },

  /**
   * Get all mismatches that need manual review.
   * 
   * @returns Flagged reconciliation items
   */
  async getFlaggedItems() {
    return await prisma.reconciliationItem.findMany({
      where: {
        resolution: ReconciliationResolution.FLAGGED,
      },
      include: {
        run: true,
      },
      orderBy: {
        checkedAt: 'desc',
      },
    });
  },

  /**
   * Mark a reconciliation item as manually resolved.
   * DOES NOT modify escrow or ledger.
   * 
   * @param itemId - Reconciliation item ID
   * @param resolvedBy - Admin user ID
   * @param notes - Resolution notes
   */
  async markAsResolved(itemId: string, resolvedBy: string, notes?: string) {
    return await prisma.reconciliationItem.update({
      where: { id: itemId },
      data: {
        resolution: ReconciliationResolution.MANUAL_ACTION,
        resolvedAt: new Date(),
        resolvedBy,
        notes,
      },
    });
  },

  /**
   * Mark a reconciliation item as acceptable variance (ignore).
   * 
   * @param itemId - Reconciliation item ID
   * @param resolvedBy - Admin user ID
   * @param notes - Reason for ignoring
   */
  async markAsIgnored(itemId: string, resolvedBy: string, notes?: string) {
    return await prisma.reconciliationItem.update({
      where: { id: itemId },
      data: {
        resolution: ReconciliationResolution.IGNORED,
        resolvedAt: new Date(),
        resolvedBy,
        notes,
      },
    });
  },

  // ============================================================
  // PHASE 4.4.3 — CLASSIFICATION-BASED QUERIES
  // ============================================================

  /**
   * Get high-severity mismatches requiring immediate attention.
   * 
   * @returns High-severity reconciliation items
   */
  async getHighSeverityItems() {
    return await prisma.reconciliationItem.findMany({
      where: {
        severity: MismatchSeverity.HIGH,
        resolution: ReconciliationResolution.FLAGGED,
      },
      include: {
        run: true,
      },
      orderBy: {
        checkedAt: 'desc',
      },
    });
  },

  /**
   * Get items by specific classification type.
   * 
   * @param classification - Mismatch classification
   * @returns Reconciliation items of specified type
   */
  async getItemsByClassification(classification: MismatchClassification) {
    return await prisma.reconciliationItem.findMany({
      where: {
        classification,
      },
      include: {
        run: true,
      },
      orderBy: {
        checkedAt: 'desc',
      },
    });
  },

  /**
   * Get items by severity level.
   * 
   * @param severity - Mismatch severity
   * @returns Reconciliation items of specified severity
   */
  async getItemsBySeverity(severity: MismatchSeverity) {
    return await prisma.reconciliationItem.findMany({
      where: {
        severity,
        resolution: ReconciliationResolution.FLAGGED,
      },
      include: {
        run: true,
      },
      orderBy: [
        { severity: 'desc' },
        { checkedAt: 'desc' },
      ],
    });
  },

  /**
   * Get classification statistics for a reconciliation run.
   * 
   * @param runId - Reconciliation run ID
   * @returns Classification breakdown
   */
  async getRunClassificationStats(runId: string) {
    const items = await prisma.reconciliationItem.findMany({
      where: { runId },
      select: {
        classification: true,
        severity: true,
      },
    });

    const stats = {
      total: items.length,
      byClassification: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      highSeverityCount: 0,
    };

    for (const item of items) {
      if (item.classification) {
        stats.byClassification[item.classification] = 
          (stats.byClassification[item.classification] || 0) + 1;
      }

      if (item.severity) {
        stats.bySeverity[item.severity] = 
          (stats.bySeverity[item.severity] || 0) + 1;

        if (item.severity === MismatchSeverity.HIGH) {
          stats.highSeverityCount++;
        }
      }
    }

    return stats;
  },
};
