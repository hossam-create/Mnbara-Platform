import { v4 as uuidv4 } from 'uuid';
import { IDecisionSource, DecisionRequest, DecisionResponse, DecisionStatus } from '../interfaces/IDecisionSource';

/**
 * InternalDecisionSource - Maintains current behavior (auto-approve)
 * 
 * This is the default mode and ensures backward compatibility.
 * All decisions are immediately approved with no external dependencies.
 */
export class InternalDecisionSource implements IDecisionSource {
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    console.log('[InternalDecisionSource] Auto-approving decision', { request });
    
    // Auto-approve immediately (current behavior)
    const response: DecisionResponse = {
      decisionId: uuidv4(),
      status: DecisionStatus.APPROVED,
      decidedAt: new Date(),
      reason: 'Auto-approved by internal rules'
    };
    
    return response;
  }
  
  async getDecision(decisionId: string): Promise<DecisionResponse> {
    // Internal decisions are always immediately approved
    return {
      decisionId,
      status: DecisionStatus.APPROVED,
      decidedAt: new Date(),
      reason: 'Auto-approved by internal rules'
    };
  }
  
  async pollDecision(decisionId: string): Promise<DecisionResponse> {
    // No polling needed for internal decisions
    return this.getDecision(decisionId);
  }
  
  async cancelDecision(decisionId: string): Promise<void> {
    // No-op for internal decisions
    console.log('[InternalDecisionSource] Cancel requested (no-op)', { decisionId });
  }
  
  getSourceName(): string {
    return 'INTERNAL';
  }
}
