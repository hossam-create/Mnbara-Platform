/**
 * Affiliate & Referral Types
 * 
 * Core Affiliate & Referral system for marketplace platform
 * Tracking + attribution ONLY, NO money handling
 */

export enum AffiliateStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ReferralTargetType {
  PRODUCT = 'PRODUCT',
  AUCTION = 'AUCTION',
  STORE = 'STORE',
  CATEGORY = 'CATEGORY'
}

export enum ReferralActionType {
  CLICK = 'CLICK',
  VIEW = 'VIEW',
  BID_PLACED = 'BID_PLACED',
  PURCHASE_COMPLETED = 'PURCHASE_COMPLETED'
}

export enum AffiliateEventType {
  // Affiliate events
  AFFILIATE_PROFILE_CREATED = 'AFFILIATE_PROFILE_CREATED',
  AFFILIATE_SUSPENDED = 'AFFILIATE_SUSPENDED',
  
  // Referral link events
  REFERRAL_LINK_CREATED = 'REFERRAL_LINK_CREATED',
  
  // Attribution events
  REFERRAL_CLICKED = 'REFERRAL_CLICKED',
  REFERRAL_ATTRIBUTED = 'REFERRAL_ATTRIBUTED',
  
  // Commission events
  COMMISSION_ELIGIBLE = 'COMMISSION_ELIGIBLE'
}

export interface AffiliateProfile {
  id: string;
  affiliateId: string;
  userId: string;
  status: AffiliateStatus;
  trustFlags: {
    flagged: boolean;
    flaggedAt?: Date;
    flaggedReason?: string;
    suspended: boolean;
    suspendedAt?: Date;
    suspendedReason?: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt?: Date;
    ipAddress: string;
    userAgent: string;
  };
  capabilities: {
    canCreateReferralLinks: boolean;
    maxActiveReferralLinks: number;
    supportedTargetTypes: ReferralTargetType[];
  };
}

export interface ReferralLink {
  id: string;
  affiliateId: string;
  referralCode: string; // immutable
  targetType: ReferralTargetType;
  targetId: string;
  targetMetadata: {
    targetTitle: string;
    targetUrl: string;
    targetImageUrl?: string;
    targetDescription?: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    ipAddress: string;
    userAgent: string;
  };
  statistics: {
    totalClicks: number;
    totalViews: number;
    totalAttributions: number;
    lastClickAt?: Date;
    lastViewAt?: Date;
    lastAttributionAt?: Date;
  };
}

export interface ReferralAttribution {
  id: string;
  affiliateId: string;
  referralCode: string;
  target: {
    type: ReferralTargetType;
    id: string;
    title: string;
  };
  action: {
    type: ReferralActionType;
    timestamp: Date;
    metadata?: Record<string, any>;
  };
  user: {
    id?: string;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
  };
  attribution: {
    attributed: boolean;
    attributedAt?: Date;
    attributionWindow: number; // days
    lastClickAt?: Date;
    clickCount: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    referralLinkId: string;
  };
}

export interface CommissionSignal {
  id: string;
  affiliateId: string;
  referralCode: string;
  target: {
    type: ReferralTargetType;
    id: string;
    title: string;
  };
  action: {
    type: ReferralActionType;
    timestamp: Date;
    amount?: number; // purchase amount for reference only
    currency?: string;
  };
  commission: {
    percentage: number; // commission percentage only
    eligible: boolean;
    reason: string;
  };
  metadata: {
    createdAt: Date;
    attributionId: string;
    referralLinkId: string;
  };
}

export interface AffiliateEvent {
  id: string;
  category: 'AFFILIATE' | 'REFERRAL_LINK' | 'ATTRIBUTION' | 'COMMISSION';
  type: AffiliateEventType;
  timestamp: Date;
  data: {
    affiliateId?: string;
    userId?: string;
    referralCode?: string;
    referralLinkId?: string;
    attributionId?: string;
    commissionId?: string;
    previousState?: string;
    newState?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AffiliateStatistics {
  totalAffiliates: number;
  activeAffiliates: number;
  suspendedAffiliates: number;
  totalReferralLinks: number;
  activeReferralLinks: number;
  totalAttributions: number;
  totalClicks: number;
  totalViews: number;
  totalCommissionSignals: number;
  eligibleCommissions: number;
  topAffiliates: Array<{
    affiliateId: string;
    userId: string;
    totalClicks: number;
    totalAttributions: number;
    totalCommissionSignals: number;
  }>;
  topTargetTypes: Array<{
    targetType: ReferralTargetType;
    count: number;
  }>;
  attributionBreakdown: {
    clicks: number;
    views: number;
    bidPlaced: number;
    purchaseCompleted: number;
  };
}

export interface AffiliateDashboard {
  affiliateId: string;
  userId: string;
  overview: {
    totalReferralLinks: number;
    activeReferralLinks: number;
    totalClicks: number;
    totalViews: number;
    totalAttributions: number;
    totalCommissionSignals: number;
    eligibleCommissions: number;
  };
  referralLinks: ReferralLink[];
  recentAttributions: ReferralAttribution[];
  recentCommissionSignals: CommissionSignal[];
  performance: {
    clickThroughRate: number;
    attributionRate: number;
    commissionEligibilityRate: number;
    averageClicksPerLink: number;
    averageAttributionsPerLink: number;
  };
  metadata: {
    lastViewedAt: Date;
    totalViews: number;
    lastRefreshAt: Date;
  };
}

export interface AffiliateConfig {
  attributionWindow: number; // days
  maxActiveReferralLinks: number;
  supportedTargetTypes: ReferralTargetType[];
  autoActivateAffiliates: boolean;
  requireTrustScore: boolean;
  minimumTrustScore: number;
  commissionEligibilityRules: {
    purchaseCompleted: boolean;
    bidPlaced: boolean;
    view: boolean;
    click: boolean;
  };
  commissionRates: {
    [key in ReferralTargetType]: {
      [key in ReferralActionType]: number; // percentage
    };
  };
}

export interface AffiliateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requirements: string[];
}

export interface ReferralLinkRequest {
  targetType: ReferralTargetType;
  targetId: string;
  targetMetadata: {
    targetTitle: string;
    targetUrl: string;
    targetImageUrl?: string;
    targetDescription?: string;
  };
  expiresAt?: Date;
}

export interface ReferralLinkResult {
  success: boolean;
  referralLink?: ReferralLink;
  error?: string;
}

export interface AttributionRequest {
  referralCode: string;
  actionType: ReferralActionType;
  user: {
    id?: string;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
  };
  metadata?: Record<string, any>;
}

export interface AttributionResult {
  success: boolean;
  attribution?: ReferralAttribution;
  commissionSignal?: CommissionSignal;
  error?: string;
}

export interface AffiliateCreationRequest {
  userId: string;
  ipAddress: string;
  userAgent: string;
}

export interface AffiliateCreationResult {
  success: boolean;
  affiliateProfile?: AffiliateProfile;
  error?: string;
}

export interface AffiliateSuspensionRequest {
  affiliateId: string;
  reason: string;
  suspendedBy: string;
}

export interface AffiliateSuspensionResult {
  success: boolean;
  error?: string;
}

export interface AffiliateActivationRequest {
  affiliateId: string;
  activatedBy: string;
}

export interface AffiliateActivationResult {
  success: boolean;
  error?: string;
}
