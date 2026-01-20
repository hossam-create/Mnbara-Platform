# Frontend ↔ Backend Integration Guide

Complete integration specification for crowdship-service, ai-core, and related endpoints.

---

## Constraints (Non-Negotiable)

| Constraint | Enforcement |
|------------|-------------|
| READ-ONLY AI | All AI endpoints return advisory data only |
| NO payments | No payment processing in advisory layer |
| NO auto execution | All actions require explicit user confirmation |
| Deterministic behavior | Same input → same output |
| Feature-flagged | All features disabled by default |

---

## 1. Endpoint → Screen Mapping

### Crowdship Service Endpoints

| Endpoint | Method | Screen(s) | Purpose |
|----------|--------|-----------|---------|
| `/api/crowdship/offers` | POST | CreateRequestPage | Create shopper request |
| `/api/crowdship/offers/:id` | GET | RequestDetailPage, OfferDetailPage | Get request/offer details |
| `/api/crowdship/offers/:id/ai/recommendation` | GET | OfferDetailPage, AIAdvisoryPanel | Get AI advisory (read-only) |
| `/api/crowdship/offers/ai/audit` | GET | AdminAuditPage | Get AI audit logs |
| `/api/crowdship/corridor/advisory` | POST | CorridorAdvisoryPanel, CheckoutPage | Get corridor assessment |
| `/api/crowdship/intent/classify` | POST | IntentChip, SearchPage | Classify user intent |
| `/api/crowdship/checkpoints` | POST | ConfirmationCheckpoint | Get confirmation checkpoints |
| `/api/crowdship/checkpoints/:id/confirm` | POST | ConfirmationCheckpoint | Record user confirmation |
| `/api/crowdship/corridor/snapshot/:id` | GET | AdminAuditPage | Get corridor snapshot |
| `/api/crowdship/health/ready` | GET | ServiceStatusBanner | Check service health |
| `/api/crowdship/health/flags` | GET | App (global) | Get feature flags |
| `/api/crowdship/health/rate-limit` | GET | RateLimitWarning | Get rate limit status |
| `/api/crowdship/health/corridors` | GET | CorridorHealthPanel | Get corridor volume status |
| `/api/crowdship/health/constraints` | GET | AdminDashboard | Verify constraints |

### AI Core Endpoints (Internal)

| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `/api/ai-core/intent/classify` | POST | crowdship-service | Classify intent |
| `/api/ai-core/trust/compute` | POST | crowdship-service | Compute trust score |
| `/api/ai-core/risk/assess` | POST | crowdship-service | Assess risk |
| `/api/ai-core/match/users` | POST | crowdship-service | Match users (advisory) |
| `/api/ai-core/recommend` | POST | crowdship-service | Get recommendation |
| `/api/ai-core/health` | GET | crowdship-service | Health check |

---

## 2. API Contracts

### 2.1 Get AI Recommendation

```typescript
// Request
GET /api/crowdship/offers/:offerId/ai/recommendation?buyerId=123

// Response
interface AIRecommendationResponse {
  data: {
    offerId: number;
    buyerTrust: TrustScoreResult | null;
    travelerTrust: TrustScoreResult | null;
    riskAssessment: RiskAssessmentResult | null;
    recommendation: DecisionRecommendationResult | null;
    marketIntent?: MarketIntentResult | null;
    corridorAssessment?: CorridorAssessment | null;
    recommendationLanes?: RecommendationLanes | null;
    confirmationCheckpoints?: HumanConfirmationCheckpoint[];
  } | null;
  meta: {
    advisory: boolean;        // Always true
    disclaimer: string;
    correlationId: string;
  };
  message?: string;           // Error message if data is null
}

interface TrustScoreResult {
  userId: string;
  role: 'BUYER' | 'TRAVELER';
  score: number;              // 0-100
  level: 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'RESTRICTED';
  factors: TrustFactor[];
  computedAt: string;         // ISO timestamp
}

interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  explanation: string;
}

interface RiskAssessmentResult {
  requestId: string;
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  riskScore: number;          // 0-100
  factors: RiskFactor[];
  flags: RiskFlag[];
  recommendations: string[];
  assessedAt: string;
}

interface DecisionRecommendationResult {
  requestId: string;
  travelerId: string;
  action: 'PROCEED' | 'PROCEED_WITH_ESCROW' | 'REQUIRE_VERIFICATION' | 'MANUAL_REVIEW' | 'DECLINE';
  confidence: number;         // 0-1
  reasoning: ReasoningStep[];
  warnings: string[];
  disclaimer: string;         // Always present
  generatedAt: string;
}
```

