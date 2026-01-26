import { Request, Response, NextFunction } from 'express';
import { SettlementCoordinatorService } from '../services/settlement-coordinator.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Match endpoints
 */
export class MatchController {
  private settlementCoordinatorService: SettlementCoordinatorService;

  constructor() {
    this.settlementCoordinatorService = new SettlementCoordinatorService(prisma);
  }

  /**
   * GET /api/v1/exchange/matches/:id
   * Get match details
   */
  getMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get match from database
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
          request: true,
          settlement: true,
          proofs: true,
        },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is part of this match
      if (match.request.userId !== userId && match.acceptorId !== userId && !req.user?.isAdmin) {
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
   * Initiate payment for a match
   */
  initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { paymentMethod, paymentDetails } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get match
      const match = await prisma.exchangeMatch.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is the payer (request creator)
      if (match.request.userId !== userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only the request creator can initiate payment',
        });
        return;
      }

      // Check match status
      if (match.status !== 'MATCHED') {
        res.status(400).json({
          error: 'Invalid match status',
          message: 'Payment can only be initiated for MATCHED exchanges',
        });
        return;
      }

      // Initiate settlement
      const settlement = await this.settlementCoordinatorService.initiateSettlement({
        matchId: parseInt(id, 10),
        externalEscrowProvider: paymentMethod === 'EXTERNAL_ESCROW' ? 'tatum' : undefined,
      });

      // Update match status
      await prisma.exchangeMatch.update({
        where: { id: parseInt(id, 10) },
        data: { status: 'PAYMENT_INITIATED' },
      });

      res.status(200).json({
        message: 'Payment initiated successfully',
        settlement,
        paymentInstructions: {
          method: paymentMethod || 'BANK_TRANSFER',
          details: paymentDetails,
          deadline: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
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
      const { id } = req.params;
      const userId = req.user?.id;
      const file = req.file;
      const { description } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Get match
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: parseInt(id, 10) },
        include: { request: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is the payer
      if (match.request.userId !== userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only the payer can upload proof',
        });
        return;
      }

      // Create proof record (file upload handled by multer middleware)
      const proof = await prisma.proofOfPayment.create({
        data: {
          matchId: parseInt(id, 10),
          uploadedBy: userId,
          fileUrl: `/uploads/proofs/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          description,
          status: 'PENDING',
        },
      });

      // Update match status
      await prisma.exchangeMatch.update({
        where: { id: parseInt(id, 10) },
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
   * Confirm receipt of payment
   */
  confirmReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { confirmed, notes } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get match
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: parseInt(id, 10) },
        include: { request: true, settlement: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is the receiver (acceptor)
      if (match.acceptorId !== userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only the receiver can confirm receipt',
        });
        return;
      }

      // Check match status
      if (match.status !== 'PROOF_UPLOADED') {
        res.status(400).json({
          error: 'Invalid match status',
          message: 'Receipt can only be confirmed after proof is uploaded',
        });
        return;
      }

      if (confirmed) {
        // Complete settlement
        if (match.settlement) {
          await this.settlementCoordinatorService.completeSettlement(match.settlement.id);
        }

        // Update match status
        await prisma.exchangeMatch.update({
          where: { id: parseInt(id, 10) },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        res.status(200).json({
          message: 'Receipt confirmed successfully',
          match: await prisma.exchangeMatch.findUnique({ where: { id: parseInt(id, 10) } }),
        });
      } else {
        // Dispute the payment
        await prisma.exchangeMatch.update({
          where: { id: parseInt(id, 10) },
          data: { status: 'DISPUTED' },
        });

        res.status(200).json({
          message: 'Payment disputed',
          notes,
          nextSteps: 'Admin review required',
        });
      }
    } catch (error) {
      next(error);
    }
  };
}
