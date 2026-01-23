import crypto from 'crypto';
import { PrismaClient, DecisionStatus as PrismaDecisionStatus } from '@prisma/client';
import { DecisionStatus } from '../interfaces/IDecisionSource';
import { AuditLogService } from './AuditLogService';
import config from '../config/config';

/**
 * WebhookService - Handles webhooks from Custodii
 * 
 * CRITICAL RULES (Phase 3.0 Design Gate):
 * - Webhook = Acceleration (not source of truth)
 * - Polling = Source of Truth
 * - Conflict? Polling wins
 * - Validate HMAC signature
 * - Validate timestamp (replay protection)
 * - Schema validation (Zod)
 * - Never trust webhook alone
 * 
 * Flow:
 * 1. Validate HMAC signature
 * 2. Validate timestamp (< 5 min old)
 * 3. Validate schema
 * 4. Update decision (if valid)
 * 5. Audit the change
 * 6. Polling will verify later
 */

interface WebhookPayload {
  decision_id: string;
  status: 'APPROVE' | 'DENY' | 'PENDING';
  reference?: string;
  reason?: string;
  decided_at?: string;
  timestamp: string;
}

interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

export class WebhookService {
  private prisma: PrismaClient;
  private auditLogService: AuditLogService;
  private webhookSecret: string;
  private readonly MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogService = new AuditLogService(prisma);
    this.webhookSecret = config.custodiiWebhookSecret;

