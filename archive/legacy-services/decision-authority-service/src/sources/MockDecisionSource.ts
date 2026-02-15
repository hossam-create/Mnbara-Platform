import { v4 as uuidv4 } from 'uuid';
import { IDecisionSource, DecisionRequest, DecisionResponse, DecisionStatus } from '../interfaces/IDecisionSource';

interface MockDecisionConfig {
  initialStatus?: DecisionStatus;
  delayMs?: number;
  finalStatus?: DecisionStatus;
  reason?: string;
}

/**
 * MockDecisionSource - Simulates external API for testing
 * 
 * Configurable delays and status transitions for testing
 * without requiring actual external API access.
 */
export class MockDecisionSource implements IDecisionSource {
  private decisions: Map<string, DecisionResponse> = new Map();
  private config: MockDecisionConfig;
  
  constructor(config: MockDecisionConfig = {}) {
    this.config = {
      initialStatus: config.initialStatus || DecisionStatus.PENDING,
      delayMs: config.delayMs || 1000,
      finalStatus: config.finalStatus || DecisionStatus.APPROVED,
      reason: config.reason || 'Mock decision'
    };
  }
  
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const decisionId = uuidv4();
    const response: DecisionResponse = {
      decisionId,
      status: this.config.initialStatus!,
      decisionRef: `MOCK-${decisionId}`,
      reason: this.config.reason
    };
    
    this.decisions.set(decisionId, response);
    
    // Simulate async status change
    if (this.config.initialStatus === DecisionStatus.PENDING) {
      setTimeout(() => {
        const updated = this.decisions.get(decisionId);
        if (updated) {
          updated.status = this.config.finalStatus!;
          updated.decidedAt = new Date();
          this.decisions.set(decisionId, updated);
        }
      }, this.config.delayMs);
    }
    
    console.log('[MockDecisionSource] Decision requested', { decisionId, request });
    return response;
  }
  
  async getDecision(decisionId: string): Promise<DecisionResponse> {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }
    return decision;
  }
  
  async pollDecision(decisionId: string): Promise<DecisionResponse> {
    return this.getDecision(decisionId);
  }
  
  async cancelDecision(decisionId: string): Promise<void> {
    const decision = this.decisions.get(decisionId);
    if (decision) {
      decision.status = DecisionStatus.CANCELLED;
      this.decisions.set(decisionId, decision);
    }
    console.log('[MockDecisionSource] Decision cancelled', { decisionId });
  }
  
  getSourceName(): string {
    return 'MOCK';
  }
}
