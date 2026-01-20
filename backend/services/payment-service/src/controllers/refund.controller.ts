/**
 * Refund Controller
 * Handles refund status tracking and chargeback processing
 * READ-ONLY for frontend, system-driven decisions
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EscrowService } from './escrow.service';
import { eventPublisherService } from './event-publisher.service';

const prisma = new PrismaClient();

export class RefundController {
  /**
   * Get refund status for an order
   * GET /api/v1/refunds/:orderId
   */
  async getRefundStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get escrow record for this order
      const escrow = await prisma.escrow.findFirst({
        where: {
          orderId: parseInt(orderId),
          OR: [
            { buyerId: parseInt(userId) },
            { sellerId: parseInt(userId) },
            { travelerId: parseInt(userId) }
          ]
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Refund record not found' });
      }

      // Get refund records for this order
      const refunds = await prisma.refund.findMany({
        where: {
          orderId: parseInt(orderId)
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get chargeback records for this order
      const chargebacks = await prisma.chargeback.findMany({
        where: {
          orderId: parseInt(orderId)
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get dispute records for this order
      const disputes = await prisma.dispute.findMany({
        where: {
          orderId: parseInt(orderId)
        },
        orderBy: { createdAt: 'desc' }
      });

      // Determine user role and refund eligibility
      const userRole = escrow.buyerId === parseInt(userId) ? 'buyer' : 
                      escrow.sellerId === parseInt(userId) ? 'seller' : 'traveler';

      const refundEligibility = this.determineRefundEligibility(
        escrow, 
        refunds, 
        chargebacks, 
        disputes, 
        userRole
      );

      const refundStatus = {
        orderId: parseInt(orderId),
        escrow,
        refunds,
        chargebacks,
        disputes,
        userRole,
        eligibility: refundEligibility,
        currentStatus: this.getCurrentRefundStatus(escrow, refunds, chargebacks, disputes),
        timeline: this.buildRefundTimeline(escrow, refunds, chargebacks, disputes),
        guaranteeCoverage: this.calculateGuaranteeCoverage(escrow, refunds, chargebacks)
      };

      res.json({
        success: true,
        data: refundStatus
      });

    } catch (error) {
      console.error('Get refund status error:', error);
      res.status(500).json({ 
        error: 'Failed to get refund status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get chargeback status for an order
   * GET /api/v1/chargebacks/:orderId
   */
  async getChargebackStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get chargeback records
      const chargebacks = await prisma.chargeback.findMany({
        where: {
          orderId: parseInt(orderId)
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              totalAmount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (chargebacks.length === 0) {
        return res.status(404).json({ error: 'Chargeback record not found' });
      }

      const chargebackStatus = {
        orderId: parseInt(orderId),
        chargebacks,
        currentStatus: this.getCurrentChargebackStatus(chargebacks),
        timeline: this.buildChargebackTimeline(chargebacks),
        gatewayResponse: chargebacks[0]?.gatewayResponse || null
      };

      res.json({
        success: true,
        data: chargebackStatus
      });

    } catch (error) {
      console.error('Get chargeback status error:', error);
      res.status(500).json({ 
        error: 'Failed to get chargeback status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Submit refund intent (request only, no execution)
   * POST /api/v1/refunds/intent
   */
  async submitRefundIntent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { orderId, reason, type } = req.body;

      // Validate required fields
      if (!orderId || !reason) {
        return res.status(400).json({ 
          error: 'Missing required fields: orderId, reason' 
        });
      }

      // Get escrow to validate user involvement
      const escrow = await prisma.escrow.findFirst({
        where: {
          orderId: parseInt(orderId),
          OR: [
            { buyerId: parseInt(userId) },
            { sellerId: parseInt(userId) },
            { travelerId: parseInt(userId) }
          ]
        }
      });

      if (!escrow) {
        return res.status(404).json({ error: 'Order not found or user not involved' });
      }

      // Create refund intent record
      const refundIntent = await prisma.refundIntent.create({
        data: {
          orderId: parseInt(orderId),
          userId: parseInt(userId),
          reason,
          type: type || 'refund_request',
          status: 'PENDING_REVIEW',
          metadata: req.body.metadata || {}
        }
      });

      // Emit event for Control Center review
      await eventPublisherService.publishEvent({
        eventType: 'REFUND_INTENT_SUBMITTED',
        aggregateId: orderId.toString(),
        aggregateType: 'order',
        data: {
          refundIntentId: refundIntent.id,
          userId: parseInt(userId),
          reason,
          type,
          escrowStatus: escrow.status
        },
        metadata: {
          submittedAt: new Date().toISOString(),
          userAgent: req.get('User-Agent')
        }
      });

      res.status(201).json({
        success: true,
        data: {
          intentId: refundIntent.id,
          status: 'PENDING_REVIEW',
          message: 'Refund request submitted for review. You will be notified of the decision.',
          nextSteps: [
            'Request will be reviewed by Control Center',
            'Decision will be based on guarantee terms',
            'You will receive email notification'
          ]
        }
      });

    } catch (error) {
      console.error('Submit refund intent error:', error);
      res.status(500).json({ 
        error: 'Failed to submit refund intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Determine refund eligibility based on escrow and dispute status
   */
  private determineRefundEligibility(
    escrow: any, 
    refunds: any[], 
    chargebacks: any[], 
    disputes: any[], 
    userRole: string
  ) {
    // If there's an active dispute, refund eligibility depends on dispute outcome
    const activeDispute = disputes.find(d => d.status === 'ACTIVE');
    if (activeDispute) {
      return {
        eligible: false,
        reason: 'DISPUTE_ACTIVE',
        message: 'Refund eligibility depends on dispute resolution',
        canRequest: false
      };
    }

    // If there's an active chargeback, refund is not eligible
    const activeChargeback = chargebacks.find(c => c.status === 'ACTIVE');
    if (activeChargeback) {
      return {
        eligible: false,
        reason: 'CHARGEBACK_ACTIVE',
        message: 'Chargeback in progress, refund not eligible',
        canRequest: false
      };
    }

    // Check if refund already processed
    const processedRefund = refunds.find(r => r.status === 'PROCESSED');
    if (processedRefund) {
      return {
        eligible: false,
        reason: 'REFUND_PROCESSED',
        message: 'Refund already processed',
        canRequest: false
      };
    }

    // Check escrow status
    if (escrow.status === 'RELEASED') {
      return {
        eligible: false,
        reason: 'ESCROW_RELEASED',
        message: 'Funds already released to seller',
        canRequest: false
      };
    }

    if (escrow.status === 'REFUNDED') {
      return {
        eligible: false,
        reason: 'ALREADY_REFUNDED',
        message: 'Order already refunded',
        canRequest: false
      };
    }

    // If escrow is held and no active disputes/chargebacks, refund is eligible
    if (escrow.status === 'HELD') {
      return {
        eligible: true,
        reason: 'ELIGIBLE',
        message: 'Refund request can be submitted for review',
        canRequest: true
      };
    }

    // Default case
    return {
      eligible: false,
      reason: 'NOT_ELIGIBLE',
      message: 'Refund not currently eligible',
      canRequest: false
    };
  }

  /**
   * Get current refund status
   */
  private getCurrentRefundStatus(escrow: any, refunds: any[], chargebacks: any[], disputes: any[]) {
    // Priority: Chargeback > Dispute > Refund
    if (chargebacks.length > 0) {
      const activeChargeback = chargebacks.find(c => c.status === 'ACTIVE');
      if (activeChargeback) {
        return 'CHARGEBACK_IN_PROGRESS';
      }
      return 'CHARGEBACK_RECEIVED';
    }

    if (disputes.length > 0) {
      const activeDispute = disputes.find(d => d.status === 'ACTIVE');
      if (activeDispute) {
        return 'DISPUTE_IN_PROGRESS';
      }
      return 'DISPUTE_RESOLVED';
    }

    if (refunds.length > 0) {
      const latestRefund = refunds[0]; // Sorted by date desc
      return latestRefund.status;
    }

    if (escrow.status === 'HELD') {
      return 'REFUND_ELIGIBLE';
    }

    return 'NO_REFUND_ACTIVITY';
  }

  /**
   * Get current chargeback status
   */
  private getCurrentChargebackStatus(chargebacks: any[]) {
    if (chargebacks.length === 0) {
      return 'NO_CHARGEBACK';
    }

    const activeChargeback = chargebacks.find(c => c.status === 'ACTIVE');
    if (activeChargeback) {
      return 'CHARGEBACK_UNDER_REVIEW';
    }

    const latestChargeback = chargebacks[0]; // Sorted by date desc
    switch (latestChargeback.status) {
      case 'RECEIVED':
        return 'CHARGEBACK_RECEIVED';
      case 'UNDER_REVIEW':
        return 'CHARGEBACK_UNDER_REVIEW';
      case 'WON':
        return 'CHARGEBACK_WON';
      case 'LOST':
        return 'CHARGEBACK_LOST';
      default:
        return 'CHARGEBACK_PENDING';
    }
  }

  /**
   * Build refund timeline
   */
  private buildRefundTimeline(escrow: any, refunds: any[], chargebacks: any[], disputes: any[]) {
    const timeline = [];

    // Add escrow creation
    timeline.push({
      type: 'ESCROW_CREATED',
      timestamp: escrow.createdAt,
      actor: 'SYSTEM',
      description: `Escrow created for order #${escrow.orderId}`,
      amount: escrow.amount,
      status: escrow.status
    });

    // Add disputes
    disputes.forEach(dispute => {
      timeline.push({
        type: 'DISPUTE_' + dispute.status,
        timestamp: dispute.createdAt,
        actor: dispute.raisedBy === escrow.buyerId ? 'BUYER' : 
                dispute.raisedBy === escrow.sellerId ? 'SELLER' : 'TRAVELER',
        description: dispute.description,
        status: dispute.status
      });
    });

    // Add chargebacks
    chargebacks.forEach(chargeback => {
      timeline.push({
        type: 'CHARGEBACK_' + chargeback.status,
        timestamp: chargeback.createdAt,
        actor: 'PAYMENT_GATEWAY',
        description: `Chargeback initiated: ${chargeback.reason}`,
        amount: chargeback.amount,
        status: chargeback.status
      });
    });

    // Add refunds
    refunds.forEach(refund => {
      timeline.push({
        type: 'REFUND_' + refund.status,
        timestamp: refund.createdAt,
        actor: refund.processedBy || 'SYSTEM',
        description: refund.reason,
        amount: refund.amount,
        status: refund.status
      });
    });

    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Build chargeback timeline
   */
  private buildChargebackTimeline(chargebacks: any[]) {
    return chargebacks.map(chargeback => ({
      type: 'CHARGEBACK_' + chargeback.status,
      timestamp: chargeback.createdAt,
      actor: 'PAYMENT_GATEWAY',
      description: chargeback.reason,
      amount: chargeback.amount,
      status: chargeback.status,
      gatewayResponse: chargeback.gatewayResponse
    }));
  }

  /**
   * Calculate guarantee coverage for refunds
   */
  private calculateGuaranteeCoverage(escrow: any, refunds: any[], chargebacks: any[]) {
    const totalRefunded = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);
    const totalChargedBack = chargebacks.reduce((sum, chargeback) => sum + (chargeback.amount || 0), 0);
    const totalLosses = totalRefunded + totalChargedBack;
    
    // This would connect to a guarantee service that tracks coverage
    const coveragePercentage = escrow.amount > 0 ? 
      Math.max(0, 100 - (totalLosses / escrow.amount * 100)) : 0;

    return {
      totalRefunded,
      totalChargedBack,
      totalLosses,
      coveragePercentage,
      guaranteePoolImpact: totalLosses > 0 ? 'DEPLETED' : 'AVAILABLE'
    };
  }
}

export const refundController = new RefundController();
