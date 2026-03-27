// Voice Controller - متحكم الصوت

import { Request, Response } from 'express';
import { voiceService } from '../services/voice.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const voiceController = {
  // Process voice command
  async processCommand(req: Request, res: Response) {
    try {
      const { userId, language, sessionId } = req.body;
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({ success: false, error: 'Audio file required', errorAr: 'ملف صوتي مطلوب' });
      }

      const result = await voiceService.processVoiceCommand(
        userId,
        audioFile.buffer,
        language || 'ar-SA',
        sessionId
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Process text command (for testing)
  async processTextCommand(req: Request, res: Response) {
    try {
      const { userId, text, language } = req.body;

      // Create a mock audio buffer for text-based testing
      const mockBuffer = Buffer.from(text);
      
      const result = await voiceService.processVoiceCommand(
        userId,
        mockBuffer,
        language || 'ar-SA'
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get user sessions
  async getUserSessions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const sessions = await prisma.voiceSession.findMany({
        where: { userId },
        include: { commands: { take: 5, orderBy: { createdAt: 'desc' } } },
        orderBy: { startedAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      });

      res.json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get session details
  async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const session = await prisma.voiceSession.findUnique({
        where: { id: sessionId },
        include: { commands: { orderBy: { createdAt: 'asc' } } },
      });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found', errorAr: 'الجلسة غير موجودة' });
      }

      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // End session
  async endSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const session = await prisma.voiceSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endedAt: new Date() },
      });

      res.json({ success: true, data: session, message: 'Session ended', messageAr: 'تم إنهاء الجلسة' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get user preferences
  async getPreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const prefs = await voiceService.getUserPreferences(userId);
      res.json({ success: true, data: prefs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update user preferences
  async updatePreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const prefs = await voiceService.updateUserPreferences(userId, req.body);
      res.json({ success: true, data: prefs, message: 'Preferences updated', messageAr: 'تم تحديث التفضيلات' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Synthesize speech
  async synthesizeSpeech(req: Request, res: Response) {
    try {
      const { text, language } = req.body;
      const audioUrl = await voiceService.synthesizeSpeech(text, language || 'ar-SA');
      res.json({ success: true, data: { audioUrl } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
