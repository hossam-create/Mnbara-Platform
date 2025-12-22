/**
 * Intent Classifier Service
 * Deterministic intent classification based on signals
 * NO ML training, NO external API calls
 */

import {
  IntentType,
  IntentConfidence,
  IntentClassification,
  IntentSignal,
  ClassifyIntentRequest,
} from '../types/ai-core.types';

// Signal weights for deterministic classification
const SIGNAL_WEIGHTS: Record<string, Record<IntentType, number>> = {
  action_keyword: {
    [IntentType.BUY]: 0.4,
    [IntentType.SELL]: 0.4,
    [IntentType.EXCHANGE]: 0.4,
    [IntentType.TRANSFER]: 0.4,
    [IntentType.UNKNOWN]: 0,
  },
  page_context: {
    [IntentType.BUY]: 0.2,
    [IntentType.SELL]: 0.2,
    [IntentType.EXCHANGE]: 0.2,
    [IntentType.TRANSFER]: 0.2,
    [IntentType.UNKNOWN]: 0,
  },
  user_history: {
    [IntentType.BUY]: 0.2,
    [IntentType.SELL]: 0.2,
    [IntentType.EXCHANGE]: 0.2,
    [IntentType.TRANSFER]: 0.2,
    [IntentType.UNKNOWN]: 0,
  },
  item_interaction: {
    [IntentType.BUY]: 0.2,
    [IntentType.SELL]: 0.2,
    [IntentType.EXCHANGE]: 0.2,
    [IntentType.TRANSFER]: 0.2,
    [IntentType.UNKNOWN]: 0,
  },
};

// Keyword mappings for intent detection
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  [IntentType.BUY]: ['buy', 'purchase', 'order', 'checkout', 'add to cart', 'bid'],
  [IntentType.SELL]: ['sell', 'list', 'post', 'offer', 'auction', 'create listing'],
  [IntentType.EXCHANGE]: ['swap', 'exchange', 'trade', 'barter'],
  [IntentType.TRANSFER]: ['transfer', 'send', 'gift', 'donate'],
  [IntentType.UNKNOWN]: [],
};

// Page context mappings
const PAGE_INTENT_MAP: Record<string, IntentType> = {
  '/checkout': IntentType.BUY,
  '/cart': IntentType.BUY,
  '/product': IntentType.BUY,
  '/auction': IntentType.BUY,
  '/sell': IntentType.SELL,
  '/listing/create': IntentType.SELL,
  '/my-listings': IntentType.SELL,
  '/swap': IntentType.EXCHANGE,
  '/exchange': IntentType.EXCHANGE,
  '/transfer': IntentType.TRANSFER,
  '/send': IntentType.TRANSFER,
};

export class IntentClassifierService {
  /**
   * Classify user intent based on provided signals
   * Deterministic algorithm - same inputs always produce same outputs
   */
  classify(request: ClassifyIntentRequest): IntentClassification {
    const signals: IntentSignal[] = [];
    const intentScores: Record<IntentType, number> = {
      [IntentType.BUY]: 0,
      [IntentType.SELL]: 0,
      [IntentType.EXCHANGE]: 0,
      [IntentType.TRANSFER]: 0,
      [IntentType.UNKNOWN]: 0,
    };

    // Process action keywords
    if (request.signals.action_keyword) {
      const keywordSignal = this.processKeywordSignal(request.signals.action_keyword);
      if (keywordSignal) {
        signals.push(keywordSignal);
        intentScores[keywordSignal.value as IntentType] += keywordSignal.weight;
      }
    }

    // Process page context
    if (request.signals.page_context) {
      const pageSignal = this.processPageContextSignal(request.signals.page_context);
      if (pageSignal) {
        signals.push(pageSignal);
        intentScores[pageSignal.value as IntentType] += pageSignal.weight;
      }
    }

    // Process user history
    if (request.signals.user_history) {
      const historySignal = this.processHistorySignal(request.signals.user_history);
      if (historySignal) {
        signals.push(historySignal);
        intentScores[historySignal.value as IntentType] += historySignal.weight;
      }
    }

    // Process item interaction
    if (request.signals.item_interaction) {
      const itemSignal = this.processItemInteractionSignal(request.signals.item_interaction);
      if (itemSignal) {
        signals.push(itemSignal);
        intentScores[itemSignal.value as IntentType] += itemSignal.weight;
      }
    }

    // Determine winning intent
    const { type, confidence } = this.determineIntent(intentScores);

    return {
      type,
      confidence,
      confidenceLevel: this.getConfidenceLevel(confidence),
      signals,
      timestamp: new Date().toISOString(),
    };
  }

  private processKeywordSignal(keyword: string): IntentSignal | null {
    const normalizedKeyword = keyword.toLowerCase().trim();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((k) => normalizedKeyword.includes(k))) {
        return {
          source: 'action_keyword',
          weight: SIGNAL_WEIGHTS.action_keyword[intent as IntentType],
          value: intent,
        };
      }
    }

    return null;
  }

  private processPageContextSignal(pageUrl: string): IntentSignal | null {
    const normalizedUrl = pageUrl.toLowerCase();

    for (const [path, intent] of Object.entries(PAGE_INTENT_MAP)) {
      if (normalizedUrl.includes(path)) {
        return {
          source: 'page_context',
          weight: SIGNAL_WEIGHTS.page_context[intent],
          value: intent,
        };
      }
    }

    return null;
  }

  private processHistorySignal(historyType: string): IntentSignal | null {
    const historyIntentMap: Record<string, IntentType> = {
      frequent_buyer: IntentType.BUY,
      frequent_seller: IntentType.SELL,
      active_trader: IntentType.EXCHANGE,
      gift_sender: IntentType.TRANSFER,
    };

    const intent = historyIntentMap[historyType.toLowerCase()];
    if (intent) {
      return {
        source: 'user_history',
        weight: SIGNAL_WEIGHTS.user_history[intent],
        value: intent,
      };
    }

    return null;
  }

  private processItemInteractionSignal(interaction: string): IntentSignal | null {
    const interactionIntentMap: Record<string, IntentType> = {
      view_listing: IntentType.BUY,
      add_to_cart: IntentType.BUY,
      place_bid: IntentType.BUY,
      create_listing: IntentType.SELL,
      edit_listing: IntentType.SELL,
      propose_swap: IntentType.EXCHANGE,
      initiate_transfer: IntentType.TRANSFER,
    };

    const intent = interactionIntentMap[interaction.toLowerCase()];
    if (intent) {
      return {
        source: 'item_interaction',
        weight: SIGNAL_WEIGHTS.item_interaction[intent],
        value: intent,
      };
    }

    return null;
  }

  private determineIntent(scores: Record<IntentType, number>): { type: IntentType; confidence: number } {
    let maxScore = 0;
    let winningIntent = IntentType.UNKNOWN;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winningIntent = intent as IntentType;
      }
    }

    // Normalize confidence to 0-1 range (max possible score is 1.0)
    const confidence = Math.min(maxScore, 1.0);

    // If confidence is too low, return UNKNOWN
    if (confidence < 0.2) {
      return { type: IntentType.UNKNOWN, confidence };
    }

    return { type: winningIntent, confidence };
  }

  private getConfidenceLevel(confidence: number): IntentConfidence {
    if (confidence >= 0.8) return IntentConfidence.HIGH;
    if (confidence >= 0.5) return IntentConfidence.MEDIUM;
    return IntentConfidence.LOW;
  }
}

export const intentClassifierService = new IntentClassifierService();
