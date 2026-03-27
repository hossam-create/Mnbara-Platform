/**
 * Dispute & Claims Intelligence Service
 * NO AUTOMATION - Advisory Only
 *
 * HARD RULES:
 * - No auto-resolution
 * - No outcome enforcement
 * - Human decides everything
 * - Read-only classification
 * - Evidence checklist only (no collection)
 */

import { createHash, randomUUID } from 'crypto';
import { getFeatureFlags } from '../config/feature-flags';
import {
  DisputeCategory,
  DisputeSeverity,
  DisputeComplexity,
  ClaimClassification,
  EvidenceChecklist,
  EvidenceItem,
  EvidenceType,
  DisputeAdvisory,
  ResolutionGuidance,
  DisputeRiskAssessment,
  DisputeDisclaimer,
  DisputeContext,
  DisputeIntelAuditEntry,
  DisputeIntelHealth,
  SuggestedAction,
  TimelineGuidance,
  PartyResponsibility,
} from '../types/dispute-intel.types';

// ===========================================
// Constants
// ===========================================

const MAX_AUDIT_LOG = 500;

// Category keywords for classification
const CATEGORY_KEYWORDS: Record<DisputeCategory, string[]> = {
  ITEM_NOT_RECEIVED: ['not received', 'never arrived', 'missing', 'lost', 'no delivery'],
  ITEM_NOT_AS_DESCRIBED: ['different', 'not as described', 'wrong description', 'misleading', 'fake'],
  DAMAGED_ITEM: ['damaged', 'broken', 'defective', 'cracked', 'torn', 'scratched'],
  WRONG_ITEM: ['wrong item', 'incorrect', 'different product', 'not what I ordered'],
  PARTIAL_DELIVERY: ['partial', 'incomplete', 'missing items', 'not all'],
  DELIVERY_DELAY: ['late', 'delayed', 'slow', 'took too long', 'overdue'],
  PAYMENT_ISSUE: ['payment', 'charged', 'refund', 'overcharged', 'double charged'],
  COMMUNICATION_ISSUE: ['no response', 'ignored', 'unresponsive', 'communication'],
  CANCELLATION_DISPUTE: ['cancelled', 'cancellation', 'cancel'],
  REFUND_REQUEST: ['refund', 'money back', 'return'],
  OTHER: [],
};

// ===========================================
// In-Memory Stores
// ===========================================

const auditLog: DisputeIntelAuditEntry[] = [];

// ===========================================
// Disclaimer Generator
// ===========================================

function generateDisclaimer(): DisputeDisclaimer {
  return {
    type: 'DISPUTE_ADVISORY',
    text: 'This is advisory information only. No automatic resolution or outcome enforcement occurs. All decisions must be made by human reviewers.',
    isAdvisoryOnly: true,
    noAutoResolution: true,
    noOutcomeEnforcement: true,
    humanDecidesEverything: true,
    timestamp: new Date().toISOString(),
  };
}

// ===========================================
// Dispute Intelligence Service
// ===========================================

export class DisputeIntelService {
  /**
   * Get full dispute advisory
   * READ-ONLY - No auto-resolution
   */
  getDisputeAdvisory(context: DisputeContext, requestId?: string): DisputeAdvisory | null {
    const flags = getFeatureFlags();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.DISPUTE_INTEL_ENABLED) {
      return null;
    }

    const advisoryId = `adv_${randomUUID().slice(0, 8)}`;
    const classification = this.classifyClaim(context);
    const evidenceChecklist = this.generateEvidenceChecklist(context, classification.category);
    const resolutionGuidance = this.generateResolutionGuidance(context, classification);
    const riskAssessment = this.assessRisk(context, classification);

