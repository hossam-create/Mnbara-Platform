# API Contracts & Data Shapes

Complete frontend ↔ backend interface definitions for MNBARA platform.

---

## Constraints (Non-Negotiable)

| Rule | Enforcement |
|------|-------------|
| Read-only advisory | AI endpoints return suggestions only, never execute |
| Deterministic responses | Same input → same output (no randomness) |
| No payment execution | Payment info is advisory, execution requires separate licensed flow |
| No side effects | GET requests never modify state |
| Feature-flagged | All AI features disabled by default |

---

## 1. Standard Response Envelope

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error?: ApiError | null;
  meta: ResponseMeta;
}

interface ResponseMeta {
  requestId: string;           // Unique request identifier
  timestamp: string;           // ISO 8601 timestamp
  version: string;             // API version (e.g., "v1")
  advisory?: boolean;          // True for AI advisory responses
  disclaimer?: string;         // Legal disclaimer for advisory
  featureEnabled?: boolean;    // Whether feature flag is on
}

interface ApiError {
  code: ErrorCode;
  message: string;             // User-friendly message
  details?: Record<string, unknown>;
  retryable: boolean;
  retryAfterMs?: number;
}

enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFLICT = 'CONFLICT',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // Feature errors
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  EMERGENCY_MODE = 'EMERGENCY_MODE',
  
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

---

## 2. Search API Contract

### GET /api/v1/search/listings

Search for listings with filters.

```typescript
// ============ REQUEST ============
interface SearchListingsRequest {
  // Query
  q?: string;                  // Free-text search
  
  // Filters
  origin?: string;             // Country code (e.g., "US")
  destination?: string;        // Country code (e.g., "EG")
  category?: string;           // Category slug
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  
  // Pagination
  page?: number;               // Default: 1
  pageSize?: number;           // Default: 20, max: 100
  
  // Sorting
  sortBy?: SearchSortOption;   // Default: 'relevance'
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
}

type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
type SearchSortOption = 'relevance' | 'price' | 'newest' | 'rating';

// ============ RESPONSE ============
interface SearchListingsResponse {
  data: {
    listings: ListingSummary[];
    facets: SearchFacets;
    pagination: PaginationInfo;
  } | null;
  error?: ApiError;
  meta: ResponseMeta;
}

interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency: string;            // ISO 4217 (e.g., "USD")
  origin: string;
  destination: string;
  category: string;
  condition: ListingCondition;
  imageUrl: string | null;     // Primary image thumbnail
  seller: SellerSummary;
  createdAt: string;           // ISO 8601
  
  // Computed (deterministic)
  estimatedDeliveryDays: number | null;
  corridorSupported: boolean;
}

interface SellerSummary {
  id: string;
  displayName: string;
  rating: number;              // 0-5
  reviewCount: number;
  trustLevel: TrustLevel;
  verified: boolean;
}

type TrustLevel = 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'RESTRICTED';

interface SearchFacets {
  categories: FacetBucket[];
  origins: FacetBucket[];
  destinations: FacetBucket[];
  conditions: FacetBucket[];
  priceRanges: PriceRangeBucket[];
}

interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

interface PriceRangeBucket {
  min: number;
  max: number | null;          // null = no upper limit
  count: number;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Search API Example

```http
GET /api/v1/search/listings?q=iphone&origin=US&destination=EG&minPrice=500&maxPrice=1500&page=1&pageSize=20&sortBy=price&sortOrder=asc
```

```json
{
  "data": {
    "listings": [
      {
        "id": "lst_abc123",
        "title": "iPhone 15 Pro Max 256GB - Sealed",
        "price": 1199,
        "currency": "USD",
        "origin": "US",
        "destination": "EG",
        "category": "electronics",
        "condition": "NEW",
        "imageUrl": "https://cdn.mnbara.com/listings/lst_abc123/thumb.jpg",
        "seller": {
          "id": "usr_xyz789",
          "displayName": "TechDeals",
          "rating": 4.8,
          "reviewCount": 127,
          "trustLevel": "VERIFIED",
          "verified": true
        },
        "createdAt": "2025-12-18T10:30:00Z",
        "estimatedDeliveryDays": 7,
        "corridorSupported": true
      }
    ],
    "facets": {
      "categories": [
        { "value": "electronics", "label": "Electronics", "count": 45 },
        { "value": "phones", "label": "Phones", "count": 32 }
      ],
      "origins": [
        { "value": "US", "label": "United States", "count": 89 }
      ],
      "destinations": [
        { "value": "EG", "label": "Egypt", "count": 89 }
      ],
      "conditions": [
        { "value": "NEW", "label": "New", "count": 67 },
        { "value": "LIKE_NEW", "label": "Like New", "count": 22 }
      ],
      "priceRanges": [
        { "min": 0, "max": 500, "count": 12 },
        { "min": 500, "max": 1000, "count": 34 },
        { "min": 1000, "max": null, "count": 43 }
      ]
    },
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 89,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2025-12-20T14:30:00Z",
    "version": "v1"
  }
}
```

---

## 3. Listing Details API Contract

### GET /api/v1/listings/:id

Get full listing details.

```typescript
// ============ REQUEST ============
// Path: /api/v1/listings/:id
// No query params required