### 2.2 Corridor Advisory

```typescript
// Request
POST /api/crowdship/corridor/advisory
{
  origin: string;             // Country code (e.g., "US")
  destination: string;        // Country code (e.g., "EG")
  itemValueUSD: number;
  deliveryDays: number;
  buyerId: number;
  travelerId: number;
}

// Response
interface CorridorAdvisoryResponse {
  data: CorridorAssessment | null;
  meta: {
    advisory: boolean;
    disclaimer: string;
    correlationId: string;
    featureEnabled?: boolean;
  };
  message?: string;
}

interface CorridorAssessment {
  corridorId: string;         // e.g., "US_EG"
  corridorName: string;
  origin: string;
  destination: string;
  isSupported: boolean;
  riskMultiplier: number;
  valueBand: { label: string; multiplier: number };
  trustGating: TrustGatingResult;
  escrowRecommendation: EscrowRecommendation;
  restrictions: string[];
  warnings: string[];
  timestamp: string;
}

interface TrustGatingResult {
  passed: boolean;
  buyerMeetsRequirement: boolean;
  travelerMeetsRequirement: boolean;
  requiredBuyerTrust: string;
  requiredTravelerTrust: string;
  actualBuyerTrust: string;
  actualTravelerTrust: string;
  downgradeReason?: string;
  isHighValue: boolean;
}

interface EscrowRecommendation {
  recommended: boolean;
  required: boolean;          // Advisory only - not enforced
  reason: string;
  policy: string;
}
```

### 2.3 Intent Classification

```typescript
// Request
POST /api/crowdship/intent/classify
{
  pageContext?: string;
  action?: string;
  userRole?: 'buyer' | 'traveler';
  productUrl?: string;
  hasPrice?: boolean;
  isCrossBorder?: boolean;
}

// Response
interface IntentClassifyResponse {
  data: MarketIntentResult | null;
  meta: {
    advisory: boolean;
    correlationId: string;
  };
}

interface MarketIntentResult {
  intent: 'BUY_FROM_ABROAD' | 'TRAVEL_MATCH' | 'PRICE_VERIFY' | 'BROWSE' | 'UNKNOWN';
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: IntentSignal[];
  reasoning: string;
  editable: boolean;          // User can override
  timestamp: string;
}
```

### 2.4 Confirmation Checkpoints

```typescript
// Request
POST /api/crowdship/checkpoints
{
  isCrossBorder: boolean;
  isContactingTraveler: boolean;
  isSelectingPayment: boolean;
}

// Response
interface CheckpointsResponse {
  data: HumanConfirmationCheckpoint[];
  meta: { advisory: boolean; correlationId: string };
}

interface HumanConfirmationCheckpoint {
  checkpointId: string;
  type: 'CONTACT_TRAVELER' | 'SELECT_PAYMENT' | 'PROCEED_CROSS_BORDER';
  title: string;
  description: string;
  requiredConfirmation: boolean;
  confirmationText: string;
  warnings: string[];
}

// Confirm checkpoint
POST /api/crowdship/checkpoints/:checkpointId/confirm
{ confirmed: boolean }

// Response
{ success: boolean; message: string; checkpointId: string; timestamp: string }
```

### 2.5 Health Check

