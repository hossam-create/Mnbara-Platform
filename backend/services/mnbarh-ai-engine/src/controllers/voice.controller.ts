// Voice Controller - Voice Assistant
// متحكم الصوت - المساعد الصوتي

import { Request, Response } from 'express';
import { voiceService } from '../services/voice.service';

export class VoiceController {
  // Process voice input
  async processVoice(req: Request, res: Response) {
    try {
      const { sessionId, userId, language } = req.body;
      const audioFile = req.file;

      if (!sessionId || !audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and audio file are required',
          messageAr: 'معرف الجلسة والملف الصوتي مطلوبان'
        });
      }

      const result = await voiceService.processVoiceInput({
        audio: audioFile.buffer,
        sessionId,
        userId,
        language
      });

      // Emit via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(sessionId).emit('voice_response', {
          transcription: result.transcription,
          response: result.response,
          language: result.language
        });
      }

      res.json({
        success: true,
        data: {
          transcription: result.transcription,
          response: result.response,
          language: result.language,
          hasAudio: !!result.audioResponse
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'حدث خطأ في معالجة الصوت'
      });
    }
  }

  // Speech to text only
  async speechToText(req: Request, res: Response) {
    try {
      const { language } = req.body;
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required',
          messageAr: 'الملف الصوتي مطلوب'
        });
      }

      const result = await voiceService.speechToText(audioFile.buffer, language);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Text to speech only
  async textToSpeech(req: Request, res: Response) {
    try {
      const { text, language } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required',
          messageAr: 'النص مطلوب'
        });
      }

      const audioBuffer = await voiceService.textToSpeech(text, language || 'ar');

      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length
      });
      res.send(audioBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get supported languages
  async getSupportedLanguages(req: Request, res: Response) {
    try {
      const languages = voiceService.getSupportedLanguages();

      res.json({
        success: true,
        data: languages
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Detect wake word
  async detectWakeWord(req: Request, res: Response) {
    try {
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }

      const result = await voiceService.detectWakeWord(audioFile.buffer);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Process voice command
  async processCommand(req: Request, res: Response) {
    try {
      const { command, language } = req.body;

      if (!command) {
        return res.status(400).json({
          success: false,
          message: 'Command is required',
          messageAr: 'الأمر مطلوب'
        });
      }

      const result = await voiceService.processVoiceCommand(command, language || 'ar');

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const voiceController = new VoiceController();
