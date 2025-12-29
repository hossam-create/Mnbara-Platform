// Voice Routes - Voice Assistant
// مسارات الصوت - المساعد الصوتي

import { Router } from 'express';
import multer from 'multer';
import { voiceController } from '../controllers/voice.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Process voice input (full pipeline: STT -> AI -> TTS)
router.post('/process', upload.single('audio'), voiceController.processVoice.bind(voiceController));

// Speech to text only
router.post('/stt', upload.single('audio'), voiceController.speechToText.bind(voiceController));

// Text to speech only
router.post('/tts', voiceController.textToSpeech.bind(voiceController));

// Get supported languages
router.get('/languages', voiceController.getSupportedLanguages.bind(voiceController));

// Detect wake word ("Hey Mnbara" / "يا منبرة")
router.post('/wake-word', upload.single('audio'), voiceController.detectWakeWord.bind(voiceController));

// Process voice command
router.post('/command', voiceController.processCommand.bind(voiceController));

export default router;
