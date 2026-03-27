/**
 * IDecisionSource - Interface for decision authority sources
 * 
 * This abstraction allows the platform to switch between:
 * - INTERNAL: Current behavior (auto-approve)
 * - EXTERNAL: Custodii API integration
 * - MOCK: Testing with simulated delays
 */

export enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum AssetType {
  LISTING = 'LISTING',
  AUCTION = 'AUCTION',
  ESCROW_RELEASE = 'ESCROW_RELEASE'
}

export interface DecisionRequest {
  assetType: AssetType;
  assetId: string;
  metadata: Record<string, any>;
}

export interface DecisionResponse {
  decisionId: string;
  status: DecisionStatus;
  decisionRef?: string;
  reason?: string;
  decidedAt?: Date;
  expiresAt?: Date;
}

export interface IDecisionSource {
  /**
   * Request a decision for an asset
   */
  requestDecision(request: DecisionRequest): Promise<DecisionResponse>;
  
  /**
   * Get the current status of a decision
   */
  getDecision(decisionId: string): Promise<DecisionResponse>;
  
  /**
   * Poll for decision status (for PENDING decisions)
   */
  pollDecision(decisionId: string): Promise<DecisionResponse>;
  
  /**
   * Cancel a pending decision
   */
  cancelDecision(decisionId: string): Promise<void>;
  
  /**
   * Get the source name for logging/debugging
   */
  getSourceName(): string;
}