```typescript
// Request
GET /api/crowdship/health/ready

// Response
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  components: ComponentHealth[];
  flags: {
    aiCoreEnabled: boolean;
    corridorAdvisoryEnabled: boolean;
    emergencyDisabled: boolean;
  };
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTimeMs?: number;
  message?: string;
  lastChecked: string;
}
```

---

## 3. Frontend Hooks

### 3.1 useRequests

```typescript
/**
 * Hook for managing shopper requests
 * READ-ONLY data fetching
 */
interface UseRequestsOptions {
  userId?: number;
  status?: 'OPEN' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  limit?: number;
  offset?: number;
}

interface UseRequestsResult {
  // Data
  requests: ShopperRequest[];
  total: number;
  
  // State
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  
  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  
  // Actions
  refetch: () => Promise<void>;
}

// Responsibilities:
// - Fetch paginated list of shopper requests
// - Handle loading, error, empty states
// - Support infinite scroll via loadMore
// - Cache results for performance
// - Retry on transient failures
```

### 3.2 useOffers

```typescript
/**
 * Hook for managing traveler offers
 * READ-ONLY data fetching
 */
interface UseOffersOptions {
  requestId?: number;
  travelerId?: number;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}

interface UseOffersResult {
  // Data
  offers: TravelerOffer[];
  
  // State
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  
  // Actions
  refetch: () => Promise<void>;
}

// Responsibilities:
// - Fetch offers for a request or traveler
// - Handle loading, error, empty states
// - Real-time updates via polling (not WebSocket for MVP)
// - Retry on transient failures
```

### 3.3 useAIAdvisory

```typescript
/**
 * Hook for AI advisory data
 * READ-ONLY, advisory only, feature-flagged
 */
interface UseAIAdvisoryOptions {
  offerId: number | null;
  buyerId?: number;
  enabled?: boolean;
}

interface UseAIAdvisoryResult {
  // Data
  buyerTrust: TrustScoreResult | null;
  travelerTrust: TrustScoreResult | null;
  riskAssessment: RiskAssessmentResult | null;
  recommendation: DecisionRecommendationResult | null;
  corridorAssessment: CorridorAssessment | null;
  
  // State
  isLoading: boolean;
  isEnabled: boolean;          // Feature flag check
  isError: boolean;
  error: string | null;
  
  // Meta
  correlationId: string | null;
  disclaimer: string | null;
  
  // Actions
  refetch: () => Promise<void>;
}

// Responsibilities:
// - Check feature flags before fetching
// - Return null data if feature disabled (not error)
// - Always include disclaimer in response
// - Log correlation ID for audit
// - Graceful degradation on failure
```

### 3.4 useCorridorAdvisory

```typescript
/**
 * Hook for corridor advisory
 * READ-ONLY, advisory only, feature-flagged
 */
interface UseCorridorAdvisoryInput {
  origin: string;
  destination: string;
  itemValueUSD: number;
  deliveryDays?: number;
  buyerId?: number;
  travelerId?: number;
}

interface UseCorridorAdvisoryResult {
  // Data
  corridorAssessment: CorridorAssessment | null;
  marketIntent: MarketIntentResult | null;
  confirmationCheckpoints: HumanConfirmationCheckpoint[];
  
  // State
  isLoading: boolean;
  isEnabled: boolean;
  isError: boolean;
  error: string | null;
  correlationId: string | null;
  
  // Feature flags
  flags: {
    corridorAiAdvisory: boolean;
    trustGating: boolean;
    intentChipUi: boolean;
    humanConfirmationCheckpoints: boolean;
  };
  
  // Actions
  refetch: () => Promise<void>;
  classifyIntent: (signals: IntentSignals) => Promise<void>;
}

// Responsibilities:
// - Fetch corridor assessment
// - Fetch market intent classification
// - Fetch confirmation checkpoints
// - Check all relevant feature flags
// - Graceful degradation per feature
```

### 3.5 useServiceHealth