// ============ RESPONSE ============
interface GetListingResponse {
  data: ListingDetail | null;
  error?: ApiError;
  meta: ResponseMeta;
}

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  
  // Location
  origin: string;              // Country code
  originCity?: string;
  destination: string;         // Country code
  destinationCity?: string;
  
  // Product info
  category: string;
  subcategory?: string;
  condition: ListingCondition;
  brand?: string;
  model?: string;
  
  // Media
  images: ListingImage[];
  
  // Seller
  seller: SellerProfile;
  
  // Status
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  
  // Computed (deterministic)
  estimatedDeliveryDays: number | null;
  corridorSupported: boolean;
  corridorId: string | null;   // e.g., "US_EG"
  
  // Stats (read-only)
  viewCount: number;
  inquiryCount: number;
}

type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'MATCHED' | 'COMPLETED' | 'EXPIRED' | 'REMOVED';

interface ListingImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  order: number;
}

interface SellerProfile {
  id: string;
  displayName: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  trustLevel: TrustLevel;
  verified: boolean;
  memberSince: string;
  responseRate: number;        // 0-100 percentage
  responseTimeHours: number;
  completedTransactions: number;
}
```

### Listing Details Example

```http
GET /api/v1/listings/lst_abc123
```

```json
{
  "data": {
    "id": "lst_abc123",
    "title": "iPhone 15 Pro Max 256GB - Sealed",
    "description": "Brand new, factory sealed iPhone 15 Pro Max. Natural Titanium color. US model with warranty.",
    "price": 1199,
    "currency": "USD",
    "origin": "US",
    "originCity": "New York",
    "destination": "EG",
    "destinationCity": "Cairo",
    "category": "electronics",
    "subcategory": "phones",
    "condition": "NEW",
    "brand": "Apple",
    "model": "iPhone 15 Pro Max",
    "images": [
      {
        "id": "img_001",
        "url": "https://cdn.mnbara.com/listings/lst_abc123/1.jpg",
        "thumbnailUrl": "https://cdn.mnbara.com/listings/lst_abc123/1_thumb.jpg",
        "alt": "iPhone 15 Pro Max front view",
        "order": 1
      }
    ],
    "seller": {
      "id": "usr_xyz789",
      "displayName": "TechDeals",
      "avatar": "https://cdn.mnbara.com/avatars/usr_xyz789.jpg",
      "rating": 4.8,
      "reviewCount": 127,
      "trustLevel": "VERIFIED",
      "verified": true,
      "memberSince": "2024-03-15T00:00:00Z",
      "responseRate": 95,
      "responseTimeHours": 2,
      "completedTransactions": 89
    },
    "status": "ACTIVE",
    "createdAt": "2025-12-18T10:30:00Z",
    "updatedAt": "2025-12-18T10:30:00Z",
    "expiresAt": "2026-01-18T10:30:00Z",
    "estimatedDeliveryDays": 7,
    "corridorSupported": true,
    "corridorId": "US_EG",
    "viewCount": 234,
    "inquiryCount": 12
  },
  "meta": {
    "requestId": "req_9876543210",
    "timestamp": "2025-12-20T14:35:00Z",
    "version": "v1"
  }
}
```

---

## 4. AI Advisory API Contract

### GET /api/v1/listings/:id/advisory

Get AI-powered advisory information for a listing. **READ-ONLY, NO EXECUTION.**

```typescript
// ============ REQUEST ============
interface GetListingAdvisoryRequest {
  // Path: /api/v1/listings/:id/advisory
  // Query params:
  buyerId?: string;            // Optional: for personalized advisory
}

