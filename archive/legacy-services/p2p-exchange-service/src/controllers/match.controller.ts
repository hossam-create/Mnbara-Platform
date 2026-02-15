import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { MatchingEngineService } from '../services/matching-engine.service';
import { ProofOfPaymentService } from '../services/proof-of-payment.service';
import { SettlementCoordinatorService } from '../services/settlement-coordinator.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Match endpoints
 */
export class MatchController {
  private matchingEngineService: MatchingEngineService;
  private proofOfPaymentService: ProofOfPaymentService;
  private settlementCoordinatorService: SettlementCoordinatorService;

  constructor() {
    this.matchingEngineService = new MatchingEngineService(prisma);
    this.proofOfPaymentService = new ProofOfPaymentService(prisma);
    this.settlementCoordinatorService = new SettlementCoordinatorService(prisma);
  }

  /**
   * GET /api/v1/exchange/matches/:id
   * Get match details
   */
  getMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const match = await prisma.exchangeMatch.findUnique({
        where: { id },
        include: {
          sellerRequest: true,
          buyerRequest: true,
          settlement: true,
          proofOfPayment: true,
        },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is part of this match
      if (match.sellerId !== userId && match.buyerId !== userId && !req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.status(200).json({ match });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/matches/:id/initiate-payment
   * Initiate payment flow
   */
  initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const { paymentMethod, externalEscrowProviderId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const match = await prisma.exchangeMatch.findUnique({
        where: { id },
        include: { settlement: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is the buyer
      if (match.buyerId !== userId) {
        res.status(403).json({ error: 'Only buyer can initiate payment' });
        return;
      }

      // Check match status
      if (match.status !== 'ACCEPTED') {
        res.status(400).json({
          error: 'Invalid match status',
          message: 'Payment can only be initiated for ACCEPTED matches',
        });
        return;
      }

      // Initiate settlement
      const settlement = await this.settlementCoordinatorService.initiateSettlement(
        id,
        paymentMethod,
        externalEscrowProviderId
      );

      res.status(200).json({
        message: 'Payment initiated successfully',
        settlement,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/matches/:id/upload-proof
   * Upload proof of payment
   */
  uploadProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const { proofType, proofData, description } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const match = await prisma.exchangeMatch.findUnique({
        where: { id },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is the buyer
      if (match.buyerId !== userId) {
        res.status(403).json({ error: 'Only buyer can upload proof' });
        return;
      }

      // Check match status
      if (match.status !== 'PAYMENT_INITIATED') {
        res.status(400).json({
          error: 'Invalid match status',
          message: 'Proof can only be uploaded for PAYMENT_INITIATED matches',
        });
        return;
      }

      // Upload proof
      const proof = await this.proofOfPaymentService.uploadProof({
        matchId: id,
        userId,
        proofType,
        proofData,
        description,
      });

      // Update match status
      await prisma.exchangeMatch.update({
        where: { id },
        data: { status: 'PROOF_UPLOADED' },
      });

      res.status(201).json({
        message: 'Proof uploaded successfully',
        proof,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/matches/:id/confirm-receipt
   * Confirm receipt of funds
   */
  confirmReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const match = await prisma.exchangeMatch.findUnique({
        where: { id },
        include: { settlement: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is the seller
      if (match.sellerId !== userId) {
        res.status(403).json({ error: 'Only seller can confirm receipt' });
        return;
      }

      // Check match status
      if (match.status !== 'PROOF_UPLOADED') {
        res.status(400).json({
          error: 'Invalid match status',
          message: 'Receipt can only be confirmed for PROOF_UPLOADED matches',
        });
        return;
      }

      // Complete settlement
      const settlement = await this.settlementCoordinatorService.completeSettlement(id);

      // Update match status
      const updatedMatch = await prisma.exchangeMatch.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      res.status(200).json({
        message: 'Receipt confirmed successfully',
        match: updatedMatch,
        settlement,
      });
    } catch (error) {
      next(error);
    }
  };
}
