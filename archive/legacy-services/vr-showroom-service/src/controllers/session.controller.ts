// Session Controller - متحكم الجلسات

import { Request, Response } from 'express';
import { showroomService } from '../services/showroom.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sessionController = {
  async startSession(req: Request, res: Response) {
    try {
      const session = await showroomService.startSession(req.body.showroomId, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async endSession(req: Request, res: Response) {
    try {
      const session = await showroomService.endSession(req.params.sessionId, req.body);
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getSession(req: Request, res: Response) {
    try {
      const session = await prisma.vRSession.findUnique({ where: { id: req.params.sessionId } });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getUserSessions(req: Request, res: Response) {
    try {
      const sessions = await prisma.vRSession.findMany({
        where: { userId: req.params.userId },
        orderBy: { startedAt: 'desc' },
        take: 20,
      });
      res.json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