// ============ RESPONSE ============
interface GetListingAdvisoryResponse {
  data: ListingAdvisory | null;
  error?: ApiError;
  meta: ResponseMeta & {
    advisory: true;            // Always true
    disclaimer: string;        // Required legal disclaimer
    featureEnabled: boolean;
  };
}

interface ListingAdvisory {
  listingId: string;
  
  // Trust Assessment (read-only)
  sellerTrust: TrustAssessment | null;
  buyerTrust: TrustAssessment | null;  // If buyerId provided
  
  // Risk Assessment (read-only)
  riskAssessment: RiskAssessment | null;
  
  // Corridor Assessment (read-only)
  corridorAssessment: CorridorAssessment | null;
  
  // Price Advisory (read-only)
  priceAdvisory: PriceAdvisory | null;
  
  // Recommendation (advisory only - NOT enforced)
  recommendation: AdvisoryRecommendation | null;
  
  // Checkpoints (user must confirm)
  checkpoints: ConfirmationCheckpoint[];
  
  // Timestamp
  generatedAt: string;
}

// ============ TRUST ASSESSMENT ============
interface TrustAssessment {
  userId: string;
  role: 'BUYER' | 'SELLER' | 'TRAVELER';
  score: number;               // 0-100
  level: TrustLevel;
  factors: TrustFactor[];
  computedAt: string;
}

interface TrustFactor {
  name: string;
  weight: number;              // 0-1
  value: number;               // Raw value
  contribution: number;        // Points contributed
  explanation: string;         // Human-readable
}

// ============ RISK ASSESSMENT ============
interface RiskAssessment {
  overallRisk: RiskLevel;
  riskScore: number;           // 0-100
  factors: RiskFactor[];
  flags: RiskFlag[];
  warnings: string[];          // User-facing warnings
  assessedAt: string;
}

type RiskLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskFactor {
  category: string;
  name: string;
  severity: RiskLevel;
  description: string;
  mitigations: string[];       // Suggested mitigations
}

interface RiskFlag {
  code: string;
  severity: RiskLevel;
  message: string;
  actionRequired: boolean;
}

// ============ CORRIDOR ASSESSMENT ============
interface CorridorAssessment {
  corridorId: string;          // e.g., "US_EG"
  corridorName: string;        // e.g., "United States → Egypt"
  isSupported: boolean;
  
  // Trust requirements (advisory)
  trustRequirements: {
    minBuyerTrust: TrustLevel;
    minSellerTrust: TrustLevel;
    buyerMeets: boolean;
    sellerMeets: boolean;
  };
  
  // Value assessment
  valueAssessment: {
    band: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    threshold: number;
    requiresVerification: boolean;  // Advisory only
  };
  
  // Escrow recommendation (advisory only - NOT enforced)
  escrowRecommendation: {
    recommended: boolean;
    reason: string;
    policy: string;            // Reference to policy doc
  };
  
