/**
 * Payment Advisory Types
 * READ-ONLY - Intelligence Only
 *
 * HARD RULES:
 * - No calls to banks
 * - No PSP SDKs
 * - No payment APIs
 * - No side effects
 * - Read-only services only
 */

// ===========================================
// Payment Method Comparison
// ===========================================

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CRYPTO' | 'COD';
  supportedCurrencies: string[];
  supportedCorridors: string[];
  feeStructure: FeeStructure;
  processingTime: ProcessingTime;
  limits: PaymentLimits;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresKYC: boolean;
  available: boolean;
}

export interface FeeStructure {
  fixedFee: number;
  percentageFee: number;
  currency: string;
  minFee: number;
  maxFee: number;
}

export interface ProcessingTime {
  minHours: number;
  maxHours: number;
  typical: string;
}

export interface PaymentLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  currency: string;
}

export interface PaymentMethodComparison {
  requestId: string;
  timestamp: string;
  corridor: string;
  amountUSD: number;
  methods: PaymentMethodOption[];
  recommended: string | null;
  recommendationReason: string;
  disclaimer: AdvisoryDisclaimer;
}

export interface PaymentMethodOption {
  methodId: string;
  methodName: string;
  available: boolean;
  unavailableReason?: string;
  estimatedFeeUSD: number;
  estimatedTotal: number;
  processingTime: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  pros: string[];
  cons: string[];
  score: number; // 0-100, higher is better
}

// ===========================================
// FX Advisory
// ===========================================

export interface FXRateSnapshot {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source: string;
  timestamp: string;
  validUntil: string;
}

export interface FXAdvisoryResult {
  requestId: string;
  timestamp: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rates: FXRateComparison[];
  bestRate: FXRateComparison | null;
  marketRate: number;
  spread: number;
  spreadPercent: number;
  warnings: string[];
  explanation: string;
  disclaimer: AdvisoryDisclaimer;
}

export interface FXRateComparison {
  provider: string;
  rate: number;
  inverseRate: number;
  convertedAmount: number;
  fee: number;
  totalCost: number;
  spreadFromMarket: number;
  spreadPercent: number;
  isRecommended: boolean;
}

// ===========================================
// Payment Risk Warnings
// ===========================================

export interface PaymentRiskWarning {
  id: string;
  type: PaymentRiskType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  affectedMethods: string[];
}

export type PaymentRiskType =
  | 'HIGH_VALUE_TRANSACTION'
  | 'CROSS_BORDER_COMPLEXITY'
  | 'CURRENCY_VOLATILITY'
  | 'PROCESSING_DELAY'
  | 'CHARGEBACK_RISK'
  | 'REGULATORY_RESTRICTION'
  | 'TRUST_MISMATCH'
  | 'CORRIDOR_RESTRICTION';

export interface PaymentRiskAssessment {
  requestId: string;
  timestamp: string;
  corridor: string;
  amountUSD: number;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  warnings: PaymentRiskWarning[];
  mitigations: string[];
  explanation: string;
  disclaimer: AdvisoryDisclaimer;
}

// ===========================================
// Advisory Disclaimer
// ===========================================

export interface AdvisoryDisclaimer {
  type: 'PAYMENT_ADVISORY';
  text: string;
  isAdvisoryOnly: true;
  noExecution: true;
  noGuarantee: true;
  timestamp: string;
}

// ===========================================
// Advisory Request/Response
// ===========================================

export interface PaymentAdvisoryRequest {
  requestId: string;
  corridor: string;
  originCountry: string;
  destinationCountry: string;
  amountUSD: number;
  currency?: string;
  buyerTrustLevel?: string;
  travelerTrustLevel?: string;
  itemCategory?: string;
}

export interface PaymentAdvisorySnapshot {
  requestId: string;
  timestamp: string;
  request: PaymentAdvisoryRequest;
  methodComparison: PaymentMethodComparison | null;
  fxAdvisory: FXAdvisoryResult | null;
  riskAssessment: PaymentRiskAssessment | null;
  featureFlags: {
    paymentAdvisoryEnabled: boolean;
    fxAdvisoryEnabled: boolean;
    riskAdvisoryEnabled: boolean;
  };
}

// ===========================================
// Health Check
// ===========================================

export interface PaymentAdvisoryHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    methodComparison: boolean;
    fxAdvisory: boolean;
    riskAssessment: boolean;
    complianceCheck: boolean;
    partnerReadiness: boolean;
  };
  featureFlags: {
    paymentAdvisoryEnabled: boolean;
    emergencyDisabled: boolean;
  };
  lastFXUpdate: string | null;
  version: string;
}

// ===========================================
// Sprint 6: Bank Integration Advisory
// ===========================================

export type PaymentMethodType = 'ESCROW' | 'CARD' | 'WALLET' | 'BANK_TRANSFER';

export interface FeeBreakdown {
  baseFee: number;
  percentageFee: number;
  fxSpread: number;
  networkFee: number;
  totalFee: number;
  currency: string;
  explanation: string;
}

export interface ComplianceBoundary {
  id: string;
  type: ComplianceBoundaryType;
  jurisdiction: string;
  requirement: string;
  status: 'COMPLIANT' | 'PENDING' | 'NOT_APPLICABLE' | 'BLOCKED';
  explanation: string;
  documentationUrl?: string;
}

export type ComplianceBoundaryType =
  | 'KYC_REQUIREMENT'
  | 'AML_CHECK'
  | 'SANCTIONS_SCREENING'
  | 'CROSS_BORDER_LIMIT'
  | 'CURRENCY_RESTRICTION'
  | 'LICENSING_REQUIREMENT'
  | 'DATA_RESIDENCY'
  | 'TAX_REPORTING';

export interface PartnerReadinessCheck {
  partnerId: string;
  partnerName: string;
  partnerType: 'BANK' | 'PSP' | 'WALLET_PROVIDER' | 'FX_PROVIDER';
  status: PartnerStatus;
  corridors: string[];
  capabilities: string[];
  limitations: string[];
  lastChecked: string;
  advisory: string;
}

export type PartnerStatus = 
  | 'READY'
  | 'INTEGRATION_PENDING'
  | 'TESTING'
  | 'NOT_AVAILABLE'
  | 'DEPRECATED';

export interface ComplianceAdvisoryResult {
  requestId: string;
  timestamp: string;
  corridor: string;
  amountUSD: number;
  boundaries: ComplianceBoundary[];
  overallStatus: 'CLEAR' | 'REVIEW_REQUIRED' | 'BLOCKED';
  blockers: string[];
  recommendations: string[];
  disclaimer: AdvisoryDisclaimer;
}

export interface PartnerReadinessResult {
  requestId: string;
  timestamp: string;
  corridor: string;
  partners: PartnerReadinessCheck[];
  recommendedPartner: string | null;
  explanation: string;
  disclaimer: AdvisoryDisclaimer;
}

// ===========================================
// Extended Advisory Disclaimer
// ===========================================

export interface ExtendedAdvisoryDisclaimer extends AdvisoryDisclaimer {
  whatWeDoNot: string[];
  whyAdvisoryOnly: string;
  humanConfirmationRequired: true;
}
