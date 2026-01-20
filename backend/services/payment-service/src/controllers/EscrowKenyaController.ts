import { Request, Response } from 'express';
import { EscrowKenyaService } from '../services/EscrowKenyaService';

export class EscrowKenyaController {
  private escrowKenyaService: EscrowKenyaService;

  constructor() {
    this.escrowKenyaService = new EscrowKenyaService();
  }

  /**
   * Create escrow transaction
   */
  createTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, currency, buyerId, sellerId, description, orderId } = req.body;

      if (!amount || !buyerId || !sellerId || !description || !orderId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const transaction = await this.escrowKenyaService.createEscrowTransaction({
        amount,
        currency: currency || 'KES',
        buyerId,
        sellerId,
        description,
        orderId,
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Escrow transaction created successfully',
      });
    } catch (error) {
      console.error('Create escrow transaction error:', error);
      res.status(500).json({ 
        error: 'Failed to create escrow transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Fund escrow transaction with M-Pesa
   */
  fundTransactionWithMpesa = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, phoneNumber, amount } = req.body;

      if (!transactionId || !phoneNumber || !amount) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // First fund the transaction
      await this.escrowKenyaService.fundEscrowTransaction(transactionId, {
        type: 'mpesa',
        details: { phoneNumber, amount },
      });

      // Then process M-Pesa payment
      const mpesaPayment = await this.escrowKenyaService.processMpesaPayment({
        phoneNumber,
        amount,
        transactionId,
        callbackUrl: `${process.env.WEBHOOK_BASE_URL}/api/escrow-kenya/mpesa-callback`,
      });

      res.status(200).json({
        success: true,
        data: mpesaPayment,
        message: 'M-Pesa payment initiated successfully',
      });
    } catch (error) {
      console.error('Fund escrow with M-Pesa error:', error);
      res.status(500).json({ 
        error: 'Failed to fund escrow transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Fund escrow transaction with card
   */
  fundTransactionWithCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, paymentMethodId } = req.body;

      if (!transactionId || !paymentMethodId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const transaction = await this.escrowKenyaService.fundEscrowTransaction(transactionId, {
        type: 'card',
        details: { paymentMethodId },
      });

      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction funded successfully with card',
      });
    } catch (error) {
      console.error('Fund escrow with card error:', error);
      res.status(500).json({ 
        error: 'Failed to fund escrow transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Release escrow funds
   */
  releaseFunds = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, reason } = req.body;

      if (!transactionId) {
        res.status(400).json({ error: 'Transaction ID is required' });
        return;
      }

      const transaction = await this.escrowKenyaService.releaseEscrowFunds(
        transactionId,
        reason || 'Order completed successfully'
      );

      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Escrow funds released successfully',
      });
    } catch (error) {
      console.error('Release escrow funds error:', error);
      res.status(500).json({ 
        error: 'Failed to release escrow funds',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Refund escrow transaction
   */
  refundTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, reason } = req.body;

      if (!transactionId || !reason) {
        res.status(400).json({ error: 'Transaction ID and reason are required' });
        return;
      }

      const transaction = await this.escrowKenyaService.refundEscrowTransaction(
        transactionId,
        reason
      );

      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction refunded successfully',
      });
    } catch (error) {
      console.error('Refund escrow transaction error:', error);
      res.status(500).json({ 
        error: 'Failed to refund transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get transaction status
   */
  getTransactionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        res.status(400).json({ error: 'Transaction ID is required' });
        return;
      }

      const transaction = await this.escrowKenyaService.getTransactionStatus(transactionId);

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error('Get transaction status error:', error);
      res.status(500).json({ 
        error: 'Failed to get transaction status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get user transaction history
   */
  getUserTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role = 'buyer' } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const transactions = await this.escrowKenyaService.getUserTransactionHistory(
        userId,
        role as 'buyer' | 'seller'
      );

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Get user transaction history error:', error);
      res.status(500).json({ 
        error: 'Failed to get transaction history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create payout
   */
  createPayout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sellerId, amount, currency, bankAccount, transactionId } = req.body;

      if (!sellerId || !amount || !bankAccount || !transactionId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const payout = await this.escrowKenyaService.createPayout({
        sellerId,
        amount,
        currency: currency || 'KES',
        bankAccount,
        transactionId,
      });

      res.status(201).json({
        success: true,
        data: payout,
        message: 'Payout created successfully',
      });
    } catch (error) {
      console.error('Create payout error:', error);
      res.status(500).json({ 
        error: 'Failed to create payout',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get payout status
   */
  getPayoutStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payoutId } = req.params;

      if (!payoutId) {
        res.status(400).json({ error: 'Payout ID is required' });
        return;
      }

      const payout = await this.escrowKenyaService.getPayoutStatus(payoutId);

      res.status(200).json({
        success: true,
        data: payout,
      });
    } catch (error) {
      console.error('Get payout status error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get seller payout history
   */
  getSellerPayoutHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sellerId } = req.params;

      if (!sellerId) {
        res.status(400).json({ error: 'Seller ID is required' });
        return;
      }

      const payouts = await this.escrowKenyaService.getSellerPayoutHistory(sellerId);

      res.status(200).json({
        success: true,
        data: payouts,
      });
    } catch (error) {
      console.error('Get seller payout history error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Handle Escrow Kenya webhook
   */
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['x-escrow-kenya-signature'] as string;
      const webhookData = {
        signature,
        payload: req.body,
      };

      await this.escrowKenyaService.handleWebhook(webhookData);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Escrow Kenya webhook error:', error);
      res.status(400).json({ 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Handle M-Pesa callback
   */
  handleMpesaCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, status, mpesaReceiptNumber, responseDescription } = req.body;

      // Update M-Pesa payment record
      const updateQuery = `
        UPDATE mpesa_payments 
        SET status = $1, mpesa_receipt_number = $2, response_description = $3,
            completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END,
            updated_at = NOW()
        WHERE transaction_id = $4
      `;

      await this.escrowKenyaService['pool'].query(updateQuery, [
        status,
        mpesaReceiptNumber,
        responseDescription,
        transactionId,
      ]);

      // If payment was successful, update escrow transaction
      if (status === 'completed') {
        await this.escrowKenyaService.fundEscrowTransaction(transactionId, {
          type: 'mpesa',
          details: { mpesaReceiptNumber },
        });
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      res.status(500).json({ 
        error: 'Callback processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get escrow statistics
   */
  getEscrowStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const statsQuery = `
        SELECT * FROM get_escrow_kenya_stats($1, $2)
      `;

      const result = await this.escrowKenyaService['pool'].query(statsQuery, [
        startDate || null,
        endDate || null,
      ]);

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get escrow stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get escrow statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get M-Pesa statistics
   */
  getMpesaStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const statsQuery = `
        SELECT * FROM get_mpesa_stats($1, $2)
      `;

      const result = await this.escrowKenyaService['pool'].query(statsQuery, [
        startDate || null,
        endDate || null,
      ]);

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get M-Pesa stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get M-Pesa statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