```typescript
/**
 * Hook for service health monitoring
 */
interface UseServiceHealthResult {
  // Data
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  components: ComponentHealth[];
  flags: FeatureFlags;
  
  // State
  isLoading: boolean;
  lastChecked: Date | null;
  
  // Derived
  isEmergencyMode: boolean;
  isAIEnabled: boolean;
  
  // Actions
  refetch: () => Promise<void>;
}

// Responsibilities:
// - Poll health endpoint periodically (30s)
// - Detect emergency mode
// - Surface degraded components
// - Trigger UI warnings when degraded
```

---

## 4. API Client Structure

```typescript
// frontend/web/src/services/crowdship.service.ts

import api from './api';
import { withRetry, RetryPresets } from '../utils/retry';
import { handleApiError, ApiError } from '../utils/errors';

const BASE_URL = process.env.REACT_APP_CROWDSHIP_API_URL || '/api/crowdship';

/**
 * Crowdship API Client
 * All methods are read-only advisory
 */
export const crowdshipApi = {
  // ============ Requests ============
  
  async getRequests(options: GetRequestsOptions): Promise<PaginatedResponse<ShopperRequest>> {
    return withRetry(
      () => api.get(`${BASE_URL}/requests`, { params: options }),
      RetryPresets.standard
    ).then(res => res.data);
  },
  
  async getRequest(id: number): Promise<ShopperRequest> {
    return withRetry(
      () => api.get(`${BASE_URL}/requests/${id}`),
      RetryPresets.standard
    ).then(res => res.data);
  },
  
  // ============ Offers ============
  
  async getOffers(options: GetOffersOptions): Promise<TravelerOffer[]> {
    return withRetry(
      () => api.get(`${BASE_URL}/offers`, { params: options }),
      RetryPresets.standard
    ).then(res => res.data);
  },
  
  async getOffer(id: number): Promise<TravelerOffer> {
    return withRetry(
      () => api.get(`${BASE_URL}/offers/${id}`),
      RetryPresets.standard
    ).then(res => res.data);
  },
  
  // ============ AI Advisory (Read-Only) ============
  
  async getAIRecommendation(offerId: number, buyerId?: number): Promise<AIRecommendationResponse> {
    try {
      const params = buyerId ? { buyerId } : {};
      const response = await withRetry(
        () => api.get(`${BASE_URL}/offers/${offerId}/ai/recommendation`, { params }),
        RetryPresets.quick
      );
      return response.data;
    } catch (error) {
      // Graceful degradation - return null data, not error
      return { data: null, message: 'AI features unavailable' };
    }
  },
  
  async getCorridorAdvisory(input: CorridorAdvisoryInput): Promise<CorridorAdvisoryResponse> {
    try {
      const response = await withRetry(
        () => api.post(`${BASE_URL}/corridor/advisory`, input),
        RetryPresets.quick
      );
      return response.data;
    } catch (error) {
      return { data: null, message: 'Corridor advisory unavailable' };
    }
  },
  
  async classifyIntent(signals: IntentSignals): Promise<IntentClassifyResponse> {
    try {
      const response = await withRetry(
        () => api.post(`${BASE_URL}/intent/classify`, signals),
        RetryPresets.quick
      );
      return response.data;
    } catch (error) {
      return { data: null, message: 'Intent classification unavailable' };
    }
  },
  
  // ============ Checkpoints ============
  
  async getCheckpoints(input: CheckpointInput): Promise<CheckpointsResponse> {
    try {
      const response = await api.post(`${BASE_URL}/checkpoints`, input);
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  },
  
  async confirmCheckpoint(checkpointId: string, confirmed: boolean): Promise<ConfirmResponse> {
    return api.post(`${BASE_URL}/checkpoints/${checkpointId}/confirm`, { confirmed })
      .then(res => res.data);
  },
  
  // ============ Health ============
  
  async checkHealth(): Promise<HealthCheckResult | null> {
    try {
      const response = await api.get(`${BASE_URL}/health/ready`);
      return response.data;
    } catch (error) {
      return null;
    }
  },
  
  async getFeatureFlags(): Promise<FeatureFlags> {
    try {
      const response = await api.get(`${BASE_URL}/health/flags`);
      return response.data.flags;
    } catch (error) {
      // Return all disabled on error
      return getDefaultFlags();
    }
  },
  
  async isEmergencyMode(): Promise<boolean> {
    try {
      const response = await api.get(`${BASE_URL}/health/flags`);
      return response.data.emergencyDisabled === true;
    } catch (error) {
      // Assume emergency mode if can't reach service
      return true;
    }
  },
};

function getDefaultFlags(): FeatureFlags {
  return {
    AI_CORE_ENABLED: false,
    CORRIDOR_AI_ADVISORY: false,
    TRUST_GATING: false,
    INTENT_CHIP_UI: false,
    HUMAN_CONFIRMATION_CHECKPOINTS: false,
    EMERGENCY_DISABLE_ALL: false,
  };
}
```