  // Restrictions (informational)
  restrictions: string[];
  warnings: string[];
}

// ============ PRICE ADVISORY ============
interface PriceAdvisory {
  listingPrice: number;
  currency: string;
  
  // Market comparison (deterministic)
  marketComparison: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    percentile: number;        // Where this price falls (0-100)
    sampleSize: number;
  };
  
  // Assessment
  assessment: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET' | 'INSUFFICIENT_DATA';
  explanation: string;
  
  // No price suggestions - just information
}

// ============ RECOMMENDATION ============
interface AdvisoryRecommendation {
  action: RecommendedAction;
  confidence: number;          // 0-1
  reasoning: ReasoningStep[];
  warnings: string[];
  
  // CRITICAL: This is advisory only
  disclaimer: string;          // Always present
}

type RecommendedAction = 
  | 'PROCEED'                  // Low risk, proceed normally
  | 'PROCEED_WITH_CAUTION'     // Some concerns, user should review
  | 'VERIFY_FIRST'             // Recommend verification before proceeding
  | 'MANUAL_REVIEW'            // Suggest contacting support
  | 'NOT_RECOMMENDED';         // High risk, not recommended

interface ReasoningStep {
  step: number;
  factor: string;
  assessment: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

// ============ CONFIRMATION CHECKPOINTS ============
interface ConfirmationCheckpoint {
  id: string;
  type: CheckpointType;
  title: string;
  description: string;
  required: boolean;           // Must confirm to proceed
  confirmationText: string;    // Text user must acknowledge
  warnings: string[];
}

type CheckpointType = 
  | 'CROSS_BORDER'             // Cross-border transaction warning
  | 'HIGH_VALUE'               // High-value item warning
  | 'NEW_SELLER'               // New/unverified seller warning
  | 'ESCROW_RECOMMENDED'       // Escrow recommendation
  | 'CUSTOMS_WARNING';         // Customs/import warning
```

### AI Advisory Example

```http
GET /api/v1/listings/lst_abc123/advisory?buyerId=usr_buyer456
```

```json
{
  "data": {
    "listingId": "lst_abc123",
    "sellerTrust": {
      "userId": "usr_xyz789",
      "role": "SELLER",
      "score": 85,
      "level": "VERIFIED",
      "factors": [
        {
          "name": "Transaction History",
          "weight": 0.3,
          "value": 89,
          "contribution": 26.7,
          "explanation": "89 completed transactions with 98% success rate"
        },
        {
          "name": "Rating",
          "weight": 0.25,
          "value": 4.8,
          "contribution": 24,
          "explanation": "4.8 average rating from 127 reviews"
        },
        {
          "name": "Identity Verification",
          "weight": 0.2,
          "value": 100,
          "contribution": 20,
          "explanation": "Fully verified identity"
        },
        {
          "name": "Account Age",
          "weight": 0.15,
          "value": 75,
          "contribution": 11.25,
          "explanation": "Member for 21 months"
        },
        {
          "name": "Response Rate",
          "weight": 0.1,
          "value": 95,
          "contribution": 9.5,
          "explanation": "95% response rate, avg 2 hours"
        }
      ],
      "computedAt": "2025-12-20T14:35:00Z"
    },
    "buyerTrust": {
      "userId": "usr_buyer456",
      "role": "BUYER",
      "score": 62,
      "level": "STANDARD",
      "factors": [
        {
          "name": "Transaction History",
          "weight": 0.3,
          "value": 5,
          "contribution": 15,
          "explanation": "5 completed purchases"
        }
      ],
      "computedAt": "2025-12-20T14:35:00Z"
    },
    "riskAssessment": {
      "overallRisk": "LOW",
      "riskScore": 25,
      "factors": [
        {
          "category": "Seller",
          "name": "Seller Trust",
          "severity": "MINIMAL",
          "description": "Seller has verified status with strong history",
          "mitigations": []
        },
        {
          "category": "Corridor",
          "name": "Cross-Border",
          "severity": "LOW",
          "description": "US to Egypt corridor is supported",
          "mitigations": ["Consider escrow for added protection"]
        }
      ],
      "flags": [],
      "warnings": [
        "This is a cross-border transaction. Customs fees may apply."
      ],
      "assessedAt": "2025-12-20T14:35:00Z"
    },
    "corridorAssessment": {
      "corridorId": "US_EG",
      "corridorName": "United States → Egypt",
      "isSupported": true,
      "trustRequirements": {
        "minBuyerTrust": "STANDARD",
        "minSellerTrust": "TRUSTED",
        "buyerMeets": true,
        "sellerMeets": true
      },
      "valueAssessment": {
        "band": "HIGH",
        "threshold": 500,
        "requiresVerification": false
      },
      "escrowRecommendation": {
        "recommended": true,
        "reason": "High-value cross-border transaction",
        "policy": "See escrow policy for details"
      },
      "restrictions": [],
      "warnings": [
        "Import duties may apply in Egypt",
        "Delivery times may vary due to customs processing"
      ]
    },
    "priceAdvisory": {
      "listingPrice": 1199,
      "currency": "USD",
      "marketComparison": {
        "averagePrice": 1150,
        "minPrice": 999,
        "maxPrice": 1399,
        "percentile": 62,
        "sampleSize": 45
      },
      "assessment": "AT_MARKET",
      "explanation": "Price is within typical range for this item"
    },
    "recommendation": {
      "action": "PROCEED_WITH_CAUTION",
      "confidence": 0.78,
      "reasoning": [
        {
          "step": 1,
          "factor": "Seller Trust",
          "assessment": "Verified seller with strong track record",
          "impact": "POSITIVE"
        },
        {
          "step": 2,
          "factor": "Transaction Value",
          "assessment": "High-value item ($1,199)",
          "impact": "NEUTRAL"
        },
        {
          "step": 3,
          "factor": "Cross-Border",
          "assessment": "Supported corridor with customs considerations",
          "impact": "NEUTRAL"
        }
      ],
      "warnings": [
        "Consider using escrow for this high-value purchase"
      ],
      "disclaimer": "This is advisory information only. MNBARA does not guarantee any transaction outcomes. You are responsible for your own purchasing decisions."
    },
    "checkpoints": [
      {
        "id": "chk_crossborder_001",
        "type": "CROSS_BORDER",
        "title": "Cross-Border Transaction",
        "description": "This item will be shipped from the United States to Egypt.",
        "required": true,
        "confirmationText": "I understand this is an international transaction and customs fees may apply",
        "warnings": [
          "Import duties and taxes are your responsibility",
          "Delivery times may be longer than domestic shipping"
        ]
      },
      {
        "id": "chk_escrow_001",
        "type": "ESCROW_RECOMMENDED",
        "title": "Escrow Recommended",
        "description": "For high-value items, we recommend using escrow protection.",
        "required": false,
        "confirmationText": "I have reviewed the escrow option",
        "warnings": []
      }
    ],
    "generatedAt": "2025-12-20T14:35:00Z"
  },
  "meta": {
    "requestId": "req_adv_123456",
    "timestamp": "2025-12-20T14:35:00Z",
    "version": "v1",
    "advisory": true,
    "disclaimer": "This information is advisory only and does not constitute financial, legal, or professional advice. All decisions are your responsibility.",
    "featureEnabled": true
  }
}
```


---

## 5. Offer Submission API Contract

### POST /api/v1/requests/:requestId/offers

Submit an offer on a shopper request. **Creates record only - NO payment execution.**

```typescript
// ============ REQUEST ============
interface SubmitOfferRequest {
  // Path: /api/v1/requests/:requestId/offers
  
