import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CommunicationService } from '../services/communication.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Communication endpoints
 */
export class CommunicationController {
  private communicationService: CommunicationService;

  constructor() {
    this.communicationService = new CommunicationService(prisma);
  }

  /**
   * POST /api/v1/exchange/matches/:matchId/messages
   * Send a message
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { matchId } = req.params;
      const userId = req.user?.id;
      const { content } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify match exists and user is part of it
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      if (match.sellerId !== userId && match.buyerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Send message
      const message = await this.communicationService.sendMessage({
        matchId,
        userId,
        content,
      });

      // Check for external contact
      const hasExternalContact = await this.communicationService.detectExternalContact(content);

      res.status(201).json({
        message,
        warnings: hasExternalContact ? ['External contact information detected'] : [],
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/exchange/matches/:matchId/messages
   * Get messages for a match
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { matchId } = req.params;
      const userId = req.user?.id;
      const { page = '1', limit = '50' } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify match exists and user is part of it
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      if (match.sellerId !== userId && match.buyerId !== userId && !req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Get messages
      const messages = await this.communicationService.getMatchMessages(matchId);

      // Apply pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedMessages = messages.slice(startIndex, endIndex);

      res.status(200).json({
        messages: paginatedMessages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: messages.length,
          totalPages: Math.ceil(messages.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/matches/:matchId/messages/:messageId/flag
   * Flag a message
   */
  flagMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { matchId, messageId } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify match exists and user is part of it
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      if (match.sellerId !== userId && match.buyerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Flag message
      const flaggedMessage = await this.communicationService.flagMessage(messageId, reason);

      res.status(200).json({
        message: 'Message flagged successfully',
        flaggedMessage,
      });
    } catch (error) {
      next(error);
    }
  };
}
