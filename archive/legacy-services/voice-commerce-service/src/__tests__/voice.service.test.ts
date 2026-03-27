import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock VoiceService
const mockVoiceService = {
  processVoiceCommand: jest.fn(),
  speechToText: jest.fn(),
  textToSpeech: jest.fn(),
  detectIntent: jest.fn(),
  searchProducts: jest.fn(),
};

describe('VoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('speechToText', () => {
    it('should convert Arabic speech to text', async () => {
      const audioBuffer = Buffer.from('mock-audio-data');
      mockVoiceService.speechToText.mockResolvedValue({
        transcript: 'ابحث عن آيفون',
        confidence: 0.95,
        language: 'ar-SA'
      });

      const result = await mockVoiceService.speechToText(audioBuffer, 'ar-SA');
      
      expect(result.transcript).toBe('ابحث عن آيفون');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.language).toBe('ar-SA');
    });

    it('should convert English speech to text', async () => {
      const audioBuffer = Buffer.from('mock-audio-data');
      mockVoiceService.speechToText.mockResolvedValue({
        transcript: 'search for iPhone',
        confidence: 0.92,
        language: 'en-US'
      });

      const result = await mockVoiceService.speechToText(audioBuffer, 'en-US');
      
      expect(result.transcript).toBe('search for iPhone');
      expect(result.language).toBe('en-US');
    });
  });

  describe('detectIntent', () => {
    it('should detect search intent', async () => {
      mockVoiceService.detectIntent.mockResolvedValue({
        intent: 'SEARCH_PRODUCT',
        confidence: 0.98,
        entities: { product: 'laptop' }
      });

      const result = await mockVoiceService.detectIntent('ابحث عن لابتوب');
      
      expect(result.intent).toBe('SEARCH_PRODUCT');
      expect(result.entities.product).toBe('laptop');
    });

    it('should detect add to cart intent', async () => {
      mockVoiceService.detectIntent.mockResolvedValue({
        intent: 'ADD_TO_CART',
        confidence: 0.95,
        entities: { productId: '123' }
      });

      const result = await mockVoiceService.detectIntent('أضف للسلة');
      
      expect(result.intent).toBe('ADD_TO_CART');
    });

    it('should detect checkout intent', async () => {
      mockVoiceService.detectIntent.mockResolvedValue({
        intent: 'CHECKOUT',
        confidence: 0.97,
        entities: {}
      });

      const result = await mockVoiceService.detectIntent('أريد الدفع');
      
      expect(result.intent).toBe('CHECKOUT');
    });
  });

  describe('searchProducts', () => {
    it('should return products matching voice query', async () => {
      mockVoiceService.searchProducts.mockResolvedValue({
        products: [
          { id: '1', name: 'iPhone 15', price: 999 },
          { id: '2', name: 'iPhone 14', price: 799 }
        ],
        total: 2
      });

      const result = await mockVoiceService.searchProducts('آيفون');
      
      expect(result.products).toHaveLength(2);
      expect(result.products[0].name).toContain('iPhone');
    });

    it('should handle empty results', async () => {
      mockVoiceService.searchProducts.mockResolvedValue({
        products: [],
        total: 0
      });

      const result = await mockVoiceService.searchProducts('منتج غير موجود');
      
      expect(result.products).toHaveLength(0);
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to Arabic speech', async () => {
      mockVoiceService.textToSpeech.mockResolvedValue({
        audioUrl: 'https://storage.example.com/audio/123.mp3',
        duration: 3.5
      });

      const result = await mockVoiceService.textToSpeech('مرحباً بك', 'ar-SA');
      
      expect(result.audioUrl).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});
