/**
 * Voice Processing Service
 * Speech-to-text and voice command processing
 */

import { 
  VoiceProcessingResult, 
  VoiceCommand, 
  VoiceAction 
} from '../types/ai-buyer.types';
import { logger } from '../utils/logger';

export class VoiceProcessingService {
  private isInitialized = false;
  private language = 'en-US';

  // Voice command patterns
  private commandPatterns: Record<VoiceAction, RegExp[]> = {
    [VoiceAction.SEARCH]: [
      /find\s+(me\s+)?(.+)/i,
      /search\s+(for\s+)?(.+)/i,
      /look\s+(for\s+)?(.+)/i,
      /show\s+(me\s+)?(.+)/i
    ],
    [VoiceAction.FILTER]: [
      /filter\s+(by\s+)?(.+)/i,
      /only\s+(show\s+)?(.+)/i,
      /(.+)\s+(price|condition|category)/i
    ],
    [VoiceAction.SORT]: [
      /sort\s+(by\s+)?(.+)/i,
      /order\s+(by\s+)?(.+)/i,
      /(.+)\s+(ascending|descending|low|high)/i
    ],
    [VoiceAction.NAVIGATE]: [
      /go\s+(to\s+)?(.+)/i,
      /open\s+(.+)/i,
      /navigate\s+(to\s+)?(.+)/i
    ],
    [VoiceAction.ADD_TO_CART]: [
      /add\s+(.+)\s+(to\s+cart|to\s+basket)/i,
      /put\s+(.+)\s+(in\s+cart|in\s+basket)/i,
      /(.+)\s+to\s+cart/i
    ],
    [VoiceAction.COMPARE]: [
      /compare\s+(.+)/i,
      /vs\s+(.+)|(.+)\s+vs\s+(.+)/i
    ],
    [VoiceAction.DETAILS]: [
      /details\s+(of\s+)?(.+)/i,
      /more\s+info\s+(on\s+)?(.+)/i,
      /(.+)\s+specs/i
    ],
    [VoiceAction.UNKNOWN]: []
  };

  /**
   * Initialize voice processing service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Voice Processing Service...');
      
      // In production, initialize Google Cloud Speech or similar
      this.isInitialized = true;
      logger.info('Voice Processing Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Voice Processing Service:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }

  /**
   * Process audio and convert to text
   */
  async processAudio(audioBuffer: Buffer, language?: string): Promise<VoiceProcessingResult> {
    const startTime = Date.now();
    
    try {
      // In production, use Google Cloud Speech-to-Text
      const mockTranscript = await this.mockSpeechToText(audioBuffer, language);
      
      const result: VoiceProcessingResult = {
        transcript: mockTranscript.transcript,
        confidence: mockTranscript.confidence,
        language: language || this.language,
        alternatives: mockTranscript.alternatives,
        processingTimeMs: Date.now() - startTime
      };

      logger.info(`Voice processed: "${result.transcript}" (${result.processingTimeMs}ms)`);
      
      return result;
    } catch (error) {
      logger.error('Voice processing failed:', error);
      throw error;
    }
  }

  /**
   * Process audio from base64 data
   */
  async processBase64Audio(audioData: string, language?: string): Promise<VoiceProcessingResult> {
    try {
      const audioBuffer = Buffer.from(audioData, 'base64');
      return await this.processAudio(audioBuffer, language);
    } catch (error) {
      logger.error('Base64 audio processing failed:', error);
      throw error;
    }
  }

  /**
   * Extract voice command from transcript
   */
  extractCommand(transcript: string): VoiceCommand {
    const normalizedTranscript = transcript.trim().toLowerCase();
    let action = VoiceAction.UNKNOWN;
    let parameters: Record<string, any> = {};
    let confidence = 0;

    // Match against command patterns
    for (const [voiceAction, patterns] of Object.entries(this.commandPatterns)) {
      if (voiceAction === VoiceAction.UNKNOWN) continue;
      
      for (const pattern of patterns) {
        const match = normalizedTranscript.match(pattern);
        if (match) {
          action = voiceAction as VoiceAction;
          confidence = this.calculateConfidence(match);
          parameters = this.extractParameters(action, match);
          break;
        }
      }
      if (action !== VoiceAction.UNKNOWN) break;
    }

    // Default to SEARCH if no pattern matched
    if (action === VoiceAction.UNKNOWN && normalizedTranscript.length > 0) {
      action = VoiceAction.SEARCH;
      parameters.query = normalizedTranscript;
      confidence = 0.7;
    }

    return { action, parameters, confidence, rawTranscript: transcript };
  }

  /**
   * Extract parameters based on voice action
   */
  private extractParameters(action: VoiceAction, match: RegExpMatchArray): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (action) {
      case VoiceAction.SEARCH:
        const queryMatch = match[match.length - 1];
        if (queryMatch && queryMatch.trim()) {
          parameters.query = queryMatch.trim();
        }
        break;
      case VoiceAction.FILTER:
        parameters.filters = this.parseFilters(match[match.length - 1]);
        break;
      case VoiceAction.SORT:
        parameters.sortBy = match[match.length - 1];
        break;
      case VoiceAction.ADD_TO_CART:
        parameters.productName = match[1];
        break;
      case VoiceAction.COMPARE:
        parameters.compareTarget = match[1] || match[2];
        break;
      case VoiceAction.DETAILS:
        parameters.productName = match[1];
        break;
      case VoiceAction.NAVIGATE:
        parameters.destination = match[1];
        break;
    }

    return parameters;
  }

  /**
   * Parse filter expressions
   */
  private parseFilters(filterText: string): Record<string, any> {
    const filters: Record<string, any> = {};
    
    const priceMatch = filterText.match(/under\s+\$?(\d+)/i);
    if (priceMatch) filters.maxPrice = parseFloat(priceMatch[1]);
    
    const priceMatch2 = filterText.match(/over\s+\$?(\d+)/i);
    if (priceMatch2) filters.minPrice = parseFloat(priceMatch2[1]);

    if (/new/i.test(filterText)) filters.condition = 'NEW';
    else if (/used|secondhand/i.test(filterText)) filters.condition = 'USED';

    const categories = ['electronics', 'clothing', 'furniture', 'vehicles', 'sports'];
    for (const category of categories) {
      if (new RegExp(category, 'i').test(filterText)) {
        filters.category = category;
        break;
      }
    }

    return filters;
  }

  /**
   * Calculate confidence based on match quality
   */
  private calculateConfidence(match: RegExpMatchArray): number {
    if (!match) return 0;
    const matchedLength = match[0].length;
    const totalLength = match.input?.length || matchedLength;
    const ratio = matchedLength / totalLength;
    const hasContent = match.slice(1).some(g => g && g.trim().length > 0);
    return Math.min(0.95, 0.7 + (ratio * 0.2) + (hasContent ? 0.1 : 0));
  }

  /**
   * Mock speech-to-text for development
   */
  private async mockSpeechToText(
    audioBuffer: Buffer, 
    language?: string
  ): Promise<{
    transcript: string;
    confidence: number;
    alternatives: { transcript: string; confidence: number }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      transcript: 'find me a smartphone under $500',
      confidence: 0.92,
      alternatives: [
        { transcript: 'find me a phone under $500', confidence: 0.85 },
        { transcript: 'find smartphones under $500', confidence: 0.78 }
      ]
    };
  }
}

export default VoiceProcessingService;
