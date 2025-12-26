import { Request, Response } from 'express';
import { PrismaClient, MatchStatus } from '@prisma/client';
import { matchingEngine } from '../index';

const prisma = new PrismaClient();

export class MatchingController {
  async getMatchProposals(req: Request, res: Response) {
    try {
      const { transferId } = req.params;
      const matches = await prisma.settlementMatch.findMany({
        where: { requestId: transferId, status: MatchStatus.PROPOSED },
        include: { counterRequest: true },
        orderBy: { matchScore: 'desc' }
      });
      res.json({ success: true, data: matches });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async acceptMatch(req: Request, res: Response) {
    try {
      const { matchId } = req.params;
      const { userId, isRequester } = req.body;

      const match = await prisma.settlementMatch.findUnique({ where: { id: matchId } });
      if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

      const updateData = isRequester 
        ? { requestAccepted: true }
        : { counterAccepted: true };

      const updated = await prisma.settlementMatch.update({
        where: { id: matchId },
        data: updateData
      });

      // إذا قبل الطرفان
      if (updated.requestAccepted && updated.counterAccepted) {
        await prisma.settlementMatch.update({
          where: { id: matchId },
          data: { status: MatchStatus.ACCEPTED, acceptedAt: new Date() }
        });
        await matchingEngine.executeMatch(matchId);
      }

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async rejectMatch(req: Request, res: Response) {
    try {
      const { matchId } = req.params;
      const match = await prisma.settlementMatch.update({
        where: { id: matchId },
        data: { status: MatchStatus.REJECTED }
      });
      res.json({ success: true, data: match });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMatchStatus(req: Request, res: Response) {
    try {
      const { matchId } = req.params;
      const match = await prisma.settlementMatch.findUnique({
        where: { id: matchId },
        include: { request: true, counterRequest: true }
      });
      res.json({ success: true, data: match });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async confirmSettlement(req: Request, res: Response) {
    try {
      const { matchId } = req.params;
      const result = await matchingEngine.completeSettlement(matchId);
      res.json({ success: true, data: result, message: 'تمت التسوية بنجاح' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
