/**
 * API Contract Types
 * Auto-generated from docs/api/API_CONTRACTS.md
 * 
 * Rules:
 * - Read-only advisory (AI endpoints return suggestions only)
 * - Deterministic responses (same input → same output)
 * - No payment execution
 * - No side effects on GET
 */

// ============ ERROR CODES ============
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'FEATURE_DISABLED'
  | 'EMERGENCY_MODE'
  | 'NETWORK_ERROR';

// ============ DOMAIN ENUMS ============
export type TrustLevel = 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'RESTRICTED';
export type RiskLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'MATCHED' | 'COMPLETED' | 'EXPIRED' | 'REMOVED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'NOT_INITIATED' | 'PENDING_BUYER' | 'IN_ESCROW' | 'RELEASED' | 'REFUNDED';
export type RecommendedAction = 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'VERIFY_FIRST' | 'MANUAL_REVIEW' | 'NOT_RECOMMENDED';
export type CheckpointType = 'CROSS_BORDER' | 'HIGH_VALUE' | 'NEW_SELLER' | 'ESCROW_RECOMMENDED' | 'CUSTOMS_WARNING';
export type SearchSortOption = 'relevance' | 'price' | 'newest' | 'rating';

// ============ BASE RESPONSE TYPES ============
export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  advisory?: boolean;
  disclaimer?: string;
  featureEnabled?: boolean;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  retryAfterMs?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error?: ApiError;
  meta: ResponseMeta;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============ SEARCH API ============
export interface SearchListingsRequest {
  q?: string;
  origin?: string;
  destination?: string;
  category?: string;
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SearchSortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface SellerSummary {
  id: string;
  displayName: string;
  rating: number;
  reviewCount: number;
  trustLevel: TrustLevel;
  verified: boolean;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  category: string;
  condition: ListingCondition;
  imageUrl: string | null;
  seller: SellerSummary;
  createdAt: string;
  estimatedDeliveryDays: number | null;
  corridorSupported: boolean;
}

export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

export interface PriceRangeBucket {
  min: number;
  max: number | null;
  count: number;
}

export interface SearchFacets {
  categories: FacetBucket[];
  origins: FacetBucket[];
  destinations: FacetBucket[];
  conditions: FacetBucket[];
  priceRanges: PriceRangeBucket[];
}

export interface SearchListingsData {
  listings: ListingSummary[];
  facets: SearchFacets;
  pagination: PaginationInfo;
}

export type SearchListingsResponse = ApiResponse<SearchListingsData>;

// ============ LISTING DETAIL API ============
export interface ListingImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  order: number;
}

export interface SellerProfile {
  id: string;
  displayName: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  trustLevel: TrustLevel;
  verified: boolean;
  memberSince: string;
  responseRate: number;
  responseTimeHours: number;
  completedTransactions: number;
}

export interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  category: string;
  subcategory?: string;
  condition: ListingCondition;
  brand?: string;
  model?: string;
  images: ListingImage[];
  seller: SellerProfile;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  estimatedDeliveryDays: number | null;
  corridorSupported: boolean;
  corridorId: string | null;
  viewCount: number;
  inquiryCount: number;
}

export type GetListingResponse = ApiResponse<ListingDetail>;

// ============ AI ADVISORY API (READ-ONLY) ============
export interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  explanation: string;
}

export interface TrustAssessment {
  userId: string;
  role: 'BUYER' | 'SELLER' | 'TRAVELER';
  score: number;
  level: TrustLevel;
  factors: TrustFactor[];
  computedAt: string;
}

export interface RiskFactor {
  category: string;
  name: string;
  severity: RiskLevel;
  description: string;
  mitigations: string[];
}

export interface RiskFlag {
  code: string;
  severity: RiskLevel;
  message: string;
  actionRequired: boolean;
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number;
  factors: RiskFactor[];
  flags: RiskFlag[];
  warnings: string[];
  assessedAt: string;
}

