// Session Controller - متحكم الجلسات

import { Request, Response } from 'express';
import { arService } from '../services/ar.service';

export const sessionController = {
  async startSession(req: Request, res: Response) {
    try {
      const session = await arService.startSession(req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async endSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await arService.endSession(sessionId, req.body);
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await arService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found', errorAr: 'الجلسة غير موجودة' });
      }

      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getUserSessions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;
      const result = await arService.getUserSessions(
        userId,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async saveScreenshot(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const screenshot = await arService.saveScreenshot({ sessionId, ...req.body });
      res.status(201).json({ success: true, data: screenshot });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getUserScreenshots(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;
      const result = await arService.getUserScreenshots(
        userId,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async shareScreenshot(req: Request, res: Response) {
    try {
      const { screenshotId } = req.params;
      const screenshot = await arService.shareScreenshot(screenshotId);
      res.json({ success: true, data: screenshot, message: 'Screenshot shared', messageAr: 'تم مشاركة الصورة' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
