# Peer-to-Peer Swap Service

This module implements peer-to-peer swap functionality for the MNBARA platform, allowing users to exchange listings directly with escrow protection.

## Features

- **Swap Matching Algorithm**: Finds compatible listings based on category, price, location, and condition
- **Proposal Flow**: Create, accept, reject, and counter-offer swap proposals
- **Escrow Integration**: Automatic escrow for value differences between swapped items
- **Atomic Transactions**: All operations use serializable isolation with deadlock retry logic

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Swap Service                                 │
├─────────────────────────────────────────────────────────────────┤
│  SwapMatchingService          │  SwapService                    │
│  ├─ findMatches()             │  ├─ createProposal()            │
│  ├─ calculateMatchScore()     │  ├─ acceptProposal()            │
│  ├─ storeMatches()            │  ├─ rejectProposal()            │
│  └─ invalidateMatches()       │  ├─ createCounterOffer()        │
│                               │  ├─ initiateEscrow()            │
│                               │  ├─ confirmCompletion()         │
│                               │  └─ cancelSwap()                │
└─────────────────────────────────────────────────────────────────┘
```

## Swap Flow

```
1. PROPOSED → User creates swap proposal
2. ACCEPTED → Receiver accepts proposal
3. IN_ESCROW → Escrow initiated for value difference
4. COMPLETED → Both parties confirm, listings transferred
```

## Usage

### Finding Matches

```typescript
import { SwapMatchingService } from './swap-matching.service';

const matchingService = new SwapMatchingService(prisma);

// Find potential swap matches for a listing
const matches = await matchingService.findMatches(listingId, {
  limit: 20,
  minScore: 0.5,
  maxPriceDifferencePercent: 30
});
```

### Creating a Swap Proposal

```typescript
import { SwapService } from './swap.service';
import { SwapItemType } from './swap.types';

const swapService = new SwapService(prisma);

const result = await swapService.createProposal({
  initiatorId: 1,
  receiverId: 2,
  initiatorItems: [
    {
      itemType: SwapItemType.LISTING,
      listingId: 100,
      estimatedValue: 500
    }
  ],
  receiverItems: [
    {
      itemType: SwapItemType.LISTING,
      listingId: 200,
      estimatedValue: 450
    }
  ],
  message: 'Would you like to swap?',
  expiresInHours: 72
});
```

### Accepting and Completing a Swap

```typescript
// Receiver accepts
await swapService.acceptProposal(swapId, receiverId);

// System initiates escrow
await swapService.initiateEscrow(swapId, systemUserId);

// Both parties confirm completion
await swapService.confirmCompletion(swapId, initiatorId);
await swapService.confirmCompletion(swapId, receiverId);
// Swap is now complete, listings transferred
```

## Match Scoring

The matching algorithm uses weighted scoring:

| Factor | Weight | Description |
|--------|--------|-------------|
| Category | 30% | Exact match = 1.0, Parent category = 0.7 |
| Price | 35% | Within 5% = 1.0, Within 30% = 0.5 |
| Location | 20% | Same city = 1.0, Same country = 0.6 |
| Condition | 15% | Same condition = 1.0, 1 level diff = 0.8 |

## Database Tables

- `Swap` - Main swap record with status and participants
- `SwapItem` - Items included in each swap
- `SwapHistory` - Audit trail of all swap actions
- `SwapMatch` - Pre-computed match scores for quick retrieval

## Escrow Handling

When items have different values:
1. The party with lower-value items pays the difference
2. Funds are held in escrow until both parties confirm
3. On completion, escrow is released to the higher-value party
4. On cancellation, escrow is refunded to the payer

## Error Handling

All operations include:
- Deadlock detection and automatic retry (up to 3 attempts)
- Serializable transaction isolation
- Comprehensive validation before state changes
- Atomic rollback on any failure