  // Body:
  price: number;               // Offered price
  currency: string;            // ISO 4217
  deliveryDate: string;        // ISO 8601 date
  message: string;             // Message to buyer (10-500 chars)
  
  // Optional
  pickupLocation?: string;     // Where traveler will pick up
  notes?: string;              // Additional notes
  
  // Confirmation (required)
  confirmations: OfferConfirmation[];
}

interface OfferConfirmation {
  checkpointId: string;
  confirmed: boolean;
  confirmedAt: string;         // ISO 8601
}

// ============ RESPONSE ============
interface SubmitOfferResponse {
  data: OfferSubmissionResult | null;
  error?: ApiError;
  meta: ResponseMeta;
}

interface OfferSubmissionResult {
  offerId: string;
  requestId: string;
  status: 'PENDING';           // Always starts as pending
  
  // Submitted values
  price: number;
  currency: string;
  deliveryDate: string;
  message: string;
  
  // Timestamps
  createdAt: string;
  expiresAt: string;           // When offer auto-expires
  
  // Next steps (informational)
  nextSteps: string[];
  
  // IMPORTANT: No payment has been processed
  paymentStatus: 'NOT_INITIATED';
}
```

### Offer Submission Example

```http
POST /api/v1/requests/req_shopper789/offers
Content-Type: application/json
Authorization: Bearer <token>

{
  "price": 1250,
  "currency": "USD",
  "deliveryDate": "2025-12-28",
  "message": "I'll be traveling from NYC to Cairo on Dec 26. I can pick up the iPhone from the Apple Store and deliver it to you. Happy to provide photos of the sealed box before shipping.",
  "pickupLocation": "Apple Store, Fifth Avenue, NYC",
  "confirmations": [
    {
      "checkpointId": "chk_crossborder_001",
      "confirmed": true,
      "confirmedAt": "2025-12-20T14:40:00Z"
    }
  ]
}
```

```json
{
  "data": {
    "offerId": "ofr_new123",
    "requestId": "req_shopper789",
    "status": "PENDING",
    "price": 1250,
    "currency": "USD",
    "deliveryDate": "2025-12-28",
    "message": "I'll be traveling from NYC to Cairo on Dec 26...",
    "createdAt": "2025-12-20T14:40:00Z",
    "expiresAt": "2025-12-23T14:40:00Z",
    "nextSteps": [
      "Your offer has been sent to the buyer",
      "You'll be notified when the buyer responds",
      "If accepted, you'll receive payment instructions"
    ],
    "paymentStatus": "NOT_INITIATED"
  },
  "meta": {
    "requestId": "req_submit_456",
    "timestamp": "2025-12-20T14:40:00Z",
    "version": "v1"
  }
}
```

### GET /api/v1/offers/:id

Get offer details.

```typescript
// ============ RESPONSE ============
interface GetOfferResponse {
  data: OfferDetail | null;
  error?: ApiError;
  meta: ResponseMeta;
}

interface OfferDetail {
  id: string;
  requestId: string;
  