    console.log('[WebhookService] Initialized', {
      hasSecret: !!this.webhookSecret
    });
  }

  /**
   * Process webhook from Custodii
   * 
   * CRITICAL: This is an acceleration mechanism, not the source of truth
   */
  async processWebhook(
    payload: WebhookPayload,
    signature: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[WebhookService] Processing webhook', {
        decisionId: payload.decision_id,
        status: payload.status
      });

      // 1. Validate signature
      const signatureValidation = this.validateSignature(payload, signature);
      if (!signatureValidation.valid) {
        console.error('[WebhookService] Invalid signature', {
          error: signatureValidation.error
        });
        return {
          success: false,
          message: 'Invalid signature'
        };
      }

      // 2. Validate timestamp (replay protection)
      const timestampValidation = this.validateTimestamp(payload.timestamp);
      if (!timestampValidation.valid) {
        console.error('[WebhookService] Invalid timestamp', {
          error: timestampValidation.error
        });
        return {
          success: false,
          message: 'Invalid timestamp'
        };
      }

      // 3. Validate schema
      const schemaValidation = this.validateSchema(payload);
      if (!schemaValidation.valid) {
        console.error('[WebhookService] Invalid schema', {
          error: schemaValidation.error
        });
        return {
          success: false,
          message: 'Invalid schema'
        };
      }

      // 4. Find decision by external ID
      const decision = await this.prisma.assetDecisionRecord.findFirst({
        where: {
          externalDecisionId: payload.decision_id
        }
      });

      if (!decision) {
        console.warn('[WebhookService] Decision not found', {
          externalDecisionId: payload.decision_id
        });
        return {
          success: false,
          message: 'Decision not found'
        };
      }

      // 5. Check if decision is still PENDING
      if (decision.status !== PrismaDecisionStatus.PENDING) {
        console.log('[WebhookService] Decision already decided', {
          decisionId: decision.id,
          currentStatus: decision.status,
          webhookStatus: payload.status
        });
        return {
          success: true,
          message: 'Decision already decided (webhook ignored)'
        };
      }

      // 6. Update decision status
      const newStatus = this.mapStatus(payload.status);
      await this.updateDecisionFromWebhook(decision, newStatus, payload.reason);

      console.log('[WebhookService] Webhook processed successfully', {
        decisionId: decision.id,
        newStatus
      });

      return {
        success: true,
        message: 'Webhook processed'
      };

    } catch (error) {
      console.error('[WebhookService] Error processing webhook', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Internal error'
      };
    }
  }

  /**
   * Validate HMAC signature
   * 
   * Security: Custodii = Untrusted External Actor
   */
  private validateSignature(
    payload: WebhookPayload,
    signature: string
  ): WebhookValidationResult {
    if (!this.webhookSecret) {
      return {
        valid: false,
        error: 'Webhook secret not configured'
      };
    }

    if (!signature) {
      return {
        valid: false,
        error: 'Missing signature'
      };
    }

    try {
      // Compute expected signature
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        return {
          valid: false,
          error: 'Signature mismatch'
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: 'Signature validation error'
      };
    }
  }

  /**
   * Validate timestamp (replay protection)
   */
  private validateTimestamp(timestamp: string): WebhookValidationResult {
    if (!timestamp) {
      return {
        valid: false,
        error: 'Missing timestamp'
      };
    }

    try {
      const webhookTime = new Date(timestamp).getTime();
      const now = Date.now();
      const age = now - webhookTime;

      if (age < 0) {
        return {
          valid: false,
          error: 'Timestamp in future'
        };
      }

      if (age > this.MAX_TIMESTAMP_AGE_MS) {
        return {
          valid: false,
          error: 'Timestamp too old (replay attack?)'
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: 'Invalid timestamp format'
      };
    }
  }

  /**
   * Validate webhook schema
   */
  private validateSchema(payload: any): WebhookValidationResult {
    if (!payload) {
      return {
        valid: false,
        error: 'Empty payload'
      };
    }

    if (!payload.decision_id) {
      return {
        valid: false,
        error: 'Missing decision_id'
      };
    }

    if (!payload.status) {
      return {
        valid: false,
        error: 'Missing status'
      };
    }

    const validStatuses = ['APPROVE', 'DENY', 'PENDING'];
    if (!validStatuses.includes(payload.status)) {
      return {
        valid: false,
        error: 'Invalid status'
      };
    }

    if (!payload.timestamp) {
      return {
        valid: false,
        error: 'Missing timestamp'
      };
    }

    return { valid: true };
  }

  /**
   * Update decision from webhook
   * 
   * Note: Polling will verify this later (polling = source of truth)
   */
  private async updateDecisionFromWebhook(
    decision: any,
    newStatus: DecisionStatus,
    reason?: string
  ): Promise<void> {
    const prismaStatus = this.mapToPrismaStatus(newStatus);

    // Update decision
    await this.prisma.assetDecisionRecord.update({
      where: { id: decision.id },
      data: {
        status: prismaStatus,
        decidedAt: new Date(),
        reason: reason || `Decision ${newStatus.toLowerCase()} via webhook`
      }
    });

    // Audit the change
    await this.auditLogService.logStatusChange(
      decision.id,
      decision.status,
      prismaStatus,
      'DECISION_SOURCE',
      'webhook',
      reason || 'Status updated via webhook'
    );
  }

  /**
   * Map Custodii status to internal status
   */
  private mapStatus(custodiiStatus: string): DecisionStatus {
    const mapping: Record<string, DecisionStatus> = {
      'APPROVE': DecisionStatus.APPROVED,
      'DENY': DecisionStatus.REJECTED,
      'PENDING': DecisionStatus.PENDING
    };

    return mapping[custodiiStatus] || DecisionStatus.PENDING;
  }

  /**
   * Map internal status to Prisma status
   */
  private mapToPrismaStatus(status: DecisionStatus): PrismaDecisionStatus {
    const mapping: Record<DecisionStatus, PrismaDecisionStatus> = {
      [DecisionStatus.PENDING]: PrismaDecisionStatus.PENDING,
      [DecisionStatus.APPROVED]: PrismaDecisionStatus.APPROVED,
      [DecisionStatus.REJECTED]: PrismaDecisionStatus.REJECTED,
      [DecisionStatus.EXPIRED]: PrismaDecisionStatus.EXPIRED,
      [DecisionStatus.CANCELLED]: PrismaDecisionStatus.CANCELLED
    };

    return mapping[status];
  }
}