    const advisory: DisputeAdvisory = {
      advisoryId,
      disputeId: context.disputeId,
      timestamp: new Date().toISOString(),
      classification,
      evidenceChecklist,
      resolutionGuidance,
      riskAssessment,
      disclaimer: generateDisclaimer(),
    };

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}`,
      advisoryId,
      disputeId: context.disputeId,
      action: 'ADVISORY_REQUESTED',
      timestamp: new Date().toISOString(),
    });

    return advisory;
  }

  /**
   * Classify a claim
   * READ-ONLY - No enforcement
   */
  classifyClaim(context: DisputeContext): ClaimClassification {
    const classificationId = `cls_${randomUUID().slice(0, 8)}`;
    const category = this.detectCategory(context.claimDescription);
    const severity = this.calculateSeverity(context, category);
    const complexity = this.calculateComplexity(context, category);
    const confidence = this.calculateConfidence(context, category);

    const classification: ClaimClassification = {
      classificationId,
      disputeId: context.disputeId,
      timestamp: new Date().toISOString(),
      category,
      severity,
      complexity,
      confidence,
      reasoning: {
        primaryFactors: this.getPrimaryFactors(context, category),
        supportingEvidence: context.existingEvidence || [],
        uncertainties: this.getUncertainties(context, confidence),
        alternativeCategories: this.getAlternativeCategories(context, category),
      },
      suggestedActions: this.getSuggestedActions(category, severity),
      disclaimer: generateDisclaimer(),
    };

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}`,
      advisoryId: classificationId,
      disputeId: context.disputeId,
      action: 'CLASSIFICATION_GENERATED',
      timestamp: new Date().toISOString(),
    });

    return classification;
  }

  /**
   * Generate evidence checklist
   * READ-ONLY - No collection
   */
  generateEvidenceChecklist(
    context: DisputeContext,
    category?: DisputeCategory
  ): EvidenceChecklist {
    const checklistId = `chk_${randomUUID().slice(0, 8)}`;
    const resolvedCategory = category || this.detectCategory(context.claimDescription);

    const checklist: EvidenceChecklist = {
      checklistId,
      disputeId: context.disputeId,
      category: resolvedCategory,
      timestamp: new Date().toISOString(),
      requiredEvidence: this.getRequiredEvidence(resolvedCategory),
      optionalEvidence: this.getOptionalEvidence(resolvedCategory),
      partyResponsibilities: this.getPartyResponsibilities(resolvedCategory),
      timelineGuidance: this.getTimelineGuidance(resolvedCategory),
      disclaimer: generateDisclaimer(),
    };

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}`,
      advisoryId: checklistId,
      disputeId: context.disputeId,
      action: 'CHECKLIST_GENERATED',
      timestamp: new Date().toISOString(),
    });

    return checklist;
  }

  /**
   * Get service health
   */
  getHealth(): DisputeIntelHealth {
    const flags = getFeatureFlags();

    return {
      status: flags.EMERGENCY_DISABLE_ALL
        ? 'disabled'
        : flags.DISPUTE_INTEL_ENABLED
          ? 'healthy'
          : 'degraded',
      timestamp: new Date().toISOString(),
      featureFlags: {
        disputeIntelEnabled: flags.DISPUTE_INTEL_ENABLED,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
      advisoryCount: auditLog.filter((a) => a.action === 'ADVISORY_REQUESTED').length,
      version: '1.0.0',
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(disputeId?: string): DisputeIntelAuditEntry[] {
    if (disputeId) {
      return auditLog.filter((e) => e.disputeId === disputeId);
    }
    return [...auditLog];
  }

  // ===========================================
  // Private Helper Methods
  // ===========================================

  private detectCategory(description: string): DisputeCategory {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => lowerDesc.includes(kw))) {
        return category as DisputeCategory;
      }
    }

    return 'OTHER';
  }

  private calculateSeverity(context: DisputeContext, category: DisputeCategory): DisputeSeverity {
    // Deterministic severity based on amount and category
    const amount = context.amount;

    if (amount > 500 || category === 'DAMAGED_ITEM' || category === 'ITEM_NOT_RECEIVED') {
      return 'HIGH';
    }
    if (amount > 100 || category === 'WRONG_ITEM' || category === 'ITEM_NOT_AS_DESCRIBED') {
      return 'MEDIUM';
    }
    if (category === 'DELIVERY_DELAY' || category === 'COMMUNICATION_ISSUE') {
      return 'LOW';
    }
    return 'MEDIUM';
  }

  private calculateComplexity(context: DisputeContext, category: DisputeCategory): DisputeComplexity {
    const hasMultipleParties = !!context.travelerId;
    const isHighValue = context.amount > 200;

    if (hasMultipleParties && isHighValue) return 'COMPLEX';
    if (hasMultipleParties || isHighValue) return 'MODERATE';
    return 'SIMPLE';
  }

  private calculateConfidence(context: DisputeContext, category: DisputeCategory): number {
    // Deterministic confidence based on description clarity
    const descLength = context.claimDescription.length;
    const hasEvidence = (context.existingEvidence?.length || 0) > 0;

    let confidence = 60;
    if (descLength > 100) confidence += 15;
    if (descLength > 200) confidence += 10;
    if (hasEvidence) confidence += 15;
    if (category !== 'OTHER') confidence += 10;

    return Math.min(95, confidence);
  }

  private getPrimaryFactors(context: DisputeContext, category: DisputeCategory): string[] {
    const factors: string[] = [];

    factors.push(`Claim category: ${category.replace(/_/g, ' ').toLowerCase()}`);
    factors.push(`Transaction amount: ${context.amount} ${context.currency}`);

    if (context.deliveryDate) {
      factors.push('Delivery date recorded');
    }
    if (context.existingEvidence?.length) {
      factors.push(`${context.existingEvidence.length} evidence item(s) provided`);
    }

    return factors;
  }

  private getUncertainties(context: DisputeContext, confidence: number): string[] {
    const uncertainties: string[] = [];

    if (confidence < 80) {
      uncertainties.push('Classification confidence below 80%');
    }
    if (!context.existingEvidence?.length) {
      uncertainties.push('No evidence provided yet');
    }
    if (!context.deliveryDate) {
      uncertainties.push('Delivery date not confirmed');
    }

    return uncertainties;
  }

  private getAlternativeCategories(
    context: DisputeContext,
    primaryCategory: DisputeCategory
  ): { category: DisputeCategory; confidence: number; reason: string }[] {
    const alternatives: { category: DisputeCategory; confidence: number; reason: string }[] = [];
    const lowerDesc = context.claimDescription.toLowerCase();

    // Check for secondary matches
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category !== primaryCategory && keywords.some((kw) => lowerDesc.includes(kw))) {
        alternatives.push({
          category: category as DisputeCategory,
          confidence: 30 + Math.floor(Math.random() * 20),
          reason: `Description contains keywords related to ${category.replace(/_/g, ' ').toLowerCase()}`,
        });
      }
    }

    return alternatives.slice(0, 2);
  }

  private getSuggestedActions(category: DisputeCategory, severity: DisputeSeverity): SuggestedAction[] {
    const actions: SuggestedAction[] = [
      {
        id: 'action_1',
        action: 'Review submitted evidence',
        priority: 'HIGH',
        description: 'Carefully review all evidence submitted by both parties',
        requiresHumanApproval: true,
        estimatedTimeMinutes: 15,
      },
      {
        id: 'action_2',
        action: 'Contact parties for clarification',
        priority: severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        description: 'Reach out to involved parties for additional context',
        requiresHumanApproval: true,
        estimatedTimeMinutes: 30,
      },
      {
        id: 'action_3',
        action: 'Request additional evidence',
        priority: 'MEDIUM',
        description: 'Ask parties to provide missing documentation',
        requiresHumanApproval: true,
        estimatedTimeMinutes: 10,
      },
    ];

    if (severity === 'HIGH' || severity === 'CRITICAL') {
      actions.push({
        id: 'action_4',
        action: 'Escalate to senior reviewer',
        priority: 'HIGH',
        description: 'High-value or complex dispute requires senior review',
        requiresHumanApproval: true,
        estimatedTimeMinutes: 5,
      });
    }

    return actions;
  }

  private getRequiredEvidence(category: DisputeCategory): EvidenceItem[] {
    const baseEvidence: EvidenceItem[] = [
      {
        id: 'ev_1',
        type: 'COMMUNICATION_LOG',
        description: 'Communication history between parties',
        importance: 'REQUIRED',
        fromParty: 'PLATFORM',
        examples: ['Chat logs', 'Email exchanges', 'Message history'],
      },
    ];

    const categoryEvidence: Record<DisputeCategory, EvidenceItem[]> = {
      ITEM_NOT_RECEIVED: [
        {
          id: 'ev_inr_1',
          type: 'TRACKING_INFO',
          description: 'Shipping tracking information',
          importance: 'REQUIRED',
          fromParty: 'SELLER',
          examples: ['Tracking number', 'Carrier confirmation', 'Delivery status'],
        },
        {
          id: 'ev_inr_2',
          type: 'DELIVERY_CONFIRMATION',
          description: 'Proof of delivery attempt or completion',
          importance: 'REQUIRED',
          fromParty: 'TRAVELER',
          examples: ['Delivery photo', 'Signature confirmation', 'GPS timestamp'],
        },
      ],
      ITEM_NOT_AS_DESCRIBED: [
        {
          id: 'ev_inad_1',
          type: 'PHOTO',
          description: 'Photos of received item',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Multiple angles', 'Close-up of issues', 'Comparison with listing'],
          acceptedFormats: ['jpg', 'png', 'heic'],
          maxSizeMB: 10,
        },
        {
          id: 'ev_inad_2',
          type: 'SCREENSHOT',
          description: 'Original listing screenshots',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Product description', 'Listed specifications', 'Seller claims'],
        },
      ],
      DAMAGED_ITEM: [
        {
          id: 'ev_dmg_1',
          type: 'PHOTO',
          description: 'Photos showing damage',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Damage close-ups', 'Packaging condition', 'Multiple angles'],
          acceptedFormats: ['jpg', 'png', 'heic'],
          maxSizeMB: 10,
        },
        {
          id: 'ev_dmg_2',
          type: 'CONDITION_REPORT',
          description: 'Condition at time of delivery',
          importance: 'REQUIRED',
          fromParty: 'TRAVELER',
          examples: ['Delivery condition notes', 'Packaging state', 'Visible damage'],
        },
      ],
      WRONG_ITEM: [
        {
          id: 'ev_wrg_1',
          type: 'PHOTO',
          description: 'Photos of received item',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Item received', 'Labels/tags', 'Comparison with order'],
        },
        {
          id: 'ev_wrg_2',
          type: 'RECEIPT',
          description: 'Order confirmation',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Order details', 'Item specifications', 'Purchase confirmation'],
        },
      ],
      PARTIAL_DELIVERY: [
        {
          id: 'ev_prt_1',
          type: 'PHOTO',
          description: 'Photos of received items',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['All items received', 'Packaging contents'],
        },
        {
          id: 'ev_prt_2',
          type: 'RECEIPT',
          description: 'Full order details',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Complete item list', 'Quantities ordered'],
        },
      ],
      DELIVERY_DELAY: [
        {
          id: 'ev_dly_1',
          type: 'TRACKING_INFO',
          description: 'Tracking history',
          importance: 'REQUIRED',
          fromParty: 'SELLER',
          examples: ['Shipping timeline', 'Delay notifications'],
        },
        {
          id: 'ev_dly_2',
          type: 'TIMESTAMP_PROOF',
          description: 'Promised delivery date',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Order confirmation with date', 'Seller commitment'],
        },
      ],
      PAYMENT_ISSUE: [
        {
          id: 'ev_pay_1',
          type: 'RECEIPT',
          description: 'Payment receipts',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Transaction records', 'Bank statements', 'Payment confirmations'],
        },
      ],
      COMMUNICATION_ISSUE: [
        {
          id: 'ev_com_1',
          type: 'COMMUNICATION_LOG',
          description: 'Attempted communications',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Message attempts', 'Response times', 'Unanswered queries'],
        },
      ],
      CANCELLATION_DISPUTE: [
        {
          id: 'ev_can_1',
          type: 'DOCUMENT',
          description: 'Cancellation request/confirmation',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Cancellation request', 'Policy terms', 'Timeline'],
        },
      ],
      REFUND_REQUEST: [
        {
          id: 'ev_ref_1',
          type: 'RECEIPT',
          description: 'Original payment proof',
          importance: 'REQUIRED',
          fromParty: 'BUYER',
          examples: ['Payment confirmation', 'Transaction ID'],
        },
      ],
      OTHER: [],
    };

    return [...baseEvidence, ...(categoryEvidence[category] || [])];
  }

  private getOptionalEvidence(category: DisputeCategory): EvidenceItem[] {
    return [
      {
        id: 'ev_opt_1',
        type: 'VIDEO',
        description: 'Video evidence (unboxing, condition)',
        importance: 'OPTIONAL',
        fromParty: 'BUYER',
        examples: ['Unboxing video', 'Condition demonstration'],
        acceptedFormats: ['mp4', 'mov'],
        maxSizeMB: 100,
      },
      {
        id: 'ev_opt_2',
        type: 'DOCUMENT',
        description: 'Additional supporting documents',
        importance: 'OPTIONAL',
        fromParty: 'BUYER',
        examples: ['Expert opinions', 'Third-party assessments'],
      },
    ];
  }

  private getPartyResponsibilities(category: DisputeCategory): PartyResponsibility[] {
    return [
      {
        party: 'BUYER',
        responsibilities: [
          'Provide clear description of the issue',
          'Submit required evidence within timeline',
          'Respond to clarification requests promptly',
          'Maintain original packaging if applicable',
        ],
      },
      {
        party: 'SELLER',
        responsibilities: [
          'Provide shipping and tracking information',
          'Respond to dispute within 48 hours',
          'Provide product documentation',
          'Cooperate with investigation',
        ],
      },
      {
        party: 'TRAVELER',
        responsibilities: [
          'Provide delivery confirmation',
          'Document item condition at handoff',
          'Respond to queries about delivery',
        ],
      },
      {
        party: 'PLATFORM',
        responsibilities: [
          'Facilitate communication between parties',
          'Provide transaction records',
          'Ensure fair review process',
          'Protect both parties\' interests',
        ],
      },
    ];
  }

  private getTimelineGuidance(category: DisputeCategory): TimelineGuidance {
    const isComplex = ['DAMAGED_ITEM', 'ITEM_NOT_AS_DESCRIBED', 'WRONG_ITEM'].includes(category);

    return {
      recommendedResponseDays: 2,
      escalationThresholdDays: isComplex ? 7 : 5,
      maxResolutionDays: isComplex ? 14 : 10,
      milestones: [
        { name: 'Initial Response', targetDays: 1, description: 'Acknowledge dispute and request evidence' },
        { name: 'Evidence Collection', targetDays: 3, description: 'Gather all required evidence from parties' },
        { name: 'Review & Analysis', targetDays: isComplex ? 5 : 3, description: 'Analyze evidence and determine facts' },
        { name: 'Resolution Proposal', targetDays: isComplex ? 7 : 5, description: 'Propose resolution to parties' },
        { name: 'Final Decision', targetDays: isComplex ? 10 : 7, description: 'Human reviewer makes final decision' },
      ],
    };
  }

  private generateResolutionGuidance(
    context: DisputeContext,
    classification: ClaimClassification
  ): ResolutionGuidance {
    return {
      recommendedApproach: this.getRecommendedApproach(classification.category, classification.severity),
      possibleOutcomes: this.getPossibleOutcomes(classification.category),
      precedentSummary: 'Similar cases typically resolved through evidence-based review with human decision.',
      escalationCriteria: [
        'Dispute value exceeds $500',
        'Evidence is contradictory',
        'Multiple parties involved',
        'Potential fraud indicators',
        'Repeated disputes from same party',
      ],
      humanDecisionRequired: true,
    };
  }

  private getRecommendedApproach(category: DisputeCategory, severity: DisputeSeverity): string {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return 'Prioritize this dispute for senior review. Gather comprehensive evidence from all parties before making any determination.';
    }

    const approaches: Record<DisputeCategory, string> = {
      ITEM_NOT_RECEIVED: 'Verify tracking information and delivery confirmation. Contact carrier if needed.',
      ITEM_NOT_AS_DESCRIBED: 'Compare received item photos with original listing. Assess materiality of differences.',
      DAMAGED_ITEM: 'Review damage photos and packaging condition. Determine if damage occurred in transit.',
      WRONG_ITEM: 'Verify order details against received item. Check for fulfillment errors.',
      PARTIAL_DELIVERY: 'Confirm full order contents and verify what was received.',
      DELIVERY_DELAY: 'Review promised timeline and actual delivery. Assess impact on buyer.',
      PAYMENT_ISSUE: 'Verify payment records and transaction history.',
      COMMUNICATION_ISSUE: 'Review communication logs and response times.',
      CANCELLATION_DISPUTE: 'Review cancellation policy and timeline of events.',
      REFUND_REQUEST: 'Verify eligibility based on policy and circumstances.',
      OTHER: 'Gather additional context to properly categorize and address the dispute.',
    };

    return approaches[category] || approaches.OTHER;
  }

  private getPossibleOutcomes(category: DisputeCategory): { outcome: string; likelihood: 'HIGH' | 'MEDIUM' | 'LOW'; conditions: string[]; implications: string[] }[] {
    return [
      {
        outcome: 'Full refund to buyer',
        likelihood: 'MEDIUM',
        conditions: ['Clear evidence supports buyer claim', 'Seller unable to provide counter-evidence'],
        implications: ['Buyer receives full refund', 'Seller bears cost', 'Transaction reversed'],
      },
      {
        outcome: 'Partial refund',
        likelihood: 'HIGH',
        conditions: ['Partial fault on both sides', 'Item usable but not as expected'],
        implications: ['Compromise resolution', 'Both parties share impact'],
      },
      {
        outcome: 'No refund - claim denied',
        likelihood: 'LOW',
        conditions: ['Evidence supports seller', 'Buyer claim not substantiated'],
        implications: ['Buyer retains item', 'Seller retains payment'],
      },
      {
        outcome: 'Replacement item',
        likelihood: 'MEDIUM',
        conditions: ['Item defective but seller willing to replace', 'Buyer agrees to replacement'],
        implications: ['Seller ships replacement', 'Original item returned'],
      },
    ];
  }

  private assessRisk(context: DisputeContext, classification: ClaimClassification): DisputeRiskAssessment {
    const financialExposure = {
      estimatedMin: context.amount * 0.5,
      estimatedMax: context.amount * 1.2,
      currency: context.currency,
      breakdown: [
        `Original transaction: ${context.amount} ${context.currency}`,
        'Potential shipping costs for returns',
        'Processing fees if applicable',
      ],
    };

    const factors = [
      {
        factor: 'Transaction amount',
        impact: context.amount > 200 ? 'NEGATIVE' as const : 'NEUTRAL' as const,
        weight: 3,
        description: context.amount > 200 ? 'High-value transaction increases exposure' : 'Moderate transaction value',
      },
      {
        factor: 'Evidence availability',
        impact: (context.existingEvidence?.length || 0) > 0 ? 'POSITIVE' as const : 'NEGATIVE' as const,
        weight: 2,
        description: (context.existingEvidence?.length || 0) > 0 ? 'Evidence provided aids resolution' : 'Lack of evidence complicates review',
      },
      {
        factor: 'Dispute complexity',
        impact: classification.complexity === 'COMPLEX' ? 'NEGATIVE' as const : 'NEUTRAL' as const,
        weight: 2,
        description: `${classification.complexity} dispute complexity`,
      },
    ];

    return {
      overallRisk: classification.severity,
      financialExposure,
      reputationRisk: classification.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      escalationRisk: classification.complexity === 'COMPLEX' ? 'HIGH' : 'MEDIUM',
      factors,
    };
  }

  private logAudit(entry: DisputeIntelAuditEntry): void {
    auditLog.push(entry);
    if (auditLog.length > MAX_AUDIT_LOG) {
      auditLog.shift();
    }
  }

  /**
   * Reset for testing
   */
  static reset(): void {
    auditLog.length = 0;
  }
}

export const disputeIntelService = new DisputeIntelService();
