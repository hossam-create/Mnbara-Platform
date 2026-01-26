import { Request, Response, NextFunction } from 'express';
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
   * Send a message in a match
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { matchId } = req.params;
      const userId = req.user?.id;
      const { message } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user is part of the match
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: parseInt(matchId, 10) },
        include: { request: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      if (match.request.userId !== userId && match.acceptorId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Send message
      const messageRecord = await this.communicationService.sendMessage({
        matchId: parseInt(matchId, 10),
        senderId: userId,
        message,
      });

      res.status(201).json({
        message: 'Message sent successfully',
        data: messageRecord,
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
      const { matchId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user is part of the match
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: parseInt(matchId, 10) },
        include: { request: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      if (match.request.userId !== userId && match.acceptorId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Get messages
      const messages = await this.communicationService.getMatchMessages(parseInt(matchId, 10));

      res.status(200).json({ messages });
    } catch (error) {
      next(error);
    }
  };
}
