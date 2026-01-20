/**
 * Escrow Payment Controller
 * Handles escrow-first payment flow endpoints
 * Integrates with payment providers and escrow service
 */

import { Request, Response } from 'express';
import { EscrowPaymentService, PaymentState } from '../services/escrow-payment.service';
import { PaymentProvider } from '../types/payment.types';

export class EscrowPaymentController {
  /**
   * Create escrow payment intent
   * POST /api/payments/escrow/create
   */
  async createEscrowPayment(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        orderId,
        sellerId,
        travelerId,
        amount,
        currency = 'USD',
        provider,
        paymentMethodId,
        billingData,
        metadata
      } = req.body;

      // Validate required fields
      if (!orderId || !sellerId || !amount || !provider) {
        return res.status(400).json({ 
          error: 'Missing required fields: orderId, sellerId, amount, provider' 
        });
      }

      // Validate provider
      const validProviders = EscrowPaymentService.getAvailableProviders(currency);
      if (!validProviders.includes(provider as PaymentProvider)) {
        return res.status(400).json({ 
          error: `Invalid provider ${provider}. Available: ${validProviders.join(', ')}` 
        });
      }

      const result = await EscrowPaymentService.createEscrowPayment({
        orderId,
        buyerId: userId,
        sellerId,
        travelerId,
        amount,
        currency,
        provider: provider as PaymentProvider,
        paymentMethodId,
        billingData,
        metadata
      });

      res.status(201).json({
        success: true,
        data: {
          paymentIntent: result.paymentResult,
          escrow: result.escrowResult,
          paymentState: result.paymentState,
          nextAction: 'confirm_payment'
        }
      });

    } catch (error) {
      console.error('Create escrow payment error:', error);
      res.status(500).json({ 
        error: 'Failed to create escrow payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Capture payment and move to escrow
   * POST /api/payments/escrow/capture
   */
  async captureToEscrow(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { orderId, paymentIntentId, provider } = req.body;

      // Validate required fields
      if (!orderId || !paymentIntentId || !provider) {
        return res.status(400).json({ 
          error: 'Missing required fields: orderId, paymentIntentId, provider' 
        });
      }

      // Use system user ID for capture operations
      const systemUserId = 1; // This should come from system configuration

      const result = await EscrowPaymentService.captureToEscrow({
        orderId,
        paymentIntentId,
        provider: provider as PaymentProvider,
        systemUserId
      });

      res.json({
        success: true,
        data: {
          paymentResult: result.paymentResult,
          escrow: result.escrowResult,
          paymentState: result.paymentState,
          status: 'funds_held_in_escrow'
        }
      });

    } catch (error) {
      console.error('Capture to escrow error:', error);
      res.status(500).json({ 
        error: 'Failed to capture payment to escrow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get payment state for an order
   * GET /api/payments/escrow/state/:orderId
   */
  async getPaymentState(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const result = await EscrowPaymentService.getPaymentState(parseInt(orderId));

      res.json({
        success: true,
        data: {
          paymentState: result.paymentState,
          escrow: result.escrow,
          paymentDetails: result.paymentDetails
        }
      });

    } catch (error) {
      console.error('Get payment state error:', error);
      res.status(500).json({ 
        error: 'Failed to get payment state',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available payment providers
   * GET /api/payments/escrow/providers
   */
  async getAvailableProviders(req: Request, res: Response) {
    try {
      const { currency = 'USD', country } = req.query;

      const providers = EscrowPaymentService.getAvailableProviders(
        currency as string,
        country as string
      );

      res.json({
        success: true,
        data: {
          providers,
          currency,
          country
        }
      });

    } catch (error) {
      console.error('Get providers error:', error);
      res.status(500).json({ 
        error: 'Failed to get available providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle dispute (freeze escrow funds)
   * POST /api/payments/escrow/dispute
   */
  async handleDispute(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { escrowId, disputeReason } = req.body;

      if (!escrowId || !disputeReason) {
        return res.status(400).json({ 
          error: 'Missing required fields: escrowId, disputeReason' 
        });
      }

      const result = await EscrowPaymentService.handleDispute(
        parseInt(escrowId),
        disputeReason,
        userId
      );

      res.json({
        success: true,
        data: {
          escrow: result,
          status: 'dispute_opened',
          message: 'Escrow funds frozen pending resolution'
        }
      });

    } catch (error) {
      console.error('Handle dispute error:', error);
      res.status(500).json({ 
        error: 'Failed to handle dispute',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Release escrow funds (Control Center only)
   * POST /api/payments/escrow/release
   */
  async releaseEscrowFunds(req: Request, res: Response) {
    try {
      // This endpoint should be protected by Control Center authentication
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'CONTROL_CENTER') {
        return res.status(403).json({ 
          error: 'Access denied. Control Center authorization required.' 
        });
      }

      const { escrowId, recipientUserId, reason } = req.body;

      if (!escrowId || !recipientUserId) {
        return res.status(400).json({ 
          error: 'Missing required fields: escrowId, recipientUserId' 
        });
      }

      const result = await EscrowPaymentService.releaseEscrowFunds(
        parseInt(escrowId),
        parseInt(recipientUserId),
        userId,
        reason
      );

      res.json({
        success: true,
        data: {
          escrow: result,
          status: 'funds_released',
          message: 'Escrow funds released successfully'
        }
      });

    } catch (error) {
      console.error('Release escrow funds error:', error);
      res.status(500).json({ 
        error: 'Failed to release escrow funds',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Refund escrow funds (Control Center only)
   * POST /api/payments/escrow/refund
   */
  async refundToBuyer(req: Request, res: Response) {
    try {
      // This endpoint should be protected by Control Center authentication
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'CONTROL_CENTER') {
        return res.status(403).json({ 
          error: 'Access denied. Control Center authorization required.' 
        });
      }

      const { escrowId, paymentIntentId, provider, reason, amount } = req.body;

      if (!escrowId || !reason) {
        return res.status(400).json({ 
          error: 'Missing required fields: escrowId, reason' 
        });
      }

      const result = await EscrowPaymentService.refundToBuyer({
        escrowId: parseInt(escrowId),
        paymentIntentId,
        provider: provider as PaymentProvider,
        reason,
        systemUserId: userId,
        amount
      });

      res.json({
        success: true,
        data: {
          escrow: result.escrowResult,
          refund: result.refundResult,
          status: 'refund_processed',
          message: 'Refund processed successfully'
        }
      });

    } catch (error) {
      console.error('Refund to buyer error:', error);
      res.status(500).json({ 
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default EscrowPaymentController;