  // Parties
  traveler: TravelerSummary;
  buyer: BuyerSummary;
  
  // Offer details
  price: number;
  currency: string;
  deliveryDate: string;
  message: string;
  pickupLocation?: string;
  notes?: string;
  
  // Status
  status: OfferStatus;
  statusHistory: StatusChange[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  
  // Payment (informational only)
  paymentStatus: PaymentStatus;
  
  // Related request summary
  request: RequestSummary;
}

type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
type PaymentStatus = 'NOT_INITIATED' | 'PENDING_BUYER' | 'IN_ESCROW' | 'RELEASED' | 'REFUNDED';

interface StatusChange {
  from: OfferStatus;
  to: OfferStatus;
  changedAt: string;
  changedBy: string;           // User ID or 'SYSTEM'
  reason?: string;
}

interface TravelerSummary {
  id: string;
  displayName: string;
  rating: number;
  trustLevel: TrustLevel;
  verified: boolean;
}

interface BuyerSummary {
  id: string;
  displayName: string;
  rating: number;
  trustLevel: TrustLevel;
}

interface RequestSummary {
  id: string;
  title: string;
  budget: number;
  origin: string;
  destination: string;
  deadline: string;
}
```


---

## 6. Error Contract Standards

### Standard Error Response

```typescript
interface ErrorResponse {
  data: null;
  error: ApiError;
  meta: ResponseMeta;
}

interface ApiError {
  code: ErrorCode;
  message: string;             // User-friendly, safe to display
  details?: ErrorDetails;
  retryable: boolean;
  retryAfterMs?: number;       // For rate limiting
}

interface ErrorDetails {
  field?: string;              // For validation errors
  fields?: FieldError[];       // Multiple field errors
  reason?: string;             // Technical reason (for debugging)
  documentationUrl?: string;   // Link to docs
}

interface FieldError {
  field: string;
  message: string;
  code: string;
}
```

### Error Codes Reference

| Code | HTTP Status | Retryable | User Message |
|------|-------------|-----------|--------------|
| `VALIDATION_ERROR` | 400 | No | "Please check your input" |
| `UNAUTHORIZED` | 401 | No | "Please log in to continue" |
| `FORBIDDEN` | 403 | No | "You don't have permission for this" |
| `NOT_FOUND` | 404 | No | "We couldn't find what you're looking for" |
| `CONFLICT` | 409 | No | "This action conflicts with current state" |
| `RATE_LIMITED` | 429 | Yes | "Too many requests. Please wait." |
| `INTERNAL_ERROR` | 500 | Yes | "Something went wrong. We're on it." |
| `SERVICE_UNAVAILABLE` | 503 | Yes | "Service temporarily unavailable" |
| `TIMEOUT` | 504 | Yes | "Request timed out. Please try again." |
| `FEATURE_DISABLED` | 503 | No | (Silent - hide feature) |
| `EMERGENCY_MODE` | 503 | No | "Some features are temporarily disabled" |

### Error Examples

**Validation Error:**
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input",
    "details": {
      "fields": [
        { "field": "price", "message": "Price must be greater than 0", "code": "min_value" },
        { "field": "message", "message": "Message must be at least 10 characters", "code": "min_length" }
      ]
    },
    "retryable": false
  },
  "meta": {
    "requestId": "req_err_001",
    "timestamp": "2025-12-20T14:45:00Z",
    "version": "v1"
  }
}
```

**Rate Limited:**
```json
{
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait 60 seconds.",
    "retryable": true,
    "retryAfterMs": 60000
  },
  "meta": {
    "requestId": "req_err_002",
    "timestamp": "2025-12-20T14:45:00Z",
    "version": "v1"
  }
}
```

**Feature Disabled (AI Advisory):**
```json
{
  "data": null,
  "error": {
    "code": "FEATURE_DISABLED",
    "message": "This feature is currently unavailable",
    "retryable": false
  },
  "meta": {
    "requestId": "req_err_003",
    "timestamp": "2025-12-20T14:45:00Z",
    "version": "v1",
    "featureEnabled": false
  }
}
```

---

## 7. Loading State Expectations

### Response Time Targets

| Endpoint | Target | Max | Timeout |
|----------|--------|-----|---------|
| Search listings | 200ms | 500ms | 10s |
| Get listing | 100ms | 300ms | 10s |
| Get advisory | 500ms | 1500ms | 5s |
| Submit offer | 300ms | 1000ms | 15s |
| Health check | 50ms | 200ms | 3s |

### Loading State Patterns

```typescript
// Frontend loading state interface
interface LoadingState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: ApiError | null;
  
  // Timing
  startedAt: number | null;    // Timestamp
  completedAt: number | null;
  durationMs: number | null;
  
  // Retry info
  retryCount: number;
  canRetry: boolean;
  retryAfterMs: number | null;
}

// Loading state by feature
interface FeatureLoadingStates {
  search: LoadingState<SearchListingsResponse['data']>;
  listing: LoadingState<ListingDetail>;
  advisory: LoadingState<ListingAdvisory>;
  offer: LoadingState<OfferSubmissionResult>;
}
```

### Loading Behavior by Feature

| Feature | Show Skeleton | Show Spinner | Timeout Action | Retry Strategy |
|---------|---------------|--------------|----------------|----------------|
| Search | Yes (list) | No | Show error, offer retry | 3x with backoff |
| Listing | Yes (detail) | No | Show error, offer retry | 3x with backoff |
| Advisory | No | Yes (inline) | Hide panel (graceful) | 2x quick |
| Offer Submit | No | Yes (button) | Show error, keep form | 3x with backoff |

### Skeleton Loading Patterns

```typescript
// Search results skeleton
interface SearchSkeleton {
  listingCards: number;        // Show N skeleton cards (default: 6)
  showFilters: boolean;        // Show filter skeleton
  showPagination: boolean;     // Show pagination skeleton
}

// Listing detail skeleton
interface ListingSkeleton {
  showImages: boolean;         // Image gallery skeleton
  showDetails: boolean;        // Title, price, description
  showSeller: boolean;         // Seller info skeleton
  showAdvisory: boolean;       // Advisory panel skeleton (if enabled)
}
```


---

## 8. TypeScript Types Export

Complete type definitions for frontend use:

```typescript
// types/api.ts

// ============ ENUMS ============
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

export type TrustLevel = 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'RESTRICTED';
export type RiskLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'MATCHED' | 'COMPLETED' | 'EXPIRED' | 'REMOVED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'NOT_INITIATED' | 'PENDING_BUYER' | 'IN_ESCROW' | 'RELEASED' | 'REFUNDED';
export type RecommendedAction = 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'VERIFY_FIRST' | 'MANUAL_REVIEW' | 'NOT_RECOMMENDED';
export type CheckpointType = 'CROSS_BORDER' | 'HIGH_VALUE' | 'NEW_SELLER' | 'ESCROW_RECOMMENDED' | 'CUSTOMS_WARNING';
export type SearchSortOption = 'relevance' | 'price' | 'newest' | 'rating';

// ============ BASE TYPES ============
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

// ============ SEARCH TYPES ============
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

export interface SellerSummary {
  id: string;
  displayName: string;
  rating: number;
  reviewCount: number;
  trustLevel: TrustLevel;
  verified: boolean;
}

export interface SearchFacets {
  categories: FacetBucket[];
  origins: FacetBucket[];
  destinations: FacetBucket[];
  conditions: FacetBucket[];
  priceRanges: PriceRangeBucket[];
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

export interface SearchListingsData {
  listings: ListingSummary[];
  facets: SearchFacets;
  pagination: PaginationInfo;
}

export type SearchListingsResponse = ApiResponse<SearchListingsData>;

// ============ LISTING TYPES ============
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

// ============ ADVISORY TYPES ============
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
  disclaimer: string;
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

// ============ OFFER TYPES ============
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
  paymentStatus: 'NOT_INITIATED';
}

export type SubmitOfferResponse = ApiResponse<OfferSubmissionResult>;

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
```

---

## 9. Quick Reference

### Endpoint Summary

| Endpoint | Method | Auth | Rate Limit | Advisory |
|----------|--------|------|------------|----------|
| `/api/v1/search/listings` | GET | No | 60/min | No |
| `/api/v1/listings/:id` | GET | No | 120/min | No |
| `/api/v1/listings/:id/advisory` | GET | Optional | 30/min | Yes |
| `/api/v1/requests/:id/offers` | POST | Yes | 10/min | No |
| `/api/v1/offers/:id` | GET | Yes | 60/min | No |

### Response Time SLAs

| Percentile | Search | Listing | Advisory | Offer |
|------------|--------|---------|----------|-------|
| p50 | 150ms | 80ms | 400ms | 250ms |
| p95 | 400ms | 250ms | 1200ms | 800ms |
| p99 | 800ms | 500ms | 2000ms | 1500ms |

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Owner: API Team*