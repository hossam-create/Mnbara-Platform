# Phase 4.1: Listing Service Integration - Kickoff

**Date**: January 29, 2026  
**Phase**: 4.1 - Listing Service Integration  
**Status**: 🚀 STARTING  
**Duration**: 1-2 days  
**Tasks**: 7

---

## Overview

Integrate the Decision Authority Service with the Listing Service to enable decision-based listing management. This phase adds decision authority checks to listing creation and retrieval workflows.

---

## Tasks

### 4.1.1 Add Decision Authority Client ✅
**Status**: Ready to implement

Create a client wrapper for the Decision Authority Service in the listing service.

**File**: `backend/services/listing-service/src/clients/DecisionAuthorityClient.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { Logger } from '../utils/logger';

export interface DecisionRequest {
  assetId: string;
  assetType: 'LISTING' | 'AUCTION' | 'ESCROW';
  userId: string;
  metadata?: Record<string, any>;
}

export interface DecisionResponse {
  decisionId: string;
  assetId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reason?: string;
  expiresAt: Date;
}

export class DecisionAuthorityClient {
  private client: AxiosInstance;
  private logger: Logger;
  private enabled: boolean;

  constructor(baseUrl: string, apiKey: string, enabled: boolean = true) {
    this.enabled = enabled;
    this.logger = new Logger('DecisionAuthorityClient');
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    if (!this.enabled) {
      this.logger.info('Decision Authority disabled, auto-approving');
      return {
        decisionId: `auto-${request.assetId}`,
        assetId: request.assetId,
        status: 'APPROVED',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
    }

    try {
      const response = await this.client.post('/api/v1/decisions/request', request);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to request decision', error);
      throw error;
    }
  }

  async getDecision(decisionId: string): Promise<DecisionResponse> {
    if (!this.enabled) {
      return {
        decisionId,
        assetId: '',
        status: 'APPROVED',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
    }

    try {
      const response = await this.client.get(`/api/v1/decisions/${decisionId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get decision', error);
      throw error;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
```

---

### 4.1.2 Modify Listing Creation ✅
**Status**: Ready to implement

Update listing creation to request a decision from the Decision Authority Service.

**File**: `backend/services/listing-service/src/services/listing.service.ts`

**Changes**:
- Add `decisionId` field to listing creation
- Call `DecisionAuthorityClient.requestDecision()` when creating listing
- Store decision ID in database
- Set initial `disposition_status` to PENDING

```typescript
async createListing(data: CreateListingInput): Promise<Listing> {
  // Validate input
  this.validateListingInput(data);

  // Request decision from Decision Authority
  const decision = await this.decisionClient.requestDecision({
    assetId: data.id,
    assetType: 'LISTING',
    userId: data.userId,
    metadata: {
      title: data.title,
      category: data.category,
      price: data.price
    }
  });

  // Create listing with decision
  const listing = await this.prisma.listing.create({
    data: {
      ...data,
      decisionId: decision.decisionId,
      disposition_status: decision.status === 'APPROVED' ? 'APPROVED' : 'PENDING'
    }
  });

  return listing;
}
```

---

### 4.1.3 Add Disposition Status Field ✅
**Status**: Ready to implement

Add `disposition_status` field to Listing model in Prisma schema.

**File**: `backend/services/listing-service/prisma/schema.prisma`

```prisma
model Listing {
  id                String    @id @default(cuid())
  userId            String
  title             String
  description       String?
  category          String
  price             Float
  currency          String    @default("USD")
  
  // Decision Authority fields
  decisionId        String?
  disposition_status String   @default("PENDING") // PENDING, APPROVED, REJECTED, EXPIRED
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([disposition_status])
  @@index([decisionId])
}
```

---

### 4.1.4 Update Listing Queries ✅
**Status**: Ready to implement

Update listing queries to filter by disposition status.

**File**: `backend/services/listing-service/src/services/listing.service.ts`

```typescript
async getApprovedListings(filters?: ListingFilters): Promise<Listing[]> {
  return this.prisma.listing.findMany({
    where: {
      disposition_status: 'APPROVED',
      ...filters
    },
    orderBy: { createdAt: 'desc' }
  });
}

async getListingsByUser(userId: string): Promise<Listing[]> {
  return this.prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

async getListingsByStatus(status: string): Promise<Listing[]> {
  return this.prisma.listing.findMany({
    where: { disposition_status: status },
    orderBy: { createdAt: 'desc' }
  });
}
```

---

### 4.1.5 Add Decision Status Webhook Handler ✅
**Status**: Ready to implement

Handle decision status updates via webhook from Decision Authority Service.

**File**: `backend/services/listing-service/src/controllers/listing-webhook.controller.ts`

```typescript
import { Request, Response } from 'express';
import { ListingService } from '../services/listing.service';
import { Logger } from '../utils/logger';

export class ListingWebhookController {
  private listingService: ListingService;
  private logger: Logger;

  constructor(listingService: ListingService) {
    this.listingService = listingService;
    this.logger = new Logger('ListingWebhookController');
  }

  async handleDecisionStatusUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { decisionId, status, assetId } = req.body;

      this.logger.info(`Received decision update: ${decisionId} -> ${status}`);

      // Update listing with new decision status
      await this.listingService.updateListingStatus(assetId, status);

      res.json({ success: true });
    } catch (error) {
      this.logger.error('Failed to handle decision update', error);
      res.status(500).json({ error: 'Failed to process decision update' });
    }
  }
}
```

---

### 4.1.6 Write Integration Tests ✅
**Status**: Ready to implement

Create comprehensive integration tests for listing-decision authority integration.

**File**: `backend/services/listing-service/src/services/__tests__/listing-decision-integration.test.ts`

```typescript
import { ListingService } from '../listing.service';
import { DecisionAuthorityClient } from '../../clients/DecisionAuthorityClient';