---

## 5. Error Handling

### Error Types

```typescript
// frontend/web/src/utils/errors.ts

export enum ErrorCode {
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Feature
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  EMERGENCY_MODE = 'EMERGENCY_MODE',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  retryAfter?: number;        // Seconds
  details?: Record<string, unknown>;
}
```

### Error Handling by Type

| Error Code | User Message | Action | Retry |
|------------|--------------|--------|-------|
| NETWORK_ERROR | "Connection issue. Check your internet." | Show retry button | Yes |
| TIMEOUT | "Request timed out. Try again." | Show retry button | Yes |
| UNAUTHORIZED | "Please log in again." | Redirect to login | No |
| FORBIDDEN | "You don't have access to this." | Show error | No |
| RATE_LIMITED | "Too many requests. Wait a moment." | Show countdown | Yes (after delay) |
| VALIDATION_ERROR | "Please check your input." | Highlight fields | No |
| SERVER_ERROR | "Something went wrong. We're on it." | Show retry button | Yes |
| SERVICE_UNAVAILABLE | "Service temporarily unavailable." | Show status banner | Yes |
| FEATURE_DISABLED | (Silent - show fallback UI) | Hide feature | No |
| EMERGENCY_MODE | "Some features are temporarily disabled." | Show banner | No |

### Error Handling in Hooks

```typescript
// Pattern for graceful degradation
function useAIAdvisory(offerId: number | null) {
  const [data, setData] = useState<AIData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetch = useCallback(async () => {
    if (!offerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await crowdshipApi.getAIRecommendation(offerId);
      
      if (response.data) {
        setData(response.data);
      } else {
        // Feature disabled or unavailable - not an error
        setData(null);
        // Don't set error - this is expected behavior
      }
    } catch (err) {
      // Only set error for unexpected failures
      setError('Unable to load AI advisory');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [offerId]);
  
  return { data, error, isLoading, refetch: fetch };
}
```

---

## 6. Empty States

| Screen | Empty State | Message | Action |
|--------|-------------|---------|--------|
| RequestsList | No requests | "No shopping requests yet" | "Create your first request" button |
| OffersList | No offers | "No offers yet" | "Travelers will see your request soon" |
| AIAdvisory | Feature disabled | (Hide panel entirely) | None |
| AIAdvisory | No data | "AI insights unavailable" | None (graceful) |
| CorridorAdvisory | Unsupported corridor | "This route isn't supported yet" | Show alternatives |
| CorridorAdvisory | Feature disabled | (Hide panel entirely) | None |
| Checkpoints | No checkpoints | (Skip checkpoint flow) | None |
| SearchResults | No results | "No matches found" | "Try different filters" |

---

## 7. Loading States

### Loading Patterns

```typescript
// Skeleton loading for lists
<RequestsList>
  {isLoading ? (
    <RequestSkeleton count={5} />
  ) : (
    requests.map(r => <RequestCard key={r.id} request={r} />)
  )}
</RequestsList>

// Inline loading for AI advisory
<AIAdvisoryPanel>
  {isLoading ? (
    <div className="ai-loading">
      <Spinner size="sm" />
      <span>Analyzing...</span>
    </div>
  ) : data ? (
    <AIAdvisoryContent data={data} />
  ) : null}
</AIAdvisoryPanel>

// Full-page loading for critical data
{isLoading && !data ? (
  <PageLoader message="Loading request details..." />
) : (
  <RequestDetailContent request={data} />
)}
```

