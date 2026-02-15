# TRV-001: Shopper Request & Traveler Offer (Negotiation MVP)

## Summary
Added shopper requests with external product URL intake, traveler offers with negotiation and travel date approval, and minimal notifications. Follows existing crowdship service architecture.

## Data Model (Prisma)
- `ShopperRequest` (buyerId, productUrl, title, price, currency, sourceSite, sourceCountry, status: REQUESTED/NEGOTIATING/ACCEPTED/REJECTED/CANCELLED, isOrderReady)
- `TravelerOffer` (requestId, travelerId, listedPrice, estimatedTax, estimatedShipping, platformFee, travelerProfit, totalProposed, status: OFFERED/COUNTERED/ACCEPTED/REJECTED, lastActor, counterNote, travelDepartureDate, travelArrivalDate, travelStatus: PENDING/SUBMITTED/APPROVED/REJECTED)
- Enums and indexes added; migration: `prisma/migrations/20250107_add_shopper_request_and_offer/migration.sql`

## Endpoints
- Shopper Requests
  - `POST /api/shopper-requests` – create shopper request (buyerId placeholder from header/body)
  - `GET /api/shopper-requests/available?country=US` – travelers fetch visible requests (by source country)
- Traveler Offers / Negotiation
  - `POST /api/offers` – traveler submits offer
  - `POST /api/offers/:id/buyer` – buyer actions: ACCEPT | REJECT | COUNTER
  - `POST /api/offers/:id/traveler` – traveler actions: ACCEPT | COUNTER
  - `POST /api/offers/:id/travel` – traveler submits travel dates
  - `POST /api/offers/:id/travel/decision` – buyer approves/rejects travel dates

## Core Logic
- Create shopper request: fetch basic metadata (title/source site/price fallback) via URL fetch; store sourceCountry if provided.
- Offer creation: upsert per traveler per request, sets request status to NEGOTIATING, computes totals, notifies buyer (placeholder).
- Buyer actions: accept → offer ACCEPTED, request ACCEPTED + isOrderReady=true (enforces single accepted); reject → offer REJECTED; counter → status COUNTERED, lastActor=buyer.
- Traveler actions: accept or counter (similar state updates).
- Travel details: traveler submits dates (SUBMITTED); buyer approve → APPROVED; reject → REJECTED (suggestions can be handled externally).
- Release block: release in escrow controller already blocks if protection; negotiation does not auto-purchase (per constraints).

## Notifications
- Placeholder `NotificationService.notify()` logging to console; hook for real notification-service integration. Notifications on new offers, counters, accepts, travel submission/approval.

## Tests
- `src/services/__tests__/offer.service.test.ts` – verifies offer creation moves request to NEGOTIATING; buyer accept sets request ACCEPTED/isOrderReady.
- `src/services/__tests__/shopper-request.service.test.ts` – verifies creation/listing logic with filters.

## Setup
1. Run migration:
   ```bash
   cd backend/services/crowdship-service
   npx prisma migrate dev
   ```
2. Install test deps (added):
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```

## Acceptance Criteria Mapping
- Shopper Request via external URL: `POST /api/shopper-requests` stores URL + fetched metadata.
- Product details stored: title/price/sourceSite captured (best-effort parsing).
- Visibility to travelers in source country: `/available?country=XX` filter.
- Traveler offer fields: listedPrice, estimatedTax, estimatedShipping, platformFee, travelerProfit, totalProposed stored in `TravelerOffer`.
- Buyer notified per offer (placeholder notify).
- Buyer ACCEPT/REJECT/COUNTER and traveler ACCEPT/COUNTER supported via endpoints/state.
- Negotiation continues until ACCEPT/REJECT; single accepted offer enforced.
- On ACCEPT, traveler submits travel dates; buyer approves/rejects travel dates; rejection allows alternative traveler suggestion externally.
- Accepted request flagged `isOrderReady` for downstream order/escrow flow.





