/**
 * Intent Classifier Service Tests
 * Verifies deterministic behavior
 */

import { intentClassifierService } from '../services/intent-classifier.service';
import { IntentType, IntentConfidence } from '../types/ai-core.types';

describe('IntentClassifierService', () => {
  describe('classify', () => {
    it('should classify BUY intent from action keyword', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'buy this item' },
      });

      expect(result.type).toBe(IntentType.BUY);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.signals).toHaveLength(1);
      expect(result.signals[0].source).toBe('action_keyword');
    });

    it('should classify SELL intent from action keyword', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'sell my phone' },
      });

      expect(result.type).toBe(IntentType.SELL);
    });

    it('should classify EXCHANGE intent from action keyword', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'swap items' },
      });

      expect(result.type).toBe(IntentType.EXCHANGE);
    });

    it('should classify TRANSFER intent from action keyword', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'transfer to friend' },
      });

      expect(result.type).toBe(IntentType.TRANSFER);
    });

    it('should classify from page context', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { page_context: '/checkout/payment' },
      });

      expect(result.type).toBe(IntentType.BUY);
      expect(result.signals[0].source).toBe('page_context');
    });

    it('should combine multiple signals', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: {
          action_keyword: 'purchase',
          page_context: '/checkout',
          item_interaction: 'add_to_cart',
        },
      });

      expect(result.type).toBe(IntentType.BUY);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.signals.length).toBeGreaterThanOrEqual(2);
    });

    it('should return UNKNOWN for unrecognized signals', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'random text' },
      });

      expect(result.type).toBe(IntentType.UNKNOWN);
    });

    it('should return HIGH confidence for strong signals', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: {
          action_keyword: 'buy',
          page_context: '/checkout',
          item_interaction: 'add_to_cart',
          user_history: 'frequent_buyer',
        },
      });

      expect(result.confidenceLevel).toBe(IntentConfidence.HIGH);
    });

    it('should be deterministic - same inputs produce same outputs', () => {
      const input = {
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'buy', page_context: '/product' },
      };

      const result1 = intentClassifierService.classify(input);
      const result2 = intentClassifierService.classify(input);

      expect(result1.type).toBe(result2.type);
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.signals).toEqual(result2.signals);
    });

    it('should include timestamp in result', () => {
      const result = intentClassifierService.classify({
        userId: 'user-1',
        context: {},
        signals: { action_keyword: 'buy' },
      });

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