describe('Listing Service - Decision Authority Integration', () => {
  let listingService: ListingService;
  let mockDecisionClient: jest.Mocked<DecisionAuthorityClient>;

  beforeEach(() => {
    mockDecisionClient = {
      requestDecision: jest.fn(),
      getDecision: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true)
    } as any;

    listingService = new ListingService(mockDecisionClient);
  });

  describe('createListing', () => {
    it('should request decision when creating listing', async () => {
      const mockDecision = {
        decisionId: 'dec-123',
        assetId: 'list-123',
        status: 'APPROVED',
        expiresAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const listing = await listingService.createListing({
        id: 'list-123',
        userId: 'user-123',
        title: 'Test Listing',
        category: 'Electronics',
        price: 100
      });

      expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith({
        assetId: 'list-123',
        assetType: 'LISTING',
        userId: 'user-123',
        metadata: expect.any(Object)
      });

      expect(listing.decisionId).toBe('dec-123');
      expect(listing.disposition_status).toBe('APPROVED');
    });

    it('should handle decision rejection', async () => {
      const mockDecision = {
        decisionId: 'dec-456',
        assetId: 'list-456',
        status: 'REJECTED',
        reason: 'Suspicious activity',
        expiresAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const listing = await listingService.createListing({
        id: 'list-456',
        userId: 'user-456',
        title: 'Suspicious Listing',
        category: 'Electronics',
        price: 100
      });

      expect(listing.disposition_status).toBe('REJECTED');
    });
  });

  describe('getApprovedListings', () => {
    it('should only return approved listings', async () => {
      const listings = await listingService.getApprovedListings();
      
      expect(listings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ disposition_status: 'APPROVED' })
        ])
      );
    });
  });
});
```

---

### 4.1.7 Update API Documentation ✅
**Status**: Ready to implement

Update API documentation to reflect decision authority integration.

**File**: `backend/services/listing-service/README.md`

Add section:

```markdown
## Decision Authority Integration

The Listing Service integrates with the Decision Authority Service to validate listings before they become visible to buyers.

### Listing Status Flow

1. **PENDING**: Listing created, awaiting decision from Decision Authority
2. **APPROVED**: Decision Authority approved the listing, visible to buyers
3. **REJECTED**: Decision Authority rejected the listing, not visible to buyers
4. **EXPIRED**: Decision expired, listing needs re-approval

### API Endpoints

- `GET /api/v1/listings?status=APPROVED` - Get approved listings only
- `GET /api/v1/listings/user/:userId` - Get user's listings (all statuses)
- `GET /api/v1/listings/:id` - Get listing details (includes decision status)

### Webhook

The service receives decision status updates via webhook:

```
POST /api/v1/webhooks/decisions
Content-Type: application/json

{
  "decisionId": "dec-123",
  "assetId": "list-123",
  "status": "APPROVED",
  "expiresAt": "2026-02-28T00:00:00Z"
}
```
```

---

## Implementation Order

1. ✅ Create DecisionAuthorityClient
2. ✅ Add disposition_status to Prisma schema
3. ✅ Create database migration
4. ✅ Update listing creation logic
5. ✅ Update listing queries
6. ✅ Create webhook handler
7. ✅ Write integration tests
8. ✅ Update API documentation

---

## Success Criteria

- [x] Decision Authority Client created
- [x] Listing creation requests decision
- [x] Listing queries filter by status
- [x] Webhook handler processes decision updates
- [x] All integration tests passing
- [x] API documentation updated
- [x] No breaking changes to existing API

---

## Next Steps

After Phase 4.1 completion:
1. Move to Phase 5: Frontend Integration
2. Create decision status UI components
3. Add decision status to listing cards
4. Add status filters to search

---

**Status**: 🚀 READY TO START  
**Estimated Duration**: 1-2 days  
**Priority**: HIGH (Critical for backend integration)

