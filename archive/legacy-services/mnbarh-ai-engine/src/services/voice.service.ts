// Voice Service - Speech-to-Text & Text-to-Speech
// خدمة الصوت - تحويل الكلام لنص والنص لكلام

import { HfInference } from '@huggingface/inference';
import { assistantService } from './assistant.service';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Supported languages for voice
const VOICE_LANGUAGES = {
  ar: { name: 'Arabic', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-ara' },
  en: { name: 'English', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-eng' },
  fr: { name: 'French', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-fra' },
  de: { name: 'German', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-deu' },
  es: { name: 'Spanish', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-spa' },
  zh: { name: 'Chinese', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-cmn' },
  ja: { name: 'Japanese', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-jpn' },
  ko: { name: 'Korean', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-kor' },
  hi: { name: 'Hindi', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-hin' },
  tr: { name: 'Turkish', sttModel: 'openai/whisper-large-v3', ttsModel: 'facebook/mms-tts-tur' }
};

export class VoiceService {
  // Process voice input (Speech-to-Text -> AI -> Text-to-Speech)
  async processVoiceInput(data: {
    audio: Buffer;
    sessionId: string;
    userId?: string;
    language?: string;
  }): Promise<{
    transcription: string;
    response: string;
    audioResponse?: Buffer;
    language: string;
  }> {
    // Step 1: Transcribe audio to text
    const transcription = await this.speechToText(data.audio, data.language);

    // Step 2: Process with AI assistant
    const aiResponse = await assistantService.chat({
      sessionId: data.sessionId,
      userId: data.userId,
      message: transcription.text,
      language: transcription.language
    });

    // Step 3: Convert response to speech
    const audioResponse = await this.textToSpeech(
      aiResponse.response,
      transcription.language
    );

    return {
      transcription: transcription.text,
      response: aiResponse.response,
      audioResponse,
      language: transcription.language
    };
  }

  // Speech to Text
  async speechToText(audio: Buffer, language?: string): Promise<{
    text: string;
    language: string;
    confidence: number;
  }> {
    try {
      // Use Whisper for transcription
      const response = await hf.automaticSpeechRecognition({
        model: 'openai/whisper-large-v3',
        data: audio
      });

      // Detect language from transcription if not provided
      const detectedLanguage = language || await this.detectLanguageFromText(response.text);

      return {
        text: response.text,
        language: detectedLanguage,
        confidence: 0.95
      };
    } catch (error) {
      console.error('STT Error:', error);
      throw new Error('Speech recognition failed');
    }
  }

  // Text to Speech
  async textToSpeech(text: string, language = 'ar'): Promise<Buffer> {
    try {
      const langConfig = VOICE_LANGUAGES[language as keyof typeof VOICE_LANGUAGES] 
        || VOICE_LANGUAGES.en;

      const response = await hf.textToSpeech({
        model: langConfig.ttsModel,
        inputs: text
      });

      // Convert blob to buffer
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('TTS Error:', error);
      throw new Error('Text to speech failed');
    }
  }

  // Detect language from text
  private async detectLanguageFromText(text: string): Promise<string> {
    // Arabic detection
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return 'ar';

    // Chinese
    const chinesePattern = /[\u4E00-\u9FFF]/;
    if (chinesePattern.test(text)) return 'zh';

    // Japanese
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    if (japanesePattern.test(text)) return 'ja';

    // Korean
    const koreanPattern = /[\uAC00-\uD7AF]/;
    if (koreanPattern.test(text)) return 'ko';

    return 'en';
  }

  // Get supported languages
  getSupportedLanguages() {
    return Object.entries(VOICE_LANGUAGES).map(([code, config]) => ({
      code,
      name: config.name
    }));
  }

  // Wake word detection (for "Hey Mnbara" / "يا منبرة")
  async detectWakeWord(audio: Buffer): Promise<{
    detected: boolean;
    confidence: number;
  }> {
    try {
      // Transcribe and check for wake words
      const transcription = await this.speechToText(audio);
      const text = transcription.text.toLowerCase();

      const wakeWords = [
        'hey mnbara', 'hi mnbara', 'mnbara',
        'يا منبرة', 'منبرة', 'هاي منبرة'
      ];

      const detected = wakeWords.some(word => text.includes(word));

      return {
        detected,
        confidence: detected ? 0.9 : 0.1
      };
    } catch {
      return { detected: false, confidence: 0 };
    }
  }

  // Real-time voice streaming (for continuous conversation)
  async processVoiceStream(
    audioChunks: Buffer[],
    sessionId: string,
    userId?: string,
    onTranscription?: (text: string) => void,
    onResponse?: (text: string, audio: Buffer) => void
  ) {
    // Combine audio chunks
    const fullAudio = Buffer.concat(audioChunks);

    // Process
    const result = await this.processVoiceInput({
      audio: fullAudio,
      sessionId,
      userId
    });

    // Callbacks
    if (onTranscription) onTranscription(result.transcription);
    if (onResponse && result.audioResponse) {
      onResponse(result.response, result.audioResponse);
    }

    return result;
  }

  // Voice command shortcuts
  async processVoiceCommand(command: string, language = 'ar'): Promise<{
    action: string;
    parameters: any;
    response: string;
  }> {
    const lowerCommand = command.toLowerCase();

    // Search command
    if (lowerCommand.includes('search') || lowerCommand.includes('find') || 
        lowerCommand.includes('ابحث') || lowerCommand.includes('اين')) {
      const query = command.replace(/search|find|ابحث عن|اين/gi, '').trim();
      return {
        action: 'SEARCH',
        parameters: { query },
        response: language === 'ar' 
          ? `جاري البحث عن "${query}"...`
          : `Searching for "${query}"...`
      };
    }

    // Track order command
    if (lowerCommand.includes('track') || lowerCommand.includes('order') ||
        lowerCommand.includes('تتبع') || lowerCommand.includes('طلب')) {
      return {
        action: 'TRACK_ORDER',
        parameters: {},
        response: language === 'ar'
          ? 'جاري عرض طلباتك...'
          : 'Showing your orders...'
      };
    }

    // Cart command
    if (lowerCommand.includes('cart') || lowerCommand.includes('basket') ||
        lowerCommand.includes('سلة') || lowerCommand.includes('عربة')) {
      return {
        action: 'VIEW_CART',
        parameters: {},
        response: language === 'ar'
          ? 'جاري فتح سلة التسوق...'
          : 'Opening your cart...'
      };
    }

    // Help command
    if (lowerCommand.includes('help') || lowerCommand.includes('مساعدة')) {
      return {
        action: 'HELP',
        parameters: {},
        response: language === 'ar'
          ? 'كيف يمكنني مساعدتك؟'
          : 'How can I help you?'
      };
    }

    // Default - process as chat
    return {
      action: 'CHAT',
      parameters: { message: command },
      response: ''
    };
  }
}

export const voiceService = new VoiceService();