### Loading Timeouts

| Operation | Timeout | On Timeout |
|-----------|---------|------------|
| List fetch | 10s | Show error, offer retry |
| Detail fetch | 10s | Show error, offer retry |
| AI advisory | 5s | Hide panel (graceful) |
| Health check | 3s | Assume degraded |
| Intent classify | 3s | Skip (graceful) |

---

## 8. Retry Behavior

### Retry Configuration

```typescript
export const RetryPresets = {
  // Quick retry for non-critical features
  quick: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
  },
  
  // Standard retry for most API calls
  standard: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  },
  
  // Aggressive retry for critical operations
  aggressive: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  
  // No retry
  none: {
    maxRetries: 0,
  },
};
```

### Retry by Endpoint

| Endpoint | Preset | Reason |
|----------|--------|--------|
| GET /requests | standard | Core functionality |
| GET /offers | standard | Core functionality |
| GET /ai/recommendation | quick | Non-critical, graceful degradation |
| POST /corridor/advisory | quick | Non-critical, graceful degradation |
| POST /intent/classify | quick | Non-critical, graceful degradation |
| POST /checkpoints/confirm | standard | User action, should succeed |
| GET /health/* | none | Fast fail for health checks |

### Rate Limit Handling

```typescript
// When rate limited, respect Retry-After header
if (error.code === ErrorCode.RATE_LIMITED) {
  const retryAfter = error.retryAfter || 60;
  
  // Show countdown to user
  showRateLimitWarning(retryAfter);
  
  // Auto-retry after delay
  await sleep(retryAfter * 1000);
  return retry();
}
```

---

## 9. Edge Cases

### Feature Flag Edge Cases

| Scenario | Behavior |
|----------|----------|
| AI_CORE_ENABLED=false | Hide all AI panels, return null from hooks |
| EMERGENCY_DISABLE_ALL=true | Show banner, disable all AI features |
| Flag changes mid-session | Re-fetch flags on navigation, update UI |
| Can't fetch flags | Assume all disabled (safe default) |

### Network Edge Cases

| Scenario | Behavior |
|----------|----------|
| Offline | Show offline banner, queue confirmations |
| Slow connection | Show loading states, extend timeouts |
| Partial response | Validate response shape, handle missing fields |
| Duplicate requests | Dedupe in-flight requests |

### Data Edge Cases

| Scenario | Behavior |
|----------|----------|
| Null trust scores | Show "Trust data unavailable" |
| Zero confidence | Show "Low confidence" warning |
| Missing corridor | Show "Route not supported" |
| Expired checkpoint | Refresh checkpoints |
| Stale data | Show "Last updated X ago" |

### User Edge Cases

| Scenario | Behavior |
|----------|----------|
| User cancels during checkpoint | Reset flow, don't record |
| User refreshes during confirmation | Restore state from URL/storage |
| User has multiple tabs | Sync state via storage events |
| User's session expires | Redirect to login, preserve context |

---

## 10. Testing Checklist

### Integration Tests

- [ ] AI advisory returns null when feature disabled
- [ ] Corridor advisory handles unsupported routes
- [ ] Checkpoints flow completes successfully
- [ ] Rate limiting shows appropriate UI
- [ ] Emergency mode disables all AI features
- [ ] Retry logic respects backoff
- [ ] Error states show correct messages
- [ ] Empty states render correctly
- [ ] Loading states don't flash

### E2E Tests

- [ ] Full request → offer → advisory flow
- [ ] Checkpoint confirmation flow
- [ ] Graceful degradation when AI unavailable
- [ ] Offline behavior
- [ ] Rate limit recovery

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Owner: Frontend Team*

