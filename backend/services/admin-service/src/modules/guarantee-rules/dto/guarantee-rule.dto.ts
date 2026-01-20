export class CreateGuaranteeRuleDto {
  name: string;
  appliesTo: 'CATEGORY' | 'ORDER_TYPE' | 'TRAVELER' | 'ALL';
  coverage: number;
  maxAmount: number;
  autoActions: {
    autoEscalate: boolean;
    autoRefund: boolean;
    autoRelease: boolean;
  };
  conditions: {
    minOrderAmount?: number;
    maxOrderAmount?: number;
    categories?: string[];
    orderTypes?: string[];
    travelerVerified?: boolean;
  };
  thresholds: {
    disputeThreshold: number;
    escalationThreshold: number;
    evidenceRequired: boolean;
  };
  escalation: {
    autoEscalateAfter: number;
    escalationLevel: 'TIER_1' | 'TIER_2' | 'TIER_3';
    requiresApproval: boolean;
  };
  priority: number;
  enabled: boolean;
}

export class UpdateGuaranteeRuleDto extends CreateGuaranteeRuleDto {}
