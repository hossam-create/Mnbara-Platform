// ============================================================
// PHASE 4.4.4 — RECONCILIATION ALERT SERVICE
// Transforms reconciliation data into Control Center alerts
// Read-only, informational — NO mutations
// ============================================================

import { PrismaClient, MismatchClassification, MismatchSeverity, ReconciliationResolution } from '@prisma/client';
import { mismatchClassifier } from './mismatch-classifier.service';
import {
  ReconciliationAlertDto,
  ReconciliationRunSummaryDto,
  ReconciliationStatsDto,
  ReconciliationAlertFilters,
  ReconciliationAlertListDto,
  ReconciliationAlertDetailDto,
} from '../dto/reconciliation-alert.dto';

const prisma = new PrismaClient();

// ============================================================
// ALERT SERVICE
// ============================================================

export const reconciliationAlertService = {
  /**
   * Get all active alerts for Control Center dashboard.
   * Filters to FLAGGED items only (unresolved).
   * 
   * @param filters - Filter and pagination options
   * @returns Paginated list of alerts
   */
  async getAlerts(filters: ReconciliationAlertFilters = {}): Promise<ReconciliationAlertListDto> {
    const {
      severity,
      classification,
      resolution = ReconciliationResolution.FLAGGED, // Default to unresolved
      gateway,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      sortBy = 'severity',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: any = {};

    if (severity) {
      where.severity = Array.isArray(severity) ? { in: severity } : severity;
    }

    if (classification) {
      where.classification = Array.isArray(classification) ? { in: classification } : classification;
    }

    if (resolution) {
      where.resolution = Array.isArray(resolution) ? { in: resolution } : resolution;
    }

    if (startDate || endDate) {
      where.checkedAt = {};
      if (startDate) where.checkedAt.gte = new Date(startDate);
      if (endDate) where.checkedAt.lte = new Date(endDate);
    }

    if (gateway) {
      where.run = {
        gateway: gateway.toUpperCase(),
      };
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'severity') {
      // Sort by severity priority (HIGH=3, MEDIUM=2, LOW=1)
      orderBy.severity = sortOrder;
      orderBy.checkedAt = 'desc'; // Secondary sort by time
    } else if (sortBy === 'detectedAt') {
      orderBy.checkedAt = sortOrder;
    } else if (sortBy === 'amount') {
      orderBy.expectedAmount = sortOrder;
    }

    // Get total count
    const total = await prisma.reconciliationItem.count({ where });

    // Get paginated items
    const skip = (page - 1) * pageSize;
    const items = await prisma.reconciliationItem.findMany({
      where,
      include: {
        run: true,
      },
      orderBy,
      skip,
      take: pageSize,
    });

    // Transform to DTOs
    const alerts = await Promise.all(
      items.map(item => this.transformToAlertDto(item))
    );

    // Calculate summary
    const summary = {
      highSeverityCount: alerts.filter(a => a.severity === MismatchSeverity.HIGH).length,
      mediumSeverityCount: alerts.filter(a => a.severity === MismatchSeverity.MEDIUM).length,
      lowSeverityCount: alerts.filter(a => a.severity === MismatchSeverity.LOW).length,
    };

    return {
      alerts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      filters,
      summary,
    };
  },

  /**
   * Get detailed view of a single alert.
   * 
   * @param alertId - Reconciliation item ID
   * @returns Detailed alert with full context
   */
  async getAlertDetail(alertId: string): Promise<ReconciliationAlertDetailDto | null> {
    const item = await prisma.reconciliationItem.findUnique({
      where: { id: alertId },
      include: {
        run: true,
      },
    });

    if (!item) return null;

    // Get escrow details
    const escrow = await prisma.escrow.findUnique({
      where: { id: item.escrowId },
    });

    if (!escrow) return null;

    // Get related alerts (same escrow)
    const relatedItems = await prisma.reconciliationItem.findMany({
      where: {
        escrowId: item.escrowId,
        id: { not: alertId },
      },
      include: {
        run: true,
      },
      take: 5,
      orderBy: {
        checkedAt: 'desc',
      },
    });

    const relatedAlerts = await Promise.all(
      relatedItems.map(ri => this.transformToAlertDto(ri))
    );

    // Build timeline
    const timeline = {
      detectedAt: item.checkedAt.toISOString(),
      resolvedAt: item.resolvedAt?.toISOString() || null,
      events: [
        {
          timestamp: item.checkedAt.toISOString(),
          type: 'DETECTED' as const,
          actor: 'system',
          notes: `Mismatch detected: ${item.classification}`,
        },
        ...(item.resolvedAt
          ? [
              {
                timestamp: item.resolvedAt.toISOString(),
                type: (item.resolution === ReconciliationResolution.MANUAL_ACTION
                  ? 'RESOLVED'
                  : 'IGNORED') as const,
                actor: item.resolvedBy || 'unknown',
                notes: item.notes,
              },
            ]
          : []),
      ],
    };

    // Transform base alert
    const baseAlert = await this.transformToAlertDto(item);

    return {
      ...baseAlert,
      escrow: {
        id: escrow.id,
        buyerWalletId: escrow.buyerWalletId,
        sellerWalletId: escrow.sellerWalletId,
        status: escrow.status,
        referenceType: escrow.referenceType,
        referenceId: escrow.referenceId,
        createdAt: escrow.createdAt.toISOString(),
        fundedAt: escrow.fundedAt?.toISOString() || null,
      },
      run: {
        id: item.run.id,
        gateway: item.run.gateway,
        startedAt: item.run.startedAt.toISOString(),
        triggeredBy: item.run.triggeredBy,
      },
      relatedAlerts,
      timeline,
    };
  },

  /**
   * Get reconciliation statistics for dashboard widgets.
   * 
   * @returns Aggregated statistics
   */
  async getStats(): Promise<ReconciliationStatsDto> {
    // Get total runs
    const totalRuns = await prisma.reconciliationRun.count();

    // Get successful runs
    const successfulRuns = await prisma.reconciliationRun.count({
      where: { status: 'SUCCESS' },
    });

    // Get all items for statistics
    const allItems = await prisma.reconciliationItem.findMany({
      select: {
        status: true,
        classification: true,
        severity: true,
        resolution: true,
        checkedAt: true,
        resolvedAt: true,
      },
    });

    // Calculate match rate
    const totalItems = allItems.length;
    const matches = allItems.filter(i => i.status === 'MATCH').length;
    const averageMatchRate = totalItems > 0 ? (matches / totalItems) * 100 : 100;

    // Active mismatches (not resolved)
    const activeMismatches = allItems.filter(
      i => i.resolution === ReconciliationResolution.FLAGGED
    ).length;

    // High severity mismatches
    const highSeverityMismatches = allItems.filter(
      i => i.severity === MismatchSeverity.HIGH && i.resolution === ReconciliationResolution.FLAGGED
    ).length;

    // Unresolved mismatches
    const unresolvedMismatches = allItems.filter(
      i => i.resolution === ReconciliationResolution.FLAGGED
    ).length;

    // By classification
    const byClassification = {
      [MismatchClassification.MISSING_PAYMENT]: 0,
      [MismatchClassification.DELAYED_PAYMENT]: 0,
      [MismatchClassification.AMOUNT_MISMATCH]: 0,
      [MismatchClassification.DUPLICATE_GATEWAY_PAYMENT]: 0,
      [MismatchClassification.GATEWAY_SUCCESS_ESCROW_MISSING]: 0,
      [MismatchClassification.GATEWAY_QUERY_FAILED]: 0,
    };

    // By severity
    const bySeverity = {
      [MismatchSeverity.LOW]: 0,
      [MismatchSeverity.MEDIUM]: 0,
      [MismatchSeverity.HIGH]: 0,
    };

    for (const item of allItems) {
      if (item.classification) {
        byClassification[item.classification]++;
      }
      if (item.severity) {
        bySeverity[item.severity]++;
      }
    }

    // Last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24HoursRuns = await prisma.reconciliationRun.count({
      where: { startedAt: { gte: yesterday } },
    });

    const last24HoursMismatches = allItems.filter(
      i => i.checkedAt >= yesterday && i.status !== 'MATCH'
    ).length;

    const last24HoursResolved = allItems.filter(
      i => i.resolvedAt && i.resolvedAt >= yesterday
    ).length;

    // Last run
    const lastRun = await prisma.reconciliationRun.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        _count: {
          select: {
            items: {
              where: {
                status: { not: 'MATCH' },
              },
            },
          },
        },
      },
    });

    return {
      totalRuns,
      successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100,
      averageMatchRate,
      activeMismatches,
      highSeverityMismatches,
      unresolvedMismatches,
      byClassification,
      bySeverity,
      last24Hours: {
        runs: last24HoursRuns,
        mismatches: last24HoursMismatches,
        resolved: last24HoursResolved,
      },
      lastRun: lastRun
        ? {
            timestamp: lastRun.startedAt.toISOString(),
            status: lastRun.status,
            mismatchCount: lastRun._count.items,
          }
        : null,
    };
  },

  /**
   * Get recent reconciliation runs for dashboard.
   * 
   * @param limit - Number of runs to return
   * @returns List of run summaries
   */
  async getRecentRuns(limit: number = 10): Promise<ReconciliationRunSummaryDto[]> {
    const runs = await prisma.reconciliationRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        items: {
          select: {
            severity: true,
          },
        },
      },
    });

    return runs.map(run => {
      const duration =
        run.finishedAt && run.startedAt
          ? run.finishedAt.getTime() - run.startedAt.getTime()
          : null;

      const highSeverityCount = run.items.filter(i => i.severity === MismatchSeverity.HIGH).length;
      const mediumSeverityCount = run.items.filter(i => i.severity === MismatchSeverity.MEDIUM).length;
      const lowSeverityCount = run.items.filter(i => i.severity === MismatchSeverity.LOW).length;

      return {
        id: run.id,
        gateway: run.gateway,
        status: run.status,
        totalChecked: run.totalChecked,
        matchCount: run.matchCount,
        mismatchCount: run.mismatchCount,
        errorCount: run.errorCount,
        highSeverityCount,
        mediumSeverityCount,
        lowSeverityCount,
        startedAt: run.startedAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString() || null,
        duration,
        triggeredBy: run.triggeredBy,
        notes: run.notes,
      };
    });
  },

  /**
   * Transform reconciliation item to alert DTO.
   * 
   * @param item - Reconciliation item from database
   * @returns Alert DTO for Control Center
   */
  async transformToAlertDto(item: any): Promise<ReconciliationAlertDto> {
    // Get escrow for currency
    const escrow = await prisma.escrow.findUnique({
      where: { id: item.escrowId },
      select: { currency: true },
    });

    const currency = escrow?.currency || 'EGP';

    // Get classification description and action
    const description = item.classification
      ? mismatchClassifier.getClassificationDescription(item.classification)
      : 'Reconciliation mismatch detected';

    const recommendedAction =
      item.classification && item.severity
        ? mismatchClassifier.getRecommendedAction(item.classification, item.severity)
        : 'Review and investigate';

    // Get severity color and priority
    const severityColor = item.severity
      ? mismatchClassifier.getSeverityColor(item.severity)
      : '#6B7280';

    const severityPriority = item.severity
      ? mismatchClassifier.getSeverityPriority(item.severity)
      : 0;

    const requiresImmediateAttention = item.severity
      ? mismatchClassifier.requiresImmediateAttention(item.severity)
      : false;

    // Build links
    const escrowLink = `/control-center/finance/escrows/${item.escrowId}`;
    const gatewayLink = this.buildGatewayLink(item.run?.gateway, item.gatewayPaymentId);

    return {
      id: item.id,
      escrowId: item.escrowId,
      gatewayPaymentId: item.gatewayPaymentId,
      classification: item.classification,
      severity: item.severity,
      expectedAmount: item.expectedAmount.toString(),
      gatewayAmount: item.gatewayAmount?.toString() || null,
      currency,
      gatewayStatus: item.gatewayStatus,
      resolution: item.resolution,
      description,
      recommendedAction,
      detectedAt: item.checkedAt.toISOString(),
      resolvedAt: item.resolvedAt?.toISOString() || null,
      resolvedBy: item.resolvedBy,
      notes: item.notes,
      escrowLink,
      gatewayLink,
      severityColor,
      severityPriority,
      requiresImmediateAttention,
    };
  },

  /**
   * Build external gateway dashboard link.
   * 
   * @param gateway - Gateway name
   * @param paymentId - Gateway payment ID
   * @returns External link or null
   */
  buildGatewayLink(gateway: string | undefined, paymentId: string | null): string | null {
    if (!gateway || !paymentId) return null;

    switch (gateway.toLowerCase()) {
      case 'stripe':
        return `https://dashboard.stripe.com/payments/${paymentId}`;
      case 'paymob':
        return `https://accept.paymob.com/portal2/en/transactions/${paymentId}`;
      default:
        return null;
    }
  },
};