export interface CorridorAssessment {
  corridorId: string;
  corridorName: string;
  isSupported: boolean;
  trustRequirements: {
    minBuyerTrust: TrustLevel;
    minSellerTrust: TrustLevel;
    buyerMeets: boolean;
    sellerMeets: boolean;
  };
  valueAssessment: {
    band: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    threshold: number;
    requiresVerification: boolean;
  };
  escrowRecommendation: {
    recommended: boolean;
    reason: string;
    policy: string;
  };
  restrictions: string[];
  warnings: string[];
}

export interface PriceAdvisory {
  listingPrice: number;
  currency: string;
  marketComparison: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    percentile: number;
    sampleSize: number;
  };
  assessment: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET' | 'INSUFFICIENT_DATA';
  explanation: string;
}

export interface ReasoningStep {
  step: number;
  factor: string;
  assessment: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface AdvisoryRecommendation {
  action: RecommendedAction;
  confidence: number;
  reasoning: ReasoningStep[];
  warnings: string[];
  disclaimer: string; // Always present
}

export interface ConfirmationCheckpoint {
  id: string;
  type: CheckpointType;
  title: string;
  description: string;
  required: boolean;
  confirmationText: string;
  warnings: string[];
}

export interface ListingAdvisory {
  listingId: string;
  sellerTrust: TrustAssessment | null;
  buyerTrust: TrustAssessment | null;
  riskAssessment: RiskAssessment | null;
  corridorAssessment: CorridorAssessment | null;
  priceAdvisory: PriceAdvisory | null;
  recommendation: AdvisoryRecommendation | null;
  checkpoints: ConfirmationCheckpoint[];
  generatedAt: string;
}

export type GetListingAdvisoryResponse = ApiResponse<ListingAdvisory>;

// ============ OFFER SUBMISSION API ============
export interface OfferConfirmation {
  checkpointId: string;
  confirmed: boolean;
  confirmedAt: string;
}

export interface SubmitOfferRequest {
  price: number;
  currency: string;
  deliveryDate: string;
  message: string;
  pickupLocation?: string;
  notes?: string;
  confirmations: OfferConfirmation[];
}

export interface OfferSubmissionResult {
  offerId: string;
  requestId: string;
  status: 'PENDING';
  price: number;
  currency: string;
  deliveryDate: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  nextSteps: string[];
  paymentStatus: 'NOT_INITIATED'; // No payment execution
}

export type SubmitOfferResponse = ApiResponse<OfferSubmissionResult>;

export interface TravelerSummary {
  id: string;
  displayName: string;
  rating: number;
  trustLevel: TrustLevel;
  verified: boolean;
}

export interface BuyerSummary {
  id: string;
  displayName: string;
  rating: number;
  trustLevel: TrustLevel;
}

export interface RequestSummary {
  id: string;
  title: string;
  budget: number;
  origin: string;
  destination: string;
  deadline: string;
}

export interface StatusChange {
  from: OfferStatus;
  to: OfferStatus;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface OfferDetail {
  id: string;
  requestId: string;
  traveler: TravelerSummary;
  buyer: BuyerSummary;
  price: number;
  currency: string;
  deliveryDate: string;
  message: string;
  pickupLocation?: string;
  notes?: string;
  status: OfferStatus;
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  paymentStatus: PaymentStatus;
  request: RequestSummary;
}

export type GetOfferResponse = ApiResponse<OfferDetail>;

// ============ LOADING STATE ============
export interface LoadingState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: ApiError | null;
  startedAt: number | null;
  completedAt: number | null;
  durationMs: number | null;
  retryCount: number;
  canRetry: boolean;
  retryAfterMs: number | null;
}

// ============ HELPER FUNCTIONS ============
export function isRetryableError(error: ApiError): boolean {
  return error.retryable;
}

export function getRetryDelay(error: ApiError, attempt: number): number {
  if (error.retryAfterMs) {
    return error.retryAfterMs;
  }
  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export function isFeatureDisabled(response: ApiResponse<unknown>): boolean {
  return response.error?.code === 'FEATURE_DISABLED' || response.meta.featureEnabled === false;
}

export function isEmergencyMode(response: ApiResponse<unknown>): boolean {
  return response.error?.code === 'EMERGENCY_MODE';
}
